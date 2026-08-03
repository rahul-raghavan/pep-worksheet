# Elementary Spiral Practice — Product and Content Design

> Superseded by [Elementary Mixed Practice Builder — Revised Product and Content Plan](elementary-mixed-practice-design-v2.md), which reflects the small-group, one-or-two-sheet workflow and the full PEP elementary curriculum review.

Status: Working proposal, no implementation

Audience: PEP mathematics teachers and curriculum leads

Initial learner range: Grade 3 and above

## 1. Product purpose

Create printable mixed-practice worksheets in which previously learned mathematics returns at deliberate intervals. Teachers choose the skills that need to remain active; the system controls recurrence, variety, interleaving, and exact-question avoidance.

This is not a full adaptive spaced-repetition system. Without student-level response data, it is better described as **planned spiral practice**:

- repeat mathematical skills;
- vary the surface questions and representations;
- space appearances across worksheets;
- mix numerical questions with word problems and other task forms;
- let teachers adjust priorities without designing a scheduling algorithm.

### Relationship with Math Bullet

| Math Bullet                                | Spiral Practice                                     |
| ------------------------------------------ | --------------------------------------------------- |
| Measures rapid automatic recall            | Keeps learned mathematics available over time       |
| Short, timed and answer-only               | Usually untimed, with working space                 |
| Mostly direct response                     | Numerical, word, representation and reasoning tasks |
| Difficulty rises inside one paper          | Skills recur across a worksheet series              |
| Diagnostic assessment and fluency practice | Cumulative review and application                   |

The two products should share a catalog, generators, exact-answer system, manifests, PDF renderer, authentication, and usage tracking. They should retain separate composition rules and teacher-facing modes.

## 2. Design principles

1. **Repeat the skill, not the exact question.** Exact prompts and semantic variants should not recur unintentionally.
2. **Keep skill and task format separate.** “Word problem” is not a mathematical skill.
3. **Use local progression.** A level in place value must describe place-value demand, not attempt to equal a level in geometry.
4. **Start from presets.** Teachers should be able to generate a useful series with a few choices.
5. **Hide scheduling mechanics.** Show “Often”, “Regularly”, and “Keep in review”, not raw weights.
6. **Generate a series as one plan.** Decide skill positions across all worksheets before generating individual values.
7. **Preserve teacher control.** The system recommends; teachers can change skills, formats, local bands, volume, and recurrence.
8. **Avoid runtime AI for core questions.** Use typed, deterministic generators and curated word-problem families.
9. **Carry recent history internally.** Do not ask ordinary teachers to upload manifests to avoid repetition.
10. **Use grade labels only as starting points.** The underlying model remains skill-first and can be moved up or down.

## 3. Scope ladder

These stages are starting points, not curriculum or student-grade judgments.

| Stage              | Indicative use                                     | Main mathematical scope                                                                                                                                                |
| ------------------ | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 — Foundations   | Grade 3 entry or substantial consolidation         | Place value to 1,000; facts within 20; addition and subtraction within 100; ×2, ×5, ×10; sharing; halves and quarters; basic time, money, measure and shape facts      |
| S2 — Consolidation | Grade 3–4 cumulative practice                      | Larger whole numbers; written addition and subtraction; tables and related division; fractions of quantities; equivalence; time, perimeter, area, measurement and data |
| S3 — Expansion     | Grade 4–5 cumulative practice                      | Multi-digit multiplication and division; fraction operations; decimal place value; coordinate basics; area, volume, patterns and multi-step contexts                   |
| S4 — Bridge        | Grade 5–6 transition or upper-elementary extension | Fraction–decimal–percentage links; factors and primes; ratio foundations; introductory integers and algebra; richer geometry, measurement and data                     |

A teacher can select an S2 preset and still lower Fractions to a Foundation band or raise Multiplication to Stretch. Stage describes overall scope; local band describes demand within a selected subskill.

## 4. Elementary skill spine

### A. Number sense and place value

| Skill                            | Subskills                                       | First useful stage |
| -------------------------------- | ----------------------------------------------- | -----------------: |
| Read and represent whole numbers | Numerals, words, models, expanded form          |                 S1 |
| Place value                      | Value of a digit; compose and decompose numbers |                 S1 |
| Compare and order                | Whole numbers, then decimals                    |                 S1 |
| Number lines                     | Locate, estimate and find intervals             |                 S1 |
| Rounding and estimation          | Nearest 10, 100 and 1,000; reasonableness       |                 S2 |
| Number patterns                  | Skip counting, rules and missing terms          |                 S1 |

### B. Addition and subtraction

| Skill                | Subskills                                       | First useful stage |
| -------------------- | ----------------------------------------------- | -----------------: |
| Core facts           | Facts within 10 and 20; complements             |                 S1 |
| Mental strategies    | Make ten, partition, compensate, near doubles   |                 S1 |
| Written addition     | No regrouping; one or more regroupings          |                 S1 |
| Written subtraction  | No exchange; exchange across one or more places |                 S1 |
| Inverse and unknowns | Missing addend, missing start and fact families |                 S1 |
| Estimate and check   | Rounding, inverse operation, error detection    |                 S2 |

### C. Multiplication and division

| Skill                         | Subskills                                        | First useful stage |
| ----------------------------- | ------------------------------------------------ | -----------------: |
| Meaning of multiplication     | Equal groups, arrays and repeated addition       |                 S1 |
| Multiplication facts          | ×2, ×5, ×10; then full facts through ×12         |                 S1 |
| Related division facts        | Fact families, sharing and grouping              |                 S1 |
| Multiply by place-value units | ×10, ×100 and related scaling                    |                 S2 |
| Multi-digit multiplication    | By one digit, then two digits                    |                 S2 |
| Division with remainders      | Interpret the remainder in context               |                 S2 |
| Written division              | By one digit, then accessible two-digit divisors |                 S3 |
| Multiplicative comparison     | “Times as many” and scale relationships          |                 S2 |

### D. Number structure

| Skill                       | Subskills                                          | First useful stage |
| --------------------------- | -------------------------------------------------- | -----------------: |
| Odd and even                | Recognition and consequences under operations      |                 S1 |
| Factors and multiples       | Lists, common factors and common multiples         |                 S3 |
| Divisibility                | Familiar rules and recognition                     |                 S3 |
| Prime and composite numbers | Classification and prime factorization foundations |                 S3 |
| Squares and cubes           | Familiar exact facts                               |                 S4 |

### E. Fractions

| Skill                      | Subskills                                                   | First useful stage |
| -------------------------- | ----------------------------------------------------------- | -----------------: |
| Part–whole meaning         | Unit and non-unit fractions                                 |                 S1 |
| Fractions on a number line | Locate, order and identify intervals                        |                 S2 |
| Equivalent fractions       | Generate, complete and simplify                             |                 S2 |
| Compare and order          | Same numerator, same denominator and benchmarks             |                 S2 |
| Fractions of quantities    | Unit fraction first, then non-unit fraction                 |                 S2 |
| Add and subtract           | Like denominators, then related and unlike denominators     |                 S2 |
| Mixed and improper forms   | Convert and interpret                                       |                 S3 |
| Multiply and divide        | Fraction by whole number and introductory fraction products |                 S4 |

### F. Decimals, percentage and money

| Skill                             | Subskills                                       | First useful stage |
| --------------------------------- | ----------------------------------------------- | -----------------: |
| Decimal place value               | Tenths, hundredths and thousandths              |                 S2 |
| Compare, order and round decimals | Place-value and number-line reasoning           |                 S3 |
| Decimal operations                | Addition, subtraction and scaling               |                 S3 |
| Fraction–decimal links            | Familiar equivalents and place-value conversion |                 S3 |
| Percentage benchmarks             | 50%, 25%, 10%, 1% and combinations              |                 S4 |
| Money                             | Compose amounts, change, totals and unit price  |                 S1 |

### G. Measurement and time

| Skill                     | Subskills                                                    | First useful stage |
| ------------------------- | ------------------------------------------------------------ | -----------------: |
| Length, mass and capacity | Choose units, estimate, measure and compare                  |                 S1 |
| Unit conversion           | Within metric families and mixed-unit notation               |                 S2 |
| Time                      | Read clocks, duration, calendars and timetables              |                 S1 |
| Perimeter                 | Regular and irregular figures                                |                 S1 |
| Area                      | Counting squares, rectangles, triangles and compound figures |                 S2 |
| Volume                    | Cubes, cuboids and capacity links                            |                 S3 |

### H. Geometry and spatial reasoning

| Skill                | Subskills                                              | First useful stage |
| -------------------- | ------------------------------------------------------ | -----------------: |
| 2D and 3D properties | Name, classify and describe                            |                 S1 |
| Angles               | Recognize, compare, measure and use simple angle facts |                 S2 |
| Symmetry             | Lines, rotational ideas and completion                 |                 S1 |
| Transformations      | Translation, reflection and introductory scaling       |                 S3 |
| Coordinates          | Read, plot and move points                             |                 S2 |

### I. Patterns and early algebra

| Skill            | Subskills                                     | First useful stage |
| ---------------- | --------------------------------------------- | -----------------: |
| Sequences        | Continue, describe and generate rules         |                 S1 |
| Equality         | True/false equations and balance              |                 S1 |
| Unknown values   | Boxes, letters and inverse operations         |                 S2 |
| Expressions      | Interpret and simplify accessible expressions |                 S4 |
| Simple equations | One-step and introductory two-step equations  |                 S4 |

### J. Data and chance

| Skill                   | Subskills                                             | First useful stage |
| ----------------------- | ----------------------------------------------------- | -----------------: |
| Read data displays      | Tables, pictographs and bar charts                    |                 S1 |
| Construct data displays | Select scales and represent data                      |                 S2 |
| Interpret and compare   | Totals, differences and multi-step questions          |                 S2 |
| Typical value           | Mode, median and mean when appropriate                |                 S3 |
| Chance language         | Impossible to certain; simple equally likely outcomes |                 S2 |

Problem solving, explanation and word-problem structure remain cross-cutting formats. They must not become an eleventh catch-all topic.

## 5. Local progression bands

Store five internal bands for precision, but show three quick teacher choices by default.

| Teacher choice | Internal bands | Meaning                                                               |
| -------------- | -------------: | --------------------------------------------------------------------- |
| Support        |            1–2 | Familiar representations, friendly values and direct unknown position |
| Core           |            2–3 | Expected mixed recall with one meaningful complication                |
| Stretch        |            3–4 | Less familiar values, representations or unknown positions            |

Band 5 remains an advanced curriculum-lead setting for exceptional challenge. Each subskill requires its own band descriptions. “Large number” alone is not a definition of difficulty.

For word problems, the skill band controls the mathematics. A separate internal language/modeling profile controls:

- number of steps;
- location of the unknown;
- sentence complexity;
- required unit conversion;
- presence of unnecessary information;
- need to choose the operation.

The teacher normally sees only “Direct”, “Interpret”, or “Multi-step”. The recommended value follows the selected skill band.

## 6. Task-format taxonomy

### Simple teacher-facing choice

For each selected skill:

- **Number practice** — primarily calculation and mathematical notation;
- **Word problems** — contextual modelling using the selected mathematics;
- **Balanced mix** — recommended combination of both.

### Internal task formats

| Format                      | Purpose                                   | Example                                       |
| --------------------------- | ----------------------------------------- | --------------------------------------------- |
| Direct calculation          | Execute a known operation                 | `384 + 267`                                   |
| Missing number or equation  | Use inverse relationships                 | `□ + 29 = 63`                                 |
| Compare, order or classify  | Discriminate between mathematical objects | `Which is greater: 5/8 or 3/4?`               |
| Represent or convert        | Move between useful forms                 | `Write 0.75 as a fraction.`                   |
| Contextual word problem     | Model a situation mathematically          | “Six boxes hold 24 pencils each…”             |
| Reasoning or error analysis | Inspect a claim or explain a relationship | “Maya says 1/3 + 1/4 = 2/7. What went wrong?” |

“Balanced mix” should normally include the first five formats. Reasoning remains low-volume unless explicitly emphasized.

## 7. Word-problem taxonomy

### Addition and subtraction structures

- **Change**: start, change and result; any one may be unknown.
- **Combine**: parts combine to form a whole.
- **Compare**: difference, larger quantity or smaller quantity is unknown.
- **Equalize**: determine what makes two quantities equal.

### Multiplication and division structures

- **Equal groups**: groups × amount in each group.
- **Partitive division**: total and number of groups are known; group size is unknown.
- **Measurement division**: total and group size are known; number of groups is unknown.
- **Arrays and area**: rows, columns and rectangular structure.
- **Multiplicative comparison**: one amount is a number of times another.
- **Rate or measure**: amount per unit, distance per interval or price per item.

### Fraction structures

- **Part–whole**: identify or compare a portion of one whole.
- **Operator**: find a fraction of a quantity.
- **Measure**: locate and combine fractional distances or quantities.
- **Quotient**: interpret division as a fraction.

### Measurement, time and geometry structures

- select an appropriate unit;
- convert before operating;
- calculate elapsed time;
- choose and use a perimeter, area or volume relationship;
- infer a missing measurement from a known relationship.

Template families must preserve their semantic structure when values and contexts vary. Changing only a child’s name does not create a meaningfully new question.

## 8. Content-generation model

Use a hybrid library.

### Parameterized generators

Best for calculations, missing-number equations, conversions, coordinates, measurement facts and structured comparisons. Each generator defines:

- valid parameter ranges by band;
- answer constraints;
- forbidden awkward cases;
- exact answer representation;
- semantic fingerprint;
- estimated written time.

### Curated word-problem families

Each family defines the problem structure, known and unknown positions, context categories, units, language constraints and parameter relations. Contexts should rotate without introducing culturally obscure assumptions or unrealistic quantities.

### Fixed curated questions

Retain for particularly good reasoning questions, special representations and diagram-dependent tasks. The existing 1,387-question bank can enter here after taxonomy and quality review.

### Anti-repetition rules

- No exact fingerprint repeats inside a series.
- Do not repeat a word-problem template family on adjacent worksheets.
- Avoid the same context plus semantic structure within the recent history window.
- Save recent fingerprints automatically by teacher and recipe; do not require file import.
- Preserve a manifest for every generated series so answer keys and recurrence checks use the exact same questions.

## 9. Rotation model

### Teacher-facing frequency

| Choice             | Default recurrence                                      |
| ------------------ | ------------------------------------------------------- |
| Practise often     | Appears on every worksheet, usually 20–35% of the sheet |
| Practise regularly | Appears at least every second worksheet                 |
| Keep in review     | Appears every third or fourth worksheet                 |

Teachers may also set an exact count for a single worksheet. Raw weights remain hidden.

### Series phases

| Phase           | Approximate position | Default behavior                                                          |
| --------------- | -------------------: | ------------------------------------------------------------------------- |
| Revisit         |            First 25% | Familiar numerical forms, prerequisite retrieval and direct word problems |
| Connect         |           Middle 50% | Strong interleaving, balanced formats and varied unknown positions        |
| Apply and check |            Final 25% | More contextual transfer, reasoning and cumulative checkpoints            |

### Composition rules

- Plan all skill and format positions before generating values.
- Interleave rather than append topic blocks.
- Use no more than two consecutive questions from one skill.
- Begin each worksheet with two accessible questions.
- Vary the first skill across worksheets.
- Respect the requested word-problem share while avoiding long clusters of reading-heavy items.
- Distribute maintenance skills across the series instead of adding them only at the end.
- Make roughly every fourth worksheet a cumulative checkpoint.
- Use the final worksheet as a representative exit check.

## 10. Teacher workflow

1. Choose **One mixed worksheet** or **A worksheet series**.
2. Choose a starting point such as S1 Foundations or S3 Expansion.
3. Set the number of worksheets and questions per worksheet.
4. Select skills and subskills.
5. For each selected skill, choose:
   - Support, Core or Stretch;
   - Number practice, Word problems or Balanced mix;
   - Practise often, Practise regularly or Keep in review.
6. Review a plain-language summary of the rotation.
7. Preview representative worksheets from the beginning, middle and end.
8. Download one student workbook and a consolidated answer key.

Advanced settings may expose exact counts, five internal bands, word-problem complexity and phase proportions. Seeds, fingerprints and manifests remain invisible to ordinary teachers.

## 11. Representative recipe A — Grade 3 foundations

### Teacher recipe

- Series: 8 worksheets, 15 questions each.
- Suggested cadence: three short sessions per week.
- Overall stage: S1 Foundations.
- Format: approximately 70% number practice, 25% word problems, 5% reasoning.
- Working space: moderate.

| Skill                                                | Band    | Format          | Frequency          |
| ---------------------------------------------------- | ------- | --------------- | ------------------ |
| Addition and subtraction within 100, with regrouping | Core    | Balanced mix    | Practise often     |
| ×2, ×5, ×10 and related division                     | Core    | Balanced mix    | Practise often     |
| Place value to 1,000                                 | Core    | Number practice | Practise regularly |
| Halves and quarters; fractions of quantities         | Support | Balanced mix    | Practise regularly |
| Time and money                                       | Support | Word problems   | Keep in review     |
| Perimeter and basic shape properties                 | Support | Balanced mix    | Keep in review     |

### Rotation preview

| Worksheet | Main purpose                                          | Expected mix                                     |
| --------- | ----------------------------------------------------- | ------------------------------------------------ |
| 1         | Re-establish accessible facts and direct applications | 10 numerical/representation, 4 word, 1 reasoning |
| 4         | Interleave operations with fractions, time and shape  | 8 numerical/representation, 6 word, 1 reasoning  |
| 8         | Cumulative check with less predictable order          | 7 numerical/representation, 6 word, 2 reasoning  |

### Mock worksheet 1

1. `8 + 7`
2. What is the value of the digit 6 in 364?
3. `47 + 28`
4. `82 − 36`
5. `□ + 29 = 63`
6. `7 × 5`
7. `40 ÷ 5`
8. `4 × 6`
9. Find `1/2` of 18.
10. Which is greater: `1/2` or `1/4`? How do you know?
11. Asha had 38 stickers. Her friend gave her 27 more. How many stickers does Asha have now?
12. `24 ÷ 4`
13. Dev has ₹50 and spends ₹18. How much money remains?
14. A lesson begins at 3:40 and lasts 25 minutes. When does it finish?
15. A rectangle has sides 6 cm and 3 cm. What is its perimeter?

Answer key: `15; 60; 75; 46; 34; 35; 8; 24; 9; 1/2; 65; 6; ₹32; 4:05; 18 cm`.

## 12. Representative recipe B — Grade 4 cumulative spiral

### Teacher recipe

- Series: 10 worksheets, 20 questions each.
- Suggested cadence: two worksheets per week.
- Overall stage: S2 Consolidation.
- Format: approximately 60% number/representation, 30% word problems, 10% reasoning.

| Skill                                                 | Band    | Format          | Frequency          |
| ----------------------------------------------------- | ------- | --------------- | ------------------ |
| Multi-digit addition and subtraction                  | Core    | Balanced mix    | Practise often     |
| Multiplication facts and related division through ×12 | Core    | Number practice | Practise often     |
| Multi-digit multiplication by one digit               | Core    | Balanced mix    | Practise regularly |
| Equivalent fractions and fractions of quantities      | Core    | Balanced mix    | Practise regularly |
| Rounding and estimation                               | Core    | Number practice | Keep in review     |
| Area, perimeter and elapsed time                      | Core    | Balanced mix    | Keep in review     |
| Data interpretation and angle classification          | Support | Balanced mix    | Keep in review     |

### Rotation preview

| Worksheet | Main purpose                                                 | Expected mix                                     |
| --------- | ------------------------------------------------------------ | ------------------------------------------------ |
| 1         | Confirm facts and direct written procedures                  | 13 numerical/representation, 5 word, 2 reasoning |
| 5         | Mix written operations with fraction and measurement choices | 11 numerical/representation, 7 word, 2 reasoning |
| 10        | Exit check across all selected skills                        | 10 numerical/representation, 7 word, 3 reasoning |

### Mock worksheet 5

1. `9 × 7`
2. What is the value of the digit 8 in 48,215?
3. `3,746 + 2,859`
4. `8,002 − 3,576`
5. `36 × 4`
6. `144 ÷ 12`
7. `7 × □ = 84`
8. Round 4,672 to the nearest hundred.
9. Complete: `3/4 = □/20`.
10. Which is greater: `5/8` or `3/4`?
11. Find `2/5` of 35.
12. A rectangular garden is 12 m long and 5 m wide. What is its area?
13. A square picture has sides of 9 cm. How much ribbon is needed to go once around it?
14. A class begins at 2:35 and lasts 45 minutes. When does it end?
15. Six boxes contain 24 pencils each. How many pencils are there altogether?
16. A library places 168 books equally on 8 shelves. How many books go on each shelf?
17. One bus carries 245 students and another carries 178. How many students are carried altogether?
18. A reading chart records 12 books on Monday, 18 on Tuesday and 15 on Wednesday. On which day were the most books recorded, and how many were recorded altogether?
19. Ravi says an angle measuring 120° is acute. Is he correct? Name the angle type.
20. Arun says 3,040 is greater than 3,400 because 40 is greater than 34. Is he correct? Explain using place value.

Answer key: `63; 8,000; 6,605; 4,426; 144; 12; 12; 4,700; 15; 3/4; 14; 60 m²; 36 cm; 3:20; 144; 21; 423; Tuesday and 45; no—it is obtuse; no—both have 3 thousands, but 3,400 has 4 hundreds while 3,040 has 0 hundreds`.

## 13. Representative recipe C — Upper-elementary bridge

### Teacher recipe

- Series: 12 worksheets, 20 questions each.
- Suggested cadence: two or three worksheets per week.
- Overall stage: S4 Bridge.
- Format: approximately 50% number/representation, 35% word problems, 15% reasoning.

| Skill                                           | Band    | Format          | Frequency          |
| ----------------------------------------------- | ------- | --------------- | ------------------ |
| Fraction operations and fractions of quantities | Core    | Balanced mix    | Practise often     |
| Decimal operations and fraction–decimal links   | Core    | Balanced mix    | Practise often     |
| Factors, multiples, primes and divisibility     | Core    | Number practice | Practise regularly |
| Percentage benchmarks and money                 | Core    | Balanced mix    | Practise regularly |
| Multiplication and division maintenance         | Core    | Number practice | Keep in review     |
| Ratio foundations                               | Support | Balanced mix    | Keep in review     |
| Coordinates, area and data                      | Support | Balanced mix    | Keep in review     |

### Rotation preview

| Worksheet | Main purpose                                            | Expected mix                                     |
| --------- | ------------------------------------------------------- | ------------------------------------------------ |
| 1         | Revisit prerequisite facts and familiar representations | 12 numerical/representation, 6 word, 2 reasoning |
| 6         | Connect fractions, decimals, percentage and ratio       | 10 numerical/representation, 7 word, 3 reasoning |
| 12        | Cumulative transfer and exit check                      | 9 numerical/representation, 8 word, 3 reasoning  |

### Mock worksheet 6

1. `12 × 8`
2. `360 ÷ 9`
3. Find the highest common factor of 18 and 24.
4. Write 84 as a product of prime factors.
5. `3/4 + 1/8`
6. `5/6 − 1/3`
7. Find `2/5` of 60.
8. Write 0.75 as a fraction in simplest form.
9. Find 25% of 84.
10. `3.6 + 2.45`
11. A 7.2-litre container is filled using a 0.6-litre jug. How many full jugs are needed?
12. The ratio of boys to girls in a club is 3:5. There are 32 children altogether. How many are boys and how many are girls?
13. A point on a coordinate map is at `(-2, 3)`. In which quadrant is it?
14. A triangular flag has base 10 cm and height 6 cm. What is its area?
15. A 120-litre tank is `3/5` full. How many litres of water does it contain?
16. A school bag costs ₹800 and is reduced by 25%. What is the sale price?
17. Four notebooks cost ₹37.50 each. What is the total cost?
18. A class collected 125 cans on Monday and 148 on Tuesday. The cans are packed into boxes of 9. A student says 30 boxes will hold every can. Is the student correct? Explain using the quotient and remainder.
19. Maya says `1/3 + 1/4 = 2/7`. Explain the error and give the correct answer.
20. Which is greater: 0.6 or `5/8`? Show them in the same form.

Answer key: `96; 40; 6; 2² × 3 × 7; 7/8; 1/2; 24; 3/4; 21; 6.05; 12; 12 boys and 20 girls; Quadrant II; 30 cm²; 72 L; ₹600; ₹150; no—30 boxes hold 270 cans, leaving 3 cans; denominators cannot be added—7/12; 5/8 because 5/8 = 0.625`.

## 14. First-release boundaries

Include:

- single mixed worksheets and configurable series;
- the S1–S4 spine;
- local skill bands;
- number/word/balanced format choice;
- deterministic numerical generators;
- curated word-problem families;
- recent-history exclusion;
- student workbook and consolidated answer key;
- teacher preview of early, middle and final worksheets.

Defer:

- student accounts or online answering;
- per-student adaptive scheduling;
- AI-authored questions at generation time;
- automated marking or OCR;
- curriculum-standard claims before explicit mapping;
- unrestricted curriculum-lead question programming;
- complex diagrams in the first generator set.

## 15. Decisions to validate before implementation

1. Use **Spiral Practice** as the working mode name, or choose a more teacher-friendly product name.
2. Confirm whether grade-labelled presets are desirable in addition to S1–S4 skill stages.
3. Confirm the recommended default: one worksheet or a multi-worksheet series.
4. Confirm default word-problem share by stage; the current proposal gradually increases it.
5. Select the first 12–15 subskills for generator implementation rather than attempting the entire spine at once.
6. Decide whether the new mode belongs inside PEP Bullet as a second tool or within a broader PEP Teacher Tools shell.
