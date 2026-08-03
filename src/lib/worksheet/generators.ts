import type {
  Band,
  PromptSegment,
  QuestionKind,
  ResponseSpace,
} from './schema';
import { createSeededRandom, type SeededRandom } from './random';

export interface DraftQuestion {
  templateId: string;
  prompt: PromptSegment[];
  answer: PromptSegment[];
  answerText: string;
  responseSpace: ResponseSpace;
  kind: QuestionKind;
  equipment: string[];
  fingerprintPayload: Record<string, unknown>;
}

export interface GenerationContext {
  skillId: string;
  band: Band;
  style: 'direct' | 'applied';
  seed: string;
  occurrence: number;
  attempt: number;
}

const text = (value: string): PromptSegment => ({ type: 'text', value });
const math = (value: string): PromptSegment => ({ type: 'math', value });
const number = (value: number) => new Intl.NumberFormat('en-GB').format(value);
const mathNumber = (value: number) => number(value).replaceAll(',', '{,}');
const bandValue = (band: Band) => ({ support: 0, core: 1, stretch: 2 })[band];

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) [x, y] = [y, x % y];
  return x;
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

function simplifyFraction(numerator: number, denominator: number): [number, number] {
  const divisor = gcd(numerator, denominator);
  return [numerator / divisor, denominator / divisor];
}

function fractionLatex(numerator: number | string, denominator: number | string): string {
  return `\\frac{${numerator}}{${denominator}}`;
}

function fractionAnswer(numerator: number, denominator: number): {
  segments: PromptSegment[];
  answerText: string;
} {
  const [n, d] = simplifyFraction(numerator, denominator);
  if (d === 1) return { segments: [math(String(n))], answerText: String(n) };
  return { segments: [math(fractionLatex(n, d))], answerText: `${n}/${d}` };
}

function factorList(value: number): number[] {
  const factors: number[] = [];
  for (let candidate = 1; candidate <= value; candidate += 1) {
    if (value % candidate === 0) factors.push(candidate);
  }
  return factors;
}

function primeFactorization(value: number): Array<[number, number]> {
  let remaining = value;
  const result: Array<[number, number]> = [];
  for (let prime = 2; prime * prime <= remaining; prime += 1) {
    let exponent = 0;
    while (remaining % prime === 0) {
      remaining /= prime;
      exponent += 1;
    }
    if (exponent > 0) result.push([prime, exponent]);
  }
  if (remaining > 1) result.push([remaining, 1]);
  return result;
}

function primeFactorLatex(value: number): string {
  return primeFactorization(value)
    .map(([prime, exponent]) => (exponent === 1 ? String(prime) : `${prime}^{${exponent}}`))
    .join(' \\times ');
}

function generationRandom(context: GenerationContext): SeededRandom {
  return createSeededRandom(
    `${context.seed}/${context.skillId}/${context.band}/${context.style}/${context.occurrence}/${context.attempt}`,
  );
}

function generatePlaceValue(
  context: GenerationContext,
  rng: SeededRandom,
  mode: 'digit' | 'compare' | 'round',
): DraftQuestion {
  const level = bandValue(context.band);
  const ranges = [
    [10_000, 99_999],
    [100_000, 9_999_999],
    [10_000_000, 999_999_999],
  ] as const;
  const value = rng.int(ranges[level][0], ranges[level][1]);
  if (mode === 'digit') {
    const place = rng.pick(level === 0 ? [10, 100, 1000] : level === 1 ? [100, 1000, 10_000] : [1000, 10_000, 100_000]);
    const digit = Math.floor(value / place) % 10;
    const digitValue = digit * place;
    return {
      templateId: `place-value-digit-${context.style}`,
      prompt: context.style === 'applied'
        ? [text(`A city recorded a population of ${number(value)}. What value does the digit ${digit} represent in this number?`)]
        : [text(`What is the value of the digit ${digit} in ${number(value)}?`)],
      answer: [text(number(digitValue))],
      answerText: number(digitValue),
      responseSpace: context.style === 'applied' ? 'standard' : 'compact',
      kind: context.style,
      equipment: [],
      fingerprintPayload: { mode, value, place, digit },
    };
  }
  if (mode === 'compare') {
    const step = rng.int(level === 0 ? 20 : 200, level === 2 ? 20_000 : 3000);
    const values = rng.shuffle([value, value + step, value - rng.int(1, step - 1)]);
    const ordered = [...values].sort((left, right) => left - right);
    return {
      templateId: `place-value-order-${context.style}`,
      prompt: context.style === 'applied'
        ? [text(`Three towns recorded ${values.map(number).join(', ')} visitors. Write the visitor totals in ascending order.`)]
        : [text(`Write these numbers in ascending order: ${values.map(number).join(', ')}.`)],
      answer: [text(ordered.map(number).join(', '))],
      answerText: ordered.map(number).join(', '),
      responseSpace: 'standard',
      kind: context.style,
      equipment: [],
      fingerprintPayload: { mode, values },
    };
  }
  const places = level === 0 ? [10, 100, 1000] : level === 1 ? [100, 1000, 10_000] : [1000, 10_000, 100_000];
  const place = rng.pick(places);
  const rounded = Math.round(value / place) * place;
  const placeLabel = number(place);
  const prompt = context.style === 'applied'
    ? [text(`A town recorded ${number(value)} visitors. Round this number to the nearest ${placeLabel} for a report.`)]
    : [text(`Round ${number(value)} to the nearest ${placeLabel}.`)];
  return {
    templateId: `place-value-round-${context.style}`,
    prompt,
    answer: [text(number(rounded))],
    answerText: number(rounded),
    responseSpace: context.style === 'applied' ? 'standard' : 'compact',
    kind: context.style,
    equipment: [],
    fingerprintPayload: { value, place, style: context.style },
  };
}

function generateWrittenAddSubtract(
  context: GenerationContext,
  rng: SeededRandom,
  operation: 'add' | 'subtract',
): DraftQuestion {
  const level = bandValue(context.band);
  const min = [1000, 10_000, 100_000][level];
  const max = [9999, 999_999, 9_999_999][level];
  let a = rng.int(min, max);
  let b = rng.int(min, max);
  if (operation === 'subtract' && b > a) [a, b] = [b, a];
  const answerValue = operation === 'add' ? a + b : a - b;
  const symbol = operation === 'add' ? '+' : '-';
  const directPrompt = [math(`${mathNumber(a)} ${symbol} ${mathNumber(b)}`)];
  const appliedPrompt = operation === 'add'
    ? [text(`A library has ${number(a)} books in its main room and ${number(b)} in its reading room. How many books are there altogether?`)]
    : [text(`A warehouse began with ${number(a)} notebooks and sent out ${number(b)}. How many notebooks remain?`)];
  return {
    templateId: `written-${operation}-${context.style}`,
    prompt: context.style === 'applied' ? appliedPrompt : directPrompt,
    answer: [text(number(answerValue))],
    answerText: number(answerValue),
    responseSpace: context.style === 'applied' ? 'large' : 'standard',
    kind: context.style,
    equipment: [],
    fingerprintPayload: { operation, a, b, style: context.style },
  };
}

function generateLongMultiplication(
  context: GenerationContext,
  rng: SeededRandom,
  multiplierSize: 'one-digit' | 'multi-digit',
): DraftQuestion {
  const level = bandValue(context.band);
  const multiplicand = rng.int(1000, 9999);
  const multiplier = multiplierSize === 'one-digit'
    ? rng.int(2, 9)
    : level === 2 ? rng.int(101, 499) : rng.int(11, 99);
  const product = multiplicand * multiplier;
  return {
    templateId: `${multiplierSize === 'one-digit' ? 'written-multiplication-one-digit' : 'long-multiplication'}-${context.style}-b${level + 1}`,
    prompt: context.style === 'applied'
      ? [text(`A printing press packs ${number(multiplicand)} sheets in each bundle. It prepares ${number(multiplier)} bundles. How many sheets are packed altogether?`)]
      : [math(`${mathNumber(multiplicand)} \\times ${mathNumber(multiplier)}`)],
    answer: [text(number(product))],
    answerText: number(product),
    responseSpace: 'large',
    kind: context.style,
    equipment: [],
    fingerprintPayload: { multiplicand, multiplier, style: context.style },
  };
}

function generateLongDivision(
  context: GenerationContext,
  rng: SeededRandom,
  divisorSize: 'one-digit' | 'two-digit',
  remainderMode: 'any' | 'required' = 'any',
): DraftQuestion {
  const level = bandValue(context.band);
  const divisor = divisorSize === 'one-digit' ? rng.int(2, 9) : rng.int(11, level === 2 ? 75 : 35);
  const quotient = level === 2
    ? rng.int(1000, 4999)
    : rng.int(level === 0 ? 500 : 120, 899);
  const remainder = remainderMode === 'required' || rng.bool(0.55) ? rng.int(1, divisor - 1) : 0;
  const dividend = divisor * quotient + remainder;
  const answerText = remainder === 0 ? number(quotient) : `${number(quotient)} remainder ${remainder}`;
  const answer = remainder === 0
    ? [text(number(quotient))]
    : [math(`${quotient}\\text{ R }${remainder}`)];
  return {
    templateId: `${remainderMode === 'required' ? 'division-remainders' : divisorSize === 'one-digit' ? 'division-one-digit' : 'long-division'}-${context.style}-b${level + 1}`,
    prompt: context.style === 'applied'
      ? [text(`${number(dividend)} exercise books are packed equally into cartons holding ${divisor} books each. How many full cartons can be filled, and how many books remain?`)]
      : [math(`${mathNumber(dividend)} \\div ${mathNumber(divisor)}`), text(' Give the quotient and remainder, if any.')],
    answer,
    answerText,
    responseSpace: 'large',
    kind: context.style,
    equipment: [],
    fingerprintPayload: { dividend, divisor, quotient, remainder, style: context.style },
  };
}

function generateFactorsMultiples(
  context: GenerationContext,
  rng: SeededRandom,
  mode: 'factors' | 'multiples' | 'prime-composite' | 'divisibility',
): DraftQuestion {
  const level = bandValue(context.band);
  const composites = level === 0
    ? [24, 30, 36, 40, 42, 48]
    : level === 1
      ? [54, 60, 72, 84, 90, 96, 108]
      : [120, 132, 144, 168, 180, 210, 252];
  const value = rng.pick(composites);
  if (mode === 'multiples') {
    const base = rng.int(level === 0 ? 3 : 6, level === 2 ? 24 : 16);
    const count = level === 2 ? 8 : 6;
    const multiples = Array.from({ length: count }, (_, index) => base * (index + 1));
    return {
      templateId: `multiples-${context.style}`,
      prompt: context.style === 'applied'
        ? [text(`A bell rings every ${base} minutes. Starting now, list the next ${count} times in minutes when it will ring.`)]
        : [text(`List the first ${count} positive multiples of ${base}.`)],
      answer: [text(multiples.join(', '))],
      answerText: multiples.join(', '),
      responseSpace: 'standard',
      kind: context.style,
      equipment: [],
      fingerprintPayload: { mode, base, count },
    };
  }
  if (mode === 'prime-composite') {
    const candidates = level === 0
      ? [17, 19, 21, 23, 25, 29, 31, 33]
      : level === 1 ? [37, 39, 41, 43, 49, 51, 53, 57] : [61, 67, 69, 71, 77, 79, 83, 87, 91, 97];
    const candidate = rng.pick(candidates);
    const factors = factorList(candidate);
    const classification = factors.length === 2 ? 'prime' : 'composite';
    const evidence = classification === 'prime'
      ? `its only factors are 1 and ${candidate}`
      : `for example, ${factors[1]} is a factor`;
    return {
      templateId: `prime-composite-${context.style}`,
      prompt: context.style === 'applied'
        ? [text(`A student says ${candidate} can be arranged into more than one non-trivial rectangular array. Is ${candidate} prime or composite? Explain using a factor.`)]
        : [text(`Is ${candidate} prime or composite? Give one fact that justifies your answer.`)],
      answer: [text(`${candidate} is ${classification}; ${evidence}.`)],
      answerText: classification,
      responseSpace: 'standard',
      kind: 'explanation',
      equipment: [],
      fingerprintPayload: { mode, candidate, classification },
    };
  }
  if (mode === 'divisibility') {
    const divisor = rng.pick(level === 0 ? [2, 3, 5, 10] : level === 1 ? [3, 4, 6, 8, 9] : [4, 6, 8, 9, 11]);
    const isDivisible = rng.bool();
    const baseValue = rng.int(level === 0 ? 100 : 1000, level === 2 ? 99_999 : 9999);
    let candidate = isDivisible ? baseValue - (baseValue % divisor) : baseValue;
    if (!isDivisible && candidate % divisor === 0) candidate += 1;
    return {
      templateId: `divisibility-${divisor}-${context.style}`,
      prompt: context.style === 'applied'
        ? [text(`Can ${number(candidate)} counters be packed into groups of ${divisor} with none left over? Use a divisibility rule rather than long division.`)]
        : [text(`Use a divisibility rule to decide whether ${number(candidate)} is divisible by ${divisor}. State your decision and the rule you used.`)],
      answer: [text(`${isDivisible ? 'Yes' : 'No'}; ${number(candidate)} ${isDivisible ? 'is' : 'is not'} divisible by ${divisor}.`)],
      answerText: isDivisible ? 'Yes' : 'No',
      responseSpace: 'standard',
      kind: 'explanation',
      equipment: [],
      fingerprintPayload: { mode, divisor, candidate, isDivisible },
    };
  }
  const factors = factorList(value);
  return {
    templateId: `factor-list-${context.style}`,
    prompt: context.style === 'applied'
      ? [text(`A teacher has ${value} counters and wants to arrange all of them in equal rows. List every possible number of counters in a row.`)]
      : [text(`List all the positive factors of ${value}.`) ],
    answer: [text(factors.join(', '))],
    answerText: factors.join(', '),
    responseSpace: context.style === 'applied' ? 'standard' : 'compact',
    kind: context.style,
    equipment: [],
    fingerprintPayload: { value, style: context.style },
  };
}

function generatePrimeHcfLcm(
  context: GenerationContext,
  rng: SeededRandom,
  mode: 'prime' | 'hcf' | 'lcm',
): DraftQuestion {
  const level = bandValue(context.band);
  if (mode === 'prime') {
    const values = level === 0 ? [84, 90, 96, 108] : level === 1 ? [126, 168, 180, 252, 360] : [420, 504, 630, 756, 924];
    const value = rng.pick(values);
    const answerLatex = primeFactorLatex(value);
    return {
      templateId: 'prime-factorization',
      prompt: [text(`Write ${value} as a product of prime factors.`)],
      answer: [math(answerLatex)],
      answerText: answerLatex.replaceAll('\\times', '×').replaceAll('^{', '^').replaceAll('}', ''),
      responseSpace: 'standard',
      kind: 'direct',
      equipment: [],
      fingerprintPayload: { mode, value },
    };
  }
  const common = rng.pick(level === 0 ? [4, 6, 8] : level === 1 ? [6, 8, 9, 12] : [12, 15, 18, 24]);
  const a = common * rng.int(2, level + 5);
  const b = common * rng.int(level + 4, level + 8);
  const value = mode === 'hcf' ? gcd(a, b) : lcm(a, b);
  const label = mode === 'hcf' ? 'HCF' : 'LCM';
  const prompt = context.style === 'applied'
    ? mode === 'hcf'
      ? [text(`Two ribbons are ${a} cm and ${b} cm long. They must be cut into the longest possible equal pieces with no waste. How long is each piece?`)]
      : [text(`One signal flashes every ${a} seconds and another every ${b} seconds. If they flash together now, after how many seconds will they next flash together?`)]
    : [text(`Find the ${label} of ${a} and ${b}.`)];
  return {
    templateId: `${mode}-${context.style}`,
    prompt,
    answer: [text(String(value)), ...(context.style === 'applied' ? [text(mode === 'hcf' ? ' cm' : ' seconds')] : [])],
    answerText: `${value}${context.style === 'applied' ? (mode === 'hcf' ? ' cm' : ' seconds') : ''}`,
    responseSpace: context.style === 'applied' ? 'large' : 'standard',
    kind: context.style,
    equipment: [],
    fingerprintPayload: { mode, a, b, style: context.style },
  };
}

function generatePowersRoots(
  context: GenerationContext,
  rng: SeededRandom,
  mode: 'square' | 'cube' | 'square-root' | 'cube-root',
): DraftQuestion {
  const level = bandValue(context.band);
  const isCube = mode === 'cube' || mode === 'cube-root';
  const base = isCube ? rng.int(3, level === 2 ? 14 : 10) : rng.int(8, level === 2 ? 30 : 20);
  const value = isCube ? base ** 3 : base ** 2;
  if (mode === 'square-root' || mode === 'cube-root') {
    return {
      templateId: mode === 'cube-root' ? 'exact-cube-root' : 'exact-square-root',
      prompt: [text('Find '), math(mode === 'cube-root' ? `\\sqrt[3]{${value}}` : `\\sqrt{${value}}`), text('.')],
      answer: [math(String(base))],
      answerText: String(base),
      responseSpace: 'compact',
      kind: 'direct',
      equipment: [],
      fingerprintPayload: { mode, value },
    };
  }
  const exponent = mode === 'cube' ? 3 : 2;
  return {
    templateId: `${mode}-${context.style}`,
    prompt: context.style === 'applied' && mode === 'square'
      ? [text(`A square courtyard has side length ${base} m. Find its area.`)]
      : [text('Calculate '), math(`${base}^{${exponent}}`), text('.')],
    answer: [text(`${number(value)}${context.style === 'applied' && mode === 'square' ? ' m²' : ''}`)],
    answerText: `${number(value)}${context.style === 'applied' && mode === 'square' ? ' m²' : ''}`,
    responseSpace: context.style === 'applied' ? 'standard' : 'compact',
    kind: context.style,
    equipment: [],
    fingerprintPayload: { mode, base, style: context.style },
  };
}

function generateFractionEquivalence(
  context: GenerationContext,
  rng: SeededRandom,
  mode: 'equivalence' | 'simplify' | 'compare' | 'mixed-improper',
): DraftQuestion {
  const level = bandValue(context.band);
  const denominator = rng.int(level === 0 ? 3 : 5, level === 2 ? 15 : 12);
  const numerator = rng.int(1, denominator - 1);
  const multiplier = rng.int(2, level + 4);
  if (mode === 'simplify') {
    const scaledNumerator = numerator * multiplier;
    const scaledDenominator = denominator * multiplier;
    const result = fractionAnswer(scaledNumerator, scaledDenominator);
    return {
      templateId: `fraction-simplify-${context.style}`,
      prompt: context.style === 'applied'
        ? [text('A fraction card shows '), math(fractionLatex(scaledNumerator, scaledDenominator)), text('. Write the fraction in its simplest form.')]
        : [text('Simplify '), math(fractionLatex(scaledNumerator, scaledDenominator)), text('.')],
      answer: result.segments,
      answerText: result.answerText,
      responseSpace: 'standard',
      kind: context.style,
      equipment: [],
      fingerprintPayload: { mode, scaledNumerator, scaledDenominator },
    };
  }
  if (mode === 'compare') {
    const d2 = denominator + rng.int(1, level + 4);
    let n2 = rng.int(1, d2 - 1);
    if (numerator * d2 === n2 * denominator) n2 = Math.min(d2 - 1, n2 + 1);
    const leftValue = numerator / denominator;
    const rightValue = n2 / d2;
    const symbol = leftValue < rightValue ? '<' : '>';
    return {
      templateId: `fraction-compare-${context.style}`,
      prompt: context.style === 'applied'
        ? [text('Mina completed '), math(fractionLatex(numerator, denominator)), text(' of a task and Jo completed '), math(fractionLatex(n2, d2)), text('. Who completed the greater fraction?')]
        : [text('Insert '), math('<'), text(' or '), math('>'), text(': '), math(`${fractionLatex(numerator, denominator)} \\square ${fractionLatex(n2, d2)}`)],
      answer: context.style === 'applied'
        ? [text(leftValue > rightValue ? 'Mina' : 'Jo')]
        : [math(symbol)],
      answerText: context.style === 'applied' ? (leftValue > rightValue ? 'Mina' : 'Jo') : symbol,
      responseSpace: 'standard',
      kind: context.style,
      equipment: [],
      fingerprintPayload: { mode, numerator, denominator, n2, d2 },
    };
  }
  if (mode === 'mixed-improper') {
    const whole = rng.int(1, level === 2 ? 8 : 5);
    const properNumerator = rng.int(1, denominator - 1);
    const improperNumerator = whole * denominator + properNumerator;
    const toImproper = rng.bool();
    return {
      templateId: `fraction-${toImproper ? 'mixed-to-improper' : 'improper-to-mixed'}-${context.style}`,
      prompt: toImproper
        ? [text('Write '), math(`${whole}${fractionLatex(properNumerator, denominator)}`), text(' as an improper fraction.')]
        : [text('Write '), math(fractionLatex(improperNumerator, denominator)), text(' as a mixed number.')],
      answer: toImproper
        ? [math(fractionLatex(improperNumerator, denominator))]
        : [math(`${whole}${fractionLatex(properNumerator, denominator)}`)],
      answerText: toImproper ? `${improperNumerator}/${denominator}` : `${whole} ${properNumerator}/${denominator}`,
      responseSpace: 'standard',
      kind: 'direct',
      equipment: [],
      fingerprintPayload: { mode, whole, properNumerator, denominator, toImproper },
    };
  }
  const missing = numerator * multiplier;
  const scaledDenominator = denominator * multiplier;
  return {
    templateId: `fraction-equivalence-${context.style}`,
    prompt: context.style === 'applied'
      ? [text('Two students shade equal portions of identical strips. One shades '), math(fractionLatex(numerator, denominator)), text(` and the other divides the strip into ${scaledDenominator} parts. How many parts must the second student shade?`)]
      : [text('Complete: '), math(`${fractionLatex(numerator, denominator)} = ${fractionLatex('\\square', scaledDenominator)}`)],
    answer: [text(String(missing))],
    answerText: String(missing),
    responseSpace: context.style === 'applied' ? 'standard' : 'compact',
    kind: context.style,
    equipment: [],
    fingerprintPayload: { numerator, denominator, multiplier, style: context.style },
  };
}

function generateFractionAddSubtract(
  context: GenerationContext,
  rng: SeededRandom,
  operation: 'add' | 'subtract',
  denominatorType: 'like' | 'unlike',
): DraftQuestion {
  const level = bandValue(context.band);
  const denominators = level === 0 ? [4, 6, 8, 10] : level === 1 ? [5, 6, 8, 9, 10, 12] : [7, 8, 9, 11, 12, 15];
  const d1 = rng.pick(denominators);
  let d2 = denominatorType === 'like' ? d1 : rng.pick(denominators);
  if (denominatorType === 'unlike' && d2 === d1) d2 = rng.pick(denominators.filter((value) => value !== d1));
  let n1 = rng.int(1, d1 - 1);
  let n2 = rng.int(1, d2 - 1);
  const common = lcm(d1, d2);
  let resultNumerator = n1 * (common / d1) + (operation === 'add' ? 1 : -1) * n2 * (common / d2);
  if (operation === 'subtract' && resultNumerator <= 0) {
    [n1, n2] = [Math.min(d1 - 1, n2), Math.max(1, Math.min(d2 - 1, n1))];
    resultNumerator = n1 * (common / d1) - n2 * (common / d2);
    if (resultNumerator <= 0) return generateFractionAddSubtract(
      { ...context, attempt: context.attempt + 101 },
      generationRandom({ ...context, attempt: context.attempt + 101 }),
      operation,
      denominatorType,
    );
  }
  const result = fractionAnswer(resultNumerator, common);
  const symbol = operation === 'add' ? '+' : '-';
  const prompt = context.style === 'applied'
    ? operation === 'add'
      ? [text('A craft project used '), math(fractionLatex(n1, d1)), text(' m of ribbon in the morning and '), math(fractionLatex(n2, d2)), text(' m in the afternoon. How much ribbon was used altogether?')]
      : [text('One piece of ribbon is '), math(fractionLatex(n1, d1)), text(' m long and another is '), math(fractionLatex(n2, d2)), text(' m long. What is the difference between their lengths?')]
    : [math(`${fractionLatex(n1, d1)} ${symbol} ${fractionLatex(n2, d2)}`)];
  return {
    templateId: `fraction-${operation}-${context.style}`,
    prompt,
    answer: result.segments,
    answerText: result.answerText,
    responseSpace: context.style === 'applied' ? 'large' : 'standard',
    kind: context.style,
    equipment: [],
    fingerprintPayload: { operation, n1, d1, n2, d2, style: context.style },
  };
}

function generateFractionMultiplyDivide(
  context: GenerationContext,
  rng: SeededRandom,
  operation: 'quantity' | 'multiply' | 'divide',
): DraftQuestion {
  const level = bandValue(context.band);
  if (operation === 'quantity') {
    const denominator = rng.int(3, level === 2 ? 12 : 9);
    const numerator = rng.int(1, denominator - 1);
    const unit = rng.int(4, 15);
    const quantity = denominator * unit;
    const result = numerator * unit;
    return {
      templateId: `fraction-of-quantity-${context.style}`,
      prompt: context.style === 'applied'
        ? [text('A container holds '), math(`${quantity}`), text(' litres when full. It is '), math(fractionLatex(numerator, denominator)), text(' full. How many litres does it contain?')]
        : [text('Find '), math(fractionLatex(numerator, denominator)), text(` of ${quantity}.`)],
      answer: [text(`${result}${context.style === 'applied' ? ' litres' : ''}`)],
      answerText: `${result}${context.style === 'applied' ? ' litres' : ''}`,
      responseSpace: context.style === 'applied' ? 'large' : 'standard',
      kind: context.style,
      equipment: [],
      fingerprintPayload: { operation, numerator, denominator, quantity, style: context.style },
    };
  }
  const d1 = rng.int(3, level === 2 ? 12 : 9);
  const d2 = rng.int(3, level === 2 ? 12 : 9);
  const n1 = rng.int(1, d1 - 1);
  const n2 = rng.int(1, d2 - 1);
  const result = operation === 'multiply'
    ? fractionAnswer(n1 * n2, d1 * d2)
    : fractionAnswer(n1 * d2, d1 * n2);
  const prompt = context.style === 'applied'
    ? operation === 'multiply'
      ? [text('A gardener uses '), math(fractionLatex(n1, d1)), text(' of a plot for vegetables and plants '), math(fractionLatex(n2, d2)), text(' of that area with beans. What fraction of the whole plot has beans?')]
      : [text('A ribbon is '), math(fractionLatex(n1, d1)), text(' m long. Pieces of length '), math(fractionLatex(n2, d2)), text(' m are cut from it. How many such pieces is this equivalent to?')]
    : [math(`${fractionLatex(n1, d1)} ${operation === 'multiply' ? '\\times' : '\\div'} ${fractionLatex(n2, d2)}`)];
  return {
    templateId: `fraction-${operation}-${context.style}`,
    prompt,
    answer: result.segments,
    answerText: result.answerText,
    responseSpace: context.style === 'applied' ? 'large' : 'standard',
    kind: context.style,
    equipment: [],
    fingerprintPayload: { operation, n1, d1, n2, d2, style: context.style },
  };
}

function generateDecimalUnderstanding(
  context: GenerationContext,
  rng: SeededRandom,
  mode: 'place-value' | 'compare-round' | 'fraction-decimal',
): DraftQuestion {
  const level = bandValue(context.band);
  if (mode === 'fraction-decimal') {
    const pairs = [
      [1, 2, '0.5'], [1, 4, '0.25'], [3, 4, '0.75'], [1, 5, '0.2'], [2, 5, '0.4'],
      [3, 5, '0.6'], [4, 5, '0.8'], [1, 8, '0.125'], [3, 8, '0.375'], [5, 8, '0.625'], [7, 8, '0.875'],
    ] as const;
    const [numerator, denominator, decimal] = rng.pick(level === 0 ? pairs.slice(0, 7) : pairs);
    const toDecimal = rng.bool();
    return {
      templateId: `fraction-decimal-${toDecimal ? 'to-decimal' : 'to-fraction'}-${context.style}`,
      prompt: toDecimal
        ? [text('Write '), math(fractionLatex(numerator, denominator)), text(' as a decimal.')]
        : [text(`Write ${decimal} as a fraction in simplest form.`)],
      answer: toDecimal ? [text(decimal)] : [math(fractionLatex(numerator, denominator))],
      answerText: toDecimal ? decimal : `${numerator}/${denominator}`,
      responseSpace: 'compact',
      kind: 'direct',
      equipment: [],
      fingerprintPayload: { mode, numerator, denominator, toDecimal },
    };
  }
  const decimalPlaces = level === 0 ? 2 : level === 1 ? 3 : 4;
  const scale = 10 ** decimalPlaces;
  const valueInt = rng.int(scale, scale * 100 - 1);
  const value = (valueInt / scale).toFixed(decimalPlaces);
  if (mode === 'place-value') {
    const placeIndex = rng.int(1, decimalPlaces);
    const digit = value.split('.')[1][placeIndex - 1];
    const names = ['tenths', 'hundredths', 'thousandths', 'ten-thousandths'];
    return {
      templateId: `decimal-place-value-${context.style}`,
      prompt: [text(`In ${value}, which digit is in the ${names[placeIndex - 1]} place, and what value does it represent?`)],
      answer: [text(`${digit}; ${Number(digit) / (10 ** placeIndex)}`)],
      answerText: `${digit}; ${Number(digit) / (10 ** placeIndex)}`,
      responseSpace: 'standard',
      kind: context.style,
      equipment: [],
      fingerprintPayload: { mode, value, placeIndex },
    };
  }
  const places = level === 0 ? 1 : level === 1 ? 2 : 3;
  const rounded = Number(value).toFixed(places);
  return {
    templateId: `decimal-round-${context.style}`,
    prompt: context.style === 'applied'
      ? [text(`A measurement is ${value} m. Round it to ${places} decimal ${places === 1 ? 'place' : 'places'}.`)]
      : [text(`Round ${value} to ${places} decimal ${places === 1 ? 'place' : 'places'}.`)],
    answer: [text(rounded)],
    answerText: rounded,
    responseSpace: 'compact',
    kind: context.style,
    equipment: [],
    fingerprintPayload: { mode, value, places },
  };
}

function generateDecimalOperations(
  context: GenerationContext,
  rng: SeededRandom,
  operation: 'add' | 'subtract' | 'multiply' | 'divide',
): DraftQuestion {
  const level = bandValue(context.band);
  if (operation === 'multiply') {
    const a = rng.int(120, level === 2 ? 9999 : 2499) / 10;
    const b = level === 0 ? rng.int(2, 9) : rng.int(12, level === 2 ? 99 : 45) / 10;
    const result = Number((a * b).toFixed(4));
    return {
      templateId: `decimal-multiply-${context.style}`,
      prompt: context.style === 'applied'
        ? [text(`A roll contains ${a} m of fabric. A workshop uses ${b} rolls. How many metres of fabric is that altogether?`)]
        : [math(`${a} \\times ${b}`)],
      answer: [text(`${result}${context.style === 'applied' ? ' m' : ''}`)],
      answerText: `${result}${context.style === 'applied' ? ' m' : ''}`,
      responseSpace: 'large',
      kind: context.style,
      equipment: [],
      fingerprintPayload: { operation, a, b, style: context.style },
    };
  }
  if (operation === 'divide') {
    const divisor = level === 0 ? rng.int(2, 9) : rng.int(12, level === 2 ? 75 : 35) / 10;
    const quotient = rng.int(25, level === 2 ? 999 : 400) / 10;
    const dividend = Number((divisor * quotient).toFixed(3));
    return {
      templateId: `decimal-divide-${context.style}`,
      prompt: context.style === 'applied'
        ? [text(`${dividend} litres are shared equally into portions of ${divisor} litres. How many portions is this equivalent to?`)]
        : [math(`${dividend} \\div ${divisor}`)],
      answer: [text(String(quotient))],
      answerText: String(quotient),
      responseSpace: 'large',
      kind: context.style,
      equipment: [],
      fingerprintPayload: { operation, dividend, divisor, quotient, style: context.style },
    };
  }
  const scale = level === 0 ? 10 : 100;
  const aInt = rng.int(100, level === 2 ? 99_999 : 9999);
  const bInt = rng.int(10, Math.max(20, Math.floor(aInt * 0.7)));
  const a = aInt / scale;
  const b = bInt / scale;
  const larger = Math.max(a, b);
  const smaller = Math.min(a, b);
  const result = operation === 'add' ? larger + smaller : larger - smaller;
  const resultText = result.toFixed(level === 0 ? 1 : 2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
  const symbol = operation === 'add' ? '+' : '-';
  return {
    templateId: `decimal-${operation}-${context.style}`,
    prompt: context.style === 'applied'
      ? [text(operation === 'add'
        ? `A laboratory used ${larger.toFixed(2)} litres of solution and then used another ${smaller.toFixed(2)} litres. How much was used altogether?`
        : `A laboratory had ${larger.toFixed(2)} litres of solution. After an experiment, ${smaller.toFixed(2)} litres remained. How much solution was used?`)]
      : [math(`${larger} ${symbol} ${smaller}`)],
    answer: [text(`${resultText}${context.style === 'applied' ? ' litres' : ''}`)],
    answerText: `${resultText}${context.style === 'applied' ? ' litres' : ''}`,
    responseSpace: context.style === 'applied' ? 'large' : 'standard',
    kind: context.style,
    equipment: [],
    fingerprintPayload: { operation, larger, smaller, style: context.style },
  };
}

function generateRatioPercentage(
  context: GenerationContext,
  rng: SeededRandom,
  mode: 'ratio-simplify' | 'ratio-share' | 'percentage' | 'conversion' | 'proportion',
): DraftQuestion {
  const level = bandValue(context.band);
  if (mode === 'percentage') {
    const percent = rng.pick(level === 0 ? [10, 25, 50] : level === 1 ? [5, 10, 20, 25, 40, 50, 75] : [12.5, 15, 35, 62.5, 75]);
    const base = percent === 12.5 || percent === 62.5 ? rng.int(4, 30) * 8 : rng.int(4, 80) * 20;
    const result = (base * percent) / 100;
    return {
      templateId: `percentage-${context.style}`,
      prompt: context.style === 'applied'
        ? [text(`A school has ${number(base)} students. ${percent}% travel by bus. How many students travel by bus?`)]
        : [text(`Find ${percent}% of ${number(base)}.`)],
      answer: [text(number(result))],
      answerText: number(result),
      responseSpace: context.style === 'applied' ? 'large' : 'standard',
      kind: context.style,
      equipment: [],
      fingerprintPayload: { mode, percent, base, style: context.style },
    };
  }
  if (mode === 'conversion') {
    const pairs = [
      [1, 2, '0.5', '50%'], [1, 4, '0.25', '25%'], [3, 4, '0.75', '75%'],
      [1, 5, '0.2', '20%'], [2, 5, '0.4', '40%'], [3, 5, '0.6', '60%'],
      [1, 8, '0.125', '12.5%'], [3, 8, '0.375', '37.5%'], [5, 8, '0.625', '62.5%'],
    ] as const;
    const [numerator, denominator, decimal, percentage] = rng.pick(level === 0 ? pairs.slice(0, 6) : pairs);
    const source = rng.pick(['fraction', 'decimal', 'percentage'] as const);
    const sourceText = source === 'fraction' ? fractionLatex(numerator, denominator) : source === 'decimal' ? decimal : percentage;
    return {
      templateId: `fraction-decimal-percentage-from-${source}`,
      prompt: [text('Complete the three equivalent forms: '), ...(source === 'fraction' ? [math(sourceText)] : [text(sourceText)]), text(' = ___ as a decimal = ___ as a percentage.')],
      answer: [math(fractionLatex(numerator, denominator)), text(` = ${decimal} = ${percentage}`)],
      answerText: `${numerator}/${denominator} = ${decimal} = ${percentage}`,
      responseSpace: 'standard',
      kind: 'direct',
      equipment: [],
      fingerprintPayload: { mode, numerator, denominator, source },
    };
  }
  if (mode === 'proportion') {
    const unitAmount = rng.int(level === 0 ? 2 : 4, level === 2 ? 45 : 20);
    const firstUnits = rng.int(2, 8);
    const secondUnits = rng.int(firstUnits + 1, firstUnits + 8);
    const firstAmount = unitAmount * firstUnits;
    const secondAmount = unitAmount * secondUnits;
    return {
      templateId: `direct-proportion-${context.style}`,
      prompt: context.style === 'applied'
        ? [text(`${firstUnits} identical notebooks cost ₹${firstAmount}. At the same price per notebook, how much will ${secondUnits} notebooks cost?`)]
        : [text(`If ${firstUnits} units correspond to ${firstAmount}, find the value corresponding to ${secondUnits} units at the same rate.`)],
      answer: [text(context.style === 'applied' ? `₹${secondAmount}` : String(secondAmount))],
      answerText: context.style === 'applied' ? `₹${secondAmount}` : String(secondAmount),
      responseSpace: 'large',
      kind: context.style,
      equipment: [],
      fingerprintPayload: { mode, unitAmount, firstUnits, secondUnits },
    };
  }
  const first = rng.int(2, level + 6);
  const second = rng.int(first + 1, first + level + 6);
  if (mode === 'ratio-simplify') {
    const multiplier = rng.int(2, level + 6);
    const left = first * multiplier;
    const right = second * multiplier;
    return {
      templateId: `ratio-simplify-${context.style}`,
      prompt: context.style === 'applied'
        ? [text(`A mixture uses ${left} scoops of sand for every ${right} scoops of gravel. Write this ratio in its simplest form.`)]
        : [text(`Simplify the ratio ${left}:${right}.`)],
      answer: [text(`${first}:${second}`)],
      answerText: `${first}:${second}`,
      responseSpace: 'standard',
      kind: context.style,
      equipment: [],
      fingerprintPayload: { mode, first, second, multiplier },
    };
  }
  const groups = rng.int(3, 12);
  const total = (first + second) * groups;
  return {
    templateId: `ratio-share-${context.style}`,
    prompt: context.style === 'applied'
      ? [text(`The ratio of red to blue flags is ${first}:${second}. There are ${total} flags altogether. How many are red and how many are blue?`)]
      : [text(`Divide ${total} in the ratio ${first}:${second}.`)],
    answer: [text(`${first * groups} and ${second * groups}`)],
    answerText: `${first * groups} and ${second * groups}`,
    responseSpace: context.style === 'applied' ? 'large' : 'standard',
    kind: context.style,
    equipment: [],
    fingerprintPayload: { mode, first, second, total, style: context.style },
  };
}

function generateScientificNotation(context: GenerationContext, rng: SeededRandom): DraftQuestion {
  const level = bandValue(context.band);
  const exponent = rng.int(level === 0 ? 3 : 4, level === 2 ? 9 : 7);
  const coefficientTenths = rng.int(11, 99);
  const coefficient = coefficientTenths / 10;
  const ordinary = coefficient * 10 ** exponent;
  const toScientific = rng.bool();
  const prompt = toScientific
    ? [text(`Write ${number(ordinary)} in scientific notation.`)]
    : [text('Write '), math(`${coefficient} \\times 10^{${exponent}}`), text(' as an ordinary number.')];
  const answer = toScientific
    ? [math(`${coefficient} \\times 10^{${exponent}}`)]
    : [text(number(ordinary))];
  const answerText = toScientific ? `${coefficient} × 10^${exponent}` : number(ordinary);
  return {
    templateId: toScientific ? 'to-scientific' : 'from-scientific',
    prompt,
    answer,
    answerText,
    responseSpace: 'standard',
    kind: 'direct',
    equipment: [],
    fingerprintPayload: { toScientific, coefficient, exponent },
  };
}

function generateUnitTime(
  context: GenerationContext,
  rng: SeededRandom,
  mode: 'length' | 'mass-capacity' | 'time' | 'temperature',
): DraftQuestion {
  const level = bandValue(context.band);
  if (mode === 'time') {
    const startHour = rng.int(7, 15);
    const startMinute = rng.pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50]);
    const duration = rng.pick(level === 0 ? [25, 35, 45, 55] : [65, 75, 95, 125]);
    const startTotal = startHour * 60 + startMinute;
    const finishTotal = startTotal + duration;
    const finishHour = Math.floor(finishTotal / 60) % 24;
    const finishMinute = finishTotal % 60;
    const start = `${startHour}:${String(startMinute).padStart(2, '0')}`;
    const finish = `${finishHour}:${String(finishMinute).padStart(2, '0')}`;
    return {
      templateId: `elapsed-time-${context.style}`,
      prompt: [text(`A lesson starts at ${start} and lasts ${duration} minutes. At what time does it finish?`)],
      answer: [text(finish)],
      answerText: finish,
      responseSpace: 'standard',
      kind: 'applied',
      equipment: [],
      fingerprintPayload: { mode, start, duration },
    };
  }
  if (mode === 'temperature') {
    const start = rng.int(-12, 18);
    const change = rng.int(7, level === 2 ? 28 : 18);
    const rises = rng.bool();
    const result = rises ? start + change : start - change;
    return {
      templateId: `temperature-change-${context.style}`,
      prompt: [text(`The temperature is ${start}°C. It ${rises ? 'rises' : 'falls'} by ${change}°C. What is the new temperature?`)],
      answer: [text(`${result}°C`)],
      answerText: `${result}°C`,
      responseSpace: 'standard',
      kind: 'applied',
      equipment: [],
      fingerprintPayload: { mode, start, change, rises },
    };
  }
  if (mode === 'mass-capacity') {
    const isMass = rng.bool();
    const whole = rng.int(1, level === 2 ? 85 : 35);
    const small = rng.int(1, 999);
    const total = whole * 1000 + small;
    const largeUnit = isMass ? 'kg' : 'l';
    const smallUnit = isMass ? 'g' : 'ml';
    return {
      templateId: `metric-${isMass ? 'mass' : 'capacity'}-${context.style}`,
      prompt: context.style === 'applied'
        ? [text(`A container holds ${whole} ${largeUnit} ${small} ${smallUnit}. Express this entirely in ${smallUnit}.`)]
        : [text(`Convert ${whole} ${largeUnit} ${small} ${smallUnit} to ${smallUnit}.`)],
      answer: [text(`${number(total)} ${smallUnit}`)],
      answerText: `${number(total)} ${smallUnit}`,
      responseSpace: 'standard',
      kind: context.style,
      equipment: [],
      fingerprintPayload: { mode, isMass, whole, small },
    };
  }
  const metres = rng.int(2, level === 2 ? 95 : 40);
  const centimetres = rng.int(1, 99);
  const totalCm = metres * 100 + centimetres;
  return {
    templateId: `metric-length-${context.style}`,
    prompt: context.style === 'applied'
      ? [text(`A rope is ${metres} m ${centimetres} cm long. Express its length entirely in centimetres.`)]
      : [text(`Convert ${metres} m ${centimetres} cm to centimetres.`)],
    answer: [text(`${number(totalCm)} cm`)],
    answerText: `${number(totalCm)} cm`,
    responseSpace: context.style === 'applied' ? 'standard' : 'compact',
    kind: context.style,
    equipment: [],
    fingerprintPayload: { mode, metres, centimetres, style: context.style },
  };
}

function generatePerimeterArea(
  context: GenerationContext,
  rng: SeededRandom,
  mode: 'perimeter' | 'rectangle-area' | 'triangle-area',
): DraftQuestion {
  const level = bandValue(context.band);
  if (mode === 'triangle-area') {
    const base = rng.int(8, 30);
    const height = rng.int(5, 20);
    const area = (base * height) / 2;
    return {
      templateId: `triangle-area-${context.style}`,
      prompt: [text(`${context.style === 'applied' ? 'A triangular banner' : 'A triangle'} has a base of ${base} cm and a perpendicular height of ${height} cm. Find its area.`)],
      answer: [text(`${area} cm²`)],
      answerText: `${area} cm²`,
      responseSpace: context.style === 'applied' ? 'large' : 'standard',
      kind: context.style,
      equipment: [],
      fingerprintPayload: { mode, base, height, style: context.style },
    };
  }
  const length = rng.int(12, level === 2 ? 85 : 45);
  const width = rng.int(5, length - 2);
  const askArea = mode === 'rectangle-area';
  const result = askArea ? length * width : 2 * (length + width);
  const unit = askArea ? 'm²' : 'm';
  return {
    templateId: `rectangle-${askArea ? 'area' : 'perimeter'}-${context.style}`,
    prompt: [text(`${context.style === 'applied' ? 'A rectangular garden' : 'A rectangle'} is ${length} m long and ${width} m wide. Find its ${askArea ? 'area' : 'perimeter'}.`) ],
    answer: [text(`${number(result)} ${unit}`)],
    answerText: `${number(result)} ${unit}`,
    responseSpace: context.style === 'applied' ? 'large' : 'standard',
    kind: context.style,
    equipment: [],
    fingerprintPayload: { mode, length, width, askArea, style: context.style },
  };
}

function angleType(degrees: number): string {
  if (degrees < 90) return 'acute';
  if (degrees === 90) return 'right';
  if (degrees < 180) return 'obtuse';
  if (degrees === 180) return 'straight';
  return 'reflex';
}

function generateAngleFacts(
  context: GenerationContext,
  rng: SeededRandom,
  mode: 'types' | 'relationships' | 'draw',
): DraftQuestion {
  const level = bandValue(context.band);
  if (mode === 'draw') {
    const degrees = rng.int(level === 0 ? 25 : 15, level === 2 ? 320 : 165);
    const safeDegrees = degrees === 90 || degrees === 180 ? degrees + 5 : degrees;
    return {
      templateId: 'draw-angle-text-only',
      prompt: [text(`Use a protractor to draw and label a ${safeDegrees}° ${angleType(safeDegrees)} angle.`)],
      answer: [text(`A correctly measured and labelled ${safeDegrees}° ${angleType(safeDegrees)} angle.`)],
      answerText: `Correct ${safeDegrees}° ${angleType(safeDegrees)} angle`,
      responseSpace: 'large',
      kind: 'drawing',
      equipment: ['protractor', 'ruler'],
      fingerprintPayload: { mode: 'draw', degrees: safeDegrees },
    };
  }
  if (mode === 'types') {
    const degrees = rng.pick([35, 55, 90, 115, 145, 180, 225, 300]);
    return {
      templateId: 'classify-angle-text-only',
      prompt: [text(`An angle measures ${degrees}°. Classify it as acute, right, obtuse, straight or reflex.`)],
      answer: [text(angleType(degrees))],
      answerText: angleType(degrees),
      responseSpace: 'compact',
      kind: 'direct',
      equipment: [],
      fingerprintPayload: { mode: 'classify', degrees },
    };
  }
  const relation = rng.bool() ? 'complementary' : 'supplementary';
  const total = relation === 'complementary' ? 90 : 180;
  const known = rng.int(20, total - 20);
  const missing = total - known;
  return {
    templateId: `${relation}-angle-text-only`,
    prompt: [text(`Two angles are ${relation}. One angle measures ${known}°. Find the other angle.`)],
    answer: [text(`${missing}°`)],
    answerText: `${missing}°`,
    responseSpace: context.style === 'applied' ? 'standard' : 'compact',
    kind: context.style,
    equipment: [],
    fingerprintPayload: { mode: relation, known },
  };
}

function generateLinesPolygons(
  context: GenerationContext,
  rng: SeededRandom,
  mode: 'lines' | 'polygon-names' | 'polygon-properties',
): DraftQuestion {
  const level = bandValue(context.band);
  if (mode === 'lines') {
    const relationship = rng.pick(level === 0
      ? ['parallel', 'perpendicular', 'intersecting'] as const
      : ['parallel', 'perpendicular', 'intersecting', 'segment', 'ray'] as const);
    const answers: Record<typeof relationship, string> = {
      parallel: 'Parallel lines remain the same distance apart and never meet.',
      perpendicular: 'Perpendicular lines meet at a right angle.',
      intersecting: 'Intersecting lines cross at a common point.',
      segment: 'A line segment has two endpoints.',
      ray: 'A ray has one endpoint and continues in one direction.',
    };
    return {
      templateId: `line-relationship-${relationship}-${context.style}`,
      prompt: context.style === 'applied'
        ? [text(`Write the defining property of ${relationship} lines, then draw a labelled example.`)]
        : [text(`State the defining property of a ${relationship}.`)],
      answer: [text(answers[relationship])],
      answerText: answers[relationship],
      responseSpace: context.style === 'applied' ? 'large' : 'standard',
      kind: context.style === 'applied' ? 'drawing' : 'explanation',
      equipment: context.style === 'applied' ? ['ruler'] : [],
      fingerprintPayload: { mode, relationship, style: context.style },
    };
  }
  const polygons = [
    [3, 'triangle'],
    [4, 'quadrilateral'],
    [5, 'pentagon'],
    [6, 'hexagon'],
    [7, 'heptagon'],
    [8, 'octagon'],
    [9, 'nonagon'],
    [10, 'decagon'],
  ] as const;
  const [sides, name] = rng.pick(polygons.slice(0, level === 0 ? 4 : level === 1 ? 6 : 8));
  if (mode === 'polygon-properties') {
    const diagonals = (sides * (sides - 3)) / 2;
    return {
      templateId: `polygon-properties-${context.style}`,
      prompt: context.style === 'applied'
        ? [text(`Draw and label a ${name}. Mark one diagonal and state how many diagonals the polygon has altogether.`)]
        : [text(`How many diagonals does a ${name} have? State whether every ${name} must be regular.`)],
      answer: [text(`${diagonals} diagonals; it may be regular or irregular.`)],
      answerText: `${diagonals} diagonals; may be regular or irregular`,
      responseSpace: context.style === 'applied' ? 'large' : 'standard',
      kind: context.style === 'applied' ? 'drawing' : 'explanation',
      equipment: context.style === 'applied' ? ['ruler'] : [],
      fingerprintPayload: { mode, sides, style: context.style },
    };
  }
  return {
    templateId: 'name-polygon-text-only',
    prompt: [text(`Name a polygon with ${sides} sides, and state whether every ${name} must be regular.`)],
    answer: [text(`${name}; no, it may be regular or irregular.`)],
    answerText: `${name}; it may be regular or irregular`,
    responseSpace: 'standard',
    kind: 'explanation',
    equipment: [],
    fingerprintPayload: { mode: 'name', sides },
  };
}

function generateDataAverages(
  context: GenerationContext,
  rng: SeededRandom,
  mode: 'mean' | 'median' | 'mode' | 'range',
): DraftQuestion {
  const level = bandValue(context.band);
  const mean = rng.int(8, level === 2 ? 60 : 35);
  const offsets = level === 0 ? [-4, -2, 0, 2, 4] : level === 1 ? [-7, -3, 0, 4, 6] : [-12, -5, -1, 7, 11];
  let values = rng.shuffle(offsets.map((offset) => mean + offset));
  let result = mean;
  if (mode === 'median') {
    const ordered = offsets.map((offset) => mean + offset).sort((left, right) => left - right);
    values = rng.shuffle(ordered);
    result = ordered[Math.floor(ordered.length / 2)];
  } else if (mode === 'mode') {
    const repeated = mean + rng.pick([-3, -1, 2, 4]);
    values = rng.shuffle([repeated, repeated, mean - 7, mean + 6, mean + 11]);
    result = repeated;
  } else if (mode === 'range') {
    const ordered = offsets.map((offset) => mean + offset).sort((left, right) => left - right);
    values = rng.shuffle(ordered);
    result = ordered[ordered.length - 1] - ordered[0];
  }
  const label = mode === 'mean' ? 'mean' : mode;
  return {
    templateId: `${mode}-${context.style}`,
    prompt: context.style === 'applied'
      ? [text(`Five teams collected ${values.join(', ')} cans. Find the ${label} of the data.`)]
      : [text(`Find the ${label} of ${values.join(', ')}.`)],
    answer: [text(String(result))],
    answerText: String(result),
    responseSpace: context.style === 'applied' ? 'large' : 'standard',
    kind: context.style,
    equipment: [],
    fingerprintPayload: { mode, values, style: context.style },
  };
}

function generateIntegerOperations(
  context: GenerationContext,
  rng: SeededRandom,
  mode: 'add-subtract' | 'multiply-divide',
): DraftQuestion {
  const level = bandValue(context.band);
  if (mode === 'multiply-divide') {
    const left = rng.int(3, 12 + level * 6) * (rng.bool() ? 1 : -1);
    const right = rng.int(2, 9 + level * 3) * (rng.bool() ? 1 : -1);
    const multiply = rng.bool();
    const dividend = left * right;
    const stageCount = Math.abs(right);
    const appliedDividend = left * stageCount;
    const result = context.style === 'applied'
      ? (multiply ? appliedDividend : left)
      : (multiply ? dividend : left);
    return {
      templateId: `integer-${multiply ? 'multiply' : 'divide'}-${context.style}`,
      prompt: context.style === 'applied'
        ? multiply
          ? [text(`A lift changes height by ${left} m on each of ${stageCount} identical stages. Represent the total signed change in height.`)]
          : [text(`A lift changes height by ${appliedDividend} m over ${stageCount} identical stages. Represent the signed change in each stage.`)]
        : [text('Calculate: '), math(multiply ? `${left} \\times ${right}` : `${dividend} \\div ${right}`)],
      answer: [text(String(result))],
      answerText: String(result),
      responseSpace: context.style === 'applied' ? 'standard' : 'compact',
      kind: context.style,
      equipment: [],
      fingerprintPayload: { mode, left, right, multiply, style: context.style },
    };
  }
  const start = rng.int(-25 - level * 20, 20 + level * 20);
  const change = rng.int(8, 25 + level * 15);
  const rises = rng.bool();
  const secondChange = rng.int(4, 15 + level * 10);
  const secondRises = rng.bool();
  const firstResult = rises ? start + change : start - change;
  const result = context.style === 'applied'
    ? firstResult
    : secondRises ? firstResult + secondChange : firstResult - secondChange;
  return {
    templateId: `integer-change-${context.style}`,
    prompt: context.style === 'applied'
      ? [text(`The temperature starts at ${start}°C and ${rises ? 'rises' : 'falls'} by ${change}°C. What is the final temperature?`)]
      : [text('Calculate: '), math(`${start} ${rises ? '+' : '-'} ${change} ${secondRises ? '+' : '-'} ${secondChange}`)],
    answer: [text(`${result}${context.style === 'applied' ? '°C' : ''}`)],
    answerText: `${result}${context.style === 'applied' ? '°C' : ''}`,
    responseSpace: context.style === 'applied' ? 'standard' : 'compact',
    kind: context.style,
    equipment: [],
    fingerprintPayload: { start, change, rises, secondChange, secondRises, style: context.style },
  };
}

function generateIntroEquations(
  context: GenerationContext,
  rng: SeededRandom,
  mode: 'one-step' | 'two-step',
): DraftQuestion {
  const level = bandValue(context.band);
  const solution = rng.int(4, 30 + level * 20);
  const coefficient = mode === 'one-step' && rng.bool() ? 1 : rng.int(2, level === 2 ? 15 : 8);
  const constant = rng.int(5, 35);
  const total = mode === 'one-step'
    ? coefficient === 1 ? solution + constant : coefficient * solution
    : coefficient * solution + constant;
  const equation = mode === 'one-step'
    ? coefficient === 1 ? `x + ${constant} = ${total}` : `${coefficient}x = ${total}`
    : `${coefficient}x + ${constant} = ${total}`;
  return {
    templateId: `${mode}-equation-${context.style}-b${level + 1}`,
    prompt: context.style === 'applied'
      ? [text(mode === 'one-step'
        ? coefficient === 1
          ? `A number increased by ${constant} gives ${total}. Find the number.`
          : `A number multiplied by ${coefficient} gives ${total}. Find the number.`
        : `A number is multiplied by ${coefficient} and then ${constant} is added. The result is ${total}. Find the number.`)]
      : [text('Solve: '), math(equation)],
    answer: [math(`x = ${solution}`)],
    answerText: `x = ${solution}`,
    responseSpace: context.style === 'applied' ? 'large' : 'standard',
    kind: context.style,
    equipment: [],
    fingerprintPayload: { mode, coefficient, constant, total, style: context.style },
  };
}

export function generateDraftQuestion(context: GenerationContext): DraftQuestion {
  const rng = generationRandom(context);
  switch (context.skillId) {
    case 'place-value-digit-value': return generatePlaceValue(context, rng, 'digit');
    case 'place-value-compare-order': return generatePlaceValue(context, rng, 'compare');
    case 'place-value-rounding': return generatePlaceValue(context, rng, 'round');
    case 'scientific-notation': return generateScientificNotation(context, rng);

    case 'written-addition': return generateWrittenAddSubtract(context, rng, 'add');
    case 'written-subtraction': return generateWrittenAddSubtract(context, rng, 'subtract');
    case 'multiplication-one-digit': return generateLongMultiplication(context, rng, 'one-digit');
    case 'long-multiplication': return generateLongMultiplication(context, rng, 'multi-digit');
    case 'division-one-digit': return generateLongDivision(context, rng, 'one-digit');
    case 'long-division': return generateLongDivision(context, rng, 'two-digit');
    case 'division-remainders': return generateLongDivision(context, rng, rng.bool() ? 'one-digit' : 'two-digit', 'required');

    case 'factors': return generateFactorsMultiples(context, rng, 'factors');
    case 'multiples': return generateFactorsMultiples(context, rng, 'multiples');
    case 'prime-composite': return generateFactorsMultiples(context, rng, 'prime-composite');
    case 'divisibility-tests': return generateFactorsMultiples(context, rng, 'divisibility');
    case 'prime-factorization': return generatePrimeHcfLcm(context, rng, 'prime');
    case 'hcf': return generatePrimeHcfLcm(context, rng, 'hcf');
    case 'lcm': return generatePrimeHcfLcm(context, rng, 'lcm');
    case 'squares': return generatePowersRoots(context, rng, 'square');
    case 'cubes': return generatePowersRoots(context, rng, 'cube');
    case 'square-roots': return generatePowersRoots(context, rng, 'square-root');
    case 'cube-roots': return generatePowersRoots(context, rng, 'cube-root');

    case 'fraction-equivalence': return generateFractionEquivalence(context, rng, 'equivalence');
    case 'fraction-simplifying': return generateFractionEquivalence(context, rng, 'simplify');
    case 'fraction-compare-order': return generateFractionEquivalence(context, rng, 'compare');
    case 'mixed-improper-fractions': return generateFractionEquivalence(context, rng, 'mixed-improper');
    case 'fraction-add-like': return generateFractionAddSubtract(context, rng, 'add', 'like');
    case 'fraction-add-unlike': return generateFractionAddSubtract(context, rng, 'add', 'unlike');
    case 'fraction-subtract-like': return generateFractionAddSubtract(context, rng, 'subtract', 'like');
    case 'fraction-subtract-unlike': return generateFractionAddSubtract(context, rng, 'subtract', 'unlike');
    case 'fraction-of-quantity': return generateFractionMultiplyDivide(context, rng, 'quantity');
    case 'fraction-multiply': return generateFractionMultiplyDivide(context, rng, 'multiply');
    case 'fraction-divide': return generateFractionMultiplyDivide(context, rng, 'divide');

    case 'decimal-place-value': return generateDecimalUnderstanding(context, rng, 'place-value');
    case 'decimal-compare-round': return generateDecimalUnderstanding(context, rng, 'compare-round');
    case 'fraction-decimal-conversion': return generateDecimalUnderstanding(context, rng, 'fraction-decimal');
    case 'decimal-addition': return generateDecimalOperations(context, rng, 'add');
    case 'decimal-subtraction': return generateDecimalOperations(context, rng, 'subtract');
    case 'decimal-multiplication': return generateDecimalOperations(context, rng, 'multiply');
    case 'decimal-division': return generateDecimalOperations(context, rng, 'divide');

    case 'ratio-simplifying': return generateRatioPercentage(context, rng, 'ratio-simplify');
    case 'ratio-sharing': return generateRatioPercentage(context, rng, 'ratio-share');
    case 'percentage-of-quantity': return generateRatioPercentage(context, rng, 'percentage');
    case 'fraction-decimal-percentage': return generateRatioPercentage(context, rng, 'conversion');
    case 'direct-proportion': return generateRatioPercentage(context, rng, 'proportion');

    case 'metric-length-conversion': return generateUnitTime(context, rng, 'length');
    case 'mass-capacity-conversion': return generateUnitTime(context, rng, 'mass-capacity');
    case 'elapsed-time': return generateUnitTime(context, rng, 'time');
    case 'temperature-change': return generateUnitTime(context, rng, 'temperature');
    case 'perimeter': return generatePerimeterArea(context, rng, 'perimeter');
    case 'rectangle-area': return generatePerimeterArea(context, rng, 'rectangle-area');
    case 'triangle-area': return generatePerimeterArea(context, rng, 'triangle-area');

    case 'angle-types': return generateAngleFacts(context, rng, 'types');
    case 'angle-relationships': return generateAngleFacts(context, rng, 'relationships');
    case 'draw-angles': return generateAngleFacts(context, rng, 'draw');
    case 'line-types-relationships': return generateLinesPolygons(context, rng, 'lines');
    case 'polygon-names': return generateLinesPolygons(context, rng, 'polygon-names');
    case 'polygon-properties': return generateLinesPolygons(context, rng, 'polygon-properties');

    case 'mean': return generateDataAverages(context, rng, 'mean');
    case 'median': return generateDataAverages(context, rng, 'median');
    case 'mode': return generateDataAverages(context, rng, 'mode');
    case 'range': return generateDataAverages(context, rng, 'range');
    case 'integer-addition-subtraction': return generateIntegerOperations(context, rng, 'add-subtract');
    case 'integer-multiplication-division': return generateIntegerOperations(context, rng, 'multiply-divide');
    case 'one-step-equations': return generateIntroEquations(context, rng, 'one-step');
    case 'two-step-equations': return generateIntroEquations(context, rng, 'two-step');
    default: throw new Error(`No generator is registered for ${context.skillId}.`);
  }
}
