/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, GraduationCap, ArrowRight, X, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { STUDENT_ACCESS_PASSWORD } from '../config/sheetsConfig';

interface StudentIdentificationModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canDismiss?: boolean;
  onSaveStudent: (name: string, group: string, accessCode: string) => void;
  initialName?: string;
  initialGroup?: string;
}

const COURSES = ['1r ESO', '2n ESO', '3r ESO', '4t ESO'] as const;
const CLASSES = ['A', 'B', 'C'] as const;

type CourseOption = (typeof COURSES)[number];
type ClassOption = (typeof CLASSES)[number];

function parseInitialGroup(rawGroup?: string): { course: CourseOption; classLetter: ClassOption } {
  const normalized = (rawGroup || '').trim();
  const matchedCourse = COURSES.find((c) => normalized.startsWith(c)) ?? '3r ESO';
  const rest = normalized.replace(matchedCourse, '').trim().toUpperCase();
  const matchedClass = CLASSES.find((cls) => rest === cls) ?? 'A';
  return { course: matchedCourse, classLetter: matchedClass };
}

export const StudentIdentificationModal: React.FC<StudentIdentificationModalProps> = ({
  isOpen,
  onClose,
  canDismiss = false,
  onSaveStudent,
  initialName = '',
  initialGroup = '3r ESO A'
}) => {
  const initialParsed = parseInitialGroup(initialGroup);
  const [name, setName] = useState(initialName);
  const [course, setCourse] = useState<CourseOption>(initialParsed.course);
  const [classLetter, setClassLetter] = useState<ClassOption>(initialParsed.classLetter);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const parsed = parseInitialGroup(initialGroup);
      setName(initialName || '');
      setCourse(parsed.course);
      setClassLetter(parsed.classLetter);
      setPassword('');
      setErrorMsg('');
    }
  }, [isOpen, initialName, initialGroup]);

  if (!isOpen) return null;

  const selectedGroup = `${course} ${classLetter}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.split(/\s+/).length < 2) {
      setErrorMsg('Escriu el teu nom i cognom (com a mínim dues paraules).');
      return;
    }

    const trimmedPassword = password.trim();
    if (trimmedPassword !== STUDENT_ACCESS_PASSWORD) {
      setErrorMsg('Contrasenya incorrecta. Demana-la al teu professor/a.');
      return;
    }

    setErrorMsg('');
    onSaveStudent(trimmedName, selectedGroup, trimmedPassword);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-5">
        {/* Header */}
        <div className="text-center space-y-2 relative">
          {canDismiss && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-0 top-0 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title="Tancar"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60">
            <GraduationCap className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white text-balance">
            Càlcul: enters, potències i fraccions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            Introdueix el teu nom i cognoms, tria curs i classe, i escriu la contrasenya d&apos;accés.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              <span>Nom i cognoms:</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: Marc Garcia Puig"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          {/* Course selector (1r, 2n, 3r, 4t ESO) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Curs:</span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Grup: <strong className="text-indigo-600 dark:text-indigo-400">{selectedGroup}</strong>
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {COURSES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCourse(c);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className={`min-h-[42px] py-2 px-2 rounded-xl text-xs font-bold whitespace-nowrap transition border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    course === c
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Class selector (A, B, C) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Classe:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CLASSES.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => {
                    setClassLetter(cls);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className={`min-h-[42px] py-2 px-4 rounded-xl text-sm font-bold whitespace-nowrap transition border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    classLetter === cls
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  Classe {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Access Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-500" />
              <span>Contrasenya de classe:</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="off"
                placeholder="Introdueix la contrasenya"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="w-full pl-4 pr-11 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title={showPassword ? 'Amaga la contrasenya' : 'Mostra la contrasenya'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-1">
            <button
              type="submit"
              disabled={!name.trim() || !password.trim()}
              className="w-full min-h-[46px] py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-sm rounded-2xl shadow-md active:scale-95 transition flex items-center justify-center gap-2"
            >
              <span>Entrar i començar a practicar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
