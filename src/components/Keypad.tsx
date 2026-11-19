/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Delete, CornerDownLeft, RefreshCw } from 'lucide-react';
import { MathExercise } from '../types/math';

interface KeypadProps {
  exercise: MathExercise;
  // Answer values:
  numInput: string;
  denInput: string;
  activeSlot: 'num' | 'den' | 'single';
  onSlotChange: (slot: 'num' | 'den' | 'single') => void;
  onInputChange: (slot: 'num' | 'den' | 'single', val: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export const Keypad: React.FC<KeypadProps> = ({
  exercise,
  numInput,
  denInput,
  activeSlot,
  onSlotChange,
  onInputChange,
  onSubmit,
  disabled = false
}) => {
  const isFraction = exercise.correctAnswer.kind === 'fraction';

  // Current value of active slot
  const currentVal = activeSlot === 'den' ? denInput : numInput;

  const handleDigit = (digit: string) => {
    if (disabled) return;
    const targetSlot = isFraction ? activeSlot : 'single';
    const val = targetSlot === 'den' ? denInput : numInput;
    if (val.length > 7) return; // avoid overflow
    const next = val === '0' ? digit : val + digit;
    onInputChange(targetSlot, next);
  };

  const handleToggleSign = () => {
    if (disabled) return;
    const targetSlot = isFraction ? activeSlot : 'single';
    const val = targetSlot === 'den' ? denInput : numInput;
    if (!val) {
      onInputChange(targetSlot, '-');
      return;
    }
    if (val.startsWith('-')) {
      onInputChange(targetSlot, val.slice(1));
    } else {
      onInputChange(targetSlot, '-' + val);
    }
  };

  const handleBackspace = () => {
    if (disabled) return;
    const targetSlot = isFraction ? activeSlot : 'single';
    const val = targetSlot === 'den' ? denInput : numInput;
    onInputChange(targetSlot, val.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled) return;
    if (isFraction) {
      onInputChange('num', '');
      onInputChange('den', '');
      onSlotChange('num');
    } else {
      onInputChange('single', '');
    }
  };

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // Let standard input handle if focused on another element
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === '-' || e.key === '+') {
        e.preventDefault();
        handleToggleSign();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSubmit();
      } else if (e.key === '/' && isFraction) {
        e.preventDefault();
        onSlotChange('den');
      } else if (e.key === 'Tab' && isFraction) {
        e.preventDefault();
        onSlotChange(activeSlot === 'num' ? 'den' : 'num');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, activeSlot, numInput, denInput, isFraction, onSubmit]);

  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0'];

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col gap-3">
      {/* Answer Slots Display */}
      {isFraction ? (
        <div className="bg-slate-100 dark:bg-slate-800/80 p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Introdueix la fracció irreductible:
          </div>
          <div className="inline-flex flex-col items-center">
            {/* Numerator Slot */}
            <button
              type="button"
              onClick={() => onSlotChange('num')}
              className={`w-32 py-2 px-3 text-center text-xl font-mono font-bold rounded-xl transition shadow-inner ${
                activeSlot === 'num'
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-300 dark:ring-indigo-900 shadow-md scale-105'
                  : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 hover:border-indigo-400'
              }`}
            >
              {numInput || <span className="opacity-40 text-sm font-sans">Numerador</span>}
            </button>

            {/* Fraction bar */}
            <div className="w-36 h-1 bg-slate-800 dark:bg-slate-200 rounded-full my-1.5" />

            {/* Denominator Slot */}
            <button
              type="button"
              onClick={() => onSlotChange('den')}
              className={`w-32 py-2 px-3 text-center text-xl font-mono font-bold rounded-xl transition shadow-inner ${
                activeSlot === 'den'
                  ? 'bg-amber-600 text-white ring-4 ring-amber-300 dark:ring-amber-900 shadow-md scale-105'
                  : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 hover:border-amber-400'
              }`}
            >
              {denInput || <span className="opacity-40 text-sm font-sans">Denominador</span>}
            </button>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Prem <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">Tab</kbd> o <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">/</kbd> per canviar de casella
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 dark:bg-slate-800/80 p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            La teva resposta:
          </div>
          <div className="w-full max-w-[200px] py-2.5 px-4 bg-white dark:bg-slate-900 border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 rounded-xl text-center text-2xl font-mono font-bold shadow-inner min-h-[52px] flex items-center justify-center">
            {numInput || <span className="opacity-30 text-base font-sans">Escriu el resultat...</span>}
          </div>
        </div>
      )}

      {/* Touch-Friendly Keypad Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {/* Row 1 */}
        <button
          type="button"
          onClick={() => handleDigit('7')}
          className="h-12 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono text-xl font-bold rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95 transition shadow-sm"
        >
          7
        </button>
        <button
          type="button"
          onClick={() => handleDigit('8')}
          className="h-12 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono text-xl font-bold rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95 transition shadow-sm"
        >
          8
        </button>
        <button
          type="button"
          onClick={() => handleDigit('9')}
          className="h-12 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono text-xl font-bold rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95 transition shadow-sm"
        >
          9
        </button>
        <button
          type="button"
          onClick={handleClear}
          title="Esborra tot"
          className="h-12 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-semibold rounded-xl border border-rose-200 dark:border-rose-900/60 active:scale-95 transition flex items-center justify-center"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        {/* Row 2 */}
        <button
          type="button"
          onClick={() => handleDigit('4')}
          className="h-12 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono text-xl font-bold rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95 transition shadow-sm"
        >
          4
        </button>
        <button
          type="button"
          onClick={() => handleDigit('5')}
          className="h-12 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono text-xl font-bold rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95 transition shadow-sm"
        >
          5
        </button>
        <button
          type="button"
          onClick={() => handleDigit('6')}
          className="h-12 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono text-xl font-bold rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95 transition shadow-sm"
        >
          6
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          title="Esborra l'últim dígit"
          className="h-12 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-600 active:scale-95 transition flex items-center justify-center"
        >
          <Delete className="w-5 h-5" />
        </button>

        {/* Row 3 */}
        <button
          type="button"
          onClick={() => handleDigit('1')}
          className="h-12 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono text-xl font-bold rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95 transition shadow-sm"
        >
          1
        </button>
        <button
          type="button"
          onClick={() => handleDigit('2')}
          className="h-12 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono text-xl font-bold rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95 transition shadow-sm"
        >
          2
        </button>
        <button
          type="button"
          onClick={() => handleDigit('3')}
          className="h-12 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono text-xl font-bold rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95 transition shadow-sm"
        >
          3
        </button>
        <button
          type="button"
          onClick={handleToggleSign}
          title="Canvia signe (+ / -)"
          className="h-12 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 font-bold rounded-xl border border-amber-200 dark:border-amber-800/50 active:scale-95 transition flex items-center justify-center gap-1"
        >
          <span className="text-base font-extrabold font-mono">±</span>
        </button>

        {/* Row 4 */}
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="col-span-2 h-12 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono text-xl font-bold rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95 transition shadow-sm"
        >
          0
        </button>

        {isFraction && (
          <button
            type="button"
            onClick={() => onSlotChange(activeSlot === 'num' ? 'den' : 'num')}
            className="h-12 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl border border-indigo-200 dark:border-indigo-800/50 active:scale-95 transition flex items-center justify-center"
          >
            {activeSlot === 'num' ? '⬇ Baix' : '⬆ Dalt'}
          </button>
        )}

        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || (!numInput && !denInput)}
          className={`${
            isFraction ? 'col-span-1' : 'col-span-2'
          } h-12 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md active:scale-95 transition flex items-center justify-center gap-1.5`}
        >
          <span>Validar</span>
          <CornerDownLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
