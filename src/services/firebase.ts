/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { MathCategory, DifficultyLevel } from '../types/math';

// Initialize Firebase SDK with error trapping
let appInstance: any = null;
let firestoreDb: any = null;
let isFirestoreAvailable = false;
let firestoreErrorMessage = '';

try {
  appInstance = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const dbId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId || '(default)';
  firestoreDb = getFirestore(appInstance, dbId);
  isFirestoreAvailable = true;
} catch (e: any) {
  console.warn('[Firebase Init Warning]:', e?.message || e);
  firestoreErrorMessage = e?.message || 'Error inicialitzant Firebase';
}

export const db = firestoreDb;

export function getFirestoreStatus(): { available: boolean; error: string } {
  return { available: isFirestoreAvailable, error: firestoreErrorMessage };
}

// Local storage keys for fallback persistence
const LOCAL_STUDENTS_KEY = 'mates3r_students_registry_v1';
const LOCAL_LOGS_KEY = 'mates3r_logs_registry_v1';

// Data types
export interface StudentProfile {
  studentId: string;
  name: string;
  group: string;
  createdAt: string;
  lastActiveAt: string;
  totalExercises: number;
  correctExercises: number;
  currentStreak: number;
  bestStreak: number;
  categoryStats: {
    enters: { total: number; correct: number; level: number };
    potencies: { total: number; correct: number; level: number };
    fraccions: { total: number; correct: number; level: number };
  };
  recentMistakes: {
    topic: string;
    expression: string;
    userAnswer: string;
    correctAnswer: string;
    mistakeTitle?: string;
    timestamp: number;
  }[];
}

export interface ExerciseLog {
  logId: string;
  studentId: string;
  studentName: string;
  group: string;
  category: MathCategory;
  difficulty: DifficultyLevel;
  expression: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  mistakeTitle?: string;
  timestamp: number;
}

// Helper: load local students list
function getLocalStudents(): StudentProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_STUDENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Helper: save local students list
function saveLocalStudents(list: StudentProfile[]) {
  try {
    localStorage.setItem(LOCAL_STUDENTS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

// Helper: load local logs list
function getLocalLogs(): ExerciseLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Helper: save local logs list
function saveLocalLogs(logs: ExerciseLog[]) {
  try {
    localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch {
    // ignore
  }
}

// Generate clean student ID from name and group
export function generateStudentId(name: string, group: string): string {
  const clean = `${name}-${group}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_');
  return clean || `alumne_${Date.now()}`;
}

// Helper promise timeout to prevent hanging UI
function withTimeout<T>(promise: Promise<T>, ms: number = 2000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout de connexió (${ms}ms)`));
    }, ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Test connection safely without blocking (uses getDocFromServer to verify live Firestore connectivity)
export async function testConnection(): Promise<boolean> {
  if (!db) {
    isFirestoreAvailable = false;
    return false;
  }
  try {
    const testDoc = doc(db, 'test', 'connection');
    await withTimeout(getDocFromServer(testDoc), 2500);
    isFirestoreAvailable = true;
    firestoreErrorMessage = '';
    return true;
  } catch (error: any) {
    const msg = error?.message || String(error);
    // Permission denied still means the server responded (Firestore database exists!)
    if (msg.includes('Missing or insufficient permissions') || msg.includes('permission-denied')) {
      isFirestoreAvailable = true;
      firestoreErrorMessage = '';
      return true;
    }
    console.warn('[Firestore Connection Check]:', msg);
    isFirestoreAvailable = false;
    firestoreErrorMessage = msg;
    return false;
  }
}

// Save or load student profile (INSTANT local + background Firestore sync)
export async function registerOrLoadStudent(name: string, group: string): Promise<StudentProfile> {
  const studentId = generateStudentId(name, group);
  const nowIso = new Date().toISOString();

  // 1. Check local storage first for instant load
  const localList = getLocalStudents();
  const existingLocal = localList.find((s) => s.studentId === studentId);

  let profile: StudentProfile;

  if (existingLocal) {
    profile = {
      ...existingLocal,
      name: name.trim(),
      group: group.trim(),
      lastActiveAt: nowIso
    };
  } else {
    profile = {
      studentId,
      name: name.trim(),
      group: group.trim(),
      createdAt: nowIso,
      lastActiveAt: nowIso,
      totalExercises: 0,
      correctExercises: 0,
      currentStreak: 0,
      bestStreak: 0,
      categoryStats: {
        enters: { total: 0, correct: 0, level: 1 },
        potencies: { total: 0, correct: 0, level: 1 },
        fraccions: { total: 0, correct: 0, level: 1 }
      },
      recentMistakes: []
    };
  }

  // Update local registry immediately
  const updatedList = [profile, ...localList.filter((s) => s.studentId !== studentId)];
  saveLocalStudents(updatedList);

  // 2. Sync to Firestore in background (with timeout to never block UI)
  if (db) {
    withTimeout(
      (async () => {
        const studentRef = doc(db, 'students', studentId);
        const snap = await getDoc(studentRef);
        if (snap.exists()) {
          const remoteData = snap.data() as StudentProfile;
          const merged: StudentProfile = {
            ...profile,
            totalExercises: Math.max(profile.totalExercises, remoteData.totalExercises || 0),
            correctExercises: Math.max(profile.correctExercises, remoteData.correctExercises || 0),
            bestStreak: Math.max(profile.bestStreak, remoteData.bestStreak || 0),
            categoryStats: remoteData.categoryStats || profile.categoryStats,
            recentMistakes: remoteData.recentMistakes || profile.recentMistakes,
            lastActiveAt: nowIso
          };
          await setDoc(studentRef, merged, { merge: true });
        } else {
          await setDoc(studentRef, profile);
        }
      })(),
      3000
    ).catch((err) => {
      console.warn('[Firestore Background Sync]:', err?.message || err);
      firestoreErrorMessage = err?.message || 'Error de sincronització';
    });
  }

  return profile;
}

// Record an exercise attempt (updates local store immediately + fires Firestore sync)
export async function logExerciseAttempt(
  student: StudentProfile,
  category: MathCategory,
  difficulty: DifficultyLevel,
  expression: string,
  userAnswer: string,
  correctAnswer: string,
  isCorrect: boolean,
  mistakeTitle?: string
): Promise<StudentProfile> {
  const now = Date.now();
  const logId = `log_${now}_${Math.random().toString(36).substring(2, 7)}`;

  const logEntry: ExerciseLog = {
    logId,
    studentId: student.studentId,
    studentName: student.name,
    group: student.group,
    category,
    difficulty,
    expression,
    userAnswer,
    correctAnswer,
    isCorrect,
    mistakeTitle: isCorrect ? undefined : (mistakeTitle || 'Error de càlcul'),
    timestamp: now
  };

  // 1. Immediately update Local Storage
  const localLogs = getLocalLogs();
  saveLocalLogs([logEntry, ...localLogs]);

  const localStudents = getLocalStudents();
  const current = localStudents.find((s) => s.studentId === student.studentId) || student;

  const nextStreak = isCorrect ? current.currentStreak + 1 : 0;
  const nextBestStreak = Math.max(current.bestStreak, nextStreak);

  const prevCat = current.categoryStats[category] || { total: 0, correct: 0, level: 1 };
  const nextCat = {
    total: prevCat.total + 1,
    correct: prevCat.correct + (isCorrect ? 1 : 0),
    level: Math.max(prevCat.level, difficulty)
  };

  let mistakes = current.recentMistakes || [];
  if (!isCorrect) {
    mistakes = [
      {
        topic: category,
        expression,
        userAnswer,
        correctAnswer,
        mistakeTitle: mistakeTitle || 'Error en el procediment',
        timestamp: now
      },
      ...mistakes.slice(0, 19)
    ];
  }

  const updatedStudent: StudentProfile = {
    ...current,
    totalExercises: current.totalExercises + 1,
    correctExercises: current.correctExercises + (isCorrect ? 1 : 0),
    currentStreak: nextStreak,
    bestStreak: nextBestStreak,
    lastActiveAt: new Date().toISOString(),
    categoryStats: {
      ...current.categoryStats,
      [category]: nextCat
    },
    recentMistakes: mistakes
  };

  saveLocalStudents([updatedStudent, ...localStudents.filter((s) => s.studentId !== student.studentId)]);

  // 2. Sync to Firestore in background (non-blocking)
  if (db) {
    withTimeout(
      (async () => {
        await setDoc(doc(db, 'exercise_logs', logId), logEntry);
        await setDoc(doc(db, 'students', student.studentId), updatedStudent, { merge: true });
      })(),
      3000
    ).catch((err) => {
      console.warn('[Firestore Log Sync]:', err?.message || err);
      firestoreErrorMessage = err?.message || 'Error desant a Firestore';
    });
  }

  return updatedStudent;
}

// Teacher subscriptions: subscribes to Firestore AND falls back to local data immediately
export function subscribeToAllStudents(callback: (students: StudentProfile[]) => void): Unsubscribe {
  // Call immediately with local data so UI is never blank
  const localData = getLocalStudents();
  if (localData.length > 0) {
    callback(localData);
  }

  if (!db) {
    return () => {};
  }

  let isSubscribed = true;

  try {
    const studentsCol = collection(db, 'students');
    const unsub = onSnapshot(
      studentsCol,
      (snapshot) => {
        if (!isSubscribed) return;
        const remoteList: StudentProfile[] = [];
        snapshot.forEach((doc) => {
          remoteList.push(doc.data() as StudentProfile);
        });

        if (remoteList.length > 0) {
          remoteList.sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime());
          callback(remoteList);
          saveLocalStudents(remoteList);
        } else {
          // If remote is empty, provide local
          callback(getLocalStudents());
        }
      },
      (error) => {
        console.warn('[Firestore onSnapshot students]:', error?.message || error);
        firestoreErrorMessage = error?.message || 'Error de lectura de Firestore';
        // Fallback to local
        callback(getLocalStudents());
      }
    );

    return () => {
      isSubscribed = false;
      unsub();
    };
  } catch (err: any) {
    console.warn('[Firestore subscribe students catch]:', err?.message || err);
    callback(getLocalStudents());
    return () => {};
  }
}

export function subscribeToRecentLogs(
  limitCount: number = 50,
  callback: (logs: ExerciseLog[]) => void
): Unsubscribe {
  // Call immediately with local data
  const localLogs = getLocalLogs();
  if (localLogs.length > 0) {
    callback(localLogs.slice(0, limitCount));
  }

  if (!db) {
    return () => {};
  }

  let isSubscribed = true;

  try {
    const logsCol = collection(db, 'exercise_logs');
    const q = query(logsCol, orderBy('timestamp', 'desc'), limit(limitCount));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        if (!isSubscribed) return;
        const remoteList: ExerciseLog[] = [];
        snapshot.forEach((doc) => {
          remoteList.push(doc.data() as ExerciseLog);
        });

        if (remoteList.length > 0) {
          callback(remoteList);
          saveLocalLogs(remoteList);
        } else {
          callback(getLocalLogs().slice(0, limitCount));
        }
      },
      (error) => {
        console.warn('[Firestore onSnapshot logs]:', error?.message || error);
        callback(getLocalLogs().slice(0, limitCount));
      }
    );

    return () => {
      isSubscribed = false;
      unsub();
    };
  } catch (err) {
    callback(getLocalLogs().slice(0, limitCount));
    return () => {};
  }
}
