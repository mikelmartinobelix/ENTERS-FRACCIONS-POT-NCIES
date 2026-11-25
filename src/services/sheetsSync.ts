/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEFAULT_APPS_SCRIPT_URL, STUDENT_ACCESS_PASSWORD } from '../config/sheetsConfig';
import { MathCategory, DifficultyLevel } from '../types/math';
import { StudentProfile } from './firebase';

const STORAGE_KEY_SHEETS_URL = 'mates3r_apps_script_url_v1';

export function getConfiguredSheetsUrl(): string {
  if (DEFAULT_APPS_SCRIPT_URL) {
    return DEFAULT_APPS_SCRIPT_URL;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SHEETS_URL);
    return saved ? saved.trim() : '';
  } catch {
    return '';
  }
}

export function saveConfiguredSheetsUrl(url: string): void {
  try {
    const clean = url.trim();
    if (clean) {
      localStorage.setItem(STORAGE_KEY_SHEETS_URL, clean);
    } else {
      localStorage.removeItem(STORAGE_KEY_SHEETS_URL);
    }
  } catch {
    // ignore storage errors
  }
}

/**
 * Reads ?sheets=... query param from shareable URLs so students automatically
 * connect to the teacher's Google Sheet even without rebuilding GitHub Pages.
 */
export function captureSheetsUrlFromLocation(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const paramUrl = params.get('sheets');
    if (paramUrl && paramUrl.startsWith('https://script.google.com/')) {
      saveConfiguredSheetsUrl(paramUrl);
      return paramUrl;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function testSheetsConnection(customUrl?: string): Promise<{ ok: boolean; message: string }> {
  const url = (customUrl ?? getConfiguredSheetsUrl()).trim();
  if (!url) {
    return { ok: false, message: 'No hi ha cap URL d’Apps Script configurada.' };
  }
  if (!url.startsWith('https://script.google.com/')) {
    return { ok: false, message: 'La URL ha de començar per https://script.google.com/...' };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      return { ok: false, message: `Error HTTP ${res.status} en connectar amb Apps Script.` };
    }
    const data = await res.json();
    if (data && data.ok) {
      return { ok: true, message: 'Connexió correcta amb Google Sheets!' };
    }
    return { ok: false, message: 'El script ha respost, però en un format inesperat.' };
  } catch (err: any) {
    return {
      ok: false,
      message: err?.name === 'AbortError'
        ? 'Temps d’espera esgotat. Revisa que la implementació sigui pública ("Qualsevol usuari").'
        : 'No s’ha pogut connectar. Revisa la URL (/exec) i permisos de l’Apps Script.'
    };
  }
}

async function postToSheets(payload: Record<string, unknown>): Promise<void> {
  const url = getConfiguredSheetsUrl();
  if (!url) return;

  try {
    // Use text/plain to avoid CORS preflight OPTIONS requests on Google Apps Script
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload),
      keepalive: true
    });
  } catch (err) {
    console.warn('[Google Sheets Sync]:', err);
  }
}

export function registerStudentInSheets(
  student: StudentProfile,
  accessCode: string = STUDENT_ACCESS_PASSWORD
): void {
  void postToSheets({
    action: 'register',
    accessCode,
    student
  });
}

export function logExerciseInSheets(
  student: StudentProfile,
  category: MathCategory,
  difficulty: DifficultyLevel,
  expression: string,
  userAnswer: string,
  correctAnswer: string,
  isCorrect: boolean,
  mistakeTitle?: string,
  accessCode: string = STUDENT_ACCESS_PASSWORD
): void {
  void postToSheets({
    action: 'exercise',
    accessCode,
    student,
    exercise: {
      category,
      difficulty,
      expression,
      userAnswer,
      correctAnswer,
      isCorrect,
      mistakeTitle: mistakeTitle || ''
    }
  });
}
