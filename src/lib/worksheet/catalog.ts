import {
  indexSubjectPack,
  type ContentDomainDefinition,
  type ContentFamilyDefinition,
  type PracticeTargetDefinition,
  type SubjectContentPack,
} from '../content-engine/pack';
import type { Band, QuestionStyle, SkillSelection } from './schema';

export interface SkillDefinition extends PracticeTargetDefinition {
  domain: string;
  family: string;
}

export const MATH_DOMAINS: ContentDomainDefinition[] = [
  { id: 'whole-numbers', name: 'Whole numbers', description: 'Numeration, place value and powers of ten.' },
  { id: 'written-operations', name: 'Written operations', description: 'Substantial written addition, subtraction, multiplication and division.' },
  { id: 'number-properties', name: 'Number properties', description: 'Factors, multiples, primes, powers and exact roots.' },
  { id: 'fractions', name: 'Fractions', description: 'Fraction meaning, equivalence, comparison and operations.' },
  { id: 'decimals', name: 'Decimals', description: 'Decimal place value, conversion and written operations.' },
  { id: 'proportional-reasoning', name: 'Ratio, percentage & proportion', description: 'Ratios, percentages and familiar proportional relationships.' },
  { id: 'measurement', name: 'Measurement', description: 'Units, time, temperature, perimeter and area.' },
  { id: 'geometry', name: 'Geometry', description: 'Text-based angle, line and polygon practice, including student drawing.' },
  { id: 'data-probability', name: 'Data & probability', description: 'Reading small datasets and calculating familiar measures.' },
  { id: 'integers-algebra', name: 'Integers & algebra', description: 'Signed-number operations and familiar equations.' },
];

const target = (
  id: string,
  familyId: string,
  name: string,
  description: string,
  assumedKnowledge: string,
  equipment?: string[],
): PracticeTargetDefinition => ({ id, familyId, name, description, assumedKnowledge, equipment });

const TARGETS: PracticeTargetDefinition[] = [
  target('place-value-digit-value', 'place-value-numeration', 'Place value and digit value', 'Identify the value represented by a digit in a large whole number.', 'Students can read large whole numbers.'),
  target('place-value-compare-order', 'place-value-numeration', 'Compare and order whole numbers', 'Compare or order large whole numbers.', 'Students understand place value and comparison symbols.'),
  target('place-value-rounding', 'place-value-numeration', 'Rounding whole numbers', 'Round large whole numbers to a stated place.', 'Students have been taught rounding using place value.'),
  target('scientific-notation', 'powers-of-ten', 'Scientific notation', 'Convert between ordinary numbers and scientific notation.', 'Students have been taught powers of ten and scientific notation.'),

  target('written-addition', 'written-addition-subtraction', 'Written addition', 'Add four-digit and larger whole numbers using a written method.', 'Students know a column method for addition.'),
  target('written-subtraction', 'written-addition-subtraction', 'Written subtraction', 'Subtract four-digit and larger whole numbers using a written method.', 'Students know a column method for subtraction.'),
  target('multiplication-one-digit', 'written-multiplication', 'Multiplication by one digit', 'Multiply a four-digit number by a one-digit number.', 'Students know the selected written multiplication method.'),
  target('long-multiplication', 'written-multiplication', 'Long multiplication', 'Multiply a four-digit number by a two- or three-digit number.', 'Students have been taught long multiplication.'),
  target('division-one-digit', 'written-division', 'Division by one digit', 'Divide a four-digit or larger number by a one-digit divisor.', 'Students know a written division method.'),
  target('long-division', 'written-division', 'Long division by two digits', 'Divide a four-digit or larger number by a two-digit divisor.', 'Students have been taught long division with a two-digit divisor.'),
  target('division-remainders', 'written-division', 'Quotients and remainders', 'Calculate and interpret a quotient with a remainder.', 'Students know written division and the meaning of a remainder.'),

  target('factors', 'factors-multiples-primes', 'Factors', 'Find every factor of a whole number.', 'Students know that factors divide exactly.'),
  target('multiples', 'factors-multiples-primes', 'Multiples', 'Generate and recognise multiples of a whole number.', 'Students understand repeated addition and multiplication facts.'),
  target('prime-composite', 'factors-multiples-primes', 'Prime and composite numbers', 'Classify numbers as prime or composite.', 'Students know the definitions of prime and composite.'),
  target('divisibility-tests', 'factors-multiples-primes', 'Divisibility tests', 'Use familiar divisibility rules to make a decision.', 'Students have learned the selected divisibility rules.'),
  target('prime-factorization', 'factors-multiples-primes', 'Prime factorisation', 'Write a number as a product of prime factors.', 'Students have used factor trees or an equivalent method.'),
  target('hcf', 'factors-multiples-primes', 'Highest common factor (HCF)', 'Find the highest common factor of two numbers.', 'Students know how to compare factors or prime factorizations.'),
  target('lcm', 'factors-multiples-primes', 'Lowest common multiple (LCM)', 'Find the lowest common multiple of two numbers.', 'Students know how to compare multiples or prime factorizations.'),
  target('squares', 'powers-roots', 'Squares', 'Calculate familiar square numbers.', 'Students recognise exponent notation.'),
  target('cubes', 'powers-roots', 'Cubes', 'Calculate familiar cube numbers.', 'Students recognise exponent notation.'),
  target('square-roots', 'powers-roots', 'Exact square roots', 'Recognise square roots of perfect squares.', 'Students know familiar perfect squares.'),
  target('cube-roots', 'powers-roots', 'Exact cube roots', 'Recognise cube roots of perfect cubes.', 'Students know familiar perfect cubes.'),

  target('fraction-equivalence', 'fraction-foundations', 'Equivalent fractions', 'Complete or generate equivalent fractions.', 'Students understand that equivalent fractions name the same quantity.'),
  target('fraction-simplifying', 'fraction-foundations', 'Simplifying fractions', 'Reduce fractions to their simplest form.', 'Students can find common factors.'),
  target('fraction-compare-order', 'fraction-foundations', 'Compare and order fractions', 'Compare or order proper fractions.', 'Students have used benchmarks or common denominators.'),
  target('mixed-improper-fractions', 'fraction-foundations', 'Mixed and improper fractions', 'Convert between mixed numbers and improper fractions.', 'Students understand wholes, numerators and denominators.'),
  target('fraction-add-like', 'fraction-add-subtract', 'Add fractions with like denominators', 'Add fractions that share a denominator.', 'Students understand that like denominators name equal-sized parts.'),
  target('fraction-add-unlike', 'fraction-add-subtract', 'Add fractions with unlike denominators', 'Add fractions by finding a common denominator.', 'Students have been taught to find a common denominator.'),
  target('fraction-subtract-like', 'fraction-add-subtract', 'Subtract fractions with like denominators', 'Subtract fractions that share a denominator.', 'Students understand that like denominators name equal-sized parts.'),
  target('fraction-subtract-unlike', 'fraction-add-subtract', 'Subtract fractions with unlike denominators', 'Subtract fractions by finding a common denominator.', 'Students have been taught to find a common denominator.'),
  target('fraction-of-quantity', 'fraction-multiply-divide', 'Fractions of quantities', 'Find a fraction of a whole-number quantity.', 'Students connect fractions with division and multiplication.'),
  target('fraction-multiply', 'fraction-multiply-divide', 'Multiply fractions', 'Multiply two fractions and simplify the result.', 'Students have been taught fraction multiplication.'),
  target('fraction-divide', 'fraction-multiply-divide', 'Divide fractions', 'Divide by a fraction using a taught method.', 'Students have been taught reciprocal division.'),

  target('decimal-place-value', 'decimal-understanding', 'Decimal place value', 'Identify the value of digits in decimal numbers.', 'Students can read tenths and hundredths.'),
  target('decimal-compare-round', 'decimal-understanding', 'Compare and round decimals', 'Compare, order or round decimal values.', 'Students understand decimal place value.'),
  target('fraction-decimal-conversion', 'decimal-understanding', 'Fraction and decimal conversion', 'Convert familiar fractions and decimals.', 'Students have met common fraction-decimal equivalents.'),
  target('decimal-addition', 'decimal-operations', 'Decimal addition', 'Add decimals using a written method.', 'Students know how to align decimal place values.'),
  target('decimal-subtraction', 'decimal-operations', 'Decimal subtraction', 'Subtract decimals using a written method.', 'Students know how to align decimal place values.'),
  target('decimal-multiplication', 'decimal-operations', 'Decimal multiplication', 'Multiply decimals using a written method.', 'Students have been taught decimal multiplication.'),
  target('decimal-division', 'decimal-operations', 'Decimal division', 'Divide decimals using a taught written method.', 'Students have been taught decimal division.'),

  target('ratio-simplifying', 'ratios', 'Equivalent and simplified ratios', 'Simplify ratios and generate equivalent ratios.', 'Students know ratio notation.'),
  target('ratio-sharing', 'ratios', 'Divide a quantity in a ratio', 'Share a whole quantity in a stated ratio.', 'Students can find the total number of ratio parts.'),
  target('percentage-of-quantity', 'percentages-proportion', 'Percentage of a quantity', 'Find familiar and less familiar percentages of quantities.', 'Students connect percentages to fractions or division by 100.'),
  target('fraction-decimal-percentage', 'percentages-proportion', 'Fraction, decimal and percentage conversion', 'Convert between familiar fractions, decimals and percentages.', 'Students understand the three representations as equivalent quantities.'),
  target('direct-proportion', 'percentages-proportion', 'Direct proportion and scaling', 'Use a familiar proportional relationship to scale a quantity.', 'Students can use multiplication or a unitary method.'),

  target('metric-length-conversion', 'metric-measurement', 'Length conversion', 'Convert between familiar metric length units.', 'Students know mm, cm, m and km relationships.'),
  target('mass-capacity-conversion', 'metric-measurement', 'Mass and capacity conversion', 'Convert between grams and kilograms or millilitres and litres.', 'Students know the relevant metric unit relationships.'),
  target('elapsed-time', 'time-temperature', 'Elapsed time', 'Calculate a finish time or elapsed duration.', 'Students can read digital times and cross an hour boundary.'),
  target('temperature-change', 'time-temperature', 'Temperature change', 'Calculate a rise or fall in temperature, including below zero.', 'Students can interpret positive and negative temperatures.'),
  target('perimeter', 'perimeter-area', 'Perimeter', 'Calculate the distance around a familiar shape.', 'Students understand perimeter and can add side lengths.'),
  target('rectangle-area', 'perimeter-area', 'Area of rectangles and parallelograms', 'Use base multiplied by perpendicular height.', 'Students have been taught the relevant area formula.'),
  target('triangle-area', 'perimeter-area', 'Area of triangles', 'Use one-half times base times perpendicular height.', 'Students have been taught the triangle area formula.'),

  target('angle-types', 'angles', 'Angle types', 'Classify angles from written measurements or descriptions.', 'Students know acute, right, obtuse, straight and reflex angles.'),
  target('angle-relationships', 'angles', 'Angle relationships', 'Use complementary, supplementary or vertically opposite angle facts.', 'Students have learned the selected angle relationships.'),
  target('draw-angles', 'angles', 'Draw and measure angles', 'Draw a stated angle using a protractor.', 'Students have been taught to use a protractor.', ['protractor', 'ruler']),
  target('line-types-relationships', 'lines-polygons', 'Lines and line relationships', 'Recall line, ray and segment vocabulary and familiar line relationships.', 'Students know parallel, perpendicular and intersecting lines.', ['ruler']),
  target('polygon-names', 'lines-polygons', 'Polygon names', 'Name polygons from their number of sides.', 'Students know common polygon names.'),
  target('polygon-properties', 'lines-polygons', 'Polygon properties', 'Recall regularity, diagonals and familiar polygon properties.', 'Students know common polygon vocabulary.', ['ruler']),

  target('mean', 'averages', 'Mean', 'Calculate the arithmetic mean of a small dataset.', 'Students have been taught to total and share equally.'),
  target('median', 'averages', 'Median', 'Order a small dataset and find its middle value.', 'Students know that data must be ordered first.'),
  target('mode', 'averages', 'Mode', 'Identify the most frequent value in a dataset.', 'Students understand frequency.'),
  target('range', 'averages', 'Range', 'Find the difference between the greatest and least values.', 'Students can identify extremes and subtract.'),

  target('integer-addition-subtraction', 'integer-operations', 'Integer addition and subtraction', 'Add and subtract positive and negative integers.', 'Students have used a number line and know sign conventions.'),
  target('integer-multiplication-division', 'integer-operations', 'Integer multiplication and division', 'Multiply and divide signed integers.', 'Students know the sign rules for products and quotients.'),
  target('one-step-equations', 'introductory-equations', 'One-step equations', 'Solve equations using one inverse operation.', 'Students understand equality and inverse operations.'),
  target('two-step-equations', 'introductory-equations', 'Two-step equations', 'Solve equations using two inverse operations.', 'Students have solved one-step equations.'),
];

const FAMILY_SPECS: Array<Omit<ContentFamilyDefinition, 'targetIds'> & { targetIds: string[] }> = [
  { id: 'place-value-numeration', domainId: 'whole-numbers', name: 'Place value & numeration', description: 'Mix place value, comparison and rounding.', targetIds: ['place-value-digit-value', 'place-value-compare-order', 'place-value-rounding'] },
  { id: 'powers-of-ten', domainId: 'whole-numbers', name: 'Powers of ten', description: 'Practise scientific notation and familiar powers of ten.', targetIds: ['scientific-notation'] },
  { id: 'written-addition-subtraction', domainId: 'written-operations', name: 'Written addition & subtraction', description: 'Mix substantial whole-number addition and subtraction.', targetIds: ['written-addition', 'written-subtraction'] },
  { id: 'written-multiplication', domainId: 'written-operations', name: 'Written multiplication', description: 'Mix one-digit multipliers and long multiplication.', targetIds: ['multiplication-one-digit', 'long-multiplication'] },
  { id: 'written-division', domainId: 'written-operations', name: 'Written division', description: 'Mix one- and two-digit divisors, including remainders.', targetIds: ['division-one-digit', 'long-division', 'division-remainders'] },
  { id: 'factors-multiples-primes', domainId: 'number-properties', name: 'Factors, multiples & primes', description: 'Mix factors, multiples, primes, divisibility, prime factorisation, HCF and LCM.', targetIds: ['factors', 'multiples', 'prime-composite', 'divisibility-tests', 'prime-factorization', 'hcf', 'lcm'] },
  { id: 'powers-roots', domainId: 'number-properties', name: 'Powers & exact roots', description: 'Mix squares, cubes and their exact roots.', targetIds: ['squares', 'cubes', 'square-roots', 'cube-roots'] },
  { id: 'fraction-foundations', domainId: 'fractions', name: 'Fraction meaning & equivalence', description: 'Mix equivalence, simplifying, ordering and mixed-number conversion.', targetIds: ['fraction-equivalence', 'fraction-simplifying', 'fraction-compare-order', 'mixed-improper-fractions'] },
  { id: 'fraction-add-subtract', domainId: 'fractions', name: 'Add & subtract fractions', description: 'Mix addition and subtraction with like and unlike denominators.', targetIds: ['fraction-add-like', 'fraction-add-unlike', 'fraction-subtract-like', 'fraction-subtract-unlike'] },
  { id: 'fraction-multiply-divide', domainId: 'fractions', name: 'Fraction multiplication & division', description: 'Mix fractions of quantities, multiplication and division.', targetIds: ['fraction-of-quantity', 'fraction-multiply', 'fraction-divide'] },
  { id: 'decimal-understanding', domainId: 'decimals', name: 'Decimal understanding', description: 'Mix place value, comparison, rounding and fraction-decimal links.', targetIds: ['decimal-place-value', 'decimal-compare-round', 'fraction-decimal-conversion'] },
  { id: 'decimal-operations', domainId: 'decimals', name: 'Decimal operations', description: 'Mix decimal addition, subtraction, multiplication and division.', targetIds: ['decimal-addition', 'decimal-subtraction', 'decimal-multiplication', 'decimal-division'] },
  { id: 'ratios', domainId: 'proportional-reasoning', name: 'Ratios', description: 'Mix equivalent ratios, simplifying and sharing in a ratio.', targetIds: ['ratio-simplifying', 'ratio-sharing'] },
  { id: 'percentages-proportion', domainId: 'proportional-reasoning', name: 'Percentages & proportion', description: 'Mix percentage calculations, conversions and direct proportion.', targetIds: ['percentage-of-quantity', 'fraction-decimal-percentage', 'direct-proportion'] },
  { id: 'metric-measurement', domainId: 'measurement', name: 'Metric measurement', description: 'Mix length, mass and capacity conversions.', targetIds: ['metric-length-conversion', 'mass-capacity-conversion'] },
  { id: 'time-temperature', domainId: 'measurement', name: 'Time & temperature', description: 'Mix elapsed-time and temperature-change questions.', targetIds: ['elapsed-time', 'temperature-change'] },
  { id: 'perimeter-area', domainId: 'measurement', name: 'Perimeter & area', description: 'Mix perimeter and familiar area formulae.', targetIds: ['perimeter', 'rectangle-area', 'triangle-area'] },
  { id: 'angles', domainId: 'geometry', name: 'Angles', description: 'Mix angle types, relationships and student drawing.', targetIds: ['angle-types', 'angle-relationships', 'draw-angles'] },
  { id: 'lines-polygons', domainId: 'geometry', name: 'Lines & polygons', description: 'Mix line vocabulary, polygon names and properties.', targetIds: ['line-types-relationships', 'polygon-names', 'polygon-properties'] },
  { id: 'averages', domainId: 'data-probability', name: 'Averages & spread', description: 'Mix mean, median, mode and range.', targetIds: ['mean', 'median', 'mode', 'range'] },
  { id: 'integer-operations', domainId: 'integers-algebra', name: 'Integer operations', description: 'Mix signed-number addition, subtraction, multiplication and division.', targetIds: ['integer-addition-subtraction', 'integer-multiplication-division'] },
  { id: 'introductory-equations', domainId: 'integers-algebra', name: 'Introductory equations', description: 'Mix familiar one- and two-step equations.', targetIds: ['one-step-equations', 'two-step-equations'] },
];

export const SKILL_FAMILIES: ContentFamilyDefinition[] = FAMILY_SPECS;

export const MATHEMATICS_PACK: SubjectContentPack = {
  id: 'pep-elementary-mathematics',
  version: '2026.08.2',
  name: 'PEP Elementary Mathematics',
  labels: {
    subject: 'Mathematics',
    domain: 'Area',
    family: 'Skill family',
    target: 'Skill',
    targetPlural: 'Skills',
  },
  domains: MATH_DOMAINS,
  families: SKILL_FAMILIES,
  targets: TARGETS,
};

export const MATH_PACK_INDEX = indexSubjectPack(MATHEMATICS_PACK);

export const SKILL_CATALOG: SkillDefinition[] = TARGETS.map((item) => {
  const family = MATH_PACK_INDEX.familiesById.get(item.familyId);
  const domain = family && MATH_PACK_INDEX.domainsById.get(family.domainId);
  if (!family || !domain) throw new Error(`Incomplete catalog entry for ${item.id}.`);
  return { ...item, family: family.name, domain: domain.name };
});

export const SKILLS_BY_ID = new Map(SKILL_CATALOG.map((skill) => [skill.id, skill]));

/** Old coarse selections remain understandable when a teacher reuses browser history. */
export const LEGACY_SELECTION_ALIASES: Record<string, { id: string; selectionType: 'family' | 'skill' }> = {
  'place-value-rounding': { id: 'place-value-numeration', selectionType: 'family' },
  'written-add-subtract': { id: 'written-addition-subtraction', selectionType: 'family' },
  'long-multiplication': { id: 'written-multiplication', selectionType: 'family' },
  'long-division': { id: 'written-division', selectionType: 'family' },
  'factors-multiples-primes': { id: 'factors-multiples-primes', selectionType: 'family' },
  'prime-factor-hcf-lcm': { id: 'factors-multiples-primes', selectionType: 'family' },
  'powers-roots': { id: 'powers-roots', selectionType: 'family' },
  'fraction-equivalence-order': { id: 'fraction-foundations', selectionType: 'family' },
  'fraction-add-subtract': { id: 'fraction-add-subtract', selectionType: 'family' },
  'fraction-multiply-divide': { id: 'fraction-multiply-divide', selectionType: 'family' },
  'decimal-operations': { id: 'decimal-operations', selectionType: 'family' },
  'ratio-percentage': { id: 'percentages-proportion', selectionType: 'family' },
  'scientific-notation': { id: 'scientific-notation', selectionType: 'skill' },
  'unit-time-conversion': { id: 'time-temperature', selectionType: 'family' },
  'perimeter-area': { id: 'perimeter-area', selectionType: 'family' },
  'angle-facts': { id: 'angles', selectionType: 'family' },
  'lines-polygons': { id: 'lines-polygons', selectionType: 'family' },
  'data-averages': { id: 'averages', selectionType: 'family' },
  'integer-operations': { id: 'integer-operations', selectionType: 'family' },
  'intro-equations': { id: 'introductory-equations', selectionType: 'family' },
};

export function normalizeSelectionReference(
  id: string,
  selectionType: 'family' | 'skill' = 'skill',
): { id: string; selectionType: 'family' | 'skill' } {
  if (selectionType === 'family' && MATH_PACK_INDEX.familiesById.has(id)) return { id, selectionType };
  if (selectionType === 'skill' && MATH_PACK_INDEX.targetsById.has(id)) return { id, selectionType };
  return LEGACY_SELECTION_ALIASES[id] ?? { id, selectionType };
}

export function getSkill(skillId: string): SkillDefinition {
  const skill = SKILLS_BY_ID.get(skillId);
  if (!skill) throw new Error(`Unknown skill: ${skillId}`);
  return skill;
}

export function getFamily(familyId: string): ContentFamilyDefinition {
  const family = MATH_PACK_INDEX.familiesById.get(familyId);
  if (!family) throw new Error(`Unknown skill family: ${familyId}`);
  return family;
}

export function getDomain(domainId: string): ContentDomainDefinition {
  const domain = MATH_PACK_INDEX.domainsById.get(domainId);
  if (!domain) throw new Error(`Unknown mathematics area: ${domainId}`);
  return domain;
}

const familySelection = (
  skillId: string,
  count = 2,
  band: Band = 'core',
  style: QuestionStyle = 'mixed',
): SkillSelection => ({ skillId, selectionType: 'family', count, band, style });

/** A dependable regression setup, not a teacher-facing starting-point choice. */
export const DEFAULT_WORKSHEET_SETUP = {
  id: 'manual-selection',
  name: 'Default weekly review setup',
  description: 'Twelve questions across six previously taught areas.',
  totalQuestions: 12,
  selections: [
    familySelection('place-value-numeration'),
    familySelection('written-addition-subtraction'),
    familySelection('factors-multiples-primes'),
    familySelection('fraction-foundations'),
    familySelection('time-temperature'),
    familySelection('angles', 2, 'support', 'direct'),
  ],
} as const;

/** @deprecated Kept only so old scripts can replay their existing regression fixtures. */
export const WORKSHEET_PRESETS = [DEFAULT_WORKSHEET_SETUP] as const;
