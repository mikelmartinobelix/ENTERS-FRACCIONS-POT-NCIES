/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, X, CheckCircle2, AlertTriangle, Sparkles, Hash, Zap, Divide } from 'lucide-react';
import { MathView } from './MathView';

interface TheoryGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: 'enters' | 'potencies' | 'fraccions';
}

export const TheoryGuideModal: React.FC<TheoryGuideModalProps> = ({
  isOpen,
  onClose,
  initialTopic = 'enters'
}) => {
  const [activeTab, setActiveTab] = useState<'enters' | 'potencies' | 'fraccions'>(initialTopic);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Guia Ràpida i Regles d'Or (3r d'ESO)
              </h2>
              <p className="text-xs text-slate-500">
                Els trucs i propietats clau per no equivocar-te mai més
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/40 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('enters')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'enters'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Hash className="w-4 h-4" />
            <span>Nombres Enters</span>
          </button>
          <button
            onClick={() => setActiveTab('potencies')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'potencies'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Potències</span>
          </button>
          <button
            onClick={() => setActiveTab('fraccions')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'fraccions'
                ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Divide className="w-4 h-4" />
            <span>Fraccions</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {activeTab === 'enters' && (
            <div className="space-y-4">
              {/* Regla dels signes vs Suma */}
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl p-4">
                <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>Diferència vital: Sumar deutes vs Multiplicar signes</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-indigo-100 dark:border-indigo-950">
                    <p className="font-bold text-slate-900 dark:text-white mb-1">
                      1. Suma i Resta (Diners i Deutes):
                    </p>
                    <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                      <li>• <strong>-5 - 3 = -8</strong> (deus 5€ i deus 3€ = deus 8€).</li>
                      <li>• <strong>-4 + 9 = +5</strong> (deus 4€ però en tens 9€ = et queden 5€).</li>
                      <li>• <strong>7 - (-4) = 7 + 4 = 11</strong> (restar un negatiu és sumar!).</li>
                    </ul>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-indigo-100 dark:border-indigo-950">
                    <p className="font-bold text-slate-900 dark:text-white mb-1">
                      2. Multiplicació i Divisió:
                    </p>
                    <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                      <li>• (+) · (+) = (+) i (-) · (-) = <strong>(+)</strong> (mateix signe = MÉS)</li>
                      <li>• (+) · (-) = <strong>(-)</strong> i (-) · (+) = <strong>(-)</strong> (signes diferents = MENYS)</li>
                      <li>• Exemple: (-4) · (-5) = <strong>+20</strong></li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Jerarquia PEMDAS */}
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">
                  La Jerarquia d'Operacions (L'Ordre Sagrat)
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">1</span>
                    <div>
                      <strong className="text-slate-900 dark:text-white">Parèntesis i Claudàtors (de dins cap a fora)</strong>
                      <p className="text-slate-500">Ex: 5 - [2 · (3 - 7)] → primer fem (3 - 7) = -4.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">2</span>
                    <div>
                      <strong className="text-slate-900 dark:text-white">Potències i Arrels</strong>
                      <p className="text-slate-500">Es calculen abans de qualsevol producte.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">3</span>
                    <div>
                      <strong className="text-slate-900 dark:text-white">Multiplicacions i Divisions (d'esquerra a dreta)</strong>
                      <p className="text-slate-500">Ex: 4 + 3 · 2 = 4 + 6 = 10 (MAI fer 4 + 3 primer!).</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">4</span>
                    <div>
                      <strong className="text-slate-900 dark:text-white">Sumes i Restes (d'esquerra a dreta)</strong>
                      <p className="text-slate-500">L'últim pas de tot!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'potencies' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-4">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-300 mb-2">
                  Taula Resum de Propietats de les Potències (3r ESO)
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">Producte mateixa base:</span>
                      <p className="text-slate-500">Es deixa la base i se <strong>SUMEN</strong> exponents.</p>
                    </div>
                    <code className="bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded font-bold text-emerald-600">aᵐ · aⁿ = aᵐ⁺ⁿ</code>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">Quocient mateixa base:</span>
                      <p className="text-slate-500">Es deixa la base i es <strong>RESTEN</strong> exponents.</p>
                    </div>
                    <code className="bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded font-bold text-emerald-600">aᵐ : aⁿ = aᵐ⁻ⁿ</code>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">Potència d'una potència:</span>
                      <p className="text-slate-500">Es <strong>MULTIPLIQUEN</strong> els exponents.</p>
                    </div>
                    <code className="bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded font-bold text-emerald-600">(aᵐ)ⁿ = aᵐ·ⁿ</code>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">Exponent Zero:</span>
                      <p className="text-slate-500">Qualsevol nombre elevat a 0 val 1 (mai 0!).</p>
                    </div>
                    <code className="bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded font-bold text-emerald-600">a⁰ = 1</code>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">Exponent Negatiu:</span>
                      <p className="text-slate-500">Inverteix la base com a fracció.</p>
                    </div>
                    <code className="bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded font-bold text-emerald-600">a⁻ⁿ = 1 / aⁿ</code>
                  </div>
                </div>
              </div>

              {/* Trampa clàssica */}
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-3.5 flex gap-3 text-xs">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-900 dark:text-amber-300 block mb-1">
                    La gran trampa dels parèntesis:
                  </strong>
                  <p className="text-slate-700 dark:text-slate-300">
                    • <strong>(-3)² = +9</strong> (el signe negatiu està DINS i s'eleva al quadrat: -3 · -3).
                    <br />
                    • <strong>-3² = -9</strong> (el signe menys està FORA i no s'eleva!).
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fraccions' && (
            <div className="space-y-4">
              <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4">
                <h4 className="font-bold text-amber-900 dark:text-amber-300 mb-2">
                  Les 4 Operacions amb Fraccions
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-amber-100 dark:border-amber-950 space-y-1.5">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>1. Suma i Resta (Cal m.c.m.!)</span>
                      <span className="text-rose-500 font-bold">MAI sumar denominadors!</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 flex items-center gap-2 flex-wrap">
                      <span>Exemple:</span>
                      <MathView expression="1/4 + 1/6" size="sm" />
                      <span>→ m.c.m.(4, 6) = 12</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 flex items-center gap-2 flex-wrap">
                      <MathView expression="3/12 + 2/12 = 5/12" size="sm" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-amber-100 dark:border-amber-950 space-y-1.5">
                    <div className="font-bold text-slate-900 dark:text-white">
                      2. Multiplicació (En línia recta: dalt per dalt, baix per baix)
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 flex items-center gap-2 flex-wrap">
                      <span>Exemple:</span>
                      <MathView expression="2/3 · 5/7 = 10/21" size="sm" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-amber-100 dark:border-amber-950 space-y-1.5">
                    <div className="font-bold text-slate-900 dark:text-white">
                      3. Divisió (En creu)
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 flex items-center gap-2 flex-wrap">
                      <span>Exemple:</span>
                      <MathView expression="3/4 : 2/5 = 15/8" size="sm" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-amber-100 dark:border-amber-950 space-y-1.5">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>4. Fracció Irreductible (Regla d'or a 3r d'ESO)</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 flex items-center gap-2 flex-wrap">
                      <span>Divideix numerador i denominador pel m.c.d.:</span>
                      <MathView expression="6/8 = 3/4" size="sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition"
          >
            Entès, tornem a practicar!
          </button>
        </div>
      </div>
    </div>
  );
};
