import type { Band, QuestionStyle, SkillSelection } from './schema';

export interface SkillDefinition {
  id: string;
  domain: string;
  name: string;
  description: string;
  assumedKnowledge: string;
  equipment?: string[];
}

export const SKILL_CATALOG: SkillDefinition[] = [
  {
    id: 'place-value-rounding',
    domain: 'Whole numbers',
    name: 'Place value, comparison & rounding',
    description: 'Read, compare and round large whole numbers.',
    assumedKnowledge: 'Students have worked with place value to at least 10,000.',
  },
  {
    id: 'written-add-subtract',
    domain: 'Written operations',
    name: 'Written addition & subtraction',
    description: 'Four-digit and larger calculations with regrouping and exchange.',
    assumedKnowledge: 'Students know a column method for addition and subtraction.',
  },
  {
    id: 'long-multiplication',
    domain: 'Written operations',
    name: 'Long multiplication',
    description: 'Four-digit multiplicands with one-, two- or three-digit multipliers.',
    assumedKnowledge: 'Students have been taught the selected long-multiplication method.',
  },
  {
    id: 'long-division',
    domain: 'Written operations',
    name: 'Long division',
    description: 'Four-digit and larger dividends, including remainders.',
    assumedKnowledge: 'Students have been taught written division with the selected divisor size.',
  },
  {
    id: 'factors-multiples-primes',
    domain: 'Number properties',
    name: 'Factors, multiples & primes',
    description: 'List and classify factors, multiples, primes and composites.',
    assumedKnowledge: 'Students know the meanings of factor, multiple, prime and composite.',
  },
  {
    id: 'prime-factor-hcf-lcm',
    domain: 'Number properties',
    name: 'Prime factors, HCF & LCM',
    description: 'Prime factorization, divisibility rules, HCF and LCM.',
    assumedKnowledge: 'Students have used factor trees and common-factor/common-multiple methods.',
  },
  {
    id: 'powers-roots',
    domain: 'Number properties',
    name: 'Squares, cubes & exact roots',
    description: 'Work with familiar squares, cubes, exponents and exact roots.',
    assumedKnowledge: 'Students recognize exponent notation and perfect squares or cubes.',
  },
  {
    id: 'fraction-equivalence-order',
    domain: 'Fractions',
    name: 'Fraction equivalence & ordering',
    description: 'Complete equivalents and compare or order fractions.',
    assumedKnowledge: 'Students have used equivalent fractions and common denominators.',
  },
  {
    id: 'fraction-add-subtract',
    domain: 'Fractions',
    name: 'Add & subtract fractions',
    description: 'Like and unlike denominators, including simplification.',
    assumedKnowledge: 'Students have been taught to find a common denominator.',
  },
  {
    id: 'fraction-multiply-divide',
    domain: 'Fractions',
    name: 'Multiply & divide fractions',
    description: 'Fraction products, quotients and fractions of quantities.',
    assumedKnowledge: 'Students have been taught fraction multiplication and reciprocal division.',
  },
  {
    id: 'decimal-operations',
    domain: 'Decimals & proportion',
    name: 'Decimal operations',
    description: 'Written decimal addition, subtraction, multiplication and division.',
    assumedKnowledge: 'Students understand decimal place value and the selected operation.',
  },
  {
    id: 'ratio-percentage',
    domain: 'Decimals & proportion',
    name: 'Ratio, percentage & proportion',
    description: 'Equivalent ratios, percentage of quantities and simple proportion.',
    assumedKnowledge: 'Students have met ratio notation and familiar percentages.',
  },
  {
    id: 'scientific-notation',
    domain: 'Whole numbers',
    name: 'Powers of ten & scientific notation',
    description: 'Convert between ordinary and scientific notation.',
    assumedKnowledge: 'Students have been taught powers of ten and scientific notation.',
  },
  {
    id: 'unit-time-conversion',
    domain: 'Measurement',
    name: 'Units, time & temperature',
    description: 'Metric conversions, elapsed time and temperature change.',
    assumedKnowledge: 'Students know the units and conversions selected for practice.',
  },
  {
    id: 'perimeter-area',
    domain: 'Measurement',
    name: 'Perimeter & area',
    description: 'Apply familiar perimeter and area relationships from text.',
    assumedKnowledge: 'Students have been taught the relevant perimeter or area formula.',
  },
  {
    id: 'angle-facts',
    domain: 'Geometry',
    name: 'Angle vocabulary & facts',
    description: 'Text-only angle classification, relationships and student drawing.',
    assumedKnowledge: 'Students know the selected angle vocabulary and relationships.',
    equipment: ['protractor'],
  },
  {
    id: 'lines-polygons',
    domain: 'Geometry',
    name: 'Lines & polygon properties',
    description: 'Text-only line relationships, polygon vocabulary and drawing.',
    assumedKnowledge: 'Students know line and polygon names and familiar properties.',
    equipment: ['ruler'],
  },
  {
    id: 'data-averages',
    domain: 'Data & probability',
    name: 'Data & averages',
    description: 'Interpret small datasets and calculate mean, median or mode.',
    assumedKnowledge: 'Students have been taught the selected average or data display.',
  },
  {
    id: 'integer-operations',
    domain: 'Algebra & integers',
    name: 'Signed-number operations',
    description: 'Add, subtract and multiply positive and negative integers.',
    assumedKnowledge: 'Students have used a number line and know the selected sign rules.',
  },
  {
    id: 'intro-equations',
    domain: 'Algebra & integers',
    name: 'Introductory equations',
    description: 'Solve familiar one- and two-step equations and translate contexts.',
    assumedKnowledge: 'Students have used inverse operations to solve equations.',
  },
];

export const SKILLS_BY_ID = new Map(SKILL_CATALOG.map((skill) => [skill.id, skill]));

const selection = (
  skillId: string,
  count = 2,
  band: Band = 'core',
  style: QuestionStyle = 'mixed',
): SkillSelection => ({ skillId, count, band, style });

export const WORKSHEET_PRESETS = [
  {
    id: 'weekly-cumulative',
    name: 'Weekly cumulative review',
    description: 'A balanced Monday-to-Friday review across six areas of earlier learning.',
    totalQuestions: 12,
    selections: [
      selection('place-value-rounding'),
      selection('written-add-subtract'),
      selection('long-multiplication', 2, 'support'),
      selection('fraction-equivalence-order'),
      selection('unit-time-conversion'),
      selection('angle-facts', 2, 'support'),
    ],
  },
  {
    id: 'written-methods',
    name: 'Written methods review',
    description: 'Substantial calculations with factors, fractions and measurement alongside them.',
    totalQuestions: 12,
    selections: [
      selection('written-add-subtract', 2, 'core', 'direct'),
      selection('long-multiplication', 2, 'core', 'direct'),
      selection('long-division', 2, 'support', 'mixed'),
      selection('prime-factor-hcf-lcm'),
      selection('fraction-add-subtract'),
      selection('decimal-operations'),
    ],
  },
  {
    id: 'fractions-decimals',
    name: 'Fractions, decimals & proportion',
    description:
      'Connect representations and practise the written procedures students already know.',
    totalQuestions: 12,
    selections: [
      selection('fraction-equivalence-order'),
      selection('fraction-add-subtract'),
      selection('fraction-multiply-divide'),
      selection('decimal-operations'),
      selection('ratio-percentage'),
      selection('unit-time-conversion', 2, 'core', 'applied'),
    ],
  },
  {
    id: 'language-application',
    name: 'Language & application review',
    description: 'Vocabulary, written explanations and familiar applications across mathematics.',
    totalQuestions: 12,
    selections: [
      selection('factors-multiples-primes', 2, 'core', 'mixed'),
      selection('ratio-percentage', 2, 'core', 'applied'),
      selection('perimeter-area', 2, 'core', 'applied'),
      selection('angle-facts', 2, 'support', 'mixed'),
      selection('lines-polygons', 2, 'support', 'mixed'),
      selection('data-averages', 2, 'core', 'applied'),
    ],
  },
] as const;

export function getSkill(skillId: string): SkillDefinition {
  const skill = SKILLS_BY_ID.get(skillId);
  if (!skill) throw new Error(`Unknown skill: ${skillId}`);
  return skill;
}
