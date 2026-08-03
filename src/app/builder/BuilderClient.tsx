'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { allocateQuestionCounts } from '@/lib/worksheet/allocation';
import {
  SKILL_CATALOG,
  WORKSHEET_PRESETS,
  getSkill,
} from '@/lib/worksheet/catalog';
import {
  loadWorksheetHistory,
  saveWorksheetHistory,
  type WorksheetHistoryEntry,
} from '@/lib/worksheet/history';
import type {
  Band,
  QuestionStyle,
  SkillSelection,
  WeeklyWorksheetManifest,
  WeeklyWorksheetRecipe,
} from '@/lib/worksheet/schema';

const BAND_COPY: Record<Band, string> = {
  support: 'Familiar version with cleaner values and fewer complications.',
  core: 'Complete, expected version of a method students have already learned.',
  stretch: 'Less direct values or an additional decision within the same taught skill.',
};

const STYLE_COPY: Record<QuestionStyle, string> = {
  direct: 'The mathematics is stated directly.',
  applied: 'Students use the skill in a familiar context.',
  mixed: 'One direct and one applied question when the skill receives two questions.',
};

function cloneSelections(selections: readonly SkillSelection[]): SkillSelection[] {
  return selections.map((selection) => ({ ...selection }));
}

function newSeed(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function groupedSkills() {
  const domains = new Map<string, typeof SKILL_CATALOG>();
  SKILL_CATALOG.forEach((skill) => {
    domains.set(skill.domain, [...(domains.get(skill.domain) ?? []), skill]);
  });
  return [...domains.entries()];
}

export default function BuilderClient({ email }: { email: string }) {
  const recommended = WORKSHEET_PRESETS[0];
  const [presetId, setPresetId] = useState<string>(recommended.id);
  const [title, setTitle] = useState('Weekly Mathematics Practice');
  const [groupLabel, setGroupLabel] = useState('');
  const [totalQuestions, setTotalQuestions] = useState<number>(recommended.totalQuestions);
  const [selections, setSelections] = useState<SkillSelection[]>(cloneSelections(recommended.selections));
  const [manifest, setManifest] = useState<WeeklyWorksheetManifest | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState<'compose' | 'preview' | 'download' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<WorksheetHistoryEntry[]>([]);
  const plannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setHistory(loadWorksheetHistory()), []);
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const domains = useMemo(groupedSkills, []);
  const allocatedTotal = selections.reduce((sum, selection) => sum + selection.count, 0);
  const shallowSkills = selections.filter((selection) => selection.count < 2).length;
  const equipment = [...new Set(selections.flatMap((selection) => getSkill(selection.skillId).equipment ?? []))];
  const isValid = selections.length > 0
    && selections.length <= 8
    && new Set(selections.map((selection) => selection.skillId)).size === selections.length
    && totalQuestions >= 8
    && totalQuestions <= 20
    && allocatedTotal === totalQuestions;

  function invalidate() {
    setManifest(null);
    setError(null);
  }

  function rebalance(nextSelections: SkillSelection[], nextTotal = totalQuestions): SkillSelection[] {
    const counts = allocateQuestionCounts(nextTotal, nextSelections.map((selection) => selection.skillId));
    return nextSelections.map((selection) => ({ ...selection, count: counts[selection.skillId] }));
  }

  function applyPreset(nextPresetId: string) {
    const preset = WORKSHEET_PRESETS.find((candidate) => candidate.id === nextPresetId);
    if (!preset) return;
    setPresetId(preset.id);
    setTotalQuestions(preset.totalQuestions);
    setSelections(cloneSelections(preset.selections));
    invalidate();
  }

  function updateSelection(index: number, patch: Partial<SkillSelection>) {
    setSelections((current) => current.map((selection, selectionIndex) => (
      selectionIndex === index ? { ...selection, ...patch } : selection
    )));
    setPresetId('custom');
    invalidate();
  }

  function changeTotal(nextTotal: number) {
    const clamped = Math.max(8, Math.min(20, nextTotal));
    setTotalQuestions(clamped);
    setSelections((current) => rebalance(current, clamped));
    setPresetId('custom');
    invalidate();
  }

  function addSkill() {
    const used = new Set(selections.map((selection) => selection.skillId));
    const nextSkill = SKILL_CATALOG.find((skill) => !used.has(skill.id));
    if (!nextSkill || selections.length >= 8) return;
    const next = rebalance([
      ...selections,
      { skillId: nextSkill.id, band: 'core', style: 'mixed', count: 1 },
    ]);
    setSelections(next);
    setPresetId('custom');
    invalidate();
  }

  function removeSkill(index: number) {
    if (selections.length === 1) return;
    setSelections((current) => rebalance(current.filter((_, selectionIndex) => selectionIndex !== index)));
    setPresetId('custom');
    invalidate();
  }

  function applyAllBand(band: Band) {
    setSelections((current) => current.map((selection) => ({ ...selection, band })));
    setPresetId('custom');
    invalidate();
  }

  function applyAllStyle(style: QuestionStyle) {
    setSelections((current) => current.map((selection) => ({ ...selection, style })));
    setPresetId('custom');
    invalidate();
  }

  function recipe(seed: string): WeeklyWorksheetRecipe {
    return {
      schemaVersion: 'weekly-worksheet-recipe-v1',
      title: title.trim() || 'Weekly Mathematics Practice',
      groupLabel: groupLabel.trim() || undefined,
      startingPointId: presetId,
      totalQuestions,
      selections,
      seed,
    };
  }

  async function responseError(response: Response): Promise<string> {
    try {
      const data = await response.json() as { error?: string };
      return data.error || 'The request could not be completed.';
    } catch {
      return 'The request could not be completed.';
    }
  }

  async function composeManifest(): Promise<WeeklyWorksheetManifest> {
    if (manifest) return manifest;
    const response = await fetch('/api/worksheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipe(newSeed())),
    });
    if (!response.ok) throw new Error(await responseError(response));
    const data = await response.json() as { manifest: WeeklyWorksheetManifest };
    setManifest(data.manifest);
    return data.manifest;
  }

  async function openPreview(sourceManifest?: WeeklyWorksheetManifest) {
    setLoading('preview');
    setError(null);
    try {
      const activeManifest = sourceManifest ?? await composeManifest();
      const response = await fetch('/api/worksheet/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifest: activeManifest }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const blob = await response.blob();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      setManifest(activeManifest);
      setPreviewOpen(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The preview could not be opened.');
    } finally {
      setLoading(null);
    }
  }

  async function downloadPack() {
    setLoading('download');
    setError(null);
    try {
      const activeManifest = await composeManifest();
      const response = await fetch('/api/worksheet/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifest: activeManifest }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      downloadBlob(await response.blob(), 'PEP Weekly Mathematics Practice Pack.zip');
      setHistory(saveWorksheetHistory(activeManifest));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The worksheet pack could not be downloaded.');
    } finally {
      setLoading(null);
    }
  }

  function loadRecipe(saved: WeeklyWorksheetManifest, exact: boolean) {
    setTitle(saved.recipe.title);
    setGroupLabel(saved.recipe.groupLabel ?? '');
    setTotalQuestions(saved.recipe.totalQuestions);
    setSelections(cloneSelections(saved.recipe.selections));
    setPresetId('custom');
    setManifest(exact ? saved : null);
    setError(null);
    plannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function reprintExact(entry: WorksheetHistoryEntry) {
    loadRecipe(entry.manifest, true);
    await openPreview(entry.manifest);
  }

  return (
    <div className="builder-shell">
      <section className="builder-hero">
        <div>
          <div className="hero-kicker">PEP Elementary · cumulative practice</div>
          <h1>Build this week&apos;s mathematics review.</h1>
          <p>
            Choose mathematics the group has already learned. The generator creates one substantial,
            two-page worksheet for Monday to Friday—not a timed fluency test.
          </p>
        </div>
        <div className="week-ribbon" aria-label="Weekly worksheet rhythm">
          {[
            ['Mon', 'Receive'],
            ['Tue', 'Begin'],
            ['Wed', 'Continue'],
            ['Thu', 'Check'],
            ['Fri', 'Submit'],
          ].map(([day, action], index) => (
            <div className="week-ribbon-day" key={day}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{day}</strong>
              <small>{action}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="preset-section" aria-labelledby="starting-point-heading">
        <div className="section-heading">
          <div>
            <span className="section-number">01</span>
            <h2 id="starting-point-heading">Choose a starting point</h2>
          </div>
          <p>Each starting point selects six sensible skills. You can change every choice below.</p>
        </div>
        <div className="preset-grid">
          {WORKSHEET_PRESETS.map((preset) => (
            <button
              type="button"
              key={preset.id}
              className={`preset-card ${presetId === preset.id ? 'preset-card-active' : ''}`}
              onClick={() => applyPreset(preset.id)}
            >
              <span>{preset.name}</span>
              <small>{preset.description}</small>
              <b>{preset.totalQuestions} questions · 2 pages</b>
            </button>
          ))}
        </div>
      </section>

      <div className="planner-layout" ref={plannerRef}>
        <main className="planner-main">
          <section className="planner-section">
            <div className="section-heading compact-heading">
              <div><span className="section-number">02</span><h2>Set up the week</h2></div>
              <p>Group information is optional and remains in this browser&apos;s worksheet history.</p>
            </div>
            <div className="field-grid">
              <label>
                <span>Worksheet title</span>
                <input value={title} onChange={(event) => { setTitle(event.target.value); invalidate(); }} maxLength={80} />
              </label>
              <label>
                <span>Group label <em>optional</em></span>
                <input value={groupLabel} onChange={(event) => { setGroupLabel(event.target.value); invalidate(); }} placeholder="e.g. Blue Group" maxLength={60} />
              </label>
              <label>
                <span>Total questions</span>
                <div className="number-control">
                  <button type="button" onClick={() => changeTotal(totalQuestions - 1)} disabled={totalQuestions <= 8}>−</button>
                  <input type="number" min={8} max={20} value={totalQuestions} onChange={(event) => changeTotal(Number(event.target.value))} />
                  <button type="button" onClick={() => changeTotal(totalQuestions + 1)} disabled={totalQuestions >= 20}>+</button>
                </div>
                <small>8–20 questions; space-heavy choices may require fewer.</small>
              </label>
            </div>
          </section>

          <section className="planner-section">
            <div className="section-heading compact-heading">
              <div><span className="section-number">03</span><h2>Choose past skills</h2></div>
              <p>Six is recommended for cumulative review. Choose only skills this group has already been taught.</p>
            </div>

            <div className="apply-all-bar">
              <span>Apply to all</span>
              <label>Band
                <select defaultValue="core" onChange={(event) => applyAllBand(event.target.value as Band)}>
                  <option value="support">Support</option>
                  <option value="core">Core</option>
                  <option value="stretch">Stretch</option>
                </select>
              </label>
              <label>Question style
                <select defaultValue="mixed" onChange={(event) => applyAllStyle(event.target.value as QuestionStyle)}>
                  <option value="direct">Direct practice</option>
                  <option value="applied">Applied or worded</option>
                  <option value="mixed">Mixed</option>
                </select>
              </label>
            </div>

            <div className="skill-list">
              {selections.map((selection, index) => {
                const skill = getSkill(selection.skillId);
                return (
                  <article className="skill-row" key={`${selection.skillId}-${index}`}>
                    <div className="skill-index">{String(index + 1).padStart(2, '0')}</div>
                    <div className="skill-controls">
                      <label className="skill-select-label">
                        <span>Previously taught skill</span>
                        <select
                          value={selection.skillId}
                          onChange={(event) => updateSelection(index, { skillId: event.target.value })}
                        >
                          {domains.map(([domain, skills]) => (
                            <optgroup label={domain} key={domain}>
                              {skills.map((candidate) => (
                                <option
                                  key={candidate.id}
                                  value={candidate.id}
                                  disabled={selections.some((selected, selectedIndex) => selected.skillId === candidate.id && selectedIndex !== index)}
                                >
                                  {candidate.name}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        <small>{skill.description}</small>
                      </label>
                      <label>
                        <span>Practice band</span>
                        <select value={selection.band} onChange={(event) => updateSelection(index, { band: event.target.value as Band })}>
                          <option value="support">Support</option>
                          <option value="core">Core</option>
                          <option value="stretch">Stretch</option>
                        </select>
                        <small>{BAND_COPY[selection.band]}</small>
                      </label>
                      <label>
                        <span>Question style</span>
                        <select value={selection.style} onChange={(event) => updateSelection(index, { style: event.target.value as QuestionStyle })}>
                          <option value="direct">Direct practice</option>
                          <option value="applied">Applied or worded</option>
                          <option value="mixed">Mixed</option>
                        </select>
                        <small>{STYLE_COPY[selection.style]}</small>
                      </label>
                    </div>
                    <div className="skill-count">
                      <strong>{selection.count}</strong>
                      <span>{selection.count === 1 ? 'question' : 'questions'}</span>
                      {selections.length > 1 && <button type="button" onClick={() => removeSkill(index)}>Remove</button>}
                    </div>
                  </article>
                );
              })}
            </div>
            <button type="button" className="add-skill-button" onClick={addSkill} disabled={selections.length >= 8 || selections.length >= totalQuestions}>
              + Add another skill
            </button>
          </section>
        </main>

        <aside className="review-card">
          <div className="review-status"><span></span>{isValid ? 'Ready to preview' : 'Check the settings'}</div>
          <h2>Your weekly sheet</h2>
          <div className="review-stats">
            <div><strong>{totalQuestions}</strong><span>questions</span></div>
            <div><strong>{selections.length}</strong><span>skills</span></div>
            <div><strong>2</strong><span>pages</span></div>
          </div>
          <div className="review-list">
            {selections.map((selection) => (
              <div key={selection.skillId}>
                <span>{getSkill(selection.skillId).name}</span>
                <b>{selection.count}Q · {selection.band}</b>
              </div>
            ))}
          </div>
          {shallowSkills > 0 && (
            <div className="review-warning">{shallowSkills} {shallowSkills === 1 ? 'skill has' : 'skills have'} only one question. That is broad retrieval rather than sustained practice.</div>
          )}
          {equipment.length > 0 && <div className="equipment-note">Students will need: {equipment.join(', ')}.</div>}
          {error && <div className="error-message" role="alert">{error}</div>}
          <button type="button" className="primary-action" onClick={() => openPreview()} disabled={!isValid || loading !== null}>
            {loading === 'preview' ? 'Preparing preview…' : 'Preview student PDF'}
          </button>
          <button type="button" className="secondary-action" onClick={downloadPack} disabled={!isValid || loading !== null}>
            {loading === 'download' ? 'Building pack…' : 'Download worksheet + key'}
          </button>
          <p className="action-note">Preview first. Downloads are saved to chronological history; previews are not.</p>
        </aside>
      </div>

      <section className="history-section">
        <div className="section-heading">
          <div><span className="section-number">04</span><h2>Recent worksheets</h2></div>
          <p>Reprint the identical questions or reuse the setup with fresh variants.</p>
        </div>
        {history.length === 0 ? (
          <div className="history-empty">Your downloaded worksheets will appear here in chronological order.</div>
        ) : (
          <div className="history-list">
            {history.map((entry) => (
              <article className="history-item" key={entry.id}>
                <div>
                  <time>{new Date(entry.generatedAt).toLocaleString()}</time>
                  <h3>{entry.manifest.recipe.groupLabel || entry.manifest.recipe.title}</h3>
                  <p>{entry.manifest.recipe.selections.map((selection) => getSkill(selection.skillId).name).join(' · ')}</p>
                </div>
                <div className="history-actions">
                  <button type="button" onClick={() => reprintExact(entry)}>Reprint exact sheet</button>
                  <button type="button" onClick={() => loadRecipe(entry.manifest, false)}>Reuse setup with fresh questions</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {previewOpen && previewUrl && (
        <div className="preview-overlay" role="dialog" aria-modal="true" aria-label="Student worksheet preview">
          <div className="preview-modal">
            <div className="preview-header">
              <div><span>Student-facing PDF</span><h2>Two-page print preview</h2></div>
              <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Close preview">×</button>
            </div>
            <iframe src={previewUrl} title="Student worksheet PDF preview" />
            <div className="preview-footer">
              <p>The complete download includes this worksheet, a teacher answer key, and the reusable worksheet record.</p>
              <button type="button" className="secondary-action" onClick={() => setPreviewOpen(false)}>Continue editing</button>
              <button type="button" className="primary-action" onClick={downloadPack} disabled={loading !== null}>
                {loading === 'download' ? 'Building pack…' : 'Download worksheet + key'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="signed-in-note">Signed in as {email}</div>
    </div>
  );
}
