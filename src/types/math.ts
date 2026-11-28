/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MathCategory = 'enters' | 'potencies' | 'fraccions';

export type DifficultyLevel = 1 | 2 | 3 | 4;

export interface FractionValue {
  num: number;
  den: number; // always > 0 in canonical form
}

export interface PowerValue {
  base: number;
  exp: number;
  calculated?: number;
}

export type AnswerType = 
  | { kind: 'number'; value: number }
  | { kind: 'fraction'; num: number; den: number }
  | { kind: 'power'; base: number; exp: number };

export interface ResolutionStep {
  title: string;
  explanation: string;
  highlightPart?: string;
  expression: string;
  ruleTag?: string; // e.g. "Regla dels signes", "Jerarquia", "m.c.m.", "Propietat de potències"
}

export interface MistakeDiagnosis {
  mistakeTitle: string;
  explanation: string;
  tip: string;
  detectedConcept: string;
}

export interface GuidedOperationOption {
  id: string;
  label: string;
  isCorrect: boolean;
  errorKind?: 'add_sub_before_priority' | 'bracket_order';
  feedbackMessage: string;
  subExpression?: string;
  expectedValue?: number;
  resultExpression?: string;
  subMistakeHint?: string;
  nextStepId?: string | null;
}

export interface GuidedStepNode {
  id: string;
  promptExpression: string;
  stepInstruction: string;
  options: GuidedOperationOption[];
  directSubExpression?: string;
  directExpectedValue?: number;
  directResultExpression?: string;
  directMistakeHint?: string;
}

export interface MathExercise {
  id: string;
  category: MathCategory;
  topicName: string;
  difficulty: DifficultyLevel;
  difficultyLabel: string;
  questionPrompt: string;
  expressionDisplay: string; // Text representation or format
  displayType: 'integer_expr' | 'fraction_expr' | 'power_expr';
  rawFormula?: string;
  correctAnswer: AnswerType;
  answerDisplay: string;
  steps: ResolutionStep[];
  guidedSteps?: GuidedStepNode[];
  hints: string[];
  diagnoseMistake: (userAnswer: {
    numberVal?: number;
    numVal?: number;
    denVal?: number;
    baseVal?: number;
    expVal?: number;
  }) => MistakeDiagnosis | null;
}

export interface UserStats {
  solvedTotal: number;
  correctFirstTry: number;
  currentStreak: number;
  bestStreak: number;
  categoryMastery: Record<MathCategory, {
    total: number;
    correct: number;
    level: DifficultyLevel;
  }>;
  badges: string[];
}

export interface FailedExercise {
  id: string;
  exercise: MathExercise;
  userAnswerStr: string;
  timestamp: number;
  timesRetried: number;
  mastered: boolean;
}
