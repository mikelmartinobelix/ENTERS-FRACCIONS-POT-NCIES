/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ResolutionStep, MistakeDiagnosis } from '../types/math';
import { AlertTriangle, CheckCircle2, Lightbulb, ArrowRight, BookOpen } from 'lucide-react';
import { MathView } from './MathView';

interface StepByStepViewProps {
  steps: ResolutionStep[];
  diagnosis: MistakeDiagnosis | null;
  userAnswerStr: string;
  correctAnswerStr: string;
  isCorrect: boolean;
  onNext: () => void;
  onOpenTheory: () => void;
}

export const StepByStepView: React.FC<StepByStepViewProps> = ({
  steps,
  diagnosis,
  userAnswerStr,
  correctAnswerStr,
  isCorrect,
  onNext,
  onOpenTheory
}) => {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Result Status Banner */}
      {isCorrect ? (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-emerald-900 dark:text-emerald-300 text-base">
                Molt bé! Resposta correcta!
              </h3>
              <div className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 flex-wrap">
                <span>La solució és:</span>
                <MathView expression={correctAnswerStr} size="sm" />
                <span>. Has aplicat la regla amb èxit!</span>
              </div>
            </div>
          </div>
          <button
            onClick={onNext}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 shrink-0"
          >
            <span>Següent</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Mistake Diagnosis Card */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-500/50 rounded-2xl p-4 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <span>{diagnosis ? diagnosis.mistakeTitle : "Compte! Revisa aquest càlcul"}</span>
              </div>
              <span className="text-[11px] bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2.5 py-0.5 rounded-full font-semibold">
                Anàlisi de l'error
              </span>
            </div>

            {diagnosis ? (
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {diagnosis.explanation}
              </p>
            ) : (
              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex items-center gap-1.5 flex-wrap">
                <span>Has respost</span>
                <MathView expression={userAnswerStr} size="sm" />
                <span>, però la solució correcta és</span>
                <MathView expression={correctAnswerStr} size="sm" />
                <span>. Anem a desglossar-ho pas a pas:</span>
              </div>
            )}

            {diagnosis?.tip && (
              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 flex items-start gap-2 text-xs">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-900 dark:text-amber-300 block">
                    Consell clau per recordar:
                  </strong>
                  <span className="text-slate-600 dark:text-slate-300">{diagnosis.tip}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step by Step Breakdown */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
              123
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Explicació Pas a Pas de la Resolució:
            </h4>
          </div>

          <button
            onClick={onOpenTheory}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Veure teoria</span>
          </button>
        </div>

        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1.5 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {step.title}
                </span>
                {step.ruleTag && (
                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-semibold border border-indigo-200 dark:border-indigo-900/50">
                    {step.ruleTag}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {step.explanation}
              </p>
              <div className="pt-1">
                <MathView expression={step.expression} size="sm" />
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onNext}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <span>Següent Exercici</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
