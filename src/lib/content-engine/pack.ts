/**
 * Subject-neutral content definitions used by every worksheet pack.
 *
 * The core engine deliberately uses "practice target" rather than "skill" so
 * a subject pack can present the same structure as grammar areas, scientific
 * concepts, historical topics, or any other teacher-friendly term.
 */
export interface ContentDomainDefinition {
  id: string;
  name: string;
  description: string;
}

export interface ContentFamilyDefinition {
  id: string;
  domainId: string;
  name: string;
  description: string;
  targetIds: string[];
  hidden?: boolean;
}

export interface PracticeTargetDefinition {
  id: string;
  familyId: string;
  name: string;
  description: string;
  assumedKnowledge: string;
  equipment?: string[];
}

export interface SubjectPackLabels {
  subject: string;
  domain: string;
  family: string;
  target: string;
  targetPlural: string;
}

export interface SubjectContentPack {
  id: string;
  version: string;
  name: string;
  labels: SubjectPackLabels;
  domains: ContentDomainDefinition[];
  families: ContentFamilyDefinition[];
  targets: PracticeTargetDefinition[];
}

export interface SubjectPackIndex {
  pack: SubjectContentPack;
  domainsById: Map<string, ContentDomainDefinition>;
  familiesById: Map<string, ContentFamilyDefinition>;
  targetsById: Map<string, PracticeTargetDefinition>;
}

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  values.forEach((value) => {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  });
  return [...repeated];
}

export function indexSubjectPack(pack: SubjectContentPack): SubjectPackIndex {
  const repeatedIds = duplicates([
    ...pack.domains.map((domain) => `domain:${domain.id}`),
    ...pack.families.map((family) => `family:${family.id}`),
    ...pack.targets.map((target) => `target:${target.id}`),
  ]);
  if (repeatedIds.length > 0) {
    throw new Error(`Duplicate content IDs in ${pack.id}: ${repeatedIds.join(', ')}`);
  }

  const domainsById = new Map(pack.domains.map((domain) => [domain.id, domain]));
  const familiesById = new Map(pack.families.map((family) => [family.id, family]));
  const targetsById = new Map(pack.targets.map((target) => [target.id, target]));

  pack.families.forEach((family) => {
    if (!domainsById.has(family.domainId)) {
      throw new Error(`Family ${family.id} refers to unknown domain ${family.domainId}.`);
    }
    family.targetIds.forEach((targetId) => {
      const target = targetsById.get(targetId);
      if (!target) throw new Error(`Family ${family.id} refers to unknown target ${targetId}.`);
      if (target.familyId !== family.id) {
        throw new Error(`Target ${target.id} belongs to ${target.familyId}, not ${family.id}.`);
      }
    });
  });

  pack.targets.forEach((target) => {
    if (!familiesById.has(target.familyId)) {
      throw new Error(`Target ${target.id} refers to unknown family ${target.familyId}.`);
    }
  });

  return { pack, domainsById, familiesById, targetsById };
}

export function resolvePracticeTargetIds(
  index: SubjectPackIndex,
  contentId: string,
  selectionType: 'family' | 'skill',
): string[] {
  if (selectionType === 'family') {
    const family = index.familiesById.get(contentId);
    if (!family) throw new Error(`Unknown ${index.pack.labels.family.toLowerCase()}: ${contentId}`);
    return [...family.targetIds];
  }
  if (!index.targetsById.has(contentId)) {
    throw new Error(`Unknown ${index.pack.labels.target.toLowerCase()}: ${contentId}`);
  }
  return [contentId];
}
