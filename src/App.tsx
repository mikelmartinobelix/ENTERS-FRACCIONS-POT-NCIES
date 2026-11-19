/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  MathCategory,
  DifficultyLevel,
  MathExercise,
  UserStats,
  FailedExercise,
  MistakeDiagnosis
} from './types/math';
import { generateExercise } from './utils/mathEngine';
import { sounds } from './utils/audio';
import { MathView } from './components/MathView';
import { Keypad } from './components/Keypad';
import { Scratchpad } from './components/Scratchpad';
import { StepByStepView } from './components/StepByStepView';
import { TheoryGuideModal } from './components/TheoryGuideModal';
import { ErrorsNotebookModal } from './components/ErrorsNotebookModal';
import { StatsModal } from './components/StatsModal';
import { ExamModeModal } from './components/ExamModeModal';
import { StudentIdentificationModal } from './components/StudentIdentificationModal';
import { TeacherDashboardModal } from './components/TeacherDashboardModal';
import {
  StudentProfile,
  registerOrLoadStudent,
  logExerciseAttempt,
  testConnection
} from './services/firebase';

import {
  Sparkles,
  Flame,
  Volume2,
  VolumeX,
  BookOpen,
  PenLine,
  BookmarkCheck,
  Trophy,
  Award,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  Hash,
  Zap,
  Divide,
  ChevronRight,
  Sun,
  Moon,
  User,
  GraduationCap,
  Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';

const STORAGE_KEY_STATS = 'mates3r_stats_v1';
const STORAGE_KEY_FAILED = 'mates3r_failed_v1';
const STORAGE_KEY_STUDENT = 'mates3r_student_profile';

const INITIAL_STATS: UserStats = {
  solvedTotal: 0,
  correctFirstTry: 0,
  currentStreak: 0,
  bestStreak: 0,
  categoryMastery: {
    enters: { total: 0, correct: 0, level: 1 },
    potencies: { total: 0, correct: 0, level: 1 },
    fraccions: { total: 0, correct: 0, level: 1 }
  },
  badges: []
};

export default function App() {
  // Navigation & Category state
  const [selectedCategory, setSelectedCategory] = useState<MathCategory>('enters');
  const [isAdaptiveMode, setIsAdaptiveMode] = useState<boolean>(true);
  const [manualDifficulty, setManualDifficulty] = useState<DifficultyLevel>(1);
  const [currentConsecutiveCorrect, setCurrentConsecutiveCorrect] = useState<number>(0);

  // Student Identification state
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STUDENT);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(() => {
    return !localStorage.getItem(STORAGE_KEY_STUDENT);
  });
  const [isTeacherDashboardOpen, setIsTeacherDashboardOpen] = useState<boolean>(false);
  const [teacherDashboardTab, setTeacherDashboardTab] = useState<'alumnes' | 'activitat' | 'compartir'>('alumnes');

  // Stats & Error notebook state
  const [stats, setStats] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATS);
      return saved ? JSON.parse(saved) : INITIAL_STATS;
    } catch {
      return INITIAL_STATS;
    }
  });

  const [failedExercises, setFailedExercises] = useState<FailedExercise[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FAILED);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active exercise & response
  const [currentExercise, setCurrentExercise] = useState<MathExercise>(() =>
    generateExercise('enters', 1)
  );
  const [numInput, setNumInput] = useState('');
  const [denInput, setDenInput] = useState('');
  const [activeSlot, setActiveSlot] = useState<'num' | 'den' | 'single'>('num');

  // Resolution & Feedback state
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [userAnswerFormatted, setUserAnswerFormatted] = useState<string>('');
  const [currentDiagnosis, setCurrentDiagnosis] = useState<MistakeDiagnosis | null>(null);
  const [currentHintIndex, setCurrentHintIndex] = useState<number>(-1);

  // Modals & Panels state
  const [isScratchpadOpen, setIsScratchpadOpen] = useState<boolean>(false);
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);
  const [isErrorsOpen, setIsErrorsOpen] = useState<boolean>(false);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isExamOpen, setIsExamOpen] = useState<boolean>(false);

  // Audio & Dark mode state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Test Firebase connection on boot
  useEffect(() => {
    testConnection();
  }, []);

  // Save stats to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    } catch {
      // ignore
    }
  }, [stats]);

  // Save failed exercises to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FAILED, JSON.stringify(failedExercises));
    } catch {
      // ignore
    }
  }, [failedExercises]);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Effective difficulty for current category
  const currentLevel: DifficultyLevel = isAdaptiveMode
    ? stats.categoryMastery[selectedCategory].level
    : manualDifficulty;

  // Generate new exercise
  const loadNewExercise = useCallback(
    (cat?: MathCategory, diff?: DifficultyLevel) => {
      const targetCat = cat || selectedCategory;
      const targetDiff = diff || currentLevel;
      const ex = generateExercise(targetCat, targetDiff);
      setCurrentExercise(ex);
      setNumInput('');
      setDenInput('');
      setActiveSlot('num');
      setIsAnswerSubmitted(false);
      setIsCorrect(false);
      setUserAnswerFormatted('');
      setCurrentDiagnosis(null);
      setCurrentHintIndex(-1);
    },
    [selectedCategory, currentLevel]
  );

  // When category changes, load fresh exercise for that category
  const handleSelectCategory = (cat: MathCategory) => {
    setSelectedCategory(cat);
    setCurrentConsecutiveCorrect(0);
    const catLevel = isAdaptiveMode ? stats.categoryMastery[cat].level : manualDifficulty;
    loadNewExercise(cat, catLevel);
  };

  // Handle saving student name and group
  const handleSaveStudent = (name: string, group: string) => {
    const studentId = `${name}-${group}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_');
    const nowIso = new Date().toISOString();
    const localProfile: StudentProfile = {
      studentId: studentId || `alumne_${Date.now()}`,
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
    setStudentProfile(localProfile);
    localStorage.setItem(STORAGE_KEY_STUDENT, JSON.stringify(localProfile));
    setIsStudentModalOpen(false);

    // Sync in background without blocking UI
    registerOrLoadStudent(name, group)
      .then((updated) => {
        if (updated) {
          setStudentProfile(updated);
          localStorage.setItem(STORAGE_KEY_STUDENT, JSON.stringify(updated));
        }
      })
      .catch(() => {
        // Silently keep localProfile
      });
  };

  // Add exercise to failed notebook
  const handleAddFailedExercise = (exercise: MathExercise, userAns: string) => {
    setFailedExercises((prev) => {
      const exists = prev.find((f) => f.exercise.expressionDisplay === exercise.expressionDisplay);
      if (exists) {
        return prev.map((f) =>
          f.id === exists.id
            ? { ...f, userAnswerStr: userAns, timesRetried: f.timesRetried + 1, mastered: false }
            : f
        );
      }
      return [
        {
          id: `fail-${Date.now()}-${Math.random()}`,
          exercise,
          userAnswerStr: userAns,
          timestamp: Date.now(),
          timesRetried: 0,
          mastered: false
        },
        ...prev
      ];
    });
  };

  // Award badges
  const checkBadges = (newStreak: number, newMasteryLevel: number) => {
    const newBadges = [...stats.badges];

    if (!newBadges.includes('first_solve')) newBadges.push('first_solve');
    if (newStreak >= 3 && !newBadges.includes('streak_3')) newBadges.push('streak_3');
    if (newStreak >= 5 && !newBadges.includes('streak_5')) newBadges.push('streak_5');
    if (newStreak >= 10 && !newBadges.includes('streak_10')) newBadges.push('streak_10');

    if (selectedCategory === 'enters' && newMasteryLevel >= 3 && !newBadges.includes('enters_master')) {
      newBadges.push('enters_master');
    }
    if (selectedCategory === 'potencies' && newMasteryLevel >= 3 && !newBadges.includes('potencies_master')) {
      newBadges.push('potencies_master');
    }
    if (selectedCategory === 'fraccions' && newMasteryLevel >= 3 && !newBadges.includes('fraccions_master')) {
      newBadges.push('fraccions_master');
    }

    return newBadges;
  };

  // Evaluate submitted answer
  const handleSubmitAnswer = () => {
    if (isAnswerSubmitted) return;

    let ansCorrect = false;
    let formattedUserAnswer = '';

    const expected = currentExercise.correctAnswer;

    if (expected.kind === 'number') {
      const parsedNum = parseInt(numInput.trim(), 10);
      ansCorrect = !isNaN(parsedNum) && parsedNum === expected.value;
      formattedUserAnswer = numInput.trim();
    } else if (expected.kind === 'power') {
      const parsedExp = parseInt(numInput.trim(), 10);
      ansCorrect = !isNaN(parsedExp) && parsedExp === expected.exp;
      formattedUserAnswer = numInput.trim();
    } else if (expected.kind === 'fraction') {
      const pNum = parseInt(numInput.trim(), 10);
      const pDen = parseInt(denInput.trim() || '1', 10);
      ansCorrect = !isNaN(pNum) && !isNaN(pDen) && pNum === expected.num && pDen === expected.den;
      formattedUserAnswer = `${numInput.trim()}/${denInput.trim() || '1'}`;
    }

    setIsCorrect(ansCorrect);
    setUserAnswerFormatted(formattedUserAnswer);
    setIsAnswerSubmitted(true);

    let calculatedDiagnosis: MistakeDiagnosis | null = null;

    if (ansCorrect) {
      sounds.playCorrect();
      const nextStreak = stats.currentStreak + 1;
      const nextBestStreak = Math.max(stats.bestStreak, nextStreak);
      const nextConsecutive = currentConsecutiveCorrect + 1;
      setCurrentConsecutiveCorrect(nextConsecutive);

      // Adaptive difficulty progression
      let nextLevel = currentLevel;
      if (isAdaptiveMode && nextConsecutive >= 3 && currentLevel < 4) {
        nextLevel = (currentLevel + 1) as DifficultyLevel;
        sounds.playLevelUp();
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        setCurrentConsecutiveCorrect(0);
      } else if (nextStreak % 5 === 0) {
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
      }

      // If this exercise was in the failed notebook, mark it as mastered!
      setFailedExercises((prev) =>
        prev.map((f) =>
          f.exercise.expressionDisplay === currentExercise.expressionDisplay
            ? { ...f, mastered: true }
            : f
        )
      );

      const updatedBadges = checkBadges(nextStreak, nextLevel);

      setStats((prev) => ({
        ...prev,
        solvedTotal: prev.solvedTotal + 1,
        correctFirstTry: prev.correctFirstTry + (currentHintIndex === -1 ? 1 : 0),
        currentStreak: nextStreak,
        bestStreak: nextBestStreak,
        categoryMastery: {
          ...prev.categoryMastery,
          [selectedCategory]: {
            total: prev.categoryMastery[selectedCategory].total + 1,
            correct: prev.categoryMastery[selectedCategory].correct + 1,
            level: nextLevel
          }
        },
        badges: updatedBadges
      }));
    } else {
      sounds.playWrong();
      setCurrentConsecutiveCorrect(0);

      // Diagnose error
      const parsedNum = parseInt(numInput.trim(), 10);
      const parsedDen = parseInt(denInput.trim(), 10);
      calculatedDiagnosis = currentExercise.diagnoseMistake({
        numberVal: isNaN(parsedNum) ? undefined : parsedNum,
        numVal: isNaN(parsedNum) ? undefined : parsedNum,
        denVal: isNaN(parsedDen) ? undefined : parsedDen,
        expVal: isNaN(parsedNum) ? undefined : parsedNum
      });
      setCurrentDiagnosis(calculatedDiagnosis);

      // Add to mistakes notebook
      handleAddFailedExercise(currentExercise, formattedUserAnswer);

      setStats((prev) => ({
        ...prev,
        solvedTotal: prev.solvedTotal + 1,
        currentStreak: 0,
        categoryMastery: {
          ...prev.categoryMastery,
          [selectedCategory]: {
            ...prev.categoryMastery[selectedCategory],
            total: prev.categoryMastery[selectedCategory].total + 1
          }
        }
      }));
    }

    // Sync to Firebase Firestore in real-time
    if (studentProfile) {
      logExerciseAttempt(
        studentProfile,
        selectedCategory,
        currentLevel,
        currentExercise.expressionDisplay,
        formattedUserAnswer,
        currentExercise.answerDisplay,
        ansCorrect,
        calculatedDiagnosis?.mistakeTitle
      );
    }
  };

  const handleNextExercise = () => {
    loadNewExercise();
  };

  const handleRequestHint = () => {
    if (currentHintIndex + 1 < currentExercise.hints.length) {
      sounds.playHint();
      setCurrentHintIndex((prev) => prev + 1);
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.setEnabled(next);
  };

  const pendingErrorsCount = failedExercises.filter((f) => !f.mastered).length;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-indigo-500/20">
              ∑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm md:text-base tracking-tight text-slate-900 dark:text-white">
                  Mates 3r ESO
                </h1>
                <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/50">
                  Catalunya
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Entrenador Adaptatiu de Càlcul Bàsic
              </p>
            </div>
          </div>

          {/* Quick Stats & Action Buttons */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Student ID badge */}
            <button
              onClick={() => setIsStudentModalOpen(true)}
              className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
              title="Canviar d'alumne o grup"
            >
              <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="truncate max-w-[80px] sm:max-w-[110px]">
                {studentProfile ? studentProfile.name.split(' ')[0] : "Identifica't"}
              </span>
              {studentProfile && (
                <span className="text-[10px] bg-indigo-200/70 dark:bg-indigo-800/80 px-1.5 py-0.5 rounded-full font-normal hidden sm:inline">
                  {studentProfile.group}
                </span>
              )}
            </button>

            {/* Compartir App button */}
            <button
              onClick={() => {
                setTeacherDashboardTab('compartir');
                setIsTeacherDashboardOpen(true);
              }}
              title="Obtenir l'enllaç i el codi QR per compartir amb els alumnes"
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Compartir</span>
            </button>

            {/* Teacher Dashboard button */}
            <button
              onClick={() => {
                setTeacherDashboardTab('alumnes');
                setIsTeacherDashboardOpen(true);
              }}
              title="Panell de Control del Professor (Registres dels alumnes)"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Panell Docent</span>
            </button>

            {/* Streak counter */}
            <div
              title={`Ràtxa actual: ${stats.currentStreak} (Rècord: ${stats.bestStreak})`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs font-bold shadow-sm"
            >
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{stats.currentStreak}</span>
            </div>

            {/* Pissarra d'esborrany Button */}
            <button
              onClick={() => setIsScratchpadOpen(!isScratchpadOpen)}
              title="Obrir pissarra d'esborrany per fer comptes"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
                isScratchpadOpen
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <PenLine className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden md:inline">Pissarra</span>
            </button>

            {/* Guia de teoria Button */}
            <button
              onClick={() => setIsTheoryOpen(true)}
              title="Veure regles d'or i fórmules"
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden md:inline">Regles</span>
            </button>

            {/* Quadern d'errors Button */}
            <button
              onClick={() => setIsErrorsOpen(true)}
              title="El meu quadern d'errors"
              className="relative px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden md:inline">Errors</span>
              {pendingErrorsCount > 0 && (
                <span className="w-4 h-4 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center font-extrabold">
                  {pendingErrorsCount}
                </span>
              )}
            </button>

            {/* Medalles & Stats Button */}
            <button
              onClick={() => setIsStatsOpen(true)}
              title="Estadístiques i medalles"
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-amber-500 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Trophy className="w-4 h-4" />
            </button>

            {/* Exam Mode Button */}
            <button
              onClick={() => setIsExamOpen(true)}
              title="Simulacre d'Examen 3r ESO"
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Award className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Simulacre</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              title={soundEnabled ? 'Silenciar so' : 'Activar so'}
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title="Canvia mode clar/fosc"
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto w-full p-4 md:p-6 flex-1 flex flex-col gap-5">
        {/* Topic Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-200/70 dark:bg-slate-900/70 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-inner">
          <button
            onClick={() => handleSelectCategory('enters')}
            className={`py-2.5 px-3 rounded-xl text-xs md:text-sm font-bold flex flex-col md:flex-row items-center justify-center gap-1.5 transition ${
              selectedCategory === 'enters'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-slate-200 dark:ring-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Hash className="w-4 h-4 shrink-0 text-indigo-500" />
            <span>Nombres Enters</span>
          </button>

          <button
            onClick={() => handleSelectCategory('potencies')}
            className={`py-2.5 px-3 rounded-xl text-xs md:text-sm font-bold flex flex-col md:flex-row items-center justify-center gap-1.5 transition ${
              selectedCategory === 'potencies'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-md ring-1 ring-slate-200 dark:ring-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>Potències</span>
          </button>

          <button
            onClick={() => handleSelectCategory('fraccions')}
            className={`py-2.5 px-3 rounded-xl text-xs md:text-sm font-bold flex flex-col md:flex-row items-center justify-center gap-1.5 transition ${
              selectedCategory === 'fraccions'
                ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-md ring-1 ring-slate-200 dark:ring-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Divide className="w-4 h-4 shrink-0 text-amber-500" />
            <span>Fraccions</span>
          </button>
        </div>

        {/* Adaptive Mode & Level Indicator Banner */}
        <div className="bg-white dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              L{currentLevel}
            </div>
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span>{currentExercise.difficultyLabel}</span>
                {isAdaptiveMode && (
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                    Adaptatiu Actiu
                  </span>
                )}
              </div>
              <div className="text-slate-500">
                {isAdaptiveMode
                  ? `Encerta 3 preguntes consecutives per pujar de nivell (${currentConsecutiveCorrect}/3).`
                  : 'Mode de dificultat fixada manualment.'}
              </div>
            </div>
          </div>

          {/* Level selector buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            {([1, 2, 3, 4] as DifficultyLevel[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setIsAdaptiveMode(false);
                  setManualDifficulty(lvl);
                  loadNewExercise(selectedCategory, lvl);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  currentLevel === lvl
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                N{lvl}
              </button>
            ))}
            <button
              onClick={() => {
                setIsAdaptiveMode(true);
                loadNewExercise();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                isAdaptiveMode
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Auto
            </button>
          </div>
        </div>

        {/* Exercise Card */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col items-center text-center space-y-6 relative overflow-hidden">
          {/* Topic Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-900/40">
              {currentExercise.topicName}
            </span>
          </div>

          {/* Question Prompt */}
          <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 max-w-xl">
            {currentExercise.questionPrompt}
          </h2>

          {/* Mathematical Expression Box */}
          <div className="w-full max-w-lg py-6 px-4 bg-slate-50 dark:bg-slate-950/60 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-inner">
            <MathView expression={currentExercise.expressionDisplay} size="xl" />
          </div>

          {/* Interactive Hints Bar */}
          {!isAnswerSubmitted && (
            <div className="w-full max-w-md space-y-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleRequestHint}
                  disabled={currentHintIndex + 1 >= currentExercise.hints.length}
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 disabled:opacity-40 flex items-center gap-1.5 transition"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>
                    {currentHintIndex === -1
                      ? 'Demanar una pista'
                      : currentHintIndex === 0
                      ? 'Demanar pista següent'
                      : 'Totes les pistes vistes'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsScratchpadOpen(true)}
                  className="text-xs font-semibold text-slate-500 hover:text-amber-500 flex items-center gap-1 transition"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  <span>Obrir pissarra d'esborrany</span>
                </button>
              </div>

              {/* Displayed Hint Box */}
              {currentHintIndex >= 0 && (
                <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-3 text-xs text-left text-amber-900 dark:text-amber-200 animate-in fade-in space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Pista {currentHintIndex + 1}:</span>
                  </div>
                  <p>{currentExercise.hints[currentHintIndex]}</p>
                </div>
              )}
            </div>
          )}

          {/* Input & Keypad or Step-by-Step Resolution */}
          {!isAnswerSubmitted ? (
            <Keypad
              exercise={currentExercise}
              numInput={numInput}
              denInput={denInput}
              activeSlot={activeSlot}
              onSlotChange={setActiveSlot}
              onInputChange={(slot, val) => {
                if (slot === 'den') setDenInput(val);
                else setNumInput(val);
              }}
              onSubmit={handleSubmitAnswer}
            />
          ) : (
            <div className="w-full text-left">
              <StepByStepView
                steps={currentExercise.steps}
                diagnosis={currentDiagnosis}
                userAnswerStr={userAnswerFormatted}
                correctAnswerStr={currentExercise.answerDisplay}
                isCorrect={isCorrect}
                onNext={handleNextExercise}
                onOpenTheory={() => setIsTheoryOpen(true)}
              />
            </div>
          )}
        </div>

        {/* Motivational Pedagogical Tip of the Day */}
        <div className="bg-white/60 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
          <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <p>
            <strong>Consell per a 3r d'ESO:</strong> Les matemàtiques no es tracten de no equivocar-se mai, sinó d'entendre <em>per què</em> ens equivoquem. Si falles, consulta el pas a pas per descobrir exactament on s'ha desviat el càlcul!
          </p>
        </div>
      </main>

      {/* Persistent Scratchpad / Blackboard */}
      <Scratchpad isOpen={isScratchpadOpen} onClose={() => setIsScratchpadOpen(false)} />

      {/* Student Identification Modal */}
      <StudentIdentificationModal
        isOpen={isStudentModalOpen}
        canDismiss={!!studentProfile}
        onClose={() => setIsStudentModalOpen(false)}
        initialName={studentProfile?.name}
        initialGroup={studentProfile?.group}
        onSaveStudent={handleSaveStudent}
      />

      {/* Teacher Dashboard Modal */}
      <TeacherDashboardModal
        isOpen={isTeacherDashboardOpen}
        onClose={() => setIsTeacherDashboardOpen(false)}
        initialTab={teacherDashboardTab}
      />

      {/* Theory & Cheat-Sheet Modal */}
      <TheoryGuideModal
        isOpen={isTheoryOpen}
        onClose={() => setIsTheoryOpen(false)}
        initialTopic={selectedCategory}
      />

      {/* Errors Notebook Modal */}
      <ErrorsNotebookModal
        isOpen={isErrorsOpen}
        onClose={() => setIsErrorsOpen(false)}
        failedExercises={failedExercises}
        onRetry={(item) => {
          setCurrentExercise(item.exercise);
          setSelectedCategory(item.exercise.category);
          setNumInput('');
          setDenInput('');
          setActiveSlot('num');
          setIsAnswerSubmitted(false);
          setIsCorrect(false);
          setUserAnswerFormatted('');
          setCurrentDiagnosis(null);
          setCurrentHintIndex(-1);
        }}
        onClear={() => {
          if (confirm('Vols buidar el teu quadern d’errors?')) {
            setFailedExercises([]);
          }
        }}
      />

      {/* Stats & Badges Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        onResetStats={() => {
          setStats(INITIAL_STATS);
          localStorage.removeItem(STORAGE_KEY_STATS);
        }}
      />

      {/* Exam Simulation Modal */}
      <ExamModeModal
        isOpen={isExamOpen}
        onClose={() => setIsExamOpen(false)}
        onAddFailedExercise={handleAddFailedExercise}
      />
    </div>
  );
}
