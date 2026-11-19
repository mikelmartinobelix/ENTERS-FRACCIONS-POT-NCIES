/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FailedExercise } from '../types/math';
import { BookmarkCheck, X, RotateCcw, CheckCircle2, Trash2 } from 'lucide-react';
import { MathView } from './MathView';

interface ErrorsNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  failedExercises: FailedExercise[];
  onRetry: (exercise: FailedExercise) => void;
  onClear: () => void;
}

export const ErrorsNotebookModal: React.FC<ErrorsNotebookModalProps> = ({
  isOpen,
  onClose,
  failedExercises,
  onRetry,
  onClear
}) => {
  if (!isOpen) return null;

  const total = failedExercises.length;
  const masteredCount = failedExercises.filter((f) => f.mastered).length;
  const pendingCount = total - masteredCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                El meu Quadern d'Errors
              </h2>
              <p className="text-xs text-slate-500">
                {pendingCount === 0
                  ? 'No tens cap error pendent de revisar! Felicitats!'
                  : `Tens ${pendingCount} exercici${pendingCount > 1 ? 's' : ''} per tornar a intentar.`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress header */}
        {total > 0 && (
          <div className="px-6 py-3 bg-indigo-50/50 dark:bg-indigo-950/30 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Superats: {masteredCount} de {total}
              </span>
              <div className="w-28 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${total > 0 ? (masteredCount / total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <button
              onClick={onClear}
              className="text-slate-500 hover:text-rose-600 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Buidar quadern</span>
            </button>
          </div>
        )}

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {failedExercises.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">
                El teu quadern està buit!
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Quan comets un error durant la pràctica, es guardarà aquí perquè puguis repassar-lo i dominar el concepte sense frustració.
              </p>
            </div>
          ) : (
            failedExercises.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  item.mastered
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 opacity-75'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-sm'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {item.exercise.topicName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {item.exercise.difficultyLabel}
                    </span>
                    {item.mastered && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Superat!
                      </span>
                    )}
                  </div>

                  <div className="py-1">
                    <MathView expression={item.exercise.expressionDisplay} size="sm" />
                  </div>

                  <div className="text-xs flex items-center gap-3 text-slate-500 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <span>La teva resposta:</span>
                      <MathView expression={item.userAnswerStr} size="sm" />
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <span>Correcte:</span>
                      <MathView expression={item.exercise.answerDisplay} size="sm" />
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      onRetry(item);
                      onClose();
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                      item.mastered
                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{item.mastered ? 'Practica de nou' : 'Reintenta ara'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-xl transition"
          >
            Tancar
          </button>
        </div>
      </div>
    </div>
  );
};
