/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  MathExercise,
  GuidedStepNode,
  GuidedOperationOption
} from '../types/math';
import { MathView } from './MathView';
import { sounds } from '../utils/audio';
import {
  AlertTriangle,
  CheckCircle2,
  CornerDownLeft,
  Delete,
  ListOrdered,
  RefreshCw
} from 'lucide-react';

interface GuidedCombinedWorkbenchProps {
  exercise: MathExercise;
  onComplete: (summary: { priorityMistakes: number; arithmeticMistakes: number }) => void;
}

interface TrailItem {
  stepNumber: number;
  subExpression: string;
  value: number;
  resultExpression: string;
}

export const GuidedCombinedWorkbench: React.FC<GuidedCombinedWorkbenchProps> = ({
  exercise,
  onComplete
}) => {
  const nodes = exercise.guidedSteps ?? [];
  const firstNodeId = nodes[0]?.id ?? '';

  const [currentNodeId, setCurrentNodeId] = useState<string>(firstNodeId);
  const [selectedOption, setSelectedOption] = useState<GuidedOperationOption | null>(null);
  const [opFeedback, setOpFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  );
  const [stepInput, setStepInput] = useState<string>('');
  const [arithErrorMsg, setArithErrorMsg] = useState<string>('');
  const [completedTrail, setCompletedTrail] = useState<TrailItem[]>([]);
  const [priorityMistakes, setPriorityMistakes] = useState<number>(0);
  const [arithmeticMistakes, setArithmeticMistakes] = useState<number>(0);

  // Reset state whenever exercise changes
  useEffect(() => {
    const startId = exercise.guidedSteps?.[0]?.id ?? '';
    setCurrentNodeId(startId);
    setSelectedOption(null);
    setOpFeedback(null);
    setStepInput('');
    setArithErrorMsg('');
    setCompletedTrail([]);
    setPriorityMistakes(0);
    setArithmeticMistakes(0);
  }, [exercise.id, exercise.guidedSteps]);

  const currentNode: GuidedStepNode | undefined = nodes.find((n) => n.id === currentNodeId);
  const isDirectStep = Boolean(currentNode && currentNode.options.length === 0);
  const isComputePhase = Boolean(currentNode && (isDirectStep || selectedOption !== null));

  const activeSubExpr = isDirectStep
    ? currentNode?.directSubExpression || ''
    : selectedOption?.subExpression || '';
  const activeExpectedVal = isDirectStep
    ? currentNode?.directExpectedValue
    : selectedOption?.expectedValue;
  const activeResultExpr = isDirectStep
    ? currentNode?.directResultExpression || ''
    : selectedOption?.resultExpression || '';
  const activeMistakeHint = isDirectStep
    ? currentNode?.directMistakeHint
    : selectedOption?.subMistakeHint;
  const activeNextId = isDirectStep ? null : selectedOption?.nextStepId ?? null;

  const handleSelectOption = (opt: GuidedOperationOption) => {
    if (selectedOption) return; // already picked the right op for this step
    if (!opt.isCorrect) {
      sounds.playWrong();
      setPriorityMistakes((prev) => prev + 1);
      setOpFeedback({ type: 'error', message: opt.feedbackMessage });
      return;
    }

    sounds.playHint();
    setSelectedOption(opt);
    setOpFeedback({ type: 'success', message: opt.feedbackMessage });
    setStepInput('');
    setArithErrorMsg('');
  };

  const handleCheckStepValue = useCallback(() => {
    if (!currentNode || !isComputePhase || activeExpectedVal === undefined) return;
    const trimmed = stepInput.trim();
    if (!trimmed || trimmed === '-') return;
    const parsed = parseInt(trimmed, 10);
    if (isNaN(parsed)) return;

    if (parsed !== activeExpectedVal) {
      sounds.playWrong();
      setArithmeticMistakes((prev) => prev + 1);
      setArithErrorMsg(
        activeMistakeHint ||
          `El resultat de ${activeSubExpr} no és ${parsed}. Revisa el càlcul i el signe!`
      );
      return;
    }

    // Sub-step solved!
    sounds.playCorrect();
    const nextTrailItem: TrailItem = {
      stepNumber: completedTrail.length + 1,
      subExpression: activeSubExpr,
      value: activeExpectedVal,
      resultExpression: activeResultExpr
    };
    setCompletedTrail((prev) => [...prev, nextTrailItem]);
    setStepInput('');
    setArithErrorMsg('');
    setSelectedOption(null);
    setOpFeedback(null);

    if (activeNextId) {
      setCurrentNodeId(activeNextId);
    } else {
      onComplete({ priorityMistakes, arithmeticMistakes });
    }
  }, [
    currentNode,
    isComputePhase,
    activeExpectedVal,
    stepInput,
    activeMistakeHint,
    activeSubExpr,
    completedTrail.length,
    activeResultExpr,
    activeNextId,
    onComplete,
    priorityMistakes,
    arithmeticMistakes
  ]);

  const handleDigit = useCallback(
    (digit: string) => {
      if (!isComputePhase) return;
      if (stepInput.length > 7) return;
      setStepInput((prev) => (prev === '0' ? digit : prev + digit));
      if (arithErrorMsg) setArithErrorMsg('');
    },
    [isComputePhase, stepInput.length, arithErrorMsg]
  );

  const handleToggleSign = useCallback(() => {
    if (!isComputePhase) return;
    setStepInput((prev) => {
      if (!prev) return '-';
      return prev.startsWith('-') ? prev.slice(1) : '-' + prev;
    });
    if (arithErrorMsg) setArithErrorMsg('');
  }, [isComputePhase, arithErrorMsg]);

  const handleBackspace = useCallback(() => {
    if (!isComputePhase) return;
    setStepInput((prev) => prev.slice(0, -1));
    if (arithErrorMsg) setArithErrorMsg('');
  }, [isComputePhase, arithErrorMsg]);

  useEffect(() => {
    if (!isComputePhase) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
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
        handleCheckStepValue();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isComputePhase, handleDigit, handleToggleSign, handleBackspace, handleCheckStepValue]);

  if (!currentNode) return null;

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 text-left">
      {/* Completed steps trail (clean hairline progression) */}
      {completedTrail.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-2">
          <div className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <ListOrdered className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Passos completats</span>
          </div>
          <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
            {completedTrail.map((item) => (
              <div
                key={item.stepNumber}
                className="py-2 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {item.stepNumber}.
                  </span>
                  <MathView expression={item.subExpression} size="sm" />
                  <span>=</span>
                  <strong className="font-mono tabular-nums text-slate-900 dark:text-white">
                    {item.value}
                  </strong>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <span>→</span>
                  <MathView expression={item.resultExpression} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Step Box */}
      <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        {/* Current expression state */}
        <div className="text-center space-y-1.5">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Expressió actual
          </div>
          <div className="py-3 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center">
            <MathView expression={currentNode.promptExpression} size="lg" />
          </div>
        </div>

        {/* Phase 1: Order-of-operations choice */}
        {!isDirectStep && (
          <div className="space-y-3">
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {currentNode.stepInstruction}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentNode.options.map((opt) => {
                const isSelectedCorrect = selectedOption?.id === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={Boolean(selectedOption)}
                    onClick={() => handleSelectOption(opt)}
                    className={`min-h-[48px] px-4 py-2.5 rounded-xl border text-sm font-semibold transition flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      isSelectedCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-200 shadow-sm'
                        : selectedOption
                        ? 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 text-slate-900 dark:text-white active:scale-95 shadow-sm'
                    }`}
                  >
                    <MathView expression={opt.label} size="sm" />
                  </button>
                );
              })}
            </div>

            {opFeedback && (
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs leading-relaxed ${
                  opFeedback.type === 'error'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                }`}
              >
                {opFeedback.type === 'error' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                )}
                <span className="font-semibold">{opFeedback.message}</span>
              </div>
            )}
          </div>
        )}

        {/* Phase 2: Calculate selected sub-operation */}
        {isComputePhase && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
            {isDirectStep && (
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {currentNode.stepInstruction}
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-wrap items-center justify-center gap-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Calcula:
              </span>
              <MathView expression={activeSubExpr} size="md" />
              <span className="text-lg font-bold text-slate-400">=</span>
              <div className="min-w-[96px] px-3 py-1.5 rounded-lg border-2 border-indigo-500 bg-indigo-50/40 dark:bg-slate-950 text-center text-xl font-mono font-bold tabular-nums text-indigo-700 dark:text-indigo-300">
                {stepInput || <span className="opacity-35 text-sm font-sans">?</span>}
              </div>
            </div>

            {arithErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2 text-xs text-rose-800 dark:text-rose-200 font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{arithErrorMsg}</span>
              </div>
            )}

            {/* Compact Keypad for sub-step */}
            <div className="max-w-xs mx-auto grid grid-cols-4 gap-1.5">
              {['7', '8', '9'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDigit(d)}
                  className="h-11 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono text-lg font-bold rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95 transition"
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setStepInput('');
                  setArithErrorMsg('');
                }}
                title="Esborra"
                className="h-11 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900/60 active:scale-95 transition flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {['4', '5', '6'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDigit(d)}
                  className="h-11 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono text-lg font-bold rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95 transition"
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={handleBackspace}
                title="Esborra l'últim dígit"
                className="h-11 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-600 active:scale-95 transition flex items-center justify-center"
              >
                <Delete className="w-4 h-4" />
              </button>

              {['1', '2', '3'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDigit(d)}
                  className="h-11 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono text-lg font-bold rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95 transition"
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={handleToggleSign}
                title="Canvia signe (+ / -)"
                className="h-11 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-400 font-mono text-base font-extrabold rounded-xl border border-amber-200 dark:border-amber-800/50 active:scale-95 transition"
              >
                ±
              </button>

              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="col-span-2 h-11 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono text-lg font-bold rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95 transition"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleCheckStepValue}
                disabled={!stepInput || stepInput === '-'}
                className="col-span-2 h-11 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-sm active:scale-95 transition flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <span>Comprovar pas</span>
                <CornerDownLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
