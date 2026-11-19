/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  StudentProfile,
  ExerciseLog,
  subscribeToAllStudents,
  subscribeToRecentLogs,
  getFirestoreStatus
} from '../services/firebase';
import {
  Users,
  GraduationCap,
  Download,
  Share2,
  Lock,
  X,
  Search,
  Filter,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Copy,
  Check
} from 'lucide-react';
import { MathView } from './MathView';

interface TeacherDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'alumnes' | 'activitat' | 'compartir';
}

export const TeacherDashboardModal: React.FC<TeacherDashboardModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'alumnes'
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'alumnes' | 'activitat' | 'compartir'>(initialTab);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [teacherPin, setTeacherPin] = useState<string>(() => {
    return localStorage.getItem('mates3r_teacher_pin') || '1234';
  });

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [recentLogs, setRecentLogs] = useState<ExerciseLog[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('Tots');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [dbStatus, setDbStatus] = useState(() => getFirestoreStatus());

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setDbStatus(getFirestoreStatus());
    }
  }, [isOpen, initialTab]);

  // Load students & logs from Firestore when open and authenticated
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    const unsubStudents = subscribeToAllStudents((data) => {
      setStudents(data);
    });

    const unsubLogs = subscribeToRecentLogs(40, (logs) => {
      setRecentLogs(logs);
    });

    return () => {
      unsubStudents();
      unsubLogs();
    };
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === teacherPin) {
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('PIN incorrecte. El PIN per defecte és 1234.');
    }
  };

  // Group list
  const allGroups = ['Tots', ...Array.from(new Set(students.map((s) => s.group))).filter(Boolean)];

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesGroup = selectedGroup === 'Tots' || s.group === selectedGroup;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.group.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  // Global class stats
  const totalStudents = students.length;
  const totalExercises = students.reduce((acc, s) => acc + s.totalExercises, 0);
  const totalCorrect = students.reduce((acc, s) => acc + s.correctExercises, 0);
  const classAccuracy = totalExercises > 0 ? Math.round((totalCorrect / totalExercises) * 100) : 0;

  // Breakdown by category
  let entersTotal = 0;
  let entersCorrect = 0;
  let potTotal = 0;
  let potCorrect = 0;
  let fracTotal = 0;
  let fracCorrect = 0;

  students.forEach((s) => {
    if (s.categoryStats) {
      entersTotal += s.categoryStats.enters?.total || 0;
      entersCorrect += s.categoryStats.enters?.correct || 0;
      potTotal += s.categoryStats.potencies?.total || 0;
      potCorrect += s.categoryStats.potencies?.correct || 0;
      fracTotal += s.categoryStats.fraccions?.total || 0;
      fracCorrect += s.categoryStats.fraccions?.correct || 0;
    }
  });

  const entersAcc = entersTotal > 0 ? Math.round((entersCorrect / entersTotal) * 100) : 0;
  const potAcc = potTotal > 0 ? Math.round((potCorrect / potTotal) * 100) : 0;
  const fracAcc = fracTotal > 0 ? Math.round((fracCorrect / fracTotal) * 100) : 0;

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Nom Alumne',
      'Classe/Grup',
      'Total Exercicis',
      'Correctes 1r Intent',
      'Percentatge Encert',
      'Ràtxa Rècord',
      'Enters Resolts',
      'Enters %',
      'Potències Resoltes',
      'Potències %',
      'Fraccions Resoltes',
      'Fraccions %',
      'Última Activitat'
    ];

    const rows = filteredStudents.map((s) => {
      const acc = s.totalExercises > 0 ? Math.round((s.correctExercises / s.totalExercises) * 100) : 0;
      const eAcc = s.categoryStats?.enters?.total ? Math.round((s.categoryStats.enters.correct / s.categoryStats.enters.total) * 100) : 0;
      const pAcc = s.categoryStats?.potencies?.total ? Math.round((s.categoryStats.potencies.correct / s.categoryStats.potencies.total) * 100) : 0;
      const fAcc = s.categoryStats?.fraccions?.total ? Math.round((s.categoryStats.fraccions.correct / s.categoryStats.fraccions.total) * 100) : 0;

      return [
        `"${s.name}"`,
        `"${s.group}"`,
        s.totalExercises,
        s.correctExercises,
        `${acc}%`,
        s.bestStreak,
        s.categoryStats?.enters?.total || 0,
        `${eAcc}%`,
        s.categoryStats?.potencies?.total || 0,
        `${pAcc}%`,
        s.categoryStats?.fraccions?.total || 0,
        `${fAcc}%`,
        `"${new Date(s.lastActiveAt).toLocaleString('ca-ES')}"`
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `registre_mates_3eso_${selectedGroup.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getShareableUrl = () => {
    const current = window.location.href.split('#')[0];
    if (current.includes('ais-dev-')) {
      return current.replace('ais-dev-', 'ais-pre-');
    }
    return current;
  };
  const shareableUrl = getShareableUrl();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* PIN Protection Screen */}
        {!isAuthenticated ? (
          <div className="p-8 text-center max-w-md mx-auto my-auto space-y-6">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Panell de Control del Professor
              </h2>
              <p className="text-xs text-slate-500">
                Aquest panell està reservat al docent per veure el registre dels alumnes.
              </p>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  placeholder="Introdueix el PIN (per defecte: 1234)"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full text-center tracking-widest text-xl font-mono py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {pinError && <p className="text-xs text-rose-500 mt-2 font-medium">{pinError}</p>}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Cancel·lar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Accedir com a Docent
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Main Dashboard Content */
          <>
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                      Panell de Seguiment de Docent
                    </h2>
                    {dbStatus.available ? (
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                        Núvol Actiu
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-semibold">
                        Mode Local
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Projecte: <strong className="font-mono">mates-3r-eso-repas</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  disabled={filteredStudents.length === 0}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Descarregar Excel / CSV</span>
                </button>

                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/40 p-1.5 gap-1.5 text-xs">
              <button
                onClick={() => setActiveTab('alumnes')}
                className={`py-2 px-4 rounded-xl font-bold flex items-center gap-2 transition ${
                  activeTab === 'alumnes'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Alumnes ({totalStudents})</span>
              </button>

              <button
                onClick={() => setActiveTab('activitat')}
                className={`py-2 px-4 rounded-xl font-bold flex items-center gap-2 transition ${
                  activeTab === 'activitat'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Darrera Activitat ({recentLogs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('compartir')}
                className={`py-2 px-4 rounded-xl font-bold flex items-center gap-2 transition ${
                  activeTab === 'compartir'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>Com compartir l'enllaç</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Tab 1: Alumnes & Class Stats */}
              {activeTab === 'alumnes' && (
                <div className="space-y-6">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 p-3.5 rounded-2xl">
                      <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                        Alumnes registrats
                      </div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {totalStudents}
                      </div>
                    </div>

                    <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 p-3.5 rounded-2xl">
                      <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Exercicis resolts
                      </div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {totalExercises}
                      </div>
                    </div>

                    <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 p-3.5 rounded-2xl">
                      <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                        Precisió global
                      </div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {classAccuracy}%
                      </div>
                    </div>

                    <div className="bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 p-3.5 rounded-2xl">
                      <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                        Tema amb més dificultat
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {totalExercises === 0
                          ? 'Sense dades'
                          : fracAcc <= potAcc && fracAcc <= entersAcc
                          ? 'Fraccions'
                          : potAcc <= entersAcc
                          ? 'Potències'
                          : 'Nombres Enters'}
                      </div>
                    </div>
                  </div>

                  {/* Topic Mastery Progress Bars */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Percentatge d'encert mitjà per bloc temàtic a la classe:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>Nombres Enters</span>
                          <span className="text-indigo-600">{entersAcc}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${entersAcc}%` }} />
                        </div>
                        <div className="text-[10px] text-slate-400">{entersTotal} exercicis fets</div>
                      </div>

                      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>Potències</span>
                          <span className="text-emerald-600">{potAcc}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${potAcc}%` }} />
                        </div>
                        <div className="text-[10px] text-slate-400">{potTotal} exercicis fets</div>
                      </div>

                      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>Fraccions</span>
                          <span className="text-amber-600">{fracAcc}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${fracAcc}%` }} />
                        </div>
                        <div className="text-[10px] text-slate-400">{fracTotal} exercicis fets</div>
                      </div>
                    </div>
                  </div>

                  {/* Filter and Search Bar */}
                  <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                      {allGroups.map((grp) => (
                        <button
                          key={grp}
                          onClick={() => setSelectedGroup(grp)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                            selectedGroup === grp
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {grp}
                        </button>
                      ))}
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Cerca alumne..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Students Table */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                    {filteredStudents.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                        <Users className="w-8 h-8 mx-auto opacity-40" />
                        <p>Encara no hi ha cap alumne registrat o cap coincideix amb la cerca.</p>
                        <p className="text-[11px] text-slate-400">
                          Comparteix l'enllaç de l'applet amb la teva classe per començar a rebre registres!
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                            <tr>
                              <th className="p-3.5">Nom de l'Alumne</th>
                              <th className="p-3.5">Grup</th>
                              <th className="p-3.5 text-center">Exercicis</th>
                              <th className="p-3.5 text-center">Precisió 1r Intent</th>
                              <th className="p-3.5 text-center">Ràtxa Rècord</th>
                              <th className="p-3.5">Última Connexió</th>
                              <th className="p-3.5 text-right">Accions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredStudents.map((st) => {
                              const acc =
                                st.totalExercises > 0
                                  ? Math.round((st.correctExercises / st.totalExercises) * 100)
                                  : 0;

                              return (
                                <tr
                                  key={st.studentId}
                                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition cursor-pointer"
                                  onClick={() => setSelectedStudent(st)}
                                >
                                  <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                                      {st.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span>{st.name}</span>
                                  </td>
                                  <td className="p-3.5">
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                                      {st.group}
                                    </span>
                                  </td>
                                  <td className="p-3.5 text-center font-mono font-semibold">
                                    {st.totalExercises}
                                  </td>
                                  <td className="p-3.5 text-center font-mono font-bold">
                                    <span
                                      className={
                                        acc >= 75
                                          ? 'text-emerald-600'
                                          : acc >= 50
                                          ? 'text-amber-600'
                                          : 'text-rose-600'
                                      }
                                    >
                                      {acc}%
                                    </span>
                                  </td>
                                  <td className="p-3.5 text-center font-mono">
                                    🔥 {st.bestStreak}
                                  </td>
                                  <td className="p-3.5 text-slate-500 text-[11px]">
                                    {new Date(st.lastActiveAt).toLocaleString('ca-ES', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </td>
                                  <td className="p-3.5 text-right">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedStudent(st);
                                      }}
                                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-indigo-600 transition"
                                      title="Veure detall"
                                    >
                                      <ChevronRight className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Activitat en temps real */}
              {activeTab === 'activitat' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Últims 40 exercicis resolts a la classe en temps real:
                  </h3>
                  {recentLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                      <Clock className="w-8 h-8 mx-auto opacity-40" />
                      <p>Encara no hi ha activitat recent.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentLogs.map((log) => (
                        <div
                          key={log.logId}
                          className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white shrink-0 ${
                                log.isCorrect ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            >
                              {log.isCorrect ? '✓' : '✗'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{log.studentName}</span>
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 rounded">
                                  {log.group}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                <span className="font-mono">{log.expression}</span>
                                <span>→</span>
                                <span>Resposta: <strong className="font-mono">{log.userAnswer}</strong></span>
                                {!log.isCorrect && (
                                  <span className="text-rose-500 font-semibold">({log.mistakeTitle})</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString('ca-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Com compartir amb els alumnes */}
              {activeTab === 'compartir' && (
                <div className="space-y-5 max-w-xl mx-auto">
                  <div className="bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white p-6 rounded-3xl space-y-3 shadow-lg">
                    <h3 className="text-lg font-bold">Com compartir l'app amb els alumnes:</h3>
                    <p className="text-xs text-indigo-100 leading-relaxed">
                      Pots publicar l'enllaç al teu <strong>Google Classroom</strong>, <strong>Moodle</strong> o projectar-lo a la pissarra digital de la classe. Els alumnes no necessiten instal·lar res; funciona directament des de qualsevol mòbil, tauleta o ordinador.
                    </p>

                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareableUrl}
                        className="flex-1 bg-white/20 border border-white/30 text-white rounded-xl px-3 py-2 text-xs font-mono select-all outline-none"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold shadow-md hover:bg-indigo-50 transition flex items-center gap-1.5 shrink-0"
                      >
                        {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedLink ? 'Copiat!' : 'Copiar Enllaç'}</span>
                      </button>
                    </div>
                  </div>

                  {/* QR Code per a la Pissarra Digital */}
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-5">
                    <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareableUrl)}`}
                        alt="Codi QR per a alumnes"
                        className="w-36 h-36 rounded-lg block"
                      />
                    </div>
                    <div className="space-y-2 text-xs text-center sm:text-left">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        Codi QR per projectar a classe:
                      </h4>
                      <p className="text-slate-500 leading-relaxed">
                        Els alumnes només han d'obrir la càmera del mòbil o la tauleta i apuntar cap a la pantalla per començar a practicar a l'instant, sense necessitat d'escriure l'enllaç.
                      </p>
                      <button
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                      >
                        <span>{copiedLink ? '✓ Enllaç copiat!' : 'Copia l\'enllaç per a Classroom / Moodle →'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Firestore activation notice */}
                  {!dbStatus.available && (
                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 p-4 rounded-2xl text-xs space-y-2 text-amber-900 dark:text-amber-200 shadow-sm">
                      <div className="flex items-center gap-2 font-bold">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Sincronització en directe entre els ordinadors/tauletes dels alumnes:</span>
                      </div>
                      <p className="leading-relaxed">
                        L'app ja té configurat el teu projecte <strong>mates-3r-eso-repas</strong>. Per rebre les respostes de tota la classe en temps real:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 font-medium pl-1">
                        <li>
                          Ves a la <a href="https://console.firebase.google.com/u/1/project/mates-3r-eso-repas/firestore" target="_blank" rel="noreferrer" className="underline font-bold text-indigo-600 dark:text-indigo-400">Consola de Firebase (Firestore)</a>.
                        </li>
                        <li>Fes clic a <strong>"Crea una base de dades"</strong> (tria <em>Mode de prova</em>).</li>
                        <li>Fet això, els exercicis de tots els alumnes apareixeran automàticament al teu panell!</li>
                      </ol>
                    </div>
                  )}

                  {/* Instruccions per a la classe */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3 text-xs">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">
                      Pautes recomanades per a la sessió de càlcul:
                    </h4>
                    <ol className="space-y-2 text-slate-600 dark:text-slate-300 list-decimal list-inside">
                      <li>
                        <strong>Identificació inicial:</strong> Demana als alumnes que posin el seu nom real i triïn el grup exacte per poder-los localitzar fàcilment.
                      </li>
                      <li>
                        <strong>Ús de la Pissarra d'Esborrany:</strong> Anima'ls a fer servir la pissarra digital integrada per provar el m.c.m. o la regla dels signes abans de contestar.
                      </li>
                      <li>
                        <strong>Revisió dels errors:</strong> Recorda'ls que si s'equivoquen, l'exercici passa al seu <em>Quadern d'Errors</em> per reintentar-lo i consolidar el concepte.
                      </li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* Individual Student Detail Modal Overlay */}
            {selectedStudent && (
              <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5 max-h-[85vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        {selectedStudent.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {selectedStudent.group} • Registrat el {new Date(selectedStudent.createdAt).toLocaleDateString('ca-ES')}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-indigo-50 dark:bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900">
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        {selectedStudent.totalExercises}
                      </div>
                      <div className="text-[10px] text-slate-500">Exercicis fets</div>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900">
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        {selectedStudent.totalExercises > 0
                          ? Math.round((selectedStudent.correctExercises / selectedStudent.totalExercises) * 100)
                          : 0}%
                      </div>
                      <div className="text-[10px] text-slate-500">Precisió</div>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900">
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        🔥 {selectedStudent.bestStreak}
                      </div>
                      <div className="text-[10px] text-slate-500">Millor ràtxa</div>
                    </div>
                  </div>

                  {/* Errors recents comesos per l'alumne */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Errors recents comesos per l'alumne:</span>
                    </h4>
                    {selectedStudent.recentMistakes?.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No ha comès cap error recent.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {selectedStudent.recentMistakes?.map((m, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1"
                          >
                            <div className="flex justify-between items-center text-[10px] text-slate-400">
                              <span className="font-bold uppercase text-indigo-600">{m.topic}</span>
                              <span>{m.mistakeTitle}</span>
                            </div>
                            <div className="py-0.5">
                              <MathView expression={m.expression} size="sm" />
                            </div>
                            <div className="flex justify-between items-center text-[11px] text-slate-500 flex-wrap gap-2 pt-0.5">
                              <span className="inline-flex items-center gap-1">
                                <span>Va respondre:</span>
                                <MathView expression={m.userAnswer} size="sm" />
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <span>Solució:</span>
                                <MathView expression={m.correctAnswer} size="sm" />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold"
                    >
                      Tancar detall
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
