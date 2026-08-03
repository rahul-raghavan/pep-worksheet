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

function generatePlaceValue(context: GenerationContext, rng: SeededRandom): DraftQuestion {
  const level = bandValue(context.band);
  const ranges = [
    [10_000, 99_999],
    [100_000, 9_999_999],
    [10_000_000, 999_999_999],
  ] as const;
  const value = rng.int(ranges[level][0], ranges[level][1]);
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

function generateWrittenAddSubtract(context: GenerationContext, rng: SeededRandom): DraftQuestion {
  const level = bandValue(context.band);
  const min = [1000, 10_000, 100_000][level];
  const max = [9999, 999_999, 9_999_999][level];
  const operation = rng.bool() ? 'add' : 'subtract';
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

function generateLongMultiplication(context: GenerationContext, rng: SeededRandom): DraftQuestion {
  const level = bandValue(context.band);
  const multiplicand = rng.int(1000, 9999);
  const multiplier = level === 0 ? rng.int(2, 9) : level === 1 ? rng.int(11, 99) : rng.int(101, 499);
  const product = multiplicand * multiplier;
  return {
    templateId: `long-multiplication-${context.style}-b${level + 1}`,
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

function generateLongDivision(context: GenerationContext, rng: SeededRandom): DraftQuestion {
  const level = bandValue(context.band);
  const divisor = level === 0 ? rng.int(2, 9) : rng.int(11, level === 1 ? 35 : 75);
  const quotient = level === 2
    ? rng.int(1000, 4999)
    : rng.int(level === 0 ? 500 : 120, 899);
  const remainder = rng.bool(0.55) ? rng.int(1, divisor - 1) : 0;
  const dividend = divisor * quotient + remainder;
  const answerText = remainder === 0 ? number(quotient) : `${number(quotient)} remainder ${remainder}`;
  const answer = remainder === 0
    ? [text(number(quotient))]
    : [math(`${quotient}\\text{ R }${remainder}`)];
  return {
    templateId: `long-division-${context.style}-b${level + 1}`,
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

function generateFactorsMultiples(context: GenerationContext, rng: SeededRandom): DraftQuestion {
  const level = bandValue(context.band);
  const composites = level === 0
    ? [24, 30, 36, 40, 42, 48]
    : level === 1
      ? [54, 60, 72, 84, 90, 96, 108]
      : [120, 132, 144, 168, 180, 210, 252];
  const value = rng.pick(composites);
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

function generatePrimeHcfLcm(context: GenerationContext, rng: SeededRandom): DraftQuestion {
  const level = bandValue(context.band);
  const mode = rng.pick(level === 0 ? ['prime', 'hcf'] as const : ['prime', 'hcf', 'lcm'] as const);
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

function generatePowersRoots(context: GenerationContext, rng: SeededRandom): DraftQuestion {
  const level = bandValue(context.band);
  const mode = rng.pick(['square', 'cube', 'root'] as const);
  const base = mode === 'cube' ? rng.int(3, level === 2 ? 14 : 10) : rng.int(8, level === 2 ? 30 : 20);
  const value = mode === 'cube' ? base ** 3 : base ** 2;
  if (mode === 'root') {
    return {
      templateId: 'exact-square-root',
      prompt: [text('Find '), math(`\\sqrt{${value}}`), text('.')],
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

function generateFractionEquivalence(context: GenerationContext, rng: SeededRandom): DraftQuestion {
  const level = bandValue(context.band);
  const denominator = rng.int(level === 0 ? 3 : 5, level === 2 ? 15 : 12);
  const numerator = rng.int(1, denominator - 1);
  const multiplier = rng.int(2, level + 4);
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

function generateFractionAddSubtract(context: GenerationContext, rng: SeededRandom): DraftQuestion {
  const level = bandValue(context.band);
  const denominators = level === 0 ? [4, 6, 8, 10] : level === 1 ? [5, 6, 8, 9, 10, 12] : [7, 8, 9, 11, 12, 15];
  const d1 = rng.pick(denominators);
  let d2 = level === 0 ? d1 : rng.pick(denominators);
  if (level > 0 && d2 === d1) d2 = rng.pick(denominators.filter((value) => value !== d1));
  let n1 = rng.int(1, d1 - 1);
  let n2 = rng.int(1, d2 - 1);
  const common = lcm(d1, d2);
  const operation = rng.bool() ? 'add' : 'subtract';
  let resultNumerator = n1 * (common / d1) + (operation === 'add' ? 1 : -1) * n2 * (common / d2);
  if (operation === 'subtract' && resultNumerator <= 0) {
    [n1, n2] = [Math.min(d1 - 1, n2), Math.max(1, Math.min(d2 - 1, n1))];
    resultNumerator = n1 * (common / d1) - n2 * (common / d2);
    if (resultNumerator <= 0) return generateFractionAddSubtract({ ...context, attempt: context.attempt + 101 }, generationRandom({ ...context, attempt: context.attempt + 101 }));
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

function generateFractionMultiplyDivide(context: GenerationContext, rng: SeededRandom): DraftQuestion {
  const level = bandValue(context.band);
  if (context.style === 'applied') {
    const denominator = rng.int(3, level === 2 ? 12 : 9);
    const numerator = rng.int(1, denominator - 1);
    const unit = rng.int(4, 15);
    const quantity = denominator * unit;
    const result = numerator * unit;
    return {
      templateId: 'fraction-of-quantity',
      prompt: [text('A container holds '), math(`${quantity}`), text(' litres when full. It is '), math(fractionLatex(numerator, denominator)), text(' full. How many litres does it contain?')],
      answer: [text(`${result} litres`)],
      answerText: `${result} litres`,
      responseSpace: 'large',
      kind: 'applied',
      equipment: [],
      fingerprintPayload: { numerator, denominator, quantity },
    };
  }
  const d1 = rng.int(3, level === 2 ? 12 : 9);
  const d2 = rng.int(3, level === 2 ? 12 : 9);
  const n1 = rng.int(1, d1 - 1);
  const n2 = rng.int(1, d2 - 1);
  const operation = rng.bool() ? 'multiply' : 'divide';
  const result = operation === 'multiply'
    ? fractionAnswer(n1 * n2, d1 * d2)
    : fractionAnswer(n1 * d2, d1 * n2);
  return {
    templateId: `fraction-${operation}`,
    prompt: [math(`${fractionLatex(n1, d1)} ${operation === 'multiply' ? '\\times' : '\\div'} ${fractionLatex(n2, d2)}`)],
    answer: result.segments,
    answerText: result.answerText,
    responseSpace: 'standard',
    kind: 'direct',
    equipment: [],
    fingerprintPayload: { operation, n1, d1, n2, d2 },
  };
}

function generateDecimalOperations(context: GenerationContext, rng: SeededRandom): DraftQuestion {
  const level = bandValue(context.band);
  const scale = level === 0 ? 10 : 100;
  const aInt = rng.int(100, level === 2 ? 99_999 : 9999);
  const bInt = rng.int(10, Math.max(20, Math.floor(aInt * 0.7)));
  const a = aInt / scale;
  const b = bInt / scale;
  const operation = rng.bool() ? 'add' : 'subtract';
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

function generateRatioPercentage(context: GenerationContext, rng: SeededRandom): DraftQuestion {
  const level = bandValue(context.band);
  const mode = rng.bool() ? 'ratio' : 'percentage';
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
  const first = rng.int(2, level + 6);
  const second = rng.int(first + 1, first + level + 6);
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

function generateUnitTime(context: GenerationContext, rng: SeededRandom): DraftQuestion {
  const level = bandValue(context.band);
  const mode = rng.pick(['length', 'time', 'temperature'] as const);
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

function generatePerimeterArea(context: GenerationContext, rng: SeededRandom): DraftQuestion {
  const level = bandValue(context.band);
  const mode = level === 2 ? rng.pick(['rectangle', 'triangle'] as const) : 'rectangle';
  if (mode === 'triangle') {
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
  const askArea = rng.bool();
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

function generateAngleFacts(context: GenerationContext, rng: SeededRandom): DraftQuestion {
  const level = bandValue(context.band);
  if (context.style === 'applied' && rng.bool(0.6)) {
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
  if (level === 0) {
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

function generateLinesPolygons(context: GenerationContext, rng: SeededRandom): DraftQuestion {
  const level = bandValue(context.band);
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
  if (context.style === 'applied') {
    return {
      templateId: 'draw-polygon-text-only',
      prompt: [text(`Draw and label a ${name}. Mark one pair of ${level === 0 ? 'adjacent sides' : 'diagonals'} on your drawing.`)],
      answer: [text(`A correctly labelled ${sides}-sided ${name} with the requested feature marked.`)],
      answerText: `Correct ${name} drawing`,
      responseSpace: 'large',
      kind: 'drawing',
      equipment: ['ruler'],
      fingerprintPayload: { mode: 'draw', sides, feature: level === 0 ? 'adjacent' : 'diagonals' },
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

function generateDataAverages(context: GenerationContext, rng: SeededRandom): DraftQuestion {
  const level = bandValue(context.band);
  const mean = rng.int(8, level === 2 ? 60 : 35);
  const offsets = level === 0 ? [-4, -2, 0, 2, 4] : level === 1 ? [-7, -3, 0, 4, 6] : [-12, -5, -1, 7, 11];
  const values = rng.shuffle(offsets.map((offset) => mean + offset));
  return {
    templateId: `mean-${context.style}`,
    prompt: context.style === 'applied'
      ? [text(`Five teams collected ${values.join(', ')} cans. Find the mean number of cans collected.`)]
      : [text(`Find the mean of ${values.join(', ')}.`)],
    answer: [text(String(mean))],
    answerText: String(mean),
    responseSpace: context.style === 'applied' ? 'large' : 'standard',
    kind: context.style,
    equipment: [],
    fingerprintPayload: { values, style: context.style },
  };
}

function generateIntegerOperations(context: GenerationContext, rng: SeededRandom): DraftQuestion {
  const level = bandValue(context.band);
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

function generateIntroEquations(context: GenerationContext, rng: SeededRandom): DraftQuestion {
  const level = bandValue(context.band);
  const solution = rng.int(4, 30 + level * 20);
  const coefficient = level === 0 ? 1 : rng.int(2, level === 1 ? 8 : 15);
  const constant = rng.int(5, 35);
  const total = coefficient * solution + constant;
  const equation = coefficient === 1 ? `x + ${constant} = ${total}` : `${coefficient}x + ${constant} = ${total}`;
  return {
    templateId: `intro-equation-${context.style}-b${level + 1}`,
    prompt: context.style === 'applied'
      ? [text(`A number is multiplied by ${coefficient} and then ${constant} is added. The result is ${total}. Find the number.`)]
      : [text('Solve: '), math(equation)],
    answer: [math(`x = ${solution}`)],
    answerText: `x = ${solution}`,
    responseSpace: context.style === 'applied' ? 'large' : 'standard',
    kind: context.style,
    equipment: [],
    fingerprintPayload: { coefficient, constant, total, style: context.style },
  };
}

export function generateDraftQuestion(context: GenerationContext): DraftQuestion {
  const rng = generationRandom(context);
  switch (context.skillId) {
    case 'place-value-rounding': return generatePlaceValue(context, rng);
    case 'written-add-subtract': return generateWrittenAddSubtract(context, rng);
    case 'long-multiplication': return generateLongMultiplication(context, rng);
    case 'long-division': return generateLongDivision(context, rng);
    case 'factors-multiples-primes': return generateFactorsMultiples(context, rng);
    case 'prime-factor-hcf-lcm': return generatePrimeHcfLcm(context, rng);
    case 'powers-roots': return generatePowersRoots(context, rng);
    case 'fraction-equivalence-order': return generateFractionEquivalence(context, rng);
    case 'fraction-add-subtract': return generateFractionAddSubtract(context, rng);
    case 'fraction-multiply-divide': return generateFractionMultiplyDivide(context, rng);
    case 'decimal-operations': return generateDecimalOperations(context, rng);
    case 'ratio-percentage': return generateRatioPercentage(context, rng);
    case 'scientific-notation': return generateScientificNotation(context, rng);
    case 'unit-time-conversion': return generateUnitTime(context, rng);
    case 'perimeter-area': return generatePerimeterArea(context, rng);
    case 'angle-facts': return generateAngleFacts(context, rng);
    case 'lines-polygons': return generateLinesPolygons(context, rng);
    case 'data-averages': return generateDataAverages(context, rng);
    case 'integer-operations': return generateIntegerOperations(context, rng);
    case 'intro-equations': return generateIntroEquations(context, rng);
    default: throw new Error(`No generator is registered for ${context.skillId}.`);
  }
}
