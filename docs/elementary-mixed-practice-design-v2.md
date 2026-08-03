# Elementary Mixed Practice Builder — Revised Product and Content Plan

Status: Working proposal; no application implementation

Audience: PEP elementary mathematics teachers and curriculum leads

Curriculum reference: `PEP Elementary Curriculum Book v2 - Math - Integrated Flow.csv`
This document supersedes the earlier series-based proposal.

## 1. Decision summary

Build a teacher tool for creating **one weekly mixed worksheet**. The teacher chooses what a small group has already learned and now needs to revisit.

The recommended worksheet contains:

- six previously taught skills;
- a local practice band for each skill;
- a question style for each skill;
- 12 substantial written questions by default, with an allowed range of 8–20;
- enough working space for written methods;
- no more than two A4 pages, designed for back-to-back printing;
- an answer key and a saved reusable setup.

Remove from the ordinary workflow:

- worksheet-series phases;
- “Practise often”, “Practise regularly” and “Keep in review”;
- recurrence weights;
- target dates and progress trackers;
- assessment-manifest imports;
- automatic judgements about what a group should learn next.

The teacher closes the loop through observation. The tool makes the next iteration easy but does not pretend to know more than the teacher does.

## 2. Why the frequency labels are no longer relevant

The earlier labels translated allocation weights across a long worksheet series:

- **Often** meant that a skill appeared on almost every sheet;
- **Regularly** meant that it appeared on some sheets;
- **Keep in review** meant occasional maintenance practice.

They were not related to students working in groups of four, nor did they imply that four skills should be practised at once.

Once the product creates one weekly sheet, the teacher needs visible question counts, not recurrence language. For example:

- Long division — 2 questions;
- Fraction addition — 2 questions;
- Angle vocabulary — 2 questions.

There is no benefit in labelling a skill “Often” when each generation event produces one worksheet. The teacher decides what returns next week by editing or reusing the previous setup.

## 3. Teaching job

> The teacher needs to give a small group one cumulative weekly worksheet covering previously taught mathematics, so that students revisit older learning and the teacher can adjust the following week’s selection from observation.

The product supports a classroom of roughly 20 students divided into small groups. Each group receives its worksheet on Monday morning, works on it during the week and submits it on Friday morning. Different groups may receive different worksheets. The teacher may not record complete item-level data and should not be required to do so.

The action after a worksheet is simple:

1. observe how the group worked;
2. decide whether to repeat, lower, raise or replace a focus skill;
3. reopen the previous setup;
4. adjust it and generate a fresh sheet.

## 4. Weekly worksheet model

The generator always produces one worksheet. There is no worksheet-count control and no series logic.

The worksheet is one weekly assignment:

- issued on Monday;
- completed gradually during the school week;
- submitted on Friday;
- reviewed by the teacher before creating the next worksheet.

The student PDF must fit on at most two A4 pages so it can be printed front and back on one sheet of paper. The answer key is separate teacher material.

## 5. How many skills at a time?

### Recommended default: six previously taught skills

Two skills would be appropriate for a short intervention sheet, but it is too narrow for this weekly cumulative-review purpose. Six skills gives students repeated contact with a meaningful cross-section of older learning.

Six is a default, not a hard requirement. Teachers may remove or add skills when a group needs a different mix. The tool should make the six-skill path easiest and warn—not block—when the selected question count produces very shallow coverage.

Suggested allocation:

| Selected skills | Default question allocation                                                |
| --------------- | -------------------------------------------------------------------------- |
| 1–3             | Concentrated practice; teacher has deliberately narrowed the weekly review |
| 4–5             | Broader review with two or more questions on most skills                   |
| 6               | Recommended: 12 questions normally gives two questions per skill           |
| 7–8             | Very broad retrieval; warn when any skill receives only one question       |

Do not show weights. Show and let the teacher edit the actual question count beside each skill.

## 6. Primary teacher workflow

1. Start from a recent worksheet, a preset or a blank selection.
2. Optionally enter a group label, such as “Blue Group”.
3. Choose six previously taught subskills.
4. Accept the default **Core** band and **Mixed** question style for all six, or adjust individual skills.
5. Accept 12 questions or choose any total from 8–20.
6. Review the visible question count beside each skill.
7. Review the exact student preview and confirm that it fits within two pages.
8. Download the worksheet and answer key.

The page should open with a useful example already selected. A teacher should not face an empty configuration.

### Essential choices

| Choice          | Default                | Teacher-facing explanation                                                                 |
| --------------- | ---------------------- | ------------------------------------------------------------------------------------------ |
| Output          | One two-page worksheet | Creates one Monday-to-Friday sheet for front-and-back printing.                            |
| Review skills   | Six                    | Revisits a broad sample of previously taught mathematics.                                  |
| Practice band   | Core                   | Uses a complete, familiar version of a procedure the group has already learned.            |
| Question style  | Mixed                  | Combines direct written practice with applications or vocabulary appropriate to the skill. |
| Total questions | 12                     | Normally gives two questions per skill with useful working space across two pages.         |

### Optional controls

- group label;
- exact question count per skill;
- fewer or more than six selected skills;
- apply one band or question style to all skills, then override selected rows;
- mostly direct or mostly applied questions;
- include a small number of explanation/error-analysis questions;
- permitted tools, such as ruler, protractor, compass or graph paper.

Seeds, fingerprints, generator names and content versions remain invisible.

## 7. Admission rule: previously taught practice only

Every generated item must satisfy this rule:

> A student who has received the selected lesson should recognize the mathematical object and the expected method. The worksheet may require effort and written work, but it must not introduce a new concept, notation, theorem, representation or problem structure.

The interface should say:

> Choose only skills this group has already been taught. These worksheets provide practice; they do not introduce new mathematics.

The system must not silently add prerequisites or a “next level” skill. It may warn about a likely prerequisite, but the teacher decides whether to include it.

## 8. This is written practice, not automaticity

Math Bullet and Elementary Mixed Practice need different question admission tests.

| Math Bullet                                   | Elementary Mixed Practice                                       |
| --------------------------------------------- | --------------------------------------------------------------- |
| Mental, rapid, answer-only                    | Paper-and-pencil with working                                   |
| High question volume                          | Lower volume and substantial questions                          |
| Direct retrieval or one rehearsed mental move | Full procedures, representations, applications and explanations |
| Small facts may be valid targets              | Small facts normally appear only inside a larger procedure      |
| Tight time limit                              | Usually untimed or given a generous classroom period            |

Do not reuse Bullet templates merely because the mathematical topic matches.

## 9. Written-operation rules

Direct operation questions should require an actual written method.

### Addition and subtraction

- Minimum direct calculation: four-digit numbers.
- Include regrouping, exchange across zero and estimation according to band.
- Word problems should use quantities that require the intended written method.
- Avoid isolated facts such as `8 + 7` or `13 − 6`.

### Multiplication

- Minimum direct calculation: a four-digit multiplicand by a one-digit multiplier.
- Core and Stretch may use two- or three-digit multipliers when already taught.
- Include estimation, partial-product inspection or error analysis when useful.
- Avoid isolated table questions such as `7 × 5`.

### Division

- Minimum direct calculation: a four-digit dividend.
- Use one-digit divisors at Support and one- or two-digit divisors at Core, subject to the selected taught skill.
- Include exact quotients, remainders and contextual remainder interpretation.
- Avoid isolated fact questions such as `40 ÷ 5`.

### Important exception

Do not inflate numbers when calculation is not the target. A fraction-equivalence, angle-vocabulary or data-reading question may use friendly values so that unrelated arithmetic does not obscure the selected skill.

### Example operation bands

| Skill                        | Support                                                | Core                                                      | Stretch                                                                           |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Written addition/subtraction | Four-digit values with a limited number of regroupings | Four- to six-digit values, multiple regroupings and zeros | Multiple terms, missing digits, decimals or error analysis when taught            |
| Long multiplication          | Four-digit × one-digit                                 | Four-digit × two-digit                                    | Four-digit × three-digit, missing partial products or estimation checks           |
| Long division                | Four-digit ÷ one-digit                                 | Four-digit ÷ two-digit, including remainders              | Larger dividends, interpretation, decimal quotients or error analysis when taught |

These are local bands within a taught skill. They are not grade labels and do not introduce a later algorithm.

## 10. Question-style model

Use three teacher-facing choices:

- **Direct practice** — the mathematics is stated directly;
- **Applied or worded** — students use the selected mathematics in a context;
- **Mixed** — recommended combination.

The meaning of “direct” adapts to the skill:

| Skill family             | Direct practice may include                                               | Applied or worded may include                                      |
| ------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Operations               | Written calculations, missing digits, inspect a worked method             | Realistic one- or multi-step contexts requiring the algorithm      |
| Fractions/decimals/ratio | Calculate, compare, order, convert or represent                           | Quantities, rates, money, measures and sharing contexts            |
| Geometry                 | Vocabulary, classify, identify relationships, calculate from stated facts | Perimeter/area/angle situations and geometric reasoning in context |
| Measurement              | Convert units or apply a known formula                                    | Time, temperature, capacity, distance and design contexts          |
| Data/probability         | Read a table/graph or calculate a statistic                               | Interpret and compare a dataset or chance situation                |
| Algebra/coordinates      | Manipulate, solve, substitute or plot                                     | Translate a situation into an expression, equation or graph        |

“Word problem” remains a format, not a mathematical skill.

### Text-only geometry in the first release

Do not render geometry figures in the generated prompt. Geometry questions may:

- ask for vocabulary or a definition;
- describe a figure or relationship in words and ask the student to classify it;
- provide all required measurements in text;
- ask the student to draw, construct or label a figure;
- ask the student to draw an angle of a stated size;
- ask the student to explain a familiar geometric relationship.

Drawing questions must receive a suitably large blank response area and list any required equipment, such as a ruler, protractor or compass. Defer questions that require students to interpret a system-generated shape, angle diagram, net or coordinate grid.

## 11. Word-problem rules

- Use a mathematical structure the group has already encountered.
- Require the selected written procedure; do not disguise a one-digit fact in a long paragraph.
- Keep quantities realistic for the context.
- Vary the unknown position and semantic structure, not only names and objects.
- Support uses direct one-step applications.
- Core may require selecting the operation or completing two connected steps.
- Stretch may include relevant conversions, interpreting remainders or explaining a result, but not an untaught modelling structure.
- Avoid unnecessary reading difficulty, culturally obscure contexts and implausible measurements.

## 12. Curriculum-derived skill catalog

The curriculum contains 42 units ranging from four-digit operations and place value through geometry, statistics, scientific notation and non-decimal bases. Its flow is valuable for teaching, but the worksheet catalog should be organized by practice-ready subskill.

### A. Whole numbers and number systems

- read, write and represent numbers to 1,000,000 and beyond;
- digit value, place-value decomposition and comparison;
- rounding and estimation;
- powers of ten;
- scientific notation;
- convert and operate in familiar non-decimal bases after instruction.

### B. Written operations

- four-digit and larger addition;
- four-digit and larger subtraction;
- long multiplication, from four-digit × one-digit through four-digit × three-digit;
- long division, including two-digit divisors;
- estimate and check written operations;
- interpret remainders;
- operation-based word problems.

### C. Multiplicative structure and number properties

- multiplication and division meanings;
- factors and multiples;
- prime and composite numbers;
- divisibility tests for 2, 3, 4, 5, 6, 8, 9 and 11;
- prime factorization;
- GCF/HCF and LCM;
- squares, cubes and exponents;
- square and cube roots of exact values;
- signed-number operations.

Multiplication facts may be prerequisites, but isolated fact drills belong in Math Bullet rather than this worksheet builder.

### D. Fractions

- unit, non-unit, proper, improper and mixed fractions;
- equivalent fractions;
- compare and order fractions;
- use benchmarks and number lines;
- generate and use a common denominator;
- add and subtract fractions, including unlike denominators;
- simplify using common factors;
- multiply and divide fractions;
- fraction of a quantity;
- fraction rate and contextual applications.

### E. Decimals, ratio and percentage

- decimal place value and comparison;
- fraction–decimal conversion;
- decimal addition and subtraction;
- decimal multiplication and division;
- ratio notation and equivalent ratios;
- percentage and fraction–percentage links;
- simple proportion;
- scale and map applications;
- money applications.

### F. Measurement and time

- perimeter of regular and irregular figures;
- read length accurately;
- convert length, mass and capacity units;
- clock reading, calendars and elapsed time;
- temperature and change in temperature;
- area of rectangles and parallelograms;
- area of triangles and trapezoids;
- area of circles and sectors;
- volume of rectangular and other right prisms;
- surface area of solids.

### G. Geometry

- straight and curved lines;
- points, endpoints, segments, rays and lines;
- horizontal, vertical and oblique lines;
- intersecting, perpendicular and parallel lines;
- open and closed figures;
- polygons from triangles through decagons;
- regular and irregular polygons;
- angle vocabulary and acute, right, obtuse, straight and reflex angles;
- measure and draw angles;
- adjacent, linear-pair, vertical, complementary and supplementary angles;
- positions formed by a transversal;
- polygon diagonals and interior/exterior angle sums;
- congruence, similarity and equal area;
- ruler-and-compass constructions after instruction;
- circle vocabulary, circumference, arc length and π;
- geometric equivalence and area transformations;
- Pythagorean theorem and grid applications;
- identify solids, faces, edges and vertices;
- recognize and reason with nets;
- Euler characteristic.

### H. Algebra, patterns and graphs

- balance and solve one-step equations;
- translate words into symbols;
- substitute into expressions;
- plot points and straight-line graphs;
- interpret slope triangles and `y = mx + c` after instruction.

### I. Data and probability

- tally tables and pictographs;
- read and construct bar graphs;
- frequency displays and strip graphs;
- mode, median and mean;
- compare datasets and describe distribution;
- histograms and box plots;
- simple probability;
- expected value after instruction.

## 13. Turning curriculum units into worksheet skills

The curriculum file mixes four kinds of content. They should not all become generator buttons in the same way.

| Curriculum content                        | Treatment in the worksheet builder                                                             |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Practice-ready exit skill                 | Expose as a selectable subskill.                                                               |
| Material-based concept introduction       | Do not reproduce as a first lesson; generate symbolic or applied practice only after teaching. |
| Vocabulary and classification             | Generate short recall, recognition and application items.                                      |
| Discovery, proof, construction or project | Offer only through a specialist template with the required tools and space, or defer.          |

Examples of material-first or activity-heavy work include discovering π with string, building nets, compass constructions, tessellation design, Euclid-plate proof and building non-decimal bases. The worksheet may revisit the resulting knowledge, but should not imitate the original lesson badly on paper.

## 14. Skill-definition requirements

Before a subskill enters the generator, define:

- a stable skill and subskill ID;
- a teacher-facing description of what students are assumed to know;
- prerequisites shown as warnings only;
- Support, Core and Stretch descriptors specific to that subskill;
- allowed direct, applied and explanation formats;
- parameter constraints and realistic contexts;
- answer representation;
- required equipment or diagram type;
- exclusions describing what would count as new learning;
- question and solution fingerprints to avoid accidental repeats.

This granularity fixes the original database problem. “Angles” is too broad; “classify angle types”, “measure an angle” and “use complementary angles” must be separate selectable subskills.

## 15. Recent-work reuse and the teacher feedback loop

Do not ask teachers to maintain student records or import files. Save a small **Recent worksheets** list under their login:

- group label, if supplied;
- date;
- selected skills;
- bands and question styles;
- question counts;
- the immutable generated worksheet;
- a **Reprint this exact worksheet** action;
- a **Use this setup with fresh questions** action.

When the teacher returns, they can duplicate the setup and make a quick judgement:

- **Repeat with fresh questions**;
- **Make this skill more supported**;
- **Keep the skill and change the question style**;
- **Replace this skill**.

This supports the real classroom feedback loop without claiming to automate diagnosis.

History is chronological rather than organized into a student-tracking system. An optional group label makes entries easier to recognize, but no student roster or performance record is required.

**Reprint this exact worksheet** must render from the saved manifest so every prompt, question number and answer remains identical. **Use this setup with fresh questions** copies the saved recipe and deliberately generates a new manifest.

## 16. Presets

Presets should describe a teaching job, not a grade.

| Preset                          | Default focus                                                 | Output                                                 |
| ------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------ |
| Weekly cumulative review        | Six teacher-selected skills from across prior learning        | 12 questions, mixed style, two pages                   |
| Written methods review          | Six operation, fraction, decimal or measurement subskills     | 12 questions, mostly direct, two pages                 |
| Language and application review | Six geometry, measurement, data or applied-number subskills   | 12 questions, vocabulary and applied prompts           |
| Mostly worded review            | Six teacher-selected skills that support contextual questions | 10 questions, mostly applied with larger working areas |

The teacher may also start from **Choose my own six skills**.

## 17. Live summary and preview

Show a plain-language summary such as:

> Blue Group will receive one 12-question weekly worksheet covering six previously taught skills, with two questions on each skill. It will print on two A4 pages. Long multiplication, fraction operations, unit conversion and data averages use Core practice; angle vocabulary and polygon properties use Support practice. Students need pencils, a ruler and a protractor.

Preview the actual student PDF, not sample cards. Show:

- confirmation that the student worksheet fits within two pages;
- selected skills and counts;
- required equipment;
- warnings about too many skills, cramped layout or unavailable question types.

## 18. Output package

### Student material

- exactly one worksheet of no more than two A4 pages;
- page 1 and page 2 designed for front-and-back printing;
- title, optional group name, student name and date;
- clear working space matched to the task;
- no answer vault or workbook tracker.

### Teacher material

- compact answer key for the generated worksheet;
- skill and band beside each answer;
- saved reusable setup and immutable internal manifest.

### Two-page layout budget

Every question template carries a response-space class:

- **Compact** — short vocabulary, classification or conversion response;
- **Standard** — one written calculation or short applied response;
- **Large** — long division, multi-step word problem, explanation or student drawing.

The composer plans both pages before generating the PDF. It must fit the selected items and their working areas within the two-page budget. It may vary the number of questions per page, but must not shrink type or answer space below the print standard.

Twenty questions will be feasible only when many are Compact. A configuration with long algorithms, drawings or multi-step applications may need closer to 8–12. The preview should explain this before generation and recommend a lower count when necessary.

## 19. Example configuration

**Group:** Falcons

**Output:** One weekly worksheet, 12 questions, two pages

| Review skill                                 | Band    | Style             | Count |
| -------------------------------------------- | ------- | ----------------- | ----: |
| Place value: compare and round large numbers | Core    | Direct            |     2 |
| Long multiplication: four-digit × two-digit  | Core    | Mixed             |     2 |
| Fraction addition with unlike denominators   | Core    | Mixed             |     2 |
| Metric unit conversion                       | Core    | Applied or worded |     2 |
| Angles: vocabulary and familiar angle facts  | Support | Mixed             |     2 |
| Data: mean, median and mode                  | Core    | Mixed             |     2 |

Acceptable operation items include:

- `4,306 × 27`;
- complete a missing partial product in a worked multiplication;
- estimate whether a stated product is reasonable;
- a context requiring `2,475 × 16`.

Acceptable geometry items include:

- recall the meaning of acute, obtuse, straight and reflex;
- identify the likely angle type from a written description of a turn;
- use a familiar angle fact when all measurements are stated in text;
- draw and label a 65° acute angle using a protractor.

The sheet should distribute the six skills across both pages and avoid placing both questions from a skill consecutively unless the second explicitly builds on the first.

## 20. Recovery and safeguards

- If a requested combination has too few valid variants, explain which subskill/style/band is short and suggest a specific adjustment.
- Never silently substitute an unselected skill or later concept.
- If the selected questions cannot fit legibly on two pages, ask the teacher to reduce the question count or replace a space-heavy format.
- Warn when the selected question total gives fewer than two questions to most selected skills, while allowing deliberate broad retrieval.
- Do not generate geometry figures in the first release.
- Preserve the setup if generation fails.
- Preview does not count as a download.

## 21. Five-minute interruption test

A teacher selects six skills for Blue Group, is interrupted and returns later. The page still shows:

- Blue Group;
- the six selected subskills;
- each band and style;
- two questions per skill;
- one 12-question, two-page worksheet.

The teacher can understand the state without remembering weights, phases or scheduling rules.

## 22. First-release recommendation

Build only the one-worksheet workflow. Do not include a worksheet-count selector or matching-form concept.

Begin with a carefully chosen subset of curriculum skills that represent the major generator types:

1. four-digit and larger addition/subtraction;
2. long multiplication;
3. long division;
4. factors, primes, GCF/HCF and LCM;
5. fraction equivalence and ordering;
6. fraction operations;
7. decimal operations;
8. ratio and percentage;
9. perimeter, area and unit conversion;
10. angle vocabulary and familiar angle facts;
11. data interpretation and averages;
12. introductory equations.

This set tests written algorithms, exact arithmetic, word problems, vocabulary, tables/data and student-created drawings without attempting all 42 curriculum units at once.

## 23. Confirmed decisions

The following decisions are confirmed:

1. Generate exactly one worksheet.
2. Use six previously taught skills as the default.
3. Default to 12 questions and allow 8–20, subject to the two-page layout budget.
4. Use text-only geometry prompts; student drawing tasks are permitted.
5. Keep a chronological history with exact reprint and fresh-question reuse actions.
