/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, GraduationCap, ArrowRight, Sparkles, X } from 'lucide-react';

interface StudentIdentificationModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canDismiss?: boolean;
  onSaveStudent: (name: string, group: string) => void;
  initialName?: string;
  initialGroup?: string;
}

export const StudentIdentificationModal: React.FC<StudentIdentificationModalProps> = ({
  isOpen,
  onClose,
  canDismiss = false,
  onSaveStudent,
  initialName = '',
  initialGroup = '3r ESO A'
}) => {
  const [name, setName] = useState(initialName);
  const [group, setGroup] = useState(initialGroup);
  const [customGroup, setCustomGroup] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  if (!isOpen) return null;

  const presetGroups = ['3r ESO A', '3r ESO B', '3r ESO C', '3r ESO D', 'Reforç'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const finalGroup = isCustom ? (customGroup.trim() || 'Grup General') : group;
    onSaveStudent(name.trim(), finalGroup);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 relative">
          {onClose && (
            <button
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
            Benvingut/da a Mates 3r d'ESO!
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Identifica't perquè el teu professor/a pugui veure el teu progrés i ajudar-te amb el càlcul.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              <span>El teu nom i cognoms:</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Marc Garcia Puig"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tria la teva classe o grup:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {presetGroups.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setGroup(g);
                    setIsCustom(false);
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
                onClick={() => setIsCustom(true)}
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
                placeholder="Escriu el nom del teu grup..."
                value={customGroup}
                onChange={(e) => setCustomGroup(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
            )}
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-40 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-500/25 active:scale-95 transition flex items-center justify-center gap-2"
            >
              <span>Comença a practicar!</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onSaveStudent('Alumne Convidat', 'Pràctica Lliure')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs rounded-xl transition"
            >
              O entra com a Convidat (sense registre)
            </button>
          </div>
        </form>

        <div className="bg-indigo-50/60 dark:bg-indigo-950/40 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2 text-[11px] text-indigo-900 dark:text-indigo-300">
          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>
            El teu nom es guardarà en aquest dispositiu per no haver-lo de tornar a escriure cada dia.
          </span>
        </div>
      </div>
    </div>
  );
};
