/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MathCategory,
  DifficultyLevel,
  MathExercise,
  ResolutionStep,
  MistakeDiagnosis,
  AnswerType,
  FractionValue
} from '../types/math';

// Basic arithmetic utilities
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

export function simplifyFraction(num: number, den: number): FractionValue {
  if (den === 0) throw new Error("Denominador zero no permès");
  if (num === 0) return { num: 0, den: 1 };
  
  const sign = (num < 0 && den > 0) || (num > 0 && den < 0) ? -1 : 1;
  const absNum = Math.abs(num);
  const absDen = Math.abs(den);
  const divisor = gcd(absNum, absDen);

  return {
    num: sign * (absNum / divisor),
    den: absDen / divisor
  };
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomNonZero(min: number, max: number): number {
  let val = 0;
  while (val === 0) {
    val = randomInt(min, max);
  }
  return val;
}

export function formatSigned(n: number): string {
  return n < 0 ? `(${n})` : `${n}`;
}

const SUP_DIGITS: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '-': '⁻'
};

export function toSuperscript(val: number | string): string {
  return String(val)
    .split('')
    .map((ch) => SUP_DIGITS[ch] ?? ch)
    .join('');
}

// -----------------------------------------------------------------------------
// EXERCISE GENERATORS: NOMBRES ENTERS
// -----------------------------------------------------------------------------

function generateEntersLevel1(): MathExercise {
  const type = randomInt(1, 4);
  const id = `ent-1-${Date.now()}-${randomInt(100, 999)}`;

  if (type === 1) {
    // Resta de negatius: a - (-b) or a - b with negatives
    const a = randomInt(-15, 15);
    const b = randomNonZero(-12, 12);
    const result = a - b;
    const isDoubleMinus = b < 0;
    const exprStr = `${a} - ${formatSigned(b)}`;

    const steps: ResolutionStep[] = [
      {
        title: "Pas 1: Aplicar la regla dels signes per treure el parèntesi",
        explanation: isDoubleMinus
          ? `Tenim dos signes 'menys' seguits: - (-b). Recorda que menys per menys és MÉS (+). Així: - (${b}) es converteix en + ${Math.abs(b)}.`
          : `Resta normal d'un nombre positiu: treiem el parèntesi i queda ${a} - ${b}.`,
        expression: isDoubleMinus ? `${a} + ${Math.abs(b)}` : `${a} - ${b}`,
        ruleTag: "Regla dels signes"
      },
      {
        title: "Pas 2: Fer l'operació final",
        explanation: `Calculem: ${isDoubleMinus ? `${a} + ${Math.abs(b)}` : `${a} - ${b}`} = ${result}.`,
        expression: `= ${result}`
      }
    ];

    return {
      id,
      category: 'enters',
      topicName: 'Sumes i restes amb enters',
      difficulty: 1,
      difficultyLabel: 'Nivell 1: Fonaments',
      questionPrompt: 'Calcula el resultat d’aquesta resta amb nombres enters:',
      expressionDisplay: exprStr,
      displayType: 'integer_expr',
      correctAnswer: { kind: 'number', value: result },
      answerDisplay: `${result}`,
      steps,
      hints: [
        isDoubleMinus
          ? "Fixa't en els dos signes negatius seguits: restar un negatiu és sumar!"
          : "Tingues en compte el signe del primer nombre.",
        `L'expressió simplificada és: ${isDoubleMinus ? `${a} + ${Math.abs(b)}` : `${a} - ${b}`}.`
      ],
      diagnoseMistake: (u) => {
        if (u.numberVal === undefined) return null;
        if (isDoubleMinus && u.numberVal === a - Math.abs(b)) {
          return {
            mistakeTitle: "Compte amb el doble negatiu!",
            explanation: `Has restat ${Math.abs(b)} en lloc de sumar-lo. Restar un nombre negatiu equival a sumar el seu oposat: - (${b}) = + ${Math.abs(b)}.`,
            tip: "Regla d'or: Dos signes menys consecutius es converteixen sempre en un signe MÉS (+).",
            detectedConcept: "Regla dels signes (- · - = +)"
          };
        }
        if (u.numberVal === -result) {
          return {
            mistakeTitle: "Signe contrari!",
            explanation: `Has obtingut ${u.numberVal}, però el signe correcte és ${result > 0 ? 'positiu' : 'negatiu'}.`,
            tip: "Pensa en diners: nombres positius són diners que tens, nombres negatius són deutes que deus.",
            detectedConcept: "Signe del resultat"
          };
        }
        return null;
      }
    };
  }

  if (type === 2) {
    // Suma de dos negatius: (-a) + (-b)
    const a = randomInt(-15, -2);
    const b = randomInt(-15, -2);
    const result = a + b;
    const exprStr = `(${a}) + (${b})`;

    return {
      id,
      category: 'enters',
      topicName: 'Suma de dos nombres negatius',
      difficulty: 1,
      difficultyLabel: 'Nivell 1: Fonaments',
      questionPrompt: 'Calcula la suma dels dos enters següents:',
      expressionDisplay: exprStr,
      displayType: 'integer_expr',
      correctAnswer: { kind: 'number', value: result },
      answerDisplay: `${result}`,
      steps: [
        {
          title: "Pas 1: Interpretar com a acumulació de deutes",
          explanation: `Si deus ${Math.abs(a)} € i després n'afegeixes un altre deute de ${Math.abs(b)} €, el deute total s'acumula.`,
          expression: `- (${Math.abs(a)} + ${Math.abs(b)})`,
          ruleTag: "Signe comú"
        },
        {
          title: "Pas 2: Sumar els valors absoluts i mantenir el signe negatiu",
          explanation: `${Math.abs(a)} + ${Math.abs(b)} = ${Math.abs(result)}, per tant el resultat és negatiu: ${result}.`,
          expression: `= ${result}`
        }
      ],
      hints: [
        "Quan sumes dos nombres del mateix signe, se sumen els valors i es manté el signe.",
        "El resultat ha de ser negatiu perquè ambdós nombres són negatius."
      ],
      diagnoseMistake: (u) => {
        if (u.numberVal === undefined) return null;
        if (u.numberVal === Math.abs(result)) {
          return {
            mistakeTitle: "Has oblidat el signe negatiu!",
            explanation: `Quan sumem dos nombres negatius, el resultat és SEMPRE negatiu. (-a) + (-b) = -(a+b).`,
            tip: "Recorda: no estàs multiplicant, estàs sumant deutes! Si sumes dos números negatius, no pot donar positiu.",
            detectedConcept: "Suma d'enters negatius"
          };
        }
        if (u.numberVal === Math.abs(a) - Math.abs(b) || u.numberVal === Math.abs(b) - Math.abs(a)) {
          return {
            mistakeTitle: "Has restat en lloc de sumar!",
            explanation: `Com que tenen el mateix signe (tots dos negatius), no s'han de restar els valors, sinó sumar-los i conservar el signe negatiu.`,
            tip: "Diferent signe es resta, mateix signe se suma!",
            detectedConcept: "Mateix signe vs diferent signe"
          };
        }
        return null;
      }
    };
  }

  // Multiplicació o divisió senzilla amb enters
  const isMult = Math.random() > 0.4;
  if (isMult) {
    const a = randomNonZero(-9, 9);
    const b = randomNonZero(-9, 9);
    const result = a * b;
    const sameSign = (a > 0 && b > 0) || (a < 0 && b < 0);

    return {
      id,
      category: 'enters',
      topicName: 'Multiplicació amb regla dels signes',
      difficulty: 1,
      difficultyLabel: 'Nivell 1: Fonaments',
      questionPrompt: 'Multiplica aquests dos enters aplicant la regla dels signes:',
      expressionDisplay: `${formatSigned(a)} · ${formatSigned(b)}`,
      displayType: 'integer_expr',
      correctAnswer: { kind: 'number', value: result },
      answerDisplay: `${result}`,
      steps: [
        {
          title: "Pas 1: Determinar el signe del resultat",
          explanation: sameSign
            ? `Tots dos nombres tenen el mateix signe (${a < 0 ? 'tots dos negatius' : 'tots dos positius'}). La regla diu: ${a < 0 ? '(-) · (-) = (+)' : '(+) · (+) = (+)'}. El resultat serà POSITIU.`
            : `Tenen signes diferents (${a < 0 ? 'negatiu i positiu' : 'positiu i negatiu'}). La regla diu: (+) · (-) = (-) o (-) · (+) = (-). El resultat serà NEGATIU.`,
          expression: `Signe: ${sameSign ? '+' : '-'}`,
          ruleTag: "Regla dels signes en multiplicació"
        },
        {
          title: "Pas 2: Multiplicar els valors absoluts",
          explanation: `${Math.abs(a)} · ${Math.abs(b)} = ${Math.abs(result)}. Amb el signe corresponent obtenim: ${result}.`,
          expression: `= ${result}`
        }
      ],
      hints: [
        "Recorda la regla dels signes per multiplicar: signes iguals donen (+), signes diferents donen (-).",
        `Multiplica ${Math.abs(a)} per ${Math.abs(b)} i afegeix el signe adequat.`
      ],
      diagnoseMistake: (u) => {
        if (u.numberVal === undefined) return null;
        if (u.numberVal === -result) {
          return {
            mistakeTitle: "Error en la regla dels signes de la multiplicació!",
            explanation: sameSign
              ? `Has posat un resultat negatiu, però (-) · (-) = (+) ! Dos negatius multiplicats donen POSITIU.`
              : `Has posat un resultat positiu, però (+) · (-) = (-) ! Un positiu per un negatiu dóna sempre NEGATIU.`,
            tip: "Cançó dels signes: Signes iguals és MÉS, signes diferents és MENYS.",
            detectedConcept: "Regla dels signes multiplicativa"
          };
        }
        return null;
      }
    };
  } else {
    // Divisió
    const b = randomNonZero(-9, 9);
    const quotient = randomNonZero(-9, 9);
    const a = b * quotient;
    const sameSign = (a > 0 && b > 0) || (a < 0 && b < 0);

    return {
      id,
      category: 'enters',
      topicName: 'Divisió exacta amb enters',
      difficulty: 1,
      difficultyLabel: 'Nivell 1: Fonaments',
      questionPrompt: 'Calcula la divisió exacta amb nombres enters:',
      expressionDisplay: `${formatSigned(a)} : ${formatSigned(b)}`,
      displayType: 'integer_expr',
      correctAnswer: { kind: 'number', value: quotient },
      answerDisplay: `${quotient}`,
      steps: [
        {
          title: "Pas 1: Determinar el signe del quocient",
          explanation: sameSign
            ? `Mateix signe: ${a < 0 ? '(-) : (-) = (+)' : '(+) : (+) = (+)'}. Resultat positiu.`
            : `Diferents signes: (+) : (-) = (-) o bé (-) : (+) = (-). Resultat negatiu.`,
          expression: `Signe: ${sameSign ? '+' : '-'}`,
          ruleTag: "Regla dels signes"
        },
        {
          title: "Pas 2: Dividir els nombres",
          explanation: `${Math.abs(a)} : ${Math.abs(b)} = ${Math.abs(quotient)}. Per tant, el resultat final és ${quotient}.`,
          expression: `= ${quotient}`
        }
      ],
      hints: [
        "La regla dels signes en la divisió funciona exactament igual que en la multiplicació.",
        `Divideix ${Math.abs(a)} entre ${Math.abs(b)}.`
      ],
      diagnoseMistake: (u) => {
        if (u.numberVal === undefined) return null;
        if (u.numberVal === -quotient) {
          return {
            mistakeTitle: "Signe incorrecte en la divisió!",
            explanation: sameSign
              ? `Negatiu dividit entre negatiu dóna positiu: (-) : (-) = (+).`
              : `Positiu entre negatiu dóna negatiu: (+) : (-) = (-).`,
            tip: "En la divisió, igual que en la multiplicació: signes iguals = positiu; signes contraris = negatiu.",
            detectedConcept: "Signe en divisió"
          };
        }
        return null;
      }
    };
  }
}

function generateEntersLevel2(): MathExercise {
  // 3 terms with hierarchy: e.g. a - b · c or a · b + c : d
  const id = `ent-2-${Date.now()}-${randomInt(100, 999)}`;
  const a = randomInt(-10, 15);
  const b = randomNonZero(-6, 6);
  const c = randomNonZero(-6, 6);
  // a - b · c
  const mult = b * c;
  const result = a - mult;

  // Common pitfall: (a - b) · c (ignoring hierarchy)
  const wrongPrecedence = (a - b) * c;

  const steps: ResolutionStep[] = [
    {
      title: "Pas 1: Respectar la jerarquia d'operacions (PEMDAS)",
      explanation: `Dins de l'expressió tenim una resta i una multiplicació. La JERARQUIA diu: primer fem la multiplicació (${formatSigned(b)} · ${formatSigned(c)}) abans de la resta!`,
      expression: `${a} - [${formatSigned(b)} · ${formatSigned(c)}]`,
      ruleTag: "Jerarquia d'operacions"
    },
    {
      title: "Pas 2: Calcular el producte",
      explanation: `${formatSigned(b)} · ${formatSigned(c)} = ${mult}.`,
      expression: `${a} - (${mult})`,
      ruleTag: "Multiplicació d'enters"
    },
    {
      title: "Pas 3: Fer la resta final amb la regla dels signes",
      explanation: mult < 0
        ? `Restar un nombre negatiu és sumar: ${a} - (${mult}) = ${a} + ${Math.abs(mult)} = ${result}.`
        : `Calculem: ${a} - ${mult} = ${result}.`,
      expression: `= ${result}`
    }
  ];

  return {
    id,
    category: 'enters',
    topicName: 'Jerarquia: resta i multiplicació',
    difficulty: 2,
    difficultyLabel: 'Nivell 2: Intermedi',
    questionPrompt: 'Aplica la jerarquia d’operacions per resoldre:',
    expressionDisplay: `${a} - ${formatSigned(b)} · ${formatSigned(c)}`,
    displayType: 'integer_expr',
    correctAnswer: { kind: 'number', value: result },
    answerDisplay: `${result}`,
    steps,
    hints: [
      "Quina operació té prioritat: la resta o la multiplicació? (Recorda: primer multiplicar!)",
      `Calcula primer el producte: ${formatSigned(b)} · ${formatSigned(c)} = ${mult}.`
    ],
    diagnoseMistake: (u) => {
      if (u.numberVal === undefined) return null;
      if (u.numberVal === wrongPrecedence) {
        return {
          mistakeTitle: "Has violat la jerarquia d'operacions!",
          explanation: `Has fet primer la resta (${a} - ${formatSigned(b)} = ${a - b}) i després has multiplicat per ${c}. Això és un error greu!`,
          tip: "A matemàtiques, les multiplicacions i divisions es fan SEMPRE abans que les sumes i restes, llevat que hi hagi un parèntesi que digui el contrari.",
          detectedConcept: "Jerarquia d'operacions (Precedència)"
        };
      }
      if (u.numberVal === a + mult) {
        return {
          mistakeTitle: "Compte amb el signe de la resta!",
          explanation: `Has multiplicat correctament, però en restar el producte ${mult} has invertit el signe.`,
          tip: `L'expressió és ${a} - (${mult}). Revisa com afecta el signe menys.`,
          detectedConcept: "Resta de productes"
        };
      }
      return null;
    }
  };
}

function generateEntersLevel3(): MathExercise {
  // Level 3 (3r ESO typical exam problem): Bracket with sub-expression and parentheses
  // e.g.: a - b · [ c - d · (e - f) ]
  const id = `ent-3-${Date.now()}-${randomInt(100, 999)}`;
  const a = randomInt(-5, 10);
  const b = randomNonZero(-3, 3);
  const c = randomInt(-5, 8);
  const d = randomNonZero(-4, 4);
  const e = randomInt(1, 6);
  const f = e + randomNonZero(-4, 4); // so e - f is small non-zero
  
  const innerPar = e - f;
  const multInner = d * innerPar;
  const bracketVal = c - multInner;
  const multOuter = b * bracketVal;
  const result = a - multOuter;

  const exprDisplay = `${a} - ${formatSigned(b)} · [ ${c} - ${formatSigned(d)} · (${e} - ${f}) ]`;

  const steps: ResolutionStep[] = [
    {
      title: "Pas 1: Parèntesi més intern (e - f)",
      explanation: `Segons la jerarquia, comencem de dins cap a fora. Primer calculem (${e} - ${f}) = ${innerPar}.`,
      expression: `${a} - ${formatSigned(b)} · [ ${c} - ${formatSigned(d)} · (${innerPar}) ]`,
      ruleTag: "Parèntesis interns"
    },
    {
      title: "Pas 2: Multiplicació dins del claudàtor",
      explanation: `Dins del claudàtor [ ] tenim una resta i una multiplicació. Primer fem ${formatSigned(d)} · (${innerPar}) = ${multInner}.`,
      expression: `${a} - ${formatSigned(b)} · [ ${c} - (${multInner}) ]`,
      ruleTag: "Jerarquia dins claudàtor"
    },
    {
      title: "Pas 3: Resoldre el contingut del claudàtor",
      explanation: `${c} - (${multInner}) = ${bracketVal}.`,
      expression: `${a} - ${formatSigned(b)} · (${bracketVal})`,
      ruleTag: "Claudàtor resolt"
    },
    {
      title: "Pas 4: Multiplicar abans de restar",
      explanation: `Multipliquem: ${formatSigned(b)} · (${bracketVal}) = ${multOuter}.`,
      expression: `${a} - (${multOuter})`,
      ruleTag: "Multiplicació exterior"
    },
    {
      title: "Pas 5: Resta final",
      explanation: `${a} - (${multOuter}) = ${result}.`,
      expression: `= ${result}`,
      ruleTag: "Resultat final"
    }
  ];

  return {
    id,
    category: 'enters',
    topicName: 'Operacions combinades amb claudàtors',
    difficulty: 3,
    difficultyLabel: 'Nivell 3: 3r d’ESO Estàndard',
    questionPrompt: 'Resol aquesta operació combinada amb claudàtors i parèntesis:',
    expressionDisplay: exprDisplay,
    displayType: 'integer_expr',
    correctAnswer: { kind: 'number', value: result },
    answerDisplay: `${result}`,
    steps,
    hints: [
      `Comença sempre pel parèntesi més interior: quant és (${e} - ${f})?`,
      `El parèntesi dóna ${innerPar}. Ara multiplica per ${formatSigned(d)} abans de restar-lo a ${c}.`,
      `El claudàtor sencer té un valor de ${bracketVal}.`
    ],
    diagnoseMistake: (u) => {
      if (u.numberVal === undefined) return null;
      if (u.numberVal === -result) {
        return {
          mistakeTitle: "Error de signe final!",
          explanation: "Has fet bé gairebé tots els passos, però t'has equivocat en el signe en l'última resta o multiplicació.",
          tip: "Revisa bé la regla dels signes de l'últim pas: menys per menys = més.",
          detectedConcept: "Signe final"
        };
      }
      return {
        mistakeTitle: "Revisa pas a pas els parèntesis!",
        explanation: `En les operacions amb claudàtors [ ] i parèntesis ( ), cal anar pas a pas des del més intern cap a l'exterior.`,
        tip: `El parèntesi interior (${e} - ${f}) val ${innerPar}, i tot el claudàtor dóna ${bracketVal}.`,
        detectedConcept: "Jerarquia de parèntesis niats"
      };
    }
  };
}

function generateEntersLevel4(): MathExercise {
  // Level 4 (Exam Challenge): multiple combined parts e.g. (-2) · (-3 + 5) - [4 - (-6) : 2] + (-10)
  const id = `ent-4-${Date.now()}-${randomInt(100, 999)}`;
  const p1 = randomNonZero(-4, 4);
  const p2_a = randomInt(-5, 5);
  const p2_b = randomInt(-5, 5);
  const part1 = p1 * (p2_a + p2_b);

  const c_div = randomNonZero(-4, 4);
  const quotient = randomNonZero(-4, 4);
  const div_a = c_div * quotient;
  const bracketBase = randomInt(-5, 5);
  // bracket = bracketBase - (div_a : c_div)
  const bracketVal = bracketBase - quotient;
  const extra = randomNonZero(-6, 6);

  const result = part1 - bracketVal + extra;

  const exprDisplay = `${formatSigned(p1)} · (${p2_a} + ${formatSigned(p2_b)}) - [ ${bracketBase} - ${formatSigned(div_a)} : ${formatSigned(c_div)} ] + ${formatSigned(extra)}`;

  const steps: ResolutionStep[] = [
    {
      title: "Pas 1: Resoldre el primer bloc amb parèntesi",
      explanation: `Primer calculem (${p2_a} + ${formatSigned(p2_b)}) = ${p2_a + p2_b}. Després multipliquem per ${formatSigned(p1)}: ${p1} · ${p2_a + p2_b} = ${part1}.`,
      expression: `${part1} - [ ${bracketBase} - ${formatSigned(div_a)} : ${formatSigned(c_div)} ] + ${formatSigned(extra)}`,
      ruleTag: "Bloc esquerre"
    },
    {
      title: "Pas 2: Resoldre la divisió dins del claudàtor",
      explanation: `Dins del claudàtor la divisió va primer: ${formatSigned(div_a)} : ${formatSigned(c_div)} = ${quotient}.`,
      expression: `${part1} - [ ${bracketBase} - (${quotient}) ] + ${formatSigned(extra)}`,
      ruleTag: "Divisió interna"
    },
    {
      title: "Pas 3: Resoldre el claudàtor",
      explanation: `${bracketBase} - (${quotient}) = ${bracketVal}.`,
      expression: `${part1} - (${bracketVal}) + ${formatSigned(extra)}`,
      ruleTag: "Claudàtor complet"
    },
    {
      title: "Pas 4: Sumes i restes finals d'esquerra a dreta",
      explanation: `${part1} - (${bracketVal}) = ${part1 - bracketVal}; i després sumem ${formatSigned(extra)}: ${part1 - bracketVal} + (${extra}) = ${result}.`,
      expression: `= ${result}`,
      ruleTag: "Resultat final"
    }
  ];

  return {
    id,
    category: 'enters',
    topicName: 'Repte d’examen d’enters combinats',
    difficulty: 4,
    difficultyLabel: 'Nivell 4: Repte d’Examen',
    questionPrompt: 'Resol aquesta expressió completa d’examen de 3r d’ESO:',
    expressionDisplay: exprDisplay,
    displayType: 'integer_expr',
    correctAnswer: { kind: 'number', value: result },
    answerDisplay: `${result}`,
    steps,
    hints: [
      `Divideix l'exercici en dos blocs: el producte de l'esquerra i el claudàtor del mig.`,
      `El primer bloc dóna ${part1}, i el claudàtor dóna ${bracketVal}.`,
      `Fes l'operació final: ${part1} - (${bracketVal}) + (${extra}).`
    ],
    diagnoseMistake: (u) => {
      if (u.numberVal === undefined) return null;
      if (u.numberVal === -result) {
        return {
          mistakeTitle: "Compte amb el signe global!",
          explanation: "Tens un error en el signe final en combinar els blocs.",
          tip: "Fes les sumes i restes finals estrictament d'esquerra a dreta.",
          detectedConcept: "Signe acumulatiu"
        };
      }
      return {
        mistakeTitle: "Algun bloc s'ha desquadrat",
        explanation: `En aquests reptes llargs, separa cada part: primer terme = ${part1}, claudàtor = ${bracketVal}.`,
        tip: "Utilitza la pissarra d'esborrany per escriure cada bloc pas a pas!",
        detectedConcept: "Estratègia per blocs"
      };
    }
  };
}

// -----------------------------------------------------------------------------
// EXERCISE GENERATORS: POTÈNCIES
// -----------------------------------------------------------------------------

function generatePotenciesLevel1(): MathExercise {
  const id = `pot-1-${Date.now()}-${randomInt(100, 999)}`;
  const sub = randomInt(1, 3);

  if (sub === 1) {
    // Base negativa amb parèntesi vs sense parèntesi
    // e.g. (-2)^4 vs (-2)^3 vs -2^4
    const base = randomInt(2, 5);
    const exp = randomInt(2, 4);
    const hasParenthesis = Math.random() > 0.4;
    const isEven = exp % 2 === 0;

    let result = Math.pow(base, exp);
    let exprStr = '';

    if (hasParenthesis) {
      exprStr = `(-${base})^${exp}`;
      result = isEven ? result : -result;
    } else {
      exprStr = `-${base}^${exp}`;
      result = -result; // Without parenthesis, the minus is NOT part of the power!
    }

    const steps: ResolutionStep[] = [
      {
        title: "Pas 1: Fixar-se si el signe menys està DINS o FORA del parèntesi",
        explanation: hasParenthesis
          ? `Hi ha parèntesi: (-${base})^${exp}. L'exponent ${exp} afecta tant al nombre com al signe negatiu.`
          : `NO hi ha parèntesi: -${base}^${exp}. L'exponent ${exp} afecta NOMÉS al ${base}, el signe menys queda davant intacte!`,
        expression: exprStr,
        ruleTag: "Signe i parèntesi a les potències"
      },
      {
        title: "Pas 2: Calcular el valor numèric",
        explanation: hasParenthesis
          ? (isEven 
              ? `Com que l'exponent ${exp} és PARELL, negatiu per negatiu dóna positiu: (-${base})^${exp} = +${Math.pow(base, exp)}.`
              : `Com que l'exponent ${exp} és SENAR, el resultat és NEGATIU: (-${base})^${exp} = -${Math.pow(base, exp)}.`)
          : `Calculem la potència ${base}^${exp} = ${Math.pow(base, exp)}, i mantenim el signe negatiu al davant: -${Math.pow(base, exp)}.`,
        expression: `= ${result}`,
        ruleTag: isEven ? "Exponent parell -> Positiu" : "Exponent senar -> Negatiu"
      }
    ];

    return {
      id,
      category: 'potencies',
      topicName: 'Bases negatives i parèntesis',
      difficulty: 1,
      difficultyLabel: 'Nivell 1: Fonaments',
      questionPrompt: 'Calcula el valor numèric d’aquesta potència:',
      expressionDisplay: exprStr,
      displayType: 'power_expr',
      correctAnswer: { kind: 'number', value: result },
      answerDisplay: `${result}`,
      steps,
      hints: [
        hasParenthesis
          ? `L'exponent és ${isEven ? 'parell' : 'senar'}. Què passa amb un negatiu elevat a nombre ${isEven ? 'parell' : 'senar'}?`
          : "Compte! No hi ha parèntesi, per tant l'exponent només afecta a la base, no al signe menys.",
        `Recorda que ${base}^${exp} és multiplicar ${base} per si mateix ${exp} vegades.`
      ],
      diagnoseMistake: (u) => {
        if (u.numberVal === undefined) return null;
        if (u.numberVal === -result) {
          if (!hasParenthesis) {
            return {
              mistakeTitle: "Parèntesis enganyosos!",
              explanation: `Has donat resultat positiu, però l'expressió era -${base}^${exp} SENSE parèntesi! Sense parèntesi, el menys no s'eleva a la potència.`,
              tip: "Recorda: (-a)² = +a², però -a² = -a² (el quadrat només afecta a la 'a').",
              detectedConcept: "Diferència entre (-a)ⁿ i -aⁿ"
            };
          } else {
            return {
              mistakeTitle: isEven ? "Exponent parell dóna positiu!" : "Exponent senar dóna negatiu!",
              explanation: isEven 
                ? `Qualsevol nombre negatiu elevat a exponent PARELL sempre dóna POSITIU: (- · - = +).`
                : `Un negatiu elevat a exponent SENAR conserva el signe NEGATIU: (- · - · - = -).`,
              tip: `Exponent ${exp} és ${isEven ? 'parell (resultat +)' : 'senar (resultat -)'}.`,
              detectedConcept: "Regla de signes en potències"
            };
          }
        }
        if (u.numberVal === base * exp || u.numberVal === -base * exp) {
          return {
            mistakeTitle: "Has multiplicat la base per l'exponent!",
            explanation: `Una potència ${base}^${exp} NO vol dir ${base} · ${exp}. Vol dir multiplicar la base ${base} per si mateixa ${exp} vegades: ${Array(exp).fill(base).join(' · ')}.`,
            tip: "Compte amb aquest error tan habitual! 2³ no és 6, és 2 · 2 · 2 = 8.",
            detectedConcept: "Definició de potència"
          };
        }
        return null;
      }
    };
  }

  // Exponent zero o exponent 1
  const base = randomNonZero(-12, 15);
  const isZero = Math.random() > 0.5;
  const exp = isZero ? 0 : 1;
  const result = isZero ? 1 : base;
  const exprStr = base < 0 ? `(${base})^${exp}` : `${base}^${exp}`;

  return {
    id,
    category: 'potencies',
    topicName: isZero ? 'Exponent zero' : 'Exponent u',
    difficulty: 1,
    difficultyLabel: 'Nivell 1: Fonaments',
    questionPrompt: 'Aplica les propietats de les potències per calcular:',
    expressionDisplay: exprStr,
    displayType: 'power_expr',
    correctAnswer: { kind: 'number', value: result },
    answerDisplay: `${result}`,
    steps: [
      {
        title: isZero ? "Propietat de l'exponent zero (a⁰ = 1)" : "Propietat de l'exponent 1 (a¹ = a)",
        explanation: isZero
          ? "Qualsevol nombre diferent de zero elevat a zero és sempre igual a 1. És una propietat fonamental!"
          : "Qualsevol nombre elevat a 1 és igual a si mateix.",
        expression: `${exprStr} = ${result}`,
        ruleTag: isZero ? "a⁰ = 1" : "a¹ = a"
      }
    ],
    hints: [
      isZero
        ? "Què val qualsevol nombre elevat a 0? Pensa en la regla fonamental."
        : "Qualsevol nombre elevat a 1 no canvia."
    ],
    diagnoseMistake: (u) => {
      if (u.numberVal === undefined) return null;
      if (isZero && u.numberVal === 0) {
        return {
          mistakeTitle: "No és zero!",
          explanation: `Un error molt típic és creure que ${base}⁰ = 0. En realitat, per definició i divisió de potències (aⁿ : aⁿ = a⁰ = 1), qualsevol nombre elevat a zero és 1.`,
          tip: "Regla d'or a recordar per a tot 3r d'ESO: a⁰ = 1 (sempre que a ≠ 0).",
          detectedConcept: "Exponent zero"
        };
      }
      return null;
    }
  };
}

function generatePotenciesLevel2(): MathExercise {
  // Product or quotient or power of a power with same base: e.g. 3^4 · 3^5 = 3^? or (2^3)^4 = 2^?
  const id = `pot-2-${Date.now()}-${randomInt(100, 999)}`;
  const type = randomInt(1, 3);
  const base = randomInt(2, 7);

  if (type === 1) {
    // Product of powers: base^e1 · base^e2 = base^(e1+e2)
    const e1 = randomInt(2, 6);
    const e2 = randomInt(2, 6);
    const finalExp = e1 + e2;

    const steps: ResolutionStep[] = [
      {
        title: "Pas 1: Identificar la propietat del producte de potències de la mateixa base",
        explanation: `Tenim la mateixa base (${base}). La propietat diu: aᵐ · aⁿ = aᵐ⁺ⁿ. Es deixa la mateixa base i se SUMEN els exponents!`,
        expression: `${base}^${e1} · ${base}^${e2} = ${base}^(${e1} + ${e2})`,
        ruleTag: "Producte de potències: se sumen exponents"
      },
      {
        title: "Pas 2: Sumar els exponents",
        explanation: `${e1} + ${e2} = ${finalExp}. L'expressió simplificada com a única potència és ${base}^${finalExp}.`,
        expression: `= ${base}^${finalExp}`,
        ruleTag: "Exponent final"
      }
    ];

    return {
      id,
      category: 'potencies',
      topicName: 'Producte de potències de la mateixa base',
      difficulty: 2,
      difficultyLabel: 'Nivell 2: Intermedi',
      questionPrompt: `Escriu com una única potència (indica l'exponent final per a la base ${base}):`,
      expressionDisplay: `${base}^${e1} · ${base}^${e2} = ${base}^?`,
      displayType: 'power_expr',
      correctAnswer: { kind: 'power', base, exp: finalExp },
      answerDisplay: `${base}^${finalExp} (exponent: ${finalExp})`,
      steps,
      hints: [
        "Quan multipliquem potències amb la mateixa base, què fem amb els exponents? Es sumen o es multipliquen?",
        `Fes la suma: ${e1} + ${e2}.`
      ],
      diagnoseMistake: (u) => {
        const val = u.expVal ?? u.numberVal;
        if (val === undefined) return null;
        if (val === e1 * e2) {
          return {
            mistakeTitle: "Has multiplicat els exponents en lloc de sumar-los!",
            explanation: `Has calculat ${e1} · ${e2} = ${e1 * e2}. Però en la multiplicació de potències de la mateixa base, els exponents se SUMEN: aᵐ · aⁿ = aᵐ⁺ⁿ.`,
            tip: "Pensa-ho: 2³ · 2² = (2·2·2) · (2·2) = 2⁵. En total hi ha 3 + 2 = 5 factors 2!",
            detectedConcept: "Suma d'exponents en producte"
          };
        }
        return null;
      }
    };
  }

  if (type === 2) {
    // Quotient: base^e1 : base^e2 = base^(e1 - e2)
    const e2 = randomInt(2, 5);
    const diff = randomInt(2, 4);
    const e1 = e2 + diff;
    const finalExp = diff;

    const steps: ResolutionStep[] = [
      {
        title: "Pas 1: Identificar la propietat de divisió de potències de la mateixa base",
        explanation: `Tenim la mateixa base (${base}). La propietat diu: aᵐ : aⁿ = aᵐ⁻ⁿ. Es deixa la base i es RESTEN els exponents!`,
        expression: `${base}^${e1} : ${base}^${e2} = ${base}^(${e1} - ${e2})`,
        ruleTag: "Quocient de potències: es resten exponents"
      },
      {
        title: "Pas 2: Restar els exponents",
        explanation: `${e1} - ${e2} = ${finalExp}. El resultat és ${base}^${finalExp}.`,
        expression: `= ${base}^${finalExp}`
      }
    ];

    return {
      id,
      category: 'potencies',
      topicName: 'Quocient de potències de la mateixa base',
      difficulty: 2,
      difficultyLabel: 'Nivell 2: Intermedi',
      questionPrompt: `Escriu com una única potència (quin és l'exponent final per a la base ${base}?):`,
      expressionDisplay: `${base}^${e1} : ${base}^${e2} = ${base}^?`,
      displayType: 'power_expr',
      correctAnswer: { kind: 'power', base, exp: finalExp },
      answerDisplay: `${base}^${finalExp} (exponent: ${finalExp})`,
      steps,
      hints: [
        "En una divisió de potències amb la mateixa base, els exponents es resten.",
        `Calcula: ${e1} - ${e2}.`
      ],
      diagnoseMistake: (u) => {
        const val = u.expVal ?? u.numberVal;
        if (val === undefined) return null;
        if (val === e1 + e2) {
          return {
            mistakeTitle: "Has sumat els exponents!",
            explanation: `Sumar exponents es fa en la MULTIPLICACIÓ. Com que aquí tenim una DIVISIÓ (:), cal RESTAR els exponents.`,
            tip: "Regla: Multiplicar -> sumar exponents. Dividir -> restar exponents.",
            detectedConcept: "Resta d'exponents en divisió"
          };
        }
        return null;
      }
    };
  }

  // Power of a power: (base^e1)^e2 = base^(e1 * e2)
  const e1 = randomInt(2, 4);
  const e2 = randomInt(2, 4);
  const finalExp = e1 * e2;

  const steps: ResolutionStep[] = [
    {
      title: "Pas 1: Propietat de potència d'una potència",
      explanation: `La propietat diu: (aᵐ)ⁿ = aᵐ·ⁿ. Aquí sí que es MULTIPLIQUEN els exponents entre ells!`,
      expression: `(${base}^${e1})^${e2} = ${base}^(${e1} · ${e2})`,
      ruleTag: "Potència d'una potència"
    },
    {
      title: "Pas 2: Multiplicar els exponents",
      explanation: `${e1} · ${e2} = ${finalExp}. Per tant queda ${base}^${finalExp}.`,
      expression: `= ${base}^${finalExp}`
    }
  ];

  return {
    id,
    category: 'potencies',
    topicName: 'Potència d’una potència',
    difficulty: 2,
    difficultyLabel: 'Nivell 2: Intermedi',
    questionPrompt: `Indica l'exponent final resultant de la potència de potència per a la base ${base}:`,
    expressionDisplay: `(${base}^${e1})^${e2} = ${base}^?`,
    displayType: 'power_expr',
    correctAnswer: { kind: 'power', base, exp: finalExp },
    answerDisplay: `${base}^${finalExp} (exponent: ${finalExp})`,
    steps,
    hints: [
      "Quan tenim un exponent sobre un altre exponent separat per parèntesi, es multipliquen!",
      `Multiplica ${e1} · ${e2}.`
    ],
    diagnoseMistake: (u) => {
      const val = u.expVal ?? u.numberVal;
      if (val === undefined) return null;
      if (val === e1 + e2) {
        return {
          mistakeTitle: "Has sumat els exponents!",
          explanation: `En la potència d'una potència (aᵐ)ⁿ, els exponents NO se sumen, es MULTIPLIQUEN: ${e1} · ${e2} = ${finalExp}.`,
          tip: "Recorda: (a³)² vol dir a³ · a³ = a³⁺³ = a⁶ (3 · 2 = 6).",
          detectedConcept: "Potència de potència multiplica"
        };
      }
      return null;
    }
  };
}

function generatePotenciesLevel3(): MathExercise {
  // Exponent negatiu a 3r d'ESO: a^(-n) = 1 / a^n or (a/b)^(-n) = (b/a)^n
  const id = `pot-3-${Date.now()}-${randomInt(100, 999)}`;
  const isFraction = Math.random() > 0.45;

  if (isFraction) {
    const num = randomInt(2, 4);
    const den = num === 2 ? 3 : num === 3 ? 4 : 5;
    const exp = randomInt(2, 3); // (num/den)^(-2) or (-3)
    const expSup = toSuperscript(-exp);
    const posExpSup = toSuperscript(exp);
    const ansNum = Math.pow(den, exp);
    const ansDen = Math.pow(num, exp);

    const steps: ResolutionStep[] = [
      {
        title: "Pas 1: Aplicar la definició d'exponent negatiu a una fracció",
        explanation: `Un exponent negatiu INVERTEIX la fracció: (a/b)⁻ⁿ = (b/a)ⁿ. Invertim numerador i denominador: (${num}/${den})${expSup} = (${den}/${num})${posExpSup}.`,
        expression: `(${num}/${den})^(-${exp}) = (${den}/${num})^${exp}`,
        ruleTag: "Inversió per exponent negatiu"
      },
      {
        title: `Pas 2: Elevar numerador i denominador a ${exp}`,
        explanation: `${den}${posExpSup} = ${ansNum} i ${num}${posExpSup} = ${ansDen}. El resultat en fracció irreductible és ${ansNum}/${ansDen}.`,
        expression: `= ${ansNum}/${ansDen}`,
        ruleTag: "Càlcul de la fracció"
      }
    ];

    return {
      id,
      category: 'potencies',
      topicName: 'Exponent negatiu en fraccions',
      difficulty: 3,
      difficultyLabel: 'Nivell 3: 3r d’ESO Estàndard',
      questionPrompt: 'Calcula el valor fraccionari simplificat aplicant la propietat de l’exponent negatiu:',
      expressionDisplay: `(${num}/${den})^(-${exp})`,
      displayType: 'fraction_expr',
      correctAnswer: { kind: 'fraction', num: ansNum, den: ansDen },
      answerDisplay: `${ansNum}/${ansDen}`,
      steps,
      hints: [
        "Recorda la regla d'or: un exponent negatiu NO fa el nombre negatiu, sinó que gira la fracció!",
        `Inverteix la fracció i després eleva a ${exp}: (${den}/${num})${posExpSup}.`
      ],
      diagnoseMistake: (u) => {
        if (u.numVal !== undefined && u.denVal !== undefined) {
          if (u.numVal === -ansNum || u.denVal < 0) {
            return {
              mistakeTitle: "L'exponent negatiu NO fa el resultat negatiu!",
              explanation: "Un dels errors més estesos a 3r d'ESO és pensar que un exponent negatiu converteix el resultat en negatiu. No és així!",
              tip: "a⁻ⁿ significa l'invers de aⁿ. Per exemple: 3⁻¹ = 1/3, mai -3.",
              detectedConcept: "Significat d'exponent negatiu"
            };
          }
          if (u.numVal === Math.pow(num, exp) && u.denVal === Math.pow(den, exp)) {
            return {
              mistakeTitle: "Has oblidat invertir la fracció!",
              explanation: `Has calculat (${num}/${den})${posExpSup} = ${Math.pow(num, exp)}/${Math.pow(den, exp)}, però l'exponent era NEGATIU (-${exp})! Calia capgirar la fracció primer: (${den}/${num})${posExpSup}.`,
              tip: "Quan vegis un exponent amb signe menys, gira la fracció cap per avall!",
              detectedConcept: "Invertir base fraccionària"
            };
          }
        }
        return null;
      }
    };
  } else {
    // a^(-n) = 1 / a^n
    const base = randomInt(2, 6);
    const exp = base <= 4 ? randomInt(2, 3) : 2;
    const expSup = toSuperscript(-exp);
    const posExpSup = toSuperscript(exp);
    const calculated = Math.pow(base, exp);

    const steps: ResolutionStep[] = [
      {
        title: "Pas 1: Transformar l'exponent negatiu en fracció",
        explanation: `La propietat diu: a⁻ⁿ = 1 / aⁿ. Per tant: ${base}${expSup} = 1 / ${base}${posExpSup}.`,
        expression: `${base}^(-${exp}) = 1 / ${base}^${exp}`,
        ruleTag: "a⁻ⁿ = 1 / aⁿ"
      },
      {
        title: "Pas 2: Calcular la potència del denominador",
        explanation: `${base}${posExpSup} = ${calculated}. Així obtenim la fracció irreductible 1/${calculated}.`,
        expression: `= 1/${calculated}`
      }
    ];

    return {
      id,
      category: 'potencies',
      topicName: 'Exponent negatiu d’un enter',
      difficulty: 3,
      difficultyLabel: 'Nivell 3: 3r d’ESO Estàndard',
      questionPrompt: 'Expressa com una fracció simplificada calculant el valor:',
      expressionDisplay: `${base}^(-${exp})`,
      displayType: 'fraction_expr',
      correctAnswer: { kind: 'fraction', num: 1, den: calculated },
      answerDisplay: `1/${calculated}`,
      steps,
      hints: [
        "Un exponent negatiu converteix el nombre en una fracció amb 1 al numerador: a⁻ⁿ = 1 / aⁿ.",
        `Calcula quant val ${base}${posExpSup} per posar-lo al denominador.`
      ],
      diagnoseMistake: (u) => {
        if (u.numVal !== undefined && u.denVal !== undefined) {
          if (u.numVal === -1 && u.denVal === calculated) {
            return {
              mistakeTitle: "L'exponent negatiu NO posa un signe menys davant!",
              explanation: `Has posat -1/${calculated}, però l'exponent negatiu només inverteix la base: ${base}${expSup} = +1/${calculated}.`,
              tip: "L'exponent negatiu indica INVERS multiplicatiu, mai canvi de signe.",
              detectedConcept: "Inversió vs signe oposat"
            };
          }
          if (u.numVal === -calculated || (u.numVal === -1 && u.denVal === 1)) {
            return {
              mistakeTitle: "L'exponent negatiu no fa el nombre negatiu!",
              explanation: `${base}${expSup} = 1 / ${base}${posExpSup} = 1/${calculated}.`,
              tip: "L'exponent negatiu indica INVERS multiplicatiu, no oposat.",
              detectedConcept: "Inversió vs signe oposat"
            };
          }
          if (u.numVal === calculated && u.denVal === 1) {
            return {
              mistakeTitle: "Has oblidat posar la potència al denominador!",
              explanation: `Has calculat ${base}${posExpSup} = ${calculated}, però com que l'exponent era -${exp}, queda 1/${calculated}.`,
              tip: "a⁻ⁿ sempre baixa al denominador: 1 / aⁿ.",
              detectedConcept: "Exponent negatiu al denominador"
            };
          }
        }
        return null;
      }
    };
  }
}

function generatePotenciesLevel4(): MathExercise {
  // Level 4 (Exam Challenge): Varied combined power structures with same base
  const id = `pot-4-${Date.now()}-${randomInt(100, 999)}`;
  const base = randomInt(2, 7);
  const variant = randomInt(1, 6);

  if (variant === 1) {
    // Variant 1: [ (b^e1 · b^e2)^outer ] : b^sub = b^?
    const e1 = randomInt(2, 4);
    const e2 = randomInt(2, 3);
    const outer = randomInt(2, 3);
    const innerSum = e1 + e2;
    const multiplied = innerSum * outer;
    const subtract = randomInt(2, multiplied - 1);
    const finalExp = multiplied - subtract;

    const exprStr = `[ (${base}^${e1} · ${base}^${e2})^${outer} ] : ${base}^${subtract} = ${base}^?`;

    return {
      id,
      category: 'potencies',
      topicName: 'Simplificació combinada de potències',
      difficulty: 4,
      difficultyLabel: 'Nivell 4: Repte d’Examen',
      questionPrompt: `Troba l'exponent final de la base ${base} en simplificar tota l'expressió:`,
      expressionDisplay: exprStr,
      displayType: 'power_expr',
      correctAnswer: { kind: 'power', base, exp: finalExp },
      answerDisplay: `${base}^${finalExp} (exponent: ${finalExp})`,
      steps: [
        {
          title: "Pas 1: Sumar exponents en el producte interior",
          explanation: `Dins del parèntesi tenim ${base}${toSuperscript(e1)} · ${base}${toSuperscript(e2)}. Se sumen exponents: ${e1} + ${e2} = ${innerSum}.`,
          expression: `[ (${base}^${innerSum})^${outer} ] : ${base}^${subtract}`,
          ruleTag: "Producte mateixa base"
        },
        {
          title: "Pas 2: Potència d'una potència",
          explanation: `Multipliquem els exponents: ${innerSum} · ${outer} = ${multiplied}.`,
          expression: `${base}^${multiplied} : ${base}^${subtract}`,
          ruleTag: "Multiplicar exponents"
        },
        {
          title: "Pas 3: Divisió de potències de la mateixa base",
          explanation: `Restem els exponents en la divisió: ${multiplied} - ${subtract} = ${finalExp}.`,
          expression: `= ${base}^${finalExp}`,
          ruleTag: "Resta d'exponents"
        }
      ],
      hints: [
        `Fes primer el parèntesi interior (${base}${toSuperscript(e1)} · ${base}${toSuperscript(e2)}) sumant exponents.`,
        `Després multiplica per l'exponent exterior ${outer}.`,
        `Finalment resta l'exponent del divisor (${subtract}).`
      ],
      diagnoseMistake: (u) => {
        const val = u.expVal ?? u.numberVal;
        if (val === undefined) return null;
        if (val === -finalExp) {
          return {
            mistakeTitle: "Signe de l'exponent erroni!",
            explanation: `L'exponent ha de ser positiu (${finalExp}).`,
            tip: "Revisa la resta d'exponents de l'últim pas.",
            detectedConcept: "Operacions amb exponents"
          };
        }
        return {
          mistakeTitle: "Revisa l'ordre de propietats",
          explanation: `Seqüència: 1r Sumar dins del parèntesi (${e1}+${e2}=${innerSum}) → 2n Multiplicar per ${outer} (${multiplied}) → 3r Restar ${subtract}.`,
          tip: `(${base}${toSuperscript(innerSum)})${toSuperscript(outer)} = ${base}${toSuperscript(multiplied)}, i després restem ${subtract}.`,
          detectedConcept: "Combinació de propietats de potències"
        };
      }
    };
  }

  if (variant === 2) {
    // Variant 2: b^e1 · (b^e2)^outer : b^sub = b^? (hierarchy without brackets)
    const e1 = randomInt(3, 6);
    const e2 = randomInt(2, 4);
    const outer = randomInt(2, 3);
    const powVal = e2 * outer;
    const sumVal = e1 + powVal;
    const sub = randomInt(2, sumVal - 1);
    const finalExp = sumVal - sub;

    const exprStr = `${base}^${e1} · (${base}^${e2})^${outer} : ${base}^${sub} = ${base}^?`;

    return {
      id,
      category: 'potencies',
      topicName: 'Jerarquia en potències combinades',
      difficulty: 4,
      difficultyLabel: 'Nivell 4: Repte d’Examen',
      questionPrompt: `Simplifica aplicant la jerarquia i indica l'exponent final per a la base ${base}:`,
      expressionDisplay: exprStr,
      displayType: 'power_expr',
      correctAnswer: { kind: 'power', base, exp: finalExp },
      answerDisplay: `${base}^${finalExp} (exponent: ${finalExp})`,
      steps: [
        {
          title: "Pas 1: Resoldre primer la potència d'una potència",
          explanation: `Tenim (${base}${toSuperscript(e2)})${toSuperscript(outer)}. Multipliquem els exponents: ${e2} · ${outer} = ${powVal}.`,
          expression: `${base}^${e1} · ${base}^${powVal} : ${base}^${sub}`,
          ruleTag: "Potència d'una potència"
        },
        {
          title: "Pas 2: Operar productes i divisions d'esquerra a dreta",
          explanation: `Primer sumem en el producte: ${e1} + ${powVal} = ${sumVal}. Després restem en la divisió: ${sumVal} - ${sub} = ${finalExp}.`,
          expression: `${base}^(${sumVal} - ${sub}) = ${base}^${finalExp}`,
          ruleTag: "Producte i quocient"
        }
      ],
      hints: [
        `Comença per la potència de potència (${base}${toSuperscript(e2)})${toSuperscript(outer)}: multiplica ${e2} · ${outer}.`,
        `Després suma l'exponent ${e1} i resta l'exponent ${sub}.`
      ],
      diagnoseMistake: (u) => {
        const val = u.expVal ?? u.numberVal;
        if (val === undefined) return null;
        if (val === (e1 + e2) * outer - sub) {
          return {
            mistakeTitle: "Compte amb l'abast del parèntesi!",
            explanation: `L'exponent ${outer} només afecta a (${base}${toSuperscript(e2)}), NO a ${base}${toSuperscript(e1)}!`,
            tip: `Calcula primer (${base}${toSuperscript(e2)})${toSuperscript(outer)} = ${base}${toSuperscript(powVal)} i després fes el producte.`,
            detectedConcept: "Jerarquia de potències"
          };
        }
        return {
          mistakeTitle: "Revisa el càlcul d'exponents",
          explanation: `Recorda: (${base}${toSuperscript(e2)})${toSuperscript(outer)} = ${base}${toSuperscript(powVal)}. Després ${e1} + ${powVal} - ${sub} = ${finalExp}.`,
          tip: "Multiplica exponents al parèntesi, suma quan multipliquis bases i resta quan divideixis.",
          detectedConcept: "Jerarquia de potències"
        };
      }
    };
  }

  if (variant === 3) {
    // Variant 3: [ (b^e1 : b^e2)^outer ] · b^e3 = b^?
    const e2 = randomInt(2, 4);
    const diff = randomInt(2, 4);
    const e1 = e2 + diff;
    const outer = randomInt(2, 3);
    const powVal = diff * outer;
    const e3 = randomInt(2, 5);
    const finalExp = powVal + e3;

    const exprStr = `[ (${base}^${e1} : ${base}^${e2})^${outer} ] · ${base}^${e3} = ${base}^?`;

    return {
      id,
      category: 'potencies',
      topicName: 'Quocient, potència i producte combinats',
      difficulty: 4,
      difficultyLabel: 'Nivell 4: Repte d’Examen',
      questionPrompt: `Troba l'exponent final de la base ${base} simplificant l'expressió:`,
      expressionDisplay: exprStr,
      displayType: 'power_expr',
      correctAnswer: { kind: 'power', base, exp: finalExp },
      answerDisplay: `${base}^${finalExp} (exponent: ${finalExp})`,
      steps: [
        {
          title: "Pas 1: Restar exponents a la divisió interior",
          explanation: `Dins del parèntesi tenim ${base}${toSuperscript(e1)} : ${base}${toSuperscript(e2)}. Restem exponents: ${e1} - ${e2} = ${diff}.`,
          expression: `[ (${base}^${diff})^${outer} ] · ${base}^${e3}`,
          ruleTag: "Quocient mateixa base"
        },
        {
          title: "Pas 2: Potència d'una potència",
          explanation: `Multipliquem els exponents: ${diff} · ${outer} = ${powVal}.`,
          expression: `${base}^${powVal} · ${base}^${e3}`,
          ruleTag: "Potència de potència"
        },
        {
          title: "Pas 3: Producte final de potències",
          explanation: `En multiplicar bases iguals, sumem exponents: ${powVal} + ${e3} = ${finalExp}.`,
          expression: `= ${base}^${finalExp}`,
          ruleTag: "Producte mateixa base"
        }
      ],
      hints: [
        `Resol primer el quocient dins del parèntesi restant ${e1} - ${e2}.`,
        `Multiplica el resultat per ${outer} i al final suma-hi ${e3}.`
      ],
      diagnoseMistake: (u) => {
        const val = u.expVal ?? u.numberVal;
        if (val === undefined) return null;
        return {
          mistakeTitle: "Revisa els passos del claudàtor",
          explanation: `1r: ${e1} - ${e2} = ${diff}. 2n: ${diff} · ${outer} = ${powVal}. 3r: ${powVal} + ${e3} = ${finalExp}.`,
          tip: "Resol sempre des de dins dels parèntesis cap enfora.",
          detectedConcept: "Operacions combinades amb potències"
        };
      }
    };
  }

  if (variant === 4) {
    // Variant 4: (b^e1 · b^e2) : (b^e3 · b^e4) = b^? (or fraction form)
    const e3 = randomInt(2, 4);
    const e4 = randomInt(2, 4);
    const denSum = e3 + e4;
    const extra = randomInt(1, 5);
    const e1 = randomInt(3, denSum + extra - 2);
    const e2 = denSum + extra - e1;
    const numSum = e1 + e2;
    const finalExp = numSum - denSum;

    const useFractionBar = Math.random() > 0.45;
    const exprStr = useFractionBar
      ? `(${base}^${e1} · ${base}^${e2}) / (${base}^${e3} · ${base}^${e4}) = ${base}^?`
      : `(${base}^${e1} · ${base}^${e2}) : (${base}^${e3} · ${base}^${e4}) = ${base}^?`;

    return {
      id,
      category: 'potencies',
      topicName: 'Quocient entre productes de potències',
      difficulty: 4,
      difficultyLabel: 'Nivell 4: Repte d’Examen',
      questionPrompt: `Simplifica els dos blocs i troba l'exponent final de la base ${base}:`,
      expressionDisplay: exprStr,
      displayType: 'power_expr',
      correctAnswer: { kind: 'power', base, exp: finalExp },
      answerDisplay: `${base}^${finalExp} (exponent: ${finalExp})`,
      steps: [
        {
          title: "Pas 1: Simplificar cada bloc per separat",
          explanation: `Al primer bloc (numerador): ${e1} + ${e2} = ${numSum}. Al segon bloc (denominador): ${e3} + ${e4} = ${denSum}.`,
          expression: useFractionBar
            ? `${base}^${numSum} / ${base}^${denSum}`
            : `${base}^${numSum} : ${base}^${denSum}`,
          ruleTag: "Sumar exponents dins cada bloc"
        },
        {
          title: "Pas 2: Dividir les dues potències resultants",
          explanation: `Restem l'exponent del segon bloc al primer: ${numSum} - ${denSum} = ${finalExp}.`,
          expression: `= ${base}^${finalExp}`,
          ruleTag: "Quocient mateixa base"
        }
      ],
      hints: [
        `Suma primer els exponents del primer bloc (${e1} + ${e2}) i els del segon (${e3} + ${e4}).`,
        `Després resta els dos resultats: ${numSum} - ${denSum}.`
      ],
      diagnoseMistake: (u) => {
        const val = u.expVal ?? u.numberVal;
        if (val === undefined) return null;
        if (val === numSum - e3 + e4) {
          return {
            mistakeTitle: "Compte amb el parèntesi del divisor!",
            explanation: `Tot el bloc (${base}${toSuperscript(e3)} · ${base}${toSuperscript(e4)}) està dividint! Has de sumar ${e3} + ${e4} = ${denSum} abans de restar-ho tot plegat.`,
            tip: "No facis - e3 + e4; agrupa primer el denominador/divisor.",
            detectedConcept: "Parèntesis en divisors"
          };
        }
        return {
          mistakeTitle: "Revisa la simplificació dels blocs",
          explanation: `El primer grup dóna ${base}${toSuperscript(numSum)} i el segon ${base}${toSuperscript(denSum)}. En dividir-los, ${numSum} - ${denSum} = ${finalExp}.`,
          tip: "Suma exponents a dalt, suma exponents a baix, i finalment resta.",
          detectedConcept: "Quocient de productes"
        };
      }
    };
  }

  if (variant === 5) {
    // Variant 5: (b^e1)^k1 · (b^e2)^k2 : b^sub = b^?
    const e1 = randomInt(2, 3);
    const k1 = randomInt(2, 3);
    const e2 = randomInt(2, 3);
    const k2 = 2;
    const p1 = e1 * k1;
    const p2 = e2 * k2;
    const sumVal = p1 + p2;
    const sub = randomInt(2, sumVal - 1);
    const finalExp = sumVal - sub;

    const exprStr = `(${base}^${e1})^${k1} · (${base}^${e2})^${k2} : ${base}^${sub} = ${base}^?`;

    return {
      id,
      category: 'potencies',
      topicName: 'Doble potència de potència combinada',
      difficulty: 4,
      difficultyLabel: 'Nivell 4: Repte d’Examen',
      questionPrompt: `Calcula l'exponent final de la base ${base} aplicant totes les propietats:`,
      expressionDisplay: exprStr,
      displayType: 'power_expr',
      correctAnswer: { kind: 'power', base, exp: finalExp },
      answerDisplay: `${base}^${finalExp} (exponent: ${finalExp})`,
      steps: [
        {
          title: "Pas 1: Resoldre les dues potències de potència",
          explanation: `(${base}${toSuperscript(e1)})${toSuperscript(k1)} = ${base}${toSuperscript(p1)} i (${base}${toSuperscript(e2)})${toSuperscript(k2)} = ${base}${toSuperscript(p2)}.`,
          expression: `${base}^${p1} · ${base}^${p2} : ${base}^${sub}`,
          ruleTag: "Potència d'una potència"
        },
        {
          title: "Pas 2: Producte i divisió finals",
          explanation: `Sumem ${p1} + ${p2} = ${sumVal} i restem ${sub}: ${sumVal} - ${sub} = ${finalExp}.`,
          expression: `= ${base}^${finalExp}`,
          ruleTag: "Suma i resta d'exponents"
        }
      ],
      hints: [
        `Multiplica primer els exponents de cada parèntesi: ${e1} · ${k1} i ${e2} · ${k2}.`,
        `Després suma els dos resultats i resta ${sub}.`
      ],
      diagnoseMistake: (u) => {
        const val = u.expVal ?? u.numberVal;
        if (val === undefined) return null;
        return {
          mistakeTitle: "Revisa les multiplicacions d'exponents",
          explanation: `(${base}${toSuperscript(e1)})${toSuperscript(k1)} = ${base}${toSuperscript(p1)}, (${base}${toSuperscript(e2)})${toSuperscript(k2)} = ${base}${toSuperscript(p2)}. Després ${p1} + ${p2} - ${sub} = ${finalExp}.`,
          tip: "Recorda: en potència de potència es MULTIPLIQUEN els exponents.",
          detectedConcept: "Potències de potències combinades"
        };
      }
    };
  }

  // Variant 6: Combined powers WITH negative exponent! e.g. (b^e1 · b^(-neg)) : b^e2 = b^?
  const neg = randomInt(2, 4);
  const e1 = randomInt(neg + 2, neg + 6);
  const prodExp = e1 - neg;
  const e2 = randomInt(1, prodExp + 2); // can yield positive, 0, or negative exponent!
  const finalExp = prodExp - e2;

  const exprStr = `(${base}^${e1} · ${base}^(-${neg})) : ${base}^${e2} = ${base}^?`;

  return {
    id,
    category: 'potencies',
    topicName: 'Potències combinades amb exponent negatiu',
    difficulty: 4,
    difficultyLabel: 'Nivell 4: Repte d’Examen',
    questionPrompt: `Simplifica tenint en compte els signes dels exponents (base ${base}):`,
    expressionDisplay: exprStr,
    displayType: 'power_expr',
    correctAnswer: { kind: 'power', base, exp: finalExp },
    answerDisplay: `${base}^${finalExp < 0 ? `(${finalExp})` : finalExp} (exponent: ${finalExp})`,
    steps: [
      {
        title: "Pas 1: Sumar exponents dins del parèntesi",
        explanation: `En multiplicar bases iguals se sumen exponents: ${e1} + (-${neg}) = ${e1} - ${neg} = ${prodExp}.`,
        expression: `${base}^${prodExp} : ${base}^${e2}`,
        ruleTag: "Producte amb exponent negatiu"
      },
      {
        title: "Pas 2: Restar l'exponent del divisor",
        explanation: `En la divisió es resten exponents: ${prodExp} - ${e2} = ${finalExp}.`,
        expression: `= ${base}^${finalExp < 0 ? `(${finalExp})` : finalExp}`,
        ruleTag: "Quocient mateixa base"
      }
    ],
    hints: [
      `Dins del parèntesi suma ${e1} + (-${neg}).`,
      `Al resultat resta-li l'exponent del divisor (${e2}).`
    ],
    diagnoseMistake: (u) => {
      const val = u.expVal ?? u.numberVal;
      if (val === undefined) return null;
      if (val === e1 + neg - e2) {
        return {
          mistakeTitle: "Compte amb el signe de l'exponent negatiu!",
          explanation: `Has sumat +${neg} en lloc de sumar (-${neg}). Recorda: ${e1} + (-${neg}) = ${prodExp}.`,
          tip: "Un exponent negatiu resta quan el sumes al producte.",
          detectedConcept: "Suma d'exponents amb signe negatiu"
        };
      }
      return {
        mistakeTitle: "Revisa els signes dels exponents",
        explanation: `1r: ${e1} + (-${neg}) = ${prodExp}. 2n: ${prodExp} - ${e2} = ${finalExp}.`,
        tip: "Respecta els signes negatius exactament com amb els nombres enters.",
        detectedConcept: "Exponents enters en operacions combinades"
      };
    }
  };
}

// -----------------------------------------------------------------------------
// EXERCISE GENERATORS: FRACCIONS
// -----------------------------------------------------------------------------

function generateFraccionsLevel1(): MathExercise {
  const id = `frac-1-${Date.now()}-${randomInt(100, 999)}`;
  const type = randomInt(1, 3);

  if (type === 1) {
    // Suma o resta de fraccions amb el mateix denominador
    const den = randomInt(4, 9);
    const n1 = randomInt(1, den - 1);
    const n2 = randomInt(1, den - 1);
    const isAdd = Math.random() > 0.4;
    const rawNum = isAdd ? n1 + n2 : n1 - n2;
    const simp = simplifyFraction(rawNum, den);

    const exprStr = `${n1}/${den} ${isAdd ? '+' : '-'} ${n2}/${den}`;

    const steps: ResolutionStep[] = [
      {
        title: "Pas 1: Mantenir el denominador comú",
        explanation: `Com que tenen exactament el mateix denominador (${den}), NO cal buscar el mínim comú múltiple! El denominador es manté fix (${den}) i s'operen només els numeradors.`,
        expression: `(${n1} ${isAdd ? '+' : '-'} ${n2}) / ${den}`,
        ruleTag: "Mateix denominador"
      },
      {
        title: "Pas 2: Operar els numeradors",
        explanation: `${n1} ${isAdd ? '+' : '-'} ${n2} = ${rawNum}. Queda la fracció ${rawNum}/${den}.`,
        expression: `${rawNum}/${den}`
      }
    ];

    if (simp.num !== rawNum || simp.den !== den) {
      steps.push({
        title: "Pas 3: Simplificar a fracció irreductible",
        explanation: `A 3r d'ESO sempre s'ha de simplificar el resultat dividint numerador i denominador pel seu màxim comú divisor (${gcd(Math.abs(rawNum), den)}). Així arribem a ${simp.num}/${simp.den}.`,
        expression: `= ${simp.num}/${simp.den}`,
        ruleTag: "Fracció irreductible"
      });
    }

    return {
      id,
      category: 'fraccions',
      topicName: 'Suma/resta amb mateix denominador',
      difficulty: 1,
      difficultyLabel: 'Nivell 1: Fonaments',
      questionPrompt: 'Calcula i deixa el resultat com a fracció irreductible:',
      expressionDisplay: exprStr,
      displayType: 'fraction_expr',
      correctAnswer: { kind: 'fraction', num: simp.num, den: simp.den },
      answerDisplay: `${simp.num}/${simp.den}`,
      steps,
      hints: [
        "Tenen el mateix denominador! No canviïs el denominador, només suma o resta els números de dalt.",
        `Fes ${n1} ${isAdd ? '+' : '-'} ${n2} i simplifica si és possible.`
      ],
      diagnoseMistake: (u) => {
        if (u.numVal !== undefined && u.denVal !== undefined) {
          if (isAdd && u.denVal === den + den) {
            return {
              mistakeTitle: "Has sumat els denominadors!",
              explanation: `Has posat denominador ${den + den}. MAI no se sumen els denominadors! Si tenim 1 quart de pizza i 2 quarts de pizza, tenim 3 quarts, no 3 vuitens!`,
              tip: "El denominador representa la mida de la porció; mai no se sumen quan sumem fraccions.",
              detectedConcept: "Denominadors en suma"
            };
          }
          if (u.numVal === rawNum && u.denVal === den && (rawNum !== simp.num || den !== simp.den)) {
            return {
              mistakeTitle: "Molt a prop! Fracció no simplificada",
              explanation: `La fracció ${rawNum}/${den} és matemàticament correcta, però a 3r d'ESO sempre has de deixar la fracció IRREDUCTIBLE dividint entre ${gcd(Math.abs(rawNum), den)}.`,
              tip: `Divideix tant dalt com baix pel seu divisor comú per obtenir ${simp.num}/${simp.den}.`,
              detectedConcept: "Simplificació de fraccions"
            };
          }
        }
        return null;
      }
    };
  }

  // Multiplicació de dues fraccions: (a/b) · (c/d)
  const a = randomInt(1, 4);
  const b = randomInt(2, 5);
  const c = randomInt(1, 5);
  const d = randomInt(2, 6);

  const rawNum = a * c;
  const rawDen = b * d;
  const simp = simplifyFraction(rawNum, rawDen);

  const steps: ResolutionStep[] = [
    {
      title: "Pas 1: Multiplicar en línia recta",
      explanation: "En la multiplicació de fraccions, es multiplica el numerador pel numerador (dalt per dalt) i el denominador pel denominador (baix per baix). NO cal m.c.m.!",
      expression: `(${a} · ${c}) / (${b} · ${d})`,
      ruleTag: "Multiplicació directa"
    },
    {
      title: "Pas 2: Calcular els productes",
      explanation: `${a} · ${c} = ${rawNum} i ${b} · ${d} = ${rawDen}. Queda ${rawNum}/${rawDen}.`,
      expression: `${rawNum}/${rawDen}`
    }
  ];

  if (simp.num !== rawNum || simp.den !== rawDen) {
    steps.push({
      title: "Pas 3: Simplificar a fracció irreductible",
      explanation: `Dividim numerador i denominador entre ${gcd(rawNum, rawDen)}: ${simp.num}/${simp.den}.`,
      expression: `= ${simp.num}/${simp.den}`,
      ruleTag: "Simplificació"
    });
  }

  return {
    id,
    category: 'fraccions',
    topicName: 'Multiplicació directa de fraccions',
    difficulty: 1,
    difficultyLabel: 'Nivell 1: Fonaments',
    questionPrompt: 'Multiplica les fraccions i simplifica al màxim:',
    expressionDisplay: `${a}/${b} · ${c}/${d}`,
    displayType: 'fraction_expr',
    correctAnswer: { kind: 'fraction', num: simp.num, den: simp.den },
    answerDisplay: `${simp.num}/${simp.den}`,
    steps,
    hints: [
      "Per multiplicar fraccions es fa en línia: numerador per numerador i denominador per denominador.",
      `Calcula: (${a} · ${c}) / (${b} · ${d}) i després simplifica.`
    ],
    diagnoseMistake: (u) => {
      if (u.numVal !== undefined && u.denVal !== undefined) {
        if (u.numVal === rawNum && u.denVal === rawDen && (rawNum !== simp.num)) {
          return {
            mistakeTitle: "Fracció correcta, però no simplificada!",
            explanation: `Tens ${rawNum}/${rawDen}, que és correcte, però recorda que a 3r d'ESO sempre has de donar la fracció irreductible!`,
            tip: `Divideix dalt i baix entre ${gcd(rawNum, rawDen)}.`,
            detectedConcept: "Fracció irreductible"
          };
        }
        if (u.numVal === a * d && u.denVal === b * c) {
          return {
            mistakeTitle: "Has multiplicat en creu!",
            explanation: "Multiplicar en creu es fa per a la DIVISIÓ (:), no per a la multiplicació (·). Per multiplicar, es fa en línia recta!",
            tip: "Multiplicar = línia recta (dalt per dalt, baix per baix). Dividir = creu.",
            detectedConcept: "Multiplicació vs Divisió de fraccions"
          };
        }
      }
      return null;
    }
  };
}

function generateFraccionsLevel2(): MathExercise {
  // Suma o resta amb diferent denominador (requereix m.c.m.)
  const id = `frac-2-${Date.now()}-${randomInt(100, 999)}`;
  const pairs = [
    { d1: 2, d2: 3 },
    { d1: 3, d2: 4 },
    { d1: 4, d2: 6 },
    { d1: 6, d2: 8 },
    { d1: 3, d2: 5 },
    { d1: 2, d2: 5 },
    { d1: 4, d2: 10 }
  ];
  const pair = pairs[randomInt(0, pairs.length - 1)];
  const d1 = pair.d1;
  const d2 = pair.d2;
  const n1 = randomInt(1, 4);
  const n2 = randomInt(1, 4);
  const isAdd = Math.random() > 0.45;

  const m = lcm(d1, d2);
  const factor1 = m / d1;
  const factor2 = m / d2;
  const newN1 = n1 * factor1;
  const newN2 = n2 * factor2;
  const rawNum = isAdd ? newN1 + newN2 : newN1 - newN2;
  const simp = simplifyFraction(rawNum, m);

  const steps: ResolutionStep[] = [
    {
      title: "Pas 1: Trobar el mínim comú múltiple (m.c.m.) dels denominadors",
      explanation: `Els denominadors són diferents (${d1} i ${d2}). Cal buscar un denominador comú. El m.c.m.(${d1}, ${d2}) = ${m}.`,
      expression: `m.c.m.(${d1}, ${d2}) = ${m}`,
      ruleTag: "Cerca del m.c.m."
    },
    {
      title: "Pas 2: Reduir a comú denominador",
      explanation: `Dividim el comú denominador ${m} entre cada denominador vell i multipliquem pel numerador:
      • Primera fracció: (${m} : ${d1}) · ${n1} = ${factor1} · ${n1} = ${newN1} -> ${newN1}/${m}
      • Segona fracció: (${m} : ${d2}) · ${n2} = ${factor2} · ${n2} = ${newN2} -> ${newN2}/${m}`,
      expression: `${newN1}/${m} ${isAdd ? '+' : '-'} ${newN2}/${m}`,
      ruleTag: "Fraccions equivalents"
    },
    {
      title: "Pas 3: Sumar o restar els nous numeradors",
      explanation: `${newN1} ${isAdd ? '+' : '-'} ${newN2} = ${rawNum}. Obtenim ${rawNum}/${m}.`,
      expression: `${rawNum}/${m}`
    }
  ];

  if (simp.num !== rawNum || simp.den !== m) {
    steps.push({
      title: "Pas 4: Simplificar el resultat a fracció irreductible",
      explanation: `Dividim numerador i denominador entre el m.c.d. (${gcd(Math.abs(rawNum), m)}): resultat final ${simp.num}/${simp.den}.`,
      expression: `= ${simp.num}/${simp.den}`,
      ruleTag: "Fracció irreductible"
    });
  }

  return {
    id,
    category: 'fraccions',
    topicName: 'Suma/resta amb diferent denominador (m.c.m.)',
    difficulty: 2,
    difficultyLabel: 'Nivell 2: Intermedi',
    questionPrompt: 'Calcula i dóna el resultat en fracció irreductible:',
    expressionDisplay: `${n1}/${d1} ${isAdd ? '+' : '-'} ${n2}/${d2}`,
    displayType: 'fraction_expr',
    correctAnswer: { kind: 'fraction', num: simp.num, den: simp.den },
    answerDisplay: `${simp.num}/${simp.den}`,
    steps,
    hints: [
      `Els denominadors són ${d1} i ${d2}. Quin és el mínim comú múltiple m.c.m.(${d1}, ${d2})?`,
      `El denominador comú és ${m}. Converteix les fraccions a denominador ${m}: ${newN1}/${m} i ${newN2}/${m}.`
    ],
    diagnoseMistake: (u) => {
      if (u.numVal !== undefined && u.denVal !== undefined) {
        if (isAdd && u.numVal === n1 + n2 && u.denVal === d1 + d2) {
          return {
            mistakeTitle: "L'error clàssic de sumar denominadors!",
            explanation: `Has sumat ${n1}+${n2}=${n1+n2} i ${d1}+${d2}=${d1+d2}. Això és COMPLETAMENT INCORRECTE. Mai no se sumen denominadors directament quan són diferents!`,
            tip: `Cal calcular el m.c.m.(${d1}, ${d2}) = ${m} i trobar les fraccions equivalents.`,
            detectedConcept: "Error gravíssim de suma de denominadors"
          };
        }
        if (u.numVal === rawNum && u.denVal === m && (rawNum !== simp.num)) {
          return {
            mistakeTitle: "Correcte, però falta simplificar!",
            explanation: `Has trobat bé el comú denominador (${rawNum}/${m}), però a 3r d'ESO sempre has de simplificar a fracció irreductible!`,
            tip: `Divideix dalt i baix pel seu m.c.d. (${gcd(Math.abs(rawNum), m)}) per arribar a ${simp.num}/${simp.den}.`,
            detectedConcept: "Simplificació requerida"
          };
        }
      }
      return null;
    }
  };
}

function generateFraccionsLevel3(): MathExercise {
  // Operacions combinades de fraccions amb parèntesis i jerarquia (Standard 3r ESO):
  // e.g. a/b - c/d · (e/f - g/h) or (a/b + c/d) : (e/f - g/h)
  const id = `frac-3-${Date.now()}-${randomInt(100, 999)}`;
  // Example template: a/b + c/d · (e/f - g) where g is integer or fraction
  // Let's create: a/b - c/d · (e/f - 1/2)
  const a = randomInt(1, 3);
  const b = 2; // a/2
  const c = 1;
  const d = randomInt(2, 3); // 1/3 or 1/2
  const e = 3;
  const f = 4; // 3/4
  const g = 1;
  const h = 2; // 1/2

  // Inside parenthesis: 3/4 - 1/2 = 3/4 - 2/4 = 1/4
  const parNum = e * h - g * f; // 6 - 4 = 2
  const parDen = f * h; // 8 -> 2/8 = 1/4
  const parSimp = simplifyFraction(parNum, parDen); // 1/4

  // Multiplication: c/d · parSimp = (1 · 1) / (d · 4)
  const multNum = c * parSimp.num;
  const multDen = d * parSimp.den;
  const multSimp = simplifyFraction(multNum, multDen);

  // Subtraction: a/b - multSimp
  const commonMcm = lcm(b, multSimp.den);
  const f1 = commonMcm / b;
  const f2 = commonMcm / multSimp.den;
  const finalRawNum = a * f1 - multSimp.num * f2;
  const finalSimp = simplifyFraction(finalRawNum, commonMcm);

  const exprStr = `${a}/${b} - ${c}/${d} · (${e}/${f} - ${g}/${h})`;

  const steps: ResolutionStep[] = [
    {
      title: "Pas 1: Operació dins del parèntesi (Jerarquia)",
      explanation: `Primer resolem la resta de dins del parèntesi: ${e}/${f} - ${g}/${h}. El m.c.m.(${f}, ${h}) = ${lcm(f, h)}. Restem i simplifiquem: obtenim ${parSimp.num}/${parSimp.den}.`,
      expression: `${a}/${b} - ${c}/${d} · (${parSimp.num}/${parSimp.den})`,
      ruleTag: "Parèntesi primer"
    },
    {
      title: "Pas 2: Multiplicació abans de la resta",
      explanation: `La jerarquia mana fer la multiplicació abans que la resta! Multipliquem en línia: (${c} · ${parSimp.num}) / (${d} · ${parSimp.den}) = ${multSimp.num}/${multSimp.den}.`,
      expression: `${a}/${b} - ${multSimp.num}/${multSimp.den}`,
      ruleTag: "Multiplicació de fraccions"
    },
    {
      title: "Pas 3: Resta amb m.c.m. dels denominadors",
      explanation: `Busquem el m.c.m.(${b}, ${multSimp.den}) = ${commonMcm}. Reduïm a comú denominador: ${a * f1}/${commonMcm} - ${multSimp.num * f2}/${commonMcm} = ${finalRawNum}/${commonMcm}.`,
      expression: `${finalRawNum}/${commonMcm}`,
      ruleTag: "Comú denominador"
    }
  ];

  if (finalSimp.num !== finalRawNum || finalSimp.den !== commonMcm) {
    steps.push({
      title: "Pas 4: Simplificació final a fracció irreductible",
      explanation: `Dividim pel màxim comú divisor: resultat final ${finalSimp.num}/${finalSimp.den}.`,
      expression: `= ${finalSimp.num}/${finalSimp.den}`,
      ruleTag: "Fracció irreductible"
    });
  }

  return {
    id,
    category: 'fraccions',
    topicName: 'Operacions combinades de fraccions amb jerarquia',
    difficulty: 3,
    difficultyLabel: 'Nivell 3: 3r d’ESO Estàndard',
    questionPrompt: 'Calcula aplicant la jerarquia d’operacions i simplifica al màxim:',
    expressionDisplay: exprStr,
    displayType: 'fraction_expr',
    correctAnswer: { kind: 'fraction', num: finalSimp.num, den: finalSimp.den },
    answerDisplay: `${finalSimp.num}/${finalSimp.den}`,
    steps,
    hints: [
      `Fes primer el que hi ha dins del parèntesi: (${e}/${f} - ${g}/${h}) = ${parSimp.num}/${parSimp.den}.`,
      `Ara fes la multiplicació amb ${c}/${d} abans de restar-ho a ${a}/${b}.`,
      `Finalment fes la resta reduint a comú denominador ${commonMcm}.`
    ],
    diagnoseMistake: (u) => {
      if (u.numVal !== undefined && u.denVal !== undefined) {
        if (u.numVal === -finalSimp.num && u.denVal === finalSimp.den) {
          return {
            mistakeTitle: "Signe invertit!",
            explanation: "Has fet bé el procediment però el signe del numerador és el contrari.",
            tip: `Revisa la resta final: ${a * f1} - ${multSimp.num * f2}.`,
            detectedConcept: "Signe en resta de fraccions"
          };
        }
        return {
          mistakeTitle: "Error en la jerarquia de fraccions!",
          explanation: "Recorda l'ordre sagrat de les operacions: 1r parèntesi -> 2n multiplicacions/divisions -> 3r sumes/restes.",
          tip: `El parèntesi donava ${parSimp.num}/${parSimp.den}, i la multiplicació ${multSimp.num}/${multSimp.den}.`,
          detectedConcept: "Jerarquia en càlcul amb fraccions"
        };
      }
      return null;
    }
  };
}

function generateFraccionsLevel4(): MathExercise {
  // Level 4 (Exam challenge): Fractions with powers and nested brackets
  // e.g. (1/2)^2 - 2/3 · (3/4 - 1/2 : 2)
  const id = `frac-4-${Date.now()}-${randomInt(100, 999)}`;
  // (2/3)^2 - 1/3 · (1 - 1/4)
  // (2/3)^2 = 4/9
  // (1 - 1/4) = 3/4
  // 1/3 · 3/4 = 3/12 = 1/4
  // 4/9 - 1/4: mcm(9, 4) = 36 -> 16/36 - 9/36 = 7/36
  const numP = 2;
  const denP = 3;
  const pExp = 2;
  const powNum = 4;
  const powDen = 9;

  const multFNum = 1;
  const multFDen = 3;

  const insideNum = 3;
  const insideDen = 4; // 1 - 1/4 = 3/4

  const prodNum = 1;
  const prodDen = 4; // 1/3 · 3/4 = 1/4

  // 4/9 - 1/4 = (16 - 9)/36 = 7/36
  const finalNum = 7;
  const finalDen = 36;

  const exprStr = `(${numP}/${denP})² - ${multFNum}/${multFDen} · (1 - 1/4)`;

  const steps: ResolutionStep[] = [
    {
      title: "Pas 1: Parèntesi i potència",
      explanation: `Resolem el parèntesi (1 - 1/4 = 4/4 - 1/4 = 3/4) i alhora calculem la potència de la fracció: (${numP}/${denP})² = ${numP}² / ${denP}² = ${powNum}/${powDen}.`,
      expression: `${powNum}/${powDen} - ${multFNum}/${multFDen} · (3/4)`,
      ruleTag: "Parèntesis i potències"
    },
    {
      title: "Pas 2: Multiplicació de fraccions",
      explanation: `Multipliquem en línia: (${multFNum} · 3) / (${multFDen} · 4) = 3/12 = 1/4.`,
      expression: `${powNum}/${powDen} - 1/4`,
      ruleTag: "Multiplicació i simplificació"
    },
    {
      title: "Pas 3: Comú denominador i resta final",
      explanation: `El m.c.m.(9, 4) = 36. Reduïm a denominador comú: (36:9)·4 = 16 i (36:4)·1 = 9.
      Així: 16/36 - 9/36 = ${finalNum}/${finalDen}. És una fracció irreductible!`,
      expression: `= ${finalNum}/${finalDen}`,
      ruleTag: "Resultat irreductible"
    }
  ];

  return {
    id,
    category: 'fraccions',
    topicName: 'Repte d’examen de fraccions amb potències',
    difficulty: 4,
    difficultyLabel: 'Nivell 4: Repte d’Examen',
    questionPrompt: 'Resol aquesta expressió completa combinada de 3r d’ESO:',
    expressionDisplay: exprStr,
    displayType: 'fraction_expr',
    correctAnswer: { kind: 'fraction', num: finalNum, den: finalDen },
    answerDisplay: `${finalNum}/${finalDen}`,
    steps,
    hints: [
      `Fes primer el parèntesi (1 - 1/4) i la potència (${numP}/${denP})² per separat.`,
      `Després multiplica ${multFNum}/${multFDen} pel resultat del parèntesi.`,
      `Finalment fes la resta buscant el m.c.m.(9, 4) = 36.`
    ],
    diagnoseMistake: (u) => {
      if (u.numVal !== undefined && u.denVal !== undefined) {
        if (u.numVal === -finalNum && u.denVal === finalDen) {
          return {
            mistakeTitle: "Error de signe en la resta!",
            explanation: "Has restat a l'inrevés (9 - 16 en lloc de 16 - 9).",
            tip: "El primer terme és 16/36 i el segon és 9/36.",
            detectedConcept: "Ordre de la resta"
          };
        }
        return {
          mistakeTitle: "Revisa pas a pas amb la pissarra!",
          explanation: `Aquest és un exercici típic de màxima puntuació d'examen. Separa la potència (4/9), el parèntesi (3/4) i el producte (1/4).`,
          tip: "16/36 - 9/36 dóna exactament 7/36.",
          detectedConcept: "Combinada avançada de fraccions"
        };
      }
      return null;
    }
  };
}

// -----------------------------------------------------------------------------
// MAIN GENERATOR DISPATCHER
// -----------------------------------------------------------------------------

export function generateExercise(category: MathCategory, difficulty: DifficultyLevel): MathExercise {
  if (category === 'enters') {
    switch (difficulty) {
      case 1: return generateEntersLevel1();
      case 2: return generateEntersLevel2();
      case 3: return generateEntersLevel3();
      case 4: return generateEntersLevel4();
    }
  }

  if (category === 'potencies') {
    switch (difficulty) {
      case 1: return generatePotenciesLevel1();
      case 2: return generatePotenciesLevel2();
      case 3: return generatePotenciesLevel3();
      case 4: return generatePotenciesLevel4();
    }
  }

  // Fraccions
  switch (difficulty) {
    case 1: return generateFraccionsLevel1();
    case 2: return generateFraccionsLevel2();
    case 3: return generateFraccionsLevel3();
    case 4: return generateFraccionsLevel4();
  }
}
