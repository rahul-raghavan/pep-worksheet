'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { allocateQuestionCounts } from '@/lib/worksheet/allocation';
import {
  MATHEMATICS_PACK,
  MATH_DOMAINS,
  SKILL_FAMILIES,
  getFamily,
  getSkill,
  normalizeSelectionReference,
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
  support: 'Familiar values and fewer complications within the same taught skill.',
  core: 'The expected version of a method students have already learned.',
  stretch: 'Less direct values or an additional decision within the same taught skill.',
};

const STYLE_COPY: Record<QuestionStyle, string> = {
  direct: 'The mathematics is stated directly.',
  applied: 'Students use the skill in a familiar context.',
  mixed: 'A balance of direct and applied questions where the allocation allows it.',
};

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

function selectionKey(selection: Pick<SkillSelection, 'skillId' | 'selectionType'>): string {
  return `${selection.selectionType}:${selection.skillId}`;
}

function normalizedSelections(selections: SkillSelection[]): SkillSelection[] {
  const merged = new Map<string, SkillSelection>();
  selections.forEach((selection) => {
    const reference = normalizeSelectionReference(selection.skillId, selection.selectionType);
    const normalized = { ...selection, skillId: reference.id, selectionType: reference.selectionType };
    const key = selectionKey(normalized);
    const existing = merged.get(key);
    merged.set(key, existing ? { ...existing, count: existing.count + normalized.count } : normalized);
  });
  return [...merged.values()];
}

function selectionName(selection: Pick<SkillSelection, 'skillId' | 'selectionType'>): string {
  const reference = normalizeSelectionReference(selection.skillId, selection.selectionType);
  return reference.selectionType === 'family'
    ? getFamily(reference.id).name
    : getSkill(reference.id).name;
}

function selectionEquipment(selection: SkillSelection): string[] {
  if (selection.selectionType === 'skill') return getSkill(selection.skillId).equipment ?? [];
  return getFamily(selection.skillId).targetIds.flatMap((targetId) => getSkill(targetId).equipment ?? []);
}

export default function BuilderClient({ email }: { email: string }) {
  const [title, setTitle] = useState('Weekly Mathematics Practice');
  const [groupLabel, setGroupLabel] = useState('');
  const [totalQuestions, setTotalQuestions] = useState(12);
  const [selections, setSelections] = useState<SkillSelection[]>([]);
  const [activeDomainId, setActiveDomainId] = useState(MATH_DOMAINS[0].id);
  const [search, setSearch] = useState('');
  const [manifest, setManifest] = useState<WeeklyWorksheetManifest | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState<'preview' | 'download' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<WorksheetHistoryEntry[]>([]);
  const plannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setHistory(loadWorksheetHistory()), []);
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const allocatedTotal = selections.reduce((sum, selection) => sum + selection.count, 0);
  const shallowSelections = selections.filter((selection) => selection.count < 2).length;
  const equipment = [...new Set(selections.flatMap(selectionEquipment))];
  const isValid = selections.length > 0
    && selections.length <= 8
    && new Set(selections.map(selectionKey)).size === selections.length
    && totalQuestions >= 8
    && totalQuestions <= 12
    && allocatedTotal === totalQuestions;

  const visibleFamilies = useMemo(() => {
    const query = search.trim().toLowerCase();
    return SKILL_FAMILIES.filter((family) => {
      if (!query) return family.domainId === activeDomainId;
      const targets = family.targetIds.map((targetId) => getSkill(targetId));
      return family.name.toLowerCase().includes(query)
        || family.description.toLowerCase().includes(query)
        || targets.some((target) => target.name.toLowerCase().includes(query) || target.description.toLowerCase().includes(query));
    });
  }, [activeDomainId, search]);

  function invalidate() {
    setManifest(null);
    setError(null);
  }

  function rebalance(nextSelections: SkillSelection[], nextTotal = totalQuestions): SkillSelection[] {
    if (nextSelections.length === 0) return [];
    const counts = allocateQuestionCounts(nextTotal, nextSelections.map(selectionKey));
    return nextSelections.map((selection) => ({ ...selection, count: counts[selectionKey(selection)] }));
  }

  function addSelection(skillId: string, selectionType: 'family' | 'skill') {
    if (selections.length >= 8) return;
    if (selectionType === 'family') {
      const family = getFamily(skillId);
      const hasSpecificChild = selections.some((selection) => (
        selection.selectionType === 'skill' && family.targetIds.includes(selection.skillId)
      ));
      if (hasSpecificChild) {
        setError('Remove the specific skills from this family before choosing the mixed family option.');
        return;
      }
    } else {
      const familyId = getSkill(skillId).familyId;
      if (selections.some((selection) => selection.selectionType === 'family' && selection.skillId === familyId)) {
        setError('Remove the mixed family first, then choose its specific skills.');
        return;
      }
    }
    const candidate: SkillSelection = { skillId, selectionType, band: 'core', style: 'mixed', count: 1 };
    if (selections.some((selection) => selectionKey(selection) === selectionKey(candidate))) return;
    setSelections((current) => rebalance([...current, candidate]));
    invalidate();
  }

  function updateSelection(index: number, patch: Partial<SkillSelection>) {
    setSelections((current) => current.map((selection, selectionIndex) => (
      selectionIndex === index ? { ...selection, ...patch } : selection
    )));
    invalidate();
  }

  function removeSelection(index: number) {
    setSelections((current) => rebalance(current.filter((_, selectionIndex) => selectionIndex !== index)));
    invalidate();
  }

  function changeTotal(nextTotal: number) {
    const clamped = Math.max(8, Math.min(12, nextTotal));
    setTotalQuestions(clamped);
    setSelections((current) => rebalance(current, clamped));
    invalidate();
  }

  function applyAllBand(band: Band) {
    setSelections((current) => current.map((selection) => ({ ...selection, band })));
    invalidate();
  }

  function applyAllStyle(style: QuestionStyle) {
    setSelections((current) => current.map((selection) => ({ ...selection, style })));
    invalidate();
  }

  function recipe(seed: string): WeeklyWorksheetRecipe {
    return {
      schemaVersion: 'weekly-worksheet-recipe-v1',
      subjectPackId: MATHEMATICS_PACK.id,
      title: title.trim() || 'Weekly Mathematics Practice',
      groupLabel: groupLabel.trim() || undefined,
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
    const nextSelections = normalizedSelections(saved.recipe.selections);
    const nextTotal = exact ? saved.recipe.totalQuestions : Math.min(12, saved.recipe.totalQuestions);
    setTitle(saved.recipe.title);
    setGroupLabel(saved.recipe.groupLabel ?? '');
    setTotalQuestions(nextTotal);
    setSelections(exact ? nextSelections : rebalance(nextSelections, nextTotal));
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
      <section className="builder-hero simple-builder-hero">
        <div>
          <div className="hero-kicker">PEP Elementary · cumulative practice</div>
          <h1>Build this week&apos;s mathematics review.</h1>
          <p>Choose skills the group has already learned. The generator creates one substantial, two-page worksheet—not a timed fluency test.</p>
        </div>
        <div className="default-summary" aria-label="Recommended worksheet setup">
          <span>Recommended setup</span>
          <strong>12 questions</strong>
          <strong>6 skill choices</strong>
          <strong>2 print-ready pages</strong>
          <small>These settings are ready. You only need to choose what students should revisit.</small>
        </div>
      </section>

      <div className="planner-layout" ref={plannerRef}>
        <main className="planner-main">
          <section className="planner-section content-picker-section">
            <div className="section-heading compact-heading">
              <div><span className="section-number">01</span><h2>Choose what to revisit</h2></div>
              <p>Choose a mixed family for breadth, or open it and select the exact skills you want.</p>
            </div>

            <label className="skill-search">
              <span>Find a skill</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try HCF, elapsed time or median" />
            </label>

            {!search && (
              <div className="domain-tabs" role="tablist" aria-label="Mathematics areas">
                {MATH_DOMAINS.map((domain) => {
                  const selectedCount = selections.filter((selection) => {
                    if (selection.selectionType === 'family') return getFamily(selection.skillId).domainId === domain.id;
                    return getFamily(getSkill(selection.skillId).familyId).domainId === domain.id;
                  }).length;
                  return (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeDomainId === domain.id}
                      className={activeDomainId === domain.id ? 'domain-tab-active' : ''}
                      key={domain.id}
                      onClick={() => setActiveDomainId(domain.id)}
                    >
                      <span>{domain.name}</span>{selectedCount > 0 && <b>{selectedCount}</b>}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="family-list">
              {visibleFamilies.map((family) => {
                const mixedSelected = selections.some((selection) => selection.selectionType === 'family' && selection.skillId === family.id);
                const selectedTargetIds = new Set(selections.filter((selection) => selection.selectionType === 'skill').map((selection) => selection.skillId));
                const hasSpecific = family.targetIds.some((targetId) => selectedTargetIds.has(targetId));
                const singleTargetId = family.targetIds.length === 1 ? family.targetIds[0] : null;
                const singleSelected = singleTargetId ? selectedTargetIds.has(singleTargetId) : false;
                return (
                  <article className="family-card" key={family.id}>
                    <div className="family-card-heading">
                      <div>
                        <h3>{family.name}</h3>
                        <p>{family.description}</p>
                      </div>
                      <button
                        type="button"
                        className={(mixedSelected || singleSelected) ? 'family-mix-button family-mix-selected' : 'family-mix-button'}
                        onClick={() => {
                          if (singleTargetId) {
                            if (singleSelected) removeSelection(selections.findIndex((selection) => selection.selectionType === 'skill' && selection.skillId === singleTargetId));
                            else addSelection(singleTargetId, 'skill');
                            return;
                          }
                          if (mixedSelected) removeSelection(selections.findIndex((selection) => selection.selectionType === 'family' && selection.skillId === family.id));
                          else addSelection(family.id, 'family');
                        }}
                        disabled={singleTargetId
                          ? (!singleSelected && selections.length >= 8)
                          : (!mixedSelected && (hasSpecific || selections.length >= 8))}
                      >
                        {singleTargetId
                          ? (singleSelected ? 'Skill added ✓' : 'Add this skill')
                          : (mixedSelected ? 'Mixed family added ✓' : 'Add a balanced mix')}
                      </button>
                    </div>
                    {!singleTargetId && (
                      <details open={Boolean(search)}>
                        <summary>{hasSpecific ? 'Specific skills selected' : `Choose specific skills (${family.targetIds.length})`}</summary>
                        <div className="target-grid">
                          {family.targetIds.map((targetId) => {
                            const skill = getSkill(targetId);
                            const selected = selectedTargetIds.has(targetId);
                            return (
                              <button
                                type="button"
                                className={selected ? 'target-choice target-choice-selected' : 'target-choice'}
                                key={targetId}
                                onClick={() => selected
                                  ? removeSelection(selections.findIndex((selection) => selection.selectionType === 'skill' && selection.skillId === targetId))
                                  : addSelection(targetId, 'skill')}
                                disabled={!selected && (mixedSelected || selections.length >= 8)}
                              >
                                <span>{skill.name}</span>
                                <small>{skill.description}</small>
                                <b>{selected ? 'Added ✓' : 'Add skill'}</b>
                              </button>
                            );
                          })}
                        </div>
                      </details>
                    )}
                  </article>
                );
              })}
              {visibleFamilies.length === 0 && <div className="history-empty">No skills match that search.</div>}
            </div>
          </section>

          <section className="planner-section">
            <div className="section-heading compact-heading">
              <div><span className="section-number">02</span><h2>Tune the worksheet</h2></div>
              <p>The defaults usually work. Adjust them only when the group needs something different.</p>
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
                  <input type="number" min={8} max={12} value={totalQuestions} onChange={(event) => changeTotal(Number(event.target.value))} />
                  <button type="button" onClick={() => changeTotal(totalQuestions + 1)} disabled={totalQuestions >= 12}>+</button>
                </div>
                <small>Choose 8–12 questions. Twelve is recommended for a broad weekly review.</small>
              </label>
            </div>

            {selections.length > 0 ? (
              <>
                <div className="apply-all-bar">
                  <span>Apply to all selected content</span>
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
                  {selections.map((selection, index) => (
                    <article className="skill-row compact-skill-row" key={selectionKey(selection)}>
                      <div className="skill-index">{String(index + 1).padStart(2, '0')}</div>
                      <div className="selected-skill-copy">
                        <span>{selection.selectionType === 'family' ? 'Mixed skill family' : 'Specific skill'}</span>
                        <strong>{selectionName(selection)}</strong>
                        <small>{selection.selectionType === 'family'
                          ? `Questions will be balanced across ${getFamily(selection.skillId).targetIds.length} related skills. The preview shows the exact choices.`
                          : getSkill(selection.skillId).description}</small>
                      </div>
                      <div className="selected-skill-settings">
                        <label><span>Band</span>
                          <select value={selection.band} onChange={(event) => updateSelection(index, { band: event.target.value as Band })}>
                            <option value="support">Support</option>
                            <option value="core">Core</option>
                            <option value="stretch">Stretch</option>
                          </select>
                          <small>{BAND_COPY[selection.band]}</small>
                        </label>
                        <label><span>Style</span>
                          <select value={selection.style} onChange={(event) => updateSelection(index, { style: event.target.value as QuestionStyle })}>
                            <option value="direct">Direct</option>
                            <option value="applied">Applied</option>
                            <option value="mixed">Mixed</option>
                          </select>
                          <small>{STYLE_COPY[selection.style]}</small>
                        </label>
                      </div>
                      <div className="skill-count">
                        <strong>{selection.count}</strong>
                        <span>{selection.count === 1 ? 'question' : 'questions'}</span>
                        <button type="button" onClick={() => removeSelection(index)}>Remove</button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="selection-empty">Choose content above. Six broad families or specific skills are recommended.</div>
            )}
          </section>
        </main>

        <aside className="review-card">
          <div className="review-status"><span></span>{isValid ? 'Ready to preview' : 'Choose past skills'}</div>
          <h2>Your weekly sheet</h2>
          <div className="review-stats">
            <div><strong>{totalQuestions}</strong><span>questions</span></div>
            <div><strong>{selections.length}</strong><span>choices</span></div>
            <div><strong>2</strong><span>pages</span></div>
          </div>
          <div className="review-list">
            {selections.map((selection) => (
              <div key={selectionKey(selection)}>
                <span>{selection.selectionType === 'family' ? 'Mixed: ' : ''}{selectionName(selection)}</span>
                <b>{selection.count}Q · {selection.band}</b>
              </div>
            ))}
          </div>
          {selections.length > 0 && selections.length < 6 && <div className="review-warning">Six choices are recommended for a broad weekly review. Fewer choices create more concentrated practice.</div>}
          {shallowSelections > 0 && <div className="review-warning">{shallowSelections} {shallowSelections === 1 ? 'choice has' : 'choices have'} only one question. That provides retrieval rather than sustained practice.</div>}
          {equipment.length > 0 && <div className="equipment-note">Students will need: {equipment.join(', ')}.</div>}
          {error && <div className="error-message" role="alert">{error}</div>}
          <button type="button" className="primary-action" onClick={() => openPreview()} disabled={!isValid || loading !== null}>
            {loading === 'preview' ? 'Preparing preview…' : 'Preview student PDF'}
          </button>
          <button type="button" className="secondary-action" onClick={downloadPack} disabled={!isValid || loading !== null}>
            {loading === 'download' ? 'Building pack…' : 'Download worksheet + key'}
          </button>
          <p className="action-note">Preview shows the exact precise skills and questions selected from any mixed family. Previews are not counted as downloads.</p>
        </aside>
      </div>

      <section className="history-section">
        <div className="section-heading">
          <div><span className="section-number">03</span><h2>Recent worksheets</h2></div>
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
                  <p>{normalizedSelections(entry.manifest.recipe.selections).map(selectionName).join(' · ')}</p>
                </div>
                <div className="history-actions">
                  <button type="button" onClick={() => reprintExact(entry)}>Reprint exact sheet</button>
                  <button type="button" onClick={() => loadRecipe(entry.manifest, false)}>Use this setup with fresh questions</button>
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
