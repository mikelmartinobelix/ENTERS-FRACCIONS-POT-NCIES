/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserStats, MathCategory } from '../types/math';
import { Trophy, Award, Flame, Target, X, CheckCircle2, RotateCcw } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats;
  onResetStats: () => void;
}

const BADGES_INFO: Record<string, { title: string; description: string; icon: string }> = {
  first_solve: { title: 'Primer Pas', description: 'Has resolt el teu primer exercici!', icon: '🌱' },
  streak_3: { title: 'Triple Encert', description: '3 encerts consecutius!', icon: '⚡' },
  streak_5: { title: 'En Ratxa!', description: '5 encerts seguits sense fallar!', icon: '🔥' },
  streak_10: { title: 'Imparable!', description: '10 respostes correctes seguides!', icon: '🏆' },
  enters_master: { title: 'Mestre dels Signes', description: 'Has assolit el nivell 3 o superior en enters!', icon: '🎯' },
  potencies_master: { title: 'Domador de Potències', description: 'Has dominat les propietats de les potències!', icon: '⚡' },
  fraccions_master: { title: 'Rei del m.c.m.', description: 'Has dominat les operacions amb fraccions!', icon: '🍕' },
  perseverance: { title: 'Esperit de Superació', description: 'Has corregit amb èxit un error del teu quadern!', icon: '💪' }
};

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  onResetStats
}) => {
  if (!isOpen) return null;

  const categories: { key: MathCategory; name: string; color: string }[] = [
    { key: 'enters', name: 'Nombres Enters', color: 'indigo' },
    { key: 'potencies', name: 'Potències i Propietats', color: 'emerald' },
    { key: 'fraccions', name: 'Fraccions i Càlcul', color: 'amber' }
  ];

  const accuracy = stats.solvedTotal > 0
    ? Math.round((stats.correctFirstTry / stats.solvedTotal) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                El teu Progrés i Medalles
              </h2>
              <p className="text-xs text-slate-500">
                L'esforç i la constància sempre donen fruits
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-3 text-center">
              <div className="flex justify-center mb-1 text-indigo-600">
                <Target className="w-5 h-5" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {stats.solvedTotal}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Resolts</div>
            </div>

            <div className="bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-2xl p-3 text-center">
              <div className="flex justify-center mb-1 text-amber-500">
                <Flame className="w-5 h-5" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {stats.currentStreak}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Ràtxa actual (Rècord: {stats.bestStreak})
              </div>
            </div>

            <div className="bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-3 text-center">
              <div className="flex justify-center mb-1 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {accuracy}%
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Precisió 1r intent</div>
            </div>
          </div>

          {/* Category Mastery */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-slate-500">
              Nivell assolit per tema
            </h3>
            <div className="space-y-2.5">
              {categories.map((cat) => {
                const mastery = stats.categoryMastery[cat.key];
                const levelNames = ['Iniciant', 'Fonaments', 'Intermedi', 'Avançat 3r ESO', 'Expert Examen'];
                const pct = Math.min(100, Math.round((mastery.level / 4) * 100));

                return (
                  <div
                    key={cat.key}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {cat.name}
                      </span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {levelNames[mastery.level]} (Nivell {mastery.level}/4)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>{mastery.correct} correctes de {mastery.total}</span>
                      <span>{pct}% dominat</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Badges unlocked */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Medalles d'Èxit ({stats.badges.length} desbloquejades)</span>
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(BADGES_INFO).map(([badgeKey, info]) => {
                const isUnlocked = stats.badges.includes(badgeKey);
                return (
                  <div
                    key={badgeKey}
                    className={`p-3 rounded-2xl border flex items-center gap-3 transition ${
                      isUnlocked
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-slate-900 dark:text-white'
                        : 'bg-slate-100/50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-40 grayscale'
                    }`}
                  >
                    <span className="text-2xl">{info.icon}</span>
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs">{info.title}</div>
                      <div className="text-[10px] text-slate-500 leading-tight">
                        {info.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('Vols reiniciar les estadístiques a zero?')) {
                onResetStats();
              }
            }}
            className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar progrés</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition"
          >
            D'acord
          </button>
        </div>
      </div>
    </div>
  );
};
