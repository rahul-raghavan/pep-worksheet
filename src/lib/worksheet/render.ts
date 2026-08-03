import katex from 'katex';
import type {
  GeneratedQuestion,
  PromptSegment,
  WeeklyWorksheetManifest,
} from './schema';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderSegments(segments: PromptSegment[]): string {
  return segments
    .map((segment) => {
      if (segment.type === 'text') return `<span>${escapeHtml(segment.value)}</span>`;
      return katex.renderToString(segment.value, {
        output: 'mathml',
        throwOnError: false,
        strict: false,
      });
    })
    .join('');
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function baseStyles(): string {
  return `
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; color: #000; }
    body { font-family: Arial, Helvetica, sans-serif; }
    .page {
      width: 210mm;
      height: 296mm;
      padding: 11mm 14mm 9mm;
      page-break-after: always;
      position: relative;
      overflow: hidden;
      background: #fff;
    }
    .page:last-child { page-break-after: auto; }
    .eyebrow {
      color: #000;
      font-size: 8pt;
      font-weight: 800;
      letter-spacing: .14em;
      text-transform: uppercase;
    }
    h1, h2 { font-family: Georgia, 'Times New Roman', serif; color: #000; margin: 0; }
    h1 { font-size: 22pt; line-height: 1.05; }
    h2 { font-size: 16pt; }
    .rule { height: .45mm; background: #000; margin: 3mm 0; }
    .metadata {
      display: grid;
      grid-template-columns: 1.35fr 1fr 1fr;
      gap: 4mm;
      font-size: 9.5pt;
      margin-top: 4mm;
    }
    .field { border-bottom: .3mm solid #000; min-height: 6mm; padding-bottom: 1mm; }
    .field b { color: #000; font-size: 7.5pt; text-transform: uppercase; letter-spacing: .08em; }
    .instructions {
      margin: 3.5mm 0 2.5mm;
      color: #000;
      font-size: 8.5pt;
      display: flex;
      justify-content: space-between;
      gap: 6mm;
    }
    .questions { display: flex; flex-direction: column; }
    .question {
      display: grid;
      grid-template-columns: 8mm 1fr;
      column-gap: 2.5mm;
      border-top: .25mm solid #000;
      padding-top: 2.4mm;
      break-inside: avoid;
    }
    .question-number {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 14pt;
      line-height: 1.1;
      font-weight: 700;
      color: #000;
    }
    .prompt { font-size: 11pt; line-height: 1.38; }
    .prompt math { font-size: 112%; }
    .response { margin-top: 2mm; position: relative; }
    .response-compact { height: 12mm; }
    .response-standard { height: 22mm; }
    .response-large { height: 32mm; }
    .equipment { color: #000; font-size: 7.5pt; margin-top: 1mm; }
    .continued-header {
      display: flex;
      align-items: end;
      justify-content: space-between;
      padding-bottom: 3mm;
      border-bottom: .45mm solid #000;
      margin-bottom: 3mm;
    }
    .footer {
      position: absolute;
      bottom: 5mm;
      left: 14mm;
      right: 14mm;
      display: flex;
      justify-content: space-between;
      color: #000;
      font-size: 7pt;
      border-top: .2mm solid #000;
      padding-top: 1.5mm;
    }
    .answer-page h1 { font-size: 20pt; }
    .answer-summary { margin: 3mm 0 5mm; color: #000; font-size: 9pt; }
    .answer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5mm 6mm; }
    .answer-item {
      min-height: 14mm;
      border-bottom: .25mm solid #000;
      padding: 1.5mm 0 2mm;
      display: grid;
      grid-template-columns: 7mm 1fr;
      column-gap: 2mm;
    }
    .answer-number { color: #000; font-family: Georgia, 'Times New Roman', serif; font-weight: 700; }
    .answer-value { font-size: 10pt; line-height: 1.35; }
    .answer-meta { color: #000; font-size: 7pt; margin-top: 1mm; }
  `;
}

function renderQuestion(question: GeneratedQuestion, displayNumber: number): string {
  const equipment = question.equipment.length > 0
    ? `<div class="equipment">Use: ${question.equipment.map(escapeHtml).join(', ')}</div>`
    : '';
  return `
    <article class="question">
      <div class="question-number">${displayNumber}</div>
      <div>
        <div class="prompt">${renderSegments(question.prompt)}</div>
        ${equipment}
        <div class="response response-${question.responseSpace}"></div>
      </div>
    </article>
  `;
}

function renderFooter(manifest: WeeklyWorksheetManifest, page: number, pages: number): string {
  return `
    <footer class="footer">
      <span>PEP Schoolv2 · Weekly mathematics practice</span>
      <span>${escapeHtml(manifest.manifestId.slice(-8).toUpperCase())} · Page ${page} of ${pages}</span>
    </footer>
  `;
}

export function renderStudentHtml(manifest: WeeklyWorksheetManifest): string {
  const byId = new Map(manifest.questions.map((question) => [question.id, question]));
  const numberById = new Map(manifest.questions.map((question, index) => [question.id, index + 1]));
  const equipment = [...new Set(manifest.questions.flatMap((question) => question.equipment))];
  const pages = manifest.questionPages.map((questionIds, pageIndex) => {
    const questions = questionIds.map((id) => {
      const question = byId.get(id);
      if (!question) throw new Error(`Question ${id} is missing from the manifest.`);
      return renderQuestion(question, numberById.get(id) ?? 0);
    }).join('');

    const header = pageIndex === 0
      ? `
        <header>
          <div class="eyebrow">PEP Elementary · Weekly review</div>
          <h1>${escapeHtml(manifest.recipe.title)}</h1>
          <div class="rule"></div>
          <div class="metadata">
            <div class="field"><b>Name</b></div>
            <div class="field"><b>Group</b> ${escapeHtml(manifest.recipe.groupLabel || '')}</div>
            <div class="field"><b>Week of</b></div>
          </div>
          <div class="instructions">
            <span>Show your working clearly. These are skills you have already learned.</span>
            <span>${equipment.length > 0 ? `Equipment: ${equipment.map(escapeHtml).join(', ')}` : 'Equipment: pencil'}</span>
          </div>
        </header>
      `
      : `
        <header class="continued-header">
          <div>
            <div class="eyebrow">PEP Elementary · Weekly review</div>
            <h2>${escapeHtml(manifest.recipe.title)} · continued</h2>
          </div>
          <div class="field" style="width:58mm"><b>Name</b></div>
        </header>
      `;

    return `<section class="page">${header}<main class="questions">${questions}</main>${renderFooter(manifest, pageIndex + 1, 2)}</section>`;
  }).join('');

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${baseStyles()}</style></head><body>${pages}</body></html>`;
}

export function renderAnswerKeyHtml(manifest: WeeklyWorksheetManifest): string {
  const chunks: GeneratedQuestion[][] = [];
  for (let index = 0; index < manifest.questions.length; index += 16) {
    chunks.push(manifest.questions.slice(index, index + 16));
  }
  const pages = chunks.map((questions, pageIndex) => {
    const items = questions.map((question) => {
      const displayNumber = manifest.questions.findIndex((candidate) => candidate.id === question.id) + 1;
      return `
        <div class="answer-item">
          <div class="answer-number">${displayNumber}</div>
          <div>
            <div class="answer-value">${renderSegments(question.answer)}</div>
            <div class="answer-meta">${escapeHtml(question.skillName)} · ${titleCase(question.band)}</div>
          </div>
        </div>
      `;
    }).join('');
    return `
      <section class="page answer-page">
        <div class="eyebrow">Teacher answer key</div>
        <h1>${escapeHtml(manifest.recipe.title)}</h1>
        <div class="rule"></div>
        <div class="answer-summary">${escapeHtml(manifest.recipe.groupLabel || 'No group label')} · ${manifest.questions.length} questions · Code ${escapeHtml(manifest.manifestId.slice(-8).toUpperCase())}</div>
        <main class="answer-grid">${items}</main>
        ${renderFooter(manifest, pageIndex + 1, chunks.length)}
      </section>
    `;
  }).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${baseStyles()}</style></head><body>${pages}</body></html>`;
}
