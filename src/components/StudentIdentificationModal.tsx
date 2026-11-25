/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, GraduationCap, ArrowRight, Sparkles, X, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { STUDENT_ACCESS_PASSWORD } from '../config/sheetsConfig';

interface StudentIdentificationModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canDismiss?: boolean;
  onSaveStudent: (name: string, group: string, accessCode: string) => void;
  initialName?: string;
  initialGroup?: string;
}

const PRESET_GROUPS = ['3r ESO A', '3r ESO B', '3r ESO C', '3r ESO D', 'Reforç'];

export const StudentIdentificationModal: React.FC<StudentIdentificationModalProps> = ({
  isOpen,
  onClose,
  canDismiss = false,
  onSaveStudent,
  initialName = '',
  initialGroup = '3r ESO A'
}) => {
  const [name, setName] = useState(initialName);
  const [group, setGroup] = useState(PRESET_GROUPS.includes(initialGroup) ? initialGroup : '3r ESO A');
  const [customGroup, setCustomGroup] = useState(
    initialGroup && !PRESET_GROUPS.includes(initialGroup) ? initialGroup : ''
  );
  const [isCustom, setIsCustom] = useState(Boolean(initialGroup && !PRESET_GROUPS.includes(initialGroup)));
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialName || '');
      const hasCustom = Boolean(initialGroup && !PRESET_GROUPS.includes(initialGroup));
      setIsCustom(hasCustom);
      setGroup(hasCustom ? '3r ESO A' : initialGroup || '3r ESO A');
      setCustomGroup(hasCustom ? initialGroup || '' : '');
      setPassword('');
      setErrorMsg('');
    }
  }, [isOpen, initialName, initialGroup]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.split(/\s+/).length < 2) {
      setErrorMsg('Escriu el teu nom i cognom (com a mínim dues paraules).');
      return;
    }

    const finalGroup = isCustom ? customGroup.trim() : group;
    if (!finalGroup) {
      setErrorMsg('Indica el teu grup classe.');
      return;
    }

    const trimmedPassword = password.trim();
    if (trimmedPassword !== STUDENT_ACCESS_PASSWORD) {
      setErrorMsg('Contrasenya incorrecta. Demana-la al teu professor/a.');
      return;
    }

    setErrorMsg('');
    onSaveStudent(trimmedName, finalGroup, trimmedPassword);
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
              className="absolute right-0 top-0 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition"
              title="Tancar"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="w-14 h-14 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
            <GraduationCap className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Benvingut/da a Mates 3r d&apos;ESO!
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Introdueix el teu nom i cognom, el teu grup classe i la contrasenya d&apos;accés per registrar la pràctica.
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

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Grup classe:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_GROUPS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setGroup(g);
                    setIsCustom(false);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                    !isCustom && group === g
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  {g}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setIsCustom(true);
                  if (errorMsg) setErrorMsg('');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                  isCustom
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                Altre grup...
              </button>
            </div>

            {isCustom && (
              <input
                type="text"
                required
                placeholder="Escriu el nom del teu grup..."
                value={customGroup}
                onChange={(e) => {
                  setCustomGroup(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
            )}
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
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-40 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-500/25 active:scale-95 transition flex items-center justify-center gap-2"
            >
              <span>Entrar i començar a practicar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="bg-indigo-50/60 dark:bg-indigo-950/40 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2 text-[11px] text-indigo-900 dark:text-indigo-300">
          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>
            Cada sessió queda registrada al full de seguiment del professorat per veure la teva evolució.
          </span>
        </div>
      </div>
    </div>
  );
};
