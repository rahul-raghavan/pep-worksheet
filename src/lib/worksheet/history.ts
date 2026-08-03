import { z } from 'zod';
import { WeeklyWorksheetManifestSchema, type WeeklyWorksheetManifest } from './schema';

const STORAGE_KEY = 'pep-weekly-worksheet-history-v1';
const MAX_HISTORY = 30;

const HistoryEntrySchema = z.object({
  id: z.string().min(1),
  generatedAt: z.string().datetime(),
  manifest: WeeklyWorksheetManifestSchema,
});

const HistorySchema = z.array(HistoryEntrySchema);

export type WorksheetHistoryEntry = z.infer<typeof HistoryEntrySchema>;

export function loadWorksheetHistory(): WorksheetHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = HistorySchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function saveWorksheetHistory(manifest: WeeklyWorksheetManifest): WorksheetHistoryEntry[] {
  const existing = loadWorksheetHistory().filter(
    (entry) => entry.manifest.manifestId !== manifest.manifestId,
  );
  const next = [
    { id: manifest.manifestId, generatedAt: new Date().toISOString(), manifest },
    ...existing,
  ].slice(0, MAX_HISTORY);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
