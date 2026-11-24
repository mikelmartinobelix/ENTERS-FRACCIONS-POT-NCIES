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
  | { type: 'bracket'; symbol: string; exp?: string }
  | { type: 'text'; value: string };

const SUPERSCRIPT_MAP: Record<string, string> = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
  '⁻': '-',
  '⁺': '+',
  'ⁿ': 'n',
  'ᵐ': 'm'
};

function normalizeExponent(raw: string): string {
  let clean = raw.trim();
  if (clean.startsWith('^')) {
    clean = clean.slice(1).trim();
  }
  if (clean.startsWith('(') && clean.endsWith(')')) {
    clean = clean.slice(1, -1).trim();
  }
  return clean.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ⁿᵐ]/g, (ch) => SUPERSCRIPT_MAP[ch] ?? ch);
}

/**
 * Reads a balanced (...) group starting at index 0. Returns null if unbalanced.
 */
function readBalancedParens(str: string): { content: string; endIndex: number } | null {
  if (!str.startsWith('(')) return null;
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '(') depth++;
    else if (str[i] === ')') {
      depth--;
      if (depth === 0) {
        return {
          content: str.slice(1, i),
          endIndex: i + 1
        };
      }
    }
  }
  return null;
}

/**
 * Reads an optional exponent right after a token:
 * supports ^2, ^-2, ^(-2), ^(3 + 4), ^?, ², ⁻², ⁻2, ⁿ, etc.
 */
function matchTrailingExponent(str: string): { exp: string; length: number } | null {
  if (!str) return null;

  // Case 1: ^ followed by (...)
  if (str.startsWith('^(')) {
    const balanced = readBalancedParens(str.slice(1));
    if (balanced) {
      return {
        exp: normalizeExponent(balanced.content),
        length: 1 + balanced.endIndex
      };
    }
  }

  // Case 2: ^ followed by -?digits, ?, or letter/unicode exponent
  let m = str.match(/^\^([-]?\d+|\?|[a-zA-Z0-9⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ⁿᵐ]+)/);
  if (m) {
    return {
      exp: normalizeExponent(m[1]),
      length: m[0].length
    };
  }

  // Case 3: Unicode superscript characters (possibly mixed with digits after ⁻, e.g. 5⁻2)
  m = str.match(/^([⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ⁿᵐ]+(?:[0-9]+)?)/);
  if (m) {
    return {
      exp: normalizeExponent(m[1]),
      length: m[0].length
    };
  }

  return null;
}

/**
 * Tokenizes mathematical strings into tokens for textbook-grade 2D rendering.
 */
function tokenizeMathExpression(str: string, allowFractions: boolean = true): Token[] {
  if (!str) return [];
  const normalized = str.replace(/\*/g, '·');
  const tokens: Token[] = [];
  let remaining = normalized.trim();

  while (remaining.length > 0) {
    remaining = remaining.trimStart();
    if (!remaining) break;

    // 1. Expressions starting with '('
    if (remaining.startsWith('(')) {
      const balanced = readBalancedParens(remaining);
      if (balanced) {
        const inner = balanced.content.trim();
        const afterParen = remaining.slice(balanced.endIndex);

        // 1a. Compound fraction: (numerator) / denominator
        if (allowFractions) {
          const slashMatch = afterParen.match(/^\s*\/\s*/);
          if (slashMatch) {
            const afterSlash = afterParen.slice(slashMatch[0].length);
            if (afterSlash.startsWith('(')) {
              const denGroup = readBalancedParens(afterSlash);
              if (denGroup) {
                const afterDen = afterSlash.slice(denGroup.endIndex);
                const denExp = matchTrailingExponent(afterDen);
                const denStr = denExp
                  ? `(${denGroup.content.trim()})^${denExp.exp}`
                  : denGroup.content.trim();
                tokens.push({ type: 'fraction', num: inner, den: denStr });
                remaining = afterDen.slice(denExp ? denExp.length : 0);
                continue;
              }
            } else {
              const denMatch = afterSlash.match(
                /^([a-zA-Z0-9]+(?:\^(?:\([^()]+\)|[-]?\d+|[a-zA-Z0-9]+)|[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ⁿᵐ]+(?:[0-9]+)?)?)/
              );
              if (denMatch) {
                tokens.push({ type: 'fraction', num: inner, den: denMatch[1].trim() });
                remaining = afterSlash.slice(denMatch[0].length);
                continue;
              }
            }
          }
        }

        // 1b. Parenthesized simple fraction with optional exponent: (2/3), (2/3)², (2/3)^(-2), (2/3)^?
        if (allowFractions) {
          const fracInner = inner.match(/^([-]?[a-zA-Z0-9]+)\s*\/\s*([a-zA-Z0-9]+)$/);
          if (fracInner) {
            const expMatch = matchTrailingExponent(afterParen);
            tokens.push({
              type: 'fraction',
              num: fracInner[1],
              den: fracInner[2],
              hasParens: true,
              exp: expMatch ? expMatch.exp : undefined
            });
            remaining = afterParen.slice(expMatch ? expMatch.length : 0);
            continue;
          }
        }

        // 1c. Parenthesized signed number with exponent: (-3)^2, (-5)^0, (7)^1
        const signedInner = inner.match(/^([-]?\d+|[a-zA-Z])$/);
        const trailingExp = matchTrailingExponent(afterParen);
        if (signedInner && trailingExp) {
          tokens.push({
            type: 'power',
            base: `(${signedInner[1]})`,
            exp: trailingExp.exp
          });
          remaining = afterParen.slice(trailingExp.length);
          continue;
        }

        // 1d. Parenthesized negative integer without exponent: e.g. (-3)
        if (/^-\d+$/.test(inner)) {
          tokens.push({ type: 'signed', value: inner });
          remaining = afterParen;
          continue;
        }

        // 1e. General parenthesized expression, possibly raised to an exponent:
        // e.g. (2^3)^4, (2^3 · 2^4)^2, (1 - 1/4), (3^5 · (3^2)^3)
        tokens.push({ type: 'bracket', symbol: '(' });
        tokens.push(...tokenizeMathExpression(inner, allowFractions));
        tokens.push({
          type: 'bracket',
          symbol: ')',
          exp: trailingExp ? trailingExp.exp : undefined
        });
        remaining = afterParen.slice(trailingExp ? trailingExp.length : 0);
        continue;
      }
    }

    // 2. Simple fraction (including powers in num/den, e.g. 3/4, 1 / 5^2, 1 / aⁿ)
    if (allowFractions) {
      const m = remaining.match(
        /^([-]?[a-zA-Z0-9]+(?:\^(?:\([^()]+\)|[-]?\d+|[a-zA-Z0-9]+)|[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ⁿᵐ]+(?:[0-9]+)?)?)\s*\/\s*([a-zA-Z0-9]+(?:\^(?:\([^()]+\)|[-]?\d+|[a-zA-Z0-9]+)|[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ⁿᵐ]+(?:[0-9]+)?)?)/
      );
      if (m) {
        tokens.push({ type: 'fraction', num: m[1].trim(), den: m[2].trim() });
        remaining = remaining.slice(m[0].length);
        continue;
      }
    }

    // 3. Power expression: e.g. 2^3, -3^2, 5^-2, 5^(-2), 5⁻2, 5⁻², 2^(3 + 4), 2^?, aᵐ⁺ⁿ
    const baseMatch = remaining.match(/^([-]?\d+|[a-zA-Z])(?=\^|[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ⁿᵐ])/);
    if (baseMatch) {
      const afterBase = remaining.slice(baseMatch[0].length);
      const expMatch = matchTrailingExponent(afterBase);
      if (expMatch) {
        tokens.push({
          type: 'power',
          base: baseMatch[1],
          exp: expMatch.exp
        });
        remaining = afterBase.slice(expMatch.length);
        continue;
      }
    }

    // 4. Math Operators: +, -, ·, :, =
    let m = remaining.match(/^[+\-·:=]/);
    if (m) {
      tokens.push({ type: 'operator', symbol: m[0] });
      remaining = remaining.slice(1);
      continue;
    }

    // 5. Brackets and Parentheses (with optional trailing exponent on ] or )): [, ], (, )
    m = remaining.match(/^[\[\]()]/);
    if (m) {
      const sym = m[0];
      const afterBracket = remaining.slice(1);
      if (sym === ']' || sym === ')') {
        const expMatch = matchTrailingExponent(afterBracket);
        if (expMatch) {
          tokens.push({ type: 'bracket', symbol: sym, exp: expMatch.exp });
          remaining = afterBracket.slice(expMatch.length);
          continue;
        }
      }
      tokens.push({ type: 'bracket', symbol: sym });
      remaining = afterBracket;
      continue;
    }

    // 6. Plain word / numbers / text (up to next space or special char)
    m = remaining.match(/^[^\s+\-·:=()[\]/^⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ⁿᵐ]+/);
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

const TokenList: React.FC<{
  tokens: Token[];
  size: 'sm' | 'md' | 'lg' | 'xl';
  inheritTextColor?: boolean;
}> = ({ tokens, size, inheritTextColor = false }) => {
  const operatorClasses = {
    sm: 'text-sm font-bold text-indigo-600 dark:text-indigo-400 mx-0.5',
    md: 'text-lg font-bold text-indigo-600 dark:text-indigo-400 mx-1',
    lg: 'text-2xl font-bold text-indigo-600 dark:text-indigo-400 mx-1.5',
    xl: 'text-3xl md:text-4xl font-black text-indigo-600 dark:text-indigo-400 mx-2 md:mx-3'
  }[size];

  const bracketClasses = {
    sm: 'text-base font-medium text-slate-600 dark:text-slate-300',
    md: 'text-xl md:text-2xl font-medium text-slate-600 dark:text-slate-300',
    lg: 'text-2xl md:text-3xl font-medium text-slate-600 dark:text-slate-300',
    xl: 'text-4xl md:text-5xl font-medium text-slate-600 dark:text-slate-300'
  }[size];

  const powerBaseClasses = inheritTextColor
    ? 'font-bold'
    : {
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

  return (
    <>
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
              <sup className={`relative leading-none ${powerExpClasses}`}>
                {token.exp}
              </sup>
            </span>
          );
        }

        if (token.type === 'signed') {
          return (
            <span
              key={index}
              className={`inline-flex items-center align-middle font-bold mx-0.5 ${
                inheritTextColor ? '' : 'text-slate-900 dark:text-white'
              }`}
            >
              ({token.value})
            </span>
          );
        }

        if (token.type === 'operator') {
          return (
            <span
              key={index}
              className={`inline-flex items-center align-middle ${
                inheritTextColor ? 'mx-1 font-bold' : operatorClasses
              }`}
            >
              {token.symbol}
            </span>
          );
        }

        if (token.type === 'bracket') {
          return (
            <span key={index} className="inline-flex items-baseline align-middle select-none">
              <span className={bracketClasses}>{token.symbol}</span>
              {token.exp && (
                <sup className={`relative leading-none ${powerExpClasses}`}>
                  {token.exp}
                </sup>
              )}
            </span>
          );
        }

        return (
          <span
            key={index}
            className={`inline-flex items-center align-middle font-bold mx-0.5 ${
              inheritTextColor ? '' : 'text-slate-900 dark:text-white'
            }`}
          >
            {token.value}
          </span>
        );
      })}
    </>
  );
};

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
    sm: 'text-xl font-medium',
    md: 'text-3xl font-medium',
    lg: 'text-4xl font-medium',
    xl: 'text-5xl md:text-6xl font-medium'
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
    xl: 'text-2xl md:text-4xl font-black tracking-wide'
  }[size];

  const subSize: 'sm' | 'md' | 'lg' = size === 'xl' ? 'lg' : size === 'lg' ? 'md' : 'sm';
  const numNeedsTokens = /[\^⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ⁿᵐ·()]/.test(num);
  const denNeedsTokens = /[\^⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ⁿᵐ·()]/.test(den);

  return (
    <span className="inline-flex items-center align-middle mx-1 md:mx-2 select-text">
      {hasParens && (
        <span className={`text-slate-600 dark:text-slate-300 mr-0.5 select-none leading-none ${parenClasses}`}>
          (
        </span>
      )}
      <span className="inline-flex flex-col items-center justify-center align-middle min-w-[22px] md:min-w-[32px]">
        {/* Numerador (a dalt) */}
        <span
          className={`px-1.5 text-center font-bold text-indigo-600 dark:text-indigo-400 leading-none pb-1 w-full inline-flex items-center justify-center ${numDenTextClasses}`}
        >
          {numNeedsTokens ? (
            <TokenList tokens={tokenizeMathExpression(num, false)} size={subSize} inheritTextColor />
          ) : (
            num
          )}
        </span>

        {/* Ratlla de fracció horitzontal */}
        <span
          className={`w-full block min-w-[1.2em] bg-slate-800 dark:bg-slate-200 rounded-full shadow-xs ${lineClasses}`}
        />

        {/* Denominador (a sota) */}
        <span
          className={`px-1.5 text-center font-bold text-amber-600 dark:text-amber-400 leading-none pt-1 w-full inline-flex items-center justify-center ${numDenTextClasses}`}
        >
          {denNeedsTokens ? (
            <TokenList tokens={tokenizeMathExpression(den, false)} size={subSize} inheritTextColor />
          ) : (
            den
          )}
        </span>
      </span>
      {hasParens && (
        <span className={`text-slate-600 dark:text-slate-300 ml-0.5 select-none leading-none ${parenClasses}`}>
          )
        </span>
      )}
      {exp && (
        <sup className={`relative leading-none text-emerald-600 dark:text-emerald-400 select-none px-1 rounded bg-emerald-50 dark:bg-emerald-950/40 ${expClasses}`}>
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

  const tokens = tokenizeMathExpression(expression);

  return (
    <div className={`select-text py-1 inline-flex items-center flex-wrap justify-center font-mono leading-none ${containerClasses} ${className}`}>
      <TokenList tokens={tokens} size={size} />
    </div>
  );
};
