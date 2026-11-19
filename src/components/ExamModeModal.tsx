/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MathExercise, AnswerType } from '../types/math';
import { generateExercise } from '../utils/mathEngine';
import { MathView } from './MathView';
import { Keypad } from './Keypad';
import { sounds } from '../utils/audio';
import { Award, Clock, ArrowRight, X, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExamModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFailedExercise: (exercise: MathExercise, userAnswerStr: string) => void;
}

export const ExamModeModal: React.FC<ExamModeModalProps> = ({
  isOpen,
  onClose,
  onAddFailedExercise
}) => {
  const [questions, setQuestions] = useState<MathExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [numInput, setNumInput] = useState('');
  const [denInput, setDenInput] = useState('');
  const [activeSlot, setActiveSlot] = useState<'num' | 'den' | 'single'>('num');
  
  // Results
  const [userAnswers, setUserAnswers] = useState<Record<number, { correct: boolean; userStr: string }>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Initialize 10 exam questions
  useEffect(() => {
    if (isOpen) {
      const qList: MathExercise[] = [
        generateExercise('enters', 2),
        generateExercise('enters', 3),
        generateExercise('enters', 3),
        generateExercise('potencies', 2),
        generateExercise('potencies', 3),
        generateExercise('potencies', 3),
        generateExercise('fraccions', 2),
        generateExercise('fraccions', 2),
        generateExercise('fraccions', 3),
        generateExercise('fraccions', 4)
      ];
      setQuestions(qList);
      setCurrentIndex(0);
      setUserAnswers({});
      setIsFinished(false);
      setSecondsElapsed(0);
      setNumInput('');
      setDenInput('');
    }
  }, [isOpen]);

  // Timer
  useEffect(() => {
    if (!isOpen || isFinished) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isFinished]);

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];

  const handleSlotChange = (slot: 'num' | 'den' | 'single') => {
    setActiveSlot(slot);
  };

  const handleInputChange = (slot: 'num' | 'den' | 'single', val: string) => {
    if (slot === 'den') setDenInput(val);
    else setNumInput(val);
  };

  const checkAnswerCorrectness = (exercise: MathExercise): { isCorrect: boolean; answerStr: string } => {
    const expected = exercise.correctAnswer;
    if (expected.kind === 'number') {
      const userVal = parseInt(numInput.trim(), 10);
      return {
        isCorrect: userVal === expected.value,
        answerStr: numInput.trim()
      };
    }
    if (expected.kind === 'power') {
      const userExp = parseInt(numInput.trim(), 10);
      return {
        isCorrect: userExp === expected.exp,
        answerStr: numInput.trim()
      };
    }
    if (expected.kind === 'fraction') {
      const userNum = parseInt(numInput.trim(), 10);
      const userDen = parseInt(denInput.trim() || '1', 10);
      const isCorrect = userNum === expected.num && userDen === expected.den;
      return {
        isCorrect,
        answerStr: `${userNum}/${userDen}`
      };
    }
    return { isCorrect: false, answerStr: '' };
  };

  const handleSubmitQuestion = () => {
    if (!currentQ) return;
    const { isCorrect, answerStr } = checkAnswerCorrectness(currentQ);

    if (isCorrect) {
      sounds.playCorrect();
    } else {
      sounds.playWrong();
      onAddFailedExercise(currentQ, answerStr);
    }

    const nextAnswers = {
      ...userAnswers,
      [currentIndex]: { correct: isCorrect, userStr: answerStr }
    };
    setUserAnswers(nextAnswers);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setNumInput('');
      setDenInput('');
      setActiveSlot('num');
    } else {
      setIsFinished(true);
      const totalCorrect = Object.values(nextAnswers).filter((a) => a.correct).length;
      if (totalCorrect >= 7) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalCorrect = Object.values(userAnswers).filter((a) => a.correct).length;
  const grade = ((totalCorrect / questions.length) * 10).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Simulacre d'Examen 3r d'ESO
              </h2>
              <p className="text-xs text-slate-500">
                10 preguntes adaptatives per avaluar el teu nivell real
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{formatTime(secondsElapsed)}</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Exam Body */}
        {!isFinished ? (
          <div className="p-6 overflow-y-auto flex-1 flex flex-col justify-between gap-6">
            {/* Progress indicators */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>
                  Pregunta <strong className="text-indigo-600 dark:text-indigo-400">{currentIndex + 1}</strong> de {questions.length}
                </span>
                <span className="font-semibold">{currentQ?.topicName}</span>
              </div>
              <div className="flex gap-1.5">
                {questions.map((_, idx) => {
                  const state = userAnswers[idx];
                  return (
                    <div
                      key={idx}
                      className={`h-2 flex-1 rounded-full transition-all ${
                        idx === currentIndex
                          ? 'bg-indigo-600 scale-y-125'
                          : state !== undefined
                          ? state.correct
                            ? 'bg-emerald-500'
                            : 'bg-rose-500'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Question card */}
            {currentQ && (
              <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/60 text-center space-y-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {currentQ.questionPrompt}
                </p>
                <div className="py-2">
                  <MathView expression={currentQ.expressionDisplay} size="xl" />
                </div>
              </div>
            )}

            {/* Keypad */}
            {currentQ && (
              <Keypad
                exercise={currentQ}
                numInput={numInput}
                denInput={denInput}
                activeSlot={activeSlot}
                onSlotChange={handleSlotChange}
                onInputChange={handleInputChange}
                onSubmit={handleSubmitQuestion}
              />
            )}
          </div>
        ) : (
          /* Report Card / Final Result */
          <div className="p-8 overflow-y-auto flex-1 space-y-6 text-center">
            <div className="space-y-2">
              <span className="text-5xl">
                {parseFloat(grade) >= 7 ? '🎉' : parseFloat(grade) >= 5 ? '👍' : '💪'}
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                Examen Finalitzat!
              </h3>
              <p className="text-xs text-slate-500">
                Temps total: {formatTime(secondsElapsed)}
              </p>
            </div>

            {/* Grade card */}
            <div className="max-w-xs mx-auto p-5 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl space-y-1">
              <div className="text-xs font-bold uppercase tracking-widest opacity-80">
                La teva nota estimada
              </div>
              <div className="text-5xl font-black tracking-tight">{grade} / 10</div>
              <div className="text-xs font-semibold pt-1">
                {parseFloat(grade) >= 9
                  ? 'Excel·lent! Domini absolut!'
                  : parseFloat(grade) >= 7
                  ? 'Notable! Molt bona base!'
                  : parseFloat(grade) >= 5
                  ? 'Aprovat! Vas pel bon camí.'
                  : 'Necessita reforç. Revisa els errors al quadern!'}
              </div>
            </div>

            {/* Feedback & Breakdown */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2.5">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Revisió de preguntes de l'examen:</span>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {questions.map((q, i) => {
                  const ans = userAnswers[i];
                  return (
                    <div
                      key={i}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center ${
                        ans?.correct
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      <span className="font-bold">P{i + 1}</span>
                      <span className="text-[10px] truncate max-w-[80px]">
                        {ans?.correct ? 'Correcte' : 'Fallat'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                💡 Les preguntes que has fallat s'han afegit automàticament al teu <strong>Quadern d'Errors</strong> perquè puguis practicar-les pas a pas sense pressió!
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-md transition"
              >
                Tornar a l'Entrenador
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
