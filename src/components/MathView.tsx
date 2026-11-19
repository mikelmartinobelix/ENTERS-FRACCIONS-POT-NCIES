/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface MathViewProps {
  expression: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  highlightColor?: string;
}

type Token =
  | { type: 'fraction'; num: string; den: string; hasParens?: boolean; exp?: string }
  | { type: 'power'; base: string; exp: string }
  | { type: 'signed'; value: string }
  | { type: 'operator'; symbol: string }
  | { type: 'bracket'; symbol: string }
  | { type: 'text'; value: string };

/**
 * Tokenizes mathematical strings into tokens for textbook-grade 2D vertical fraction rendering.
 */
function tokenizeMathExpression(str: string): Token[] {
  if (!str) return [];
  const normalized = str.replace(/\*/g, '·');
  const tokens: Token[] = [];
  let remaining = normalized.trim();

  while (remaining.length > 0) {
    remaining = remaining.trimStart();
    if (!remaining) break;

    // 1. Compound fraction with parentheses in numerator: e.g. (3 + 2) / 6 or (a · c) / (b · d) or (16 - 9) / 36
    let m = remaining.match(/^\(([^()]+)\)\s*\/\s*(\(([^()]+)\)|[a-zA-Z0-9_\-]+)/);
    if (m) {
      const num = m[1].trim();
      const den = (m[3] || m[2]).trim();
      tokens.push({ type: 'fraction', num, den });
      remaining = remaining.slice(m[0].length);
      continue;
    }

    // 2. Parenthesized fraction with optional exponent: e.g. (2/3)², (2/3)^2, (2/3)⁻², (3/4)^?, (1/2)
    m = remaining.match(/^\(([a-zA-Z0-9_\-]+)\s*\/\s*([a-zA-Z0-9_\-]+)\)(\^[-]?\d+|\^[-]?\?|[²³⁻¹⁻²⁻³\^0-9\?]+)?/);
    if (m) {
      tokens.push({
        type: 'fraction',
        num: m[1],
        den: m[2],
        hasParens: true,
        exp: m[3] ? m[3].replace(/^\^/, '') : undefined
      });
      remaining = remaining.slice(m[0].length);
      continue;
    }

    // 3. Simple fraction: e.g. 3/4, 3 / 4, -3/4, 15/8, 7/36, a/b, 1 / aⁿ
    m = remaining.match(/^([-]?[a-zA-Z0-9]+)\s*\/\s*([a-zA-Z0-9ⁿ²³]+)/);
    if (m) {
      tokens.push({ type: 'fraction', num: m[1], den: m[2] });
      remaining = remaining.slice(m[0].length);
      continue;
    }

    // 4. Power expression: e.g. 2^3, (-3)^2, base^?, 10^4
    m = remaining.match(/^(\(?[-]?\d+\)?)\^(\(?[-]?\d+\)?|\?|[²³⁻¹⁻²⁻³]+)/);
    if (m) {
      tokens.push({ type: 'power', base: m[1], exp: m[2].replace(/[()]/g, '') });
      remaining = remaining.slice(m[0].length);
      continue;
    }

    // 5. Parenthesized negative integer: e.g. (-3)
    m = remaining.match(/^\(([-]?\d+)\)/);
    if (m) {
      tokens.push({ type: 'signed', value: m[1] });
      remaining = remaining.slice(m[0].length);
      continue;
    }

    // 6. Math Operators: +, -, ·, :, =
    m = remaining.match(/^[+\-·:=]/);
    if (m) {
      tokens.push({ type: 'operator', symbol: m[0] });
      remaining = remaining.slice(1);
      continue;
    }

    // 7. Brackets and Parentheses: [, ], (, )
    m = remaining.match(/^[\[\]()]/);
    if (m) {
      tokens.push({ type: 'bracket', symbol: m[0] });
      remaining = remaining.slice(1);
      continue;
    }

    // 8. Plain word / numbers / text (up to next space or special char)
    m = remaining.match(/^[^\s+\-·:=()[\]/]+/);
    if (m) {
      tokens.push({ type: 'text', value: m[0] });
      remaining = remaining.slice(m[0].length);
      continue;
    }

    // Fallback single char
    tokens.push({ type: 'text', value: remaining[0] });
    remaining = remaining.slice(1);
  }

  return tokens;
}

/**
 * Vertical fraction rendering component:
 * - Numerador a dalt
 * - Ratlla de fracció horitzontal sòlida
 * - Denominador a sota
 * - Centrat verticalment amb els operadors
 */
const VerticalFraction: React.FC<{
  num: string;
  den: string;
  hasParens?: boolean;
  exp?: string;
  size: 'sm' | 'md' | 'lg' | 'xl';
}> = ({ num, den, hasParens, exp, size }) => {
  const lineClasses = {
    sm: 'h-[2px] my-0.5',
    md: 'h-[2.5px] my-1',
    lg: 'h-[3px] my-1',
    xl: 'h-[4px] md:h-[5px] my-1 md:my-1.5'
  }[size];

  const parenClasses = {
    sm: 'text-xl font-light',
    md: 'text-3xl font-light',
    lg: 'text-4xl font-light',
    xl: 'text-5xl md:text-6xl font-light'
  }[size];

  const expClasses = {
    sm: 'text-[10px] -top-2 ml-0.5 font-bold',
    md: 'text-xs -top-2.5 ml-0.5 font-bold',
    lg: 'text-sm -top-3.5 ml-1 font-bold',
    xl: 'text-base md:text-2xl -top-4 md:-top-6 ml-1 font-extrabold'
  }[size];

  const numDenTextClasses = {
    sm: 'text-xs md:text-sm font-bold',
    md: 'text-base md:text-lg font-bold',
    lg: 'text-xl md:text-2xl font-bold',
    xl: 'text-3xl md:text-5xl font-black tracking-wide'
  }[size];

  return (
    <span className="inline-flex items-center align-middle mx-1 md:mx-2 select-text">
      {hasParens && (
        <span className={`text-slate-400 dark:text-slate-500 mr-0.5 select-none leading-none ${parenClasses}`}>
          (
        </span>
      )}
      <span className="inline-flex flex-col items-center justify-center align-middle min-w-[22px] md:min-w-[32px]">
        {/* Numerador (a dalt) */}
        <span
          className={`px-1 text-center font-bold text-indigo-600 dark:text-indigo-400 leading-none pb-0.5 w-full ${numDenTextClasses}`}
        >
          {num}
        </span>

        {/* Ratlla de fracció horitzontal */}
        <span
          className={`w-full block min-w-[1.2em] bg-slate-800 dark:bg-slate-200 rounded-full shadow-xs ${lineClasses}`}
        />

        {/* Denominador (a sota) */}
        <span
          className={`px-1 text-center font-bold text-amber-600 dark:text-amber-400 leading-none pt-0.5 w-full ${numDenTextClasses}`}
        >
          {den}
        </span>
      </span>
      {hasParens && (
        <span className={`text-slate-400 dark:text-slate-500 ml-0.5 select-none leading-none ${parenClasses}`}>
          )
        </span>
      )}
      {exp && (
        <sup className={`text-emerald-600 dark:text-emerald-400 select-none ${expClasses}`}>
          {exp}
        </sup>
      )}
    </span>
  );
};

export const MathView: React.FC<MathViewProps> = ({
  expression,
  className = '',
  size = 'md'
}) => {
  const containerClasses = {
    sm: 'text-xs md:text-sm gap-x-1 gap-y-1',
    md: 'text-base md:text-lg gap-x-1.5 gap-y-1.5',
    lg: 'text-xl md:text-2xl gap-x-2 gap-y-2',
    xl: 'text-3xl md:text-4xl gap-x-2.5 gap-y-3'
  }[size];

  const operatorClasses = {
    sm: 'text-sm font-bold text-indigo-600 dark:text-indigo-400 mx-0.5',
    md: 'text-lg font-bold text-indigo-600 dark:text-indigo-400 mx-1',
    lg: 'text-2xl font-bold text-indigo-600 dark:text-indigo-400 mx-1.5',
    xl: 'text-3xl md:text-4xl font-black text-indigo-600 dark:text-indigo-400 mx-2 md:mx-3'
  }[size];

  const bracketClasses = {
    sm: 'text-base font-light text-slate-400',
    md: 'text-xl md:text-2xl font-light text-slate-400',
    lg: 'text-2xl md:text-3xl font-light text-slate-400',
    xl: 'text-4xl md:text-5xl font-light text-slate-400 dark:text-slate-500'
  }[size];

  const powerBaseClasses = {
    sm: 'font-semibold text-slate-800 dark:text-slate-100',
    md: 'font-bold text-slate-800 dark:text-slate-100',
    lg: 'font-bold text-slate-800 dark:text-slate-100',
    xl: 'font-extrabold text-slate-900 dark:text-white'
  }[size];

  const powerExpClasses = {
    sm: 'text-[10px] font-bold text-emerald-600 dark:text-emerald-400 ml-0.5 px-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 -top-2',
    md: 'text-xs font-bold text-emerald-600 dark:text-emerald-400 ml-0.5 px-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 -top-2.5',
    lg: 'text-sm font-bold text-emerald-600 dark:text-emerald-400 ml-1 px-1 rounded bg-emerald-50 dark:bg-emerald-950/40 -top-3',
    xl: 'text-base md:text-xl font-black text-emerald-600 dark:text-emerald-400 ml-1 px-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 -top-4 md:-top-5'
  }[size];

  const tokens = tokenizeMathExpression(expression);

  return (
    <div className={`select-text py-1 inline-flex items-center flex-wrap justify-center font-mono leading-none ${containerClasses} ${className}`}>
      {tokens.map((token, index) => {
        if (token.type === 'fraction') {
          return (
            <VerticalFraction
              key={index}
              num={token.num}
              den={token.den}
              hasParens={token.hasParens}
              exp={token.exp}
              size={size}
            />
          );
        }

        if (token.type === 'power') {
          return (
            <span key={index} className="inline-flex items-baseline align-middle mx-0.5">
              <span className={powerBaseClasses}>{token.base}</span>
              <sup className={powerExpClasses}>
                {token.exp}
              </sup>
            </span>
          );
        }

        if (token.type === 'signed') {
          return (
            <span key={index} className="inline-flex items-center align-middle font-bold text-slate-900 dark:text-white mx-0.5">
              ({token.value})
            </span>
          );
        }

        if (token.type === 'operator') {
          return (
            <span key={index} className={`inline-flex items-center align-middle ${operatorClasses}`}>
              {token.symbol}
            </span>
          );
        }

        if (token.type === 'bracket') {
          return (
            <span key={index} className={`inline-flex items-center align-middle select-none ${bracketClasses}`}>
              {token.symbol}
            </span>
          );
        }

        // Default text or numbers
        return (
          <span
            key={index}
            className="inline-flex items-center align-middle font-bold text-slate-900 dark:text-white mx-0.5"
          >
            {token.value}
          </span>
        );
      })}
    </div>
  );
};
