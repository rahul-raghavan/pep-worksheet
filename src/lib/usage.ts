import type { WeeklyWorksheetManifest } from '@/lib/worksheet/schema';
import { z } from 'zod';

const EVENT_TABLE = 'worksheet_download_events';

export type UsageTrackingStatus = 'recorded' | 'not_configured' | 'failed';

export interface SkillUsageSummary {
  skillId: string;
  skillName: string;
  familyName?: string;
  domainName?: string;
  questionCount: number;
}

export interface WorksheetDownloadEvent {
  id: string;
  user_id: string;
  teacher_email: string;
  event_type: 'weekly_worksheet_pack_downloaded';
  tool_mode: 'weekly_mixed_review';
  manifest_id: string;
  starting_point_id: string;
  total_questions: number;
  skill_count: number;
  skill_summary: SkillUsageSummary[];
  band_summary: Record<string, number>;
  style_summary: Record<string, number>;
  kind_summary: Record<string, number>;
  application_version: string;
  created_at: string;
}

export interface UsageTrackingResult {
  status: UsageTrackingStatus;
  detail?: string;
}

export interface TeacherUsageSummary {
  email: string;
  downloads: number;
  questions: number;
  lastDownload: string;
  topSkills: string[];
}

export interface NamedUsageCount {
  id: string;
  name: string;
  downloads: number;
  questions?: number;
}

export interface UsageReport {
  status: Exclude<UsageTrackingStatus, 'recorded'> | 'connected';
  detail?: string;
  totalDownloads: number;
  activeTeachers: number;
  downloadsLast7Days: number;
  teachers: TeacherUsageSummary[];
  startingPoints: NamedUsageCount[];
  skills: NamedUsageCount[];
  bands: NamedUsageCount[];
  styles: NamedUsageCount[];
  recent: WorksheetDownloadEvent[];
}

const SkillUsageSummarySchema = z.object({
  skillId: z.string(),
  skillName: z.string(),
  familyName: z.string().optional(),
  domainName: z.string().optional(),
  questionCount: z.number().int().nonnegative(),
});

const WorksheetDownloadEventSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  teacher_email: z.string(),
  event_type: z.literal('weekly_worksheet_pack_downloaded'),
  tool_mode: z.literal('weekly_mixed_review'),
  manifest_id: z.string(),
  starting_point_id: z.string(),
  total_questions: z.number().int(),
  skill_count: z.number().int(),
  skill_summary: z.array(SkillUsageSummarySchema),
  band_summary: z.record(z.string(), z.number().int().nonnegative()),
  style_summary: z.record(z.string(), z.number().int().nonnegative()),
  kind_summary: z.record(z.string(), z.number().int().nonnegative()),
  application_version: z.string(),
  created_at: z.string().datetime(),
});

type SupabaseConfigResult =
  | { status: 'ready'; url: string; privilegedKey: string; useBearerToken: boolean }
  | { status: 'not_configured' | 'invalid'; detail: string };

function legacyJwtRole(key: string): string | undefined {
  const parts = key.split('.');
  if (parts.length !== 3) return undefined;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as { role?: unknown };
    return typeof payload.role === 'string' ? payload.role : undefined;
  } catch {
    return undefined;
  }
}

function publicKeyConfigurationDetail(): string {
  return 'The server key in Vercel is a public Supabase anon/publishable key. Replace it with a server-only Secret key (sb_secret_...) in SUPABASE_SECRET_KEY, or a legacy service_role key in SUPABASE_SERVICE_ROLE_KEY, then redeploy. Do not grant this table to anon.';
}

function supabaseConfig(): SupabaseConfigResult {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const privilegedKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !privilegedKey) {
    return {
      status: 'not_configured',
      detail: 'Add SUPABASE_URL and a server-only SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY) in Vercel, then redeploy.',
    };
  }

  const configuredPublicKeys = [
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ].filter((value): value is string => Boolean(value));
  const role = legacyJwtRole(privilegedKey);
  if (
    privilegedKey.startsWith('sb_publishable_')
    || configuredPublicKeys.includes(privilegedKey)
    || role === 'anon'
    || role === 'authenticated'
  ) {
    return { status: 'invalid', detail: publicKeyConfigurationDetail() };
  }

  return {
    status: 'ready',
    url: url.replace(/\/$/, ''),
    privilegedKey,
    // Supabase's newer sb_secret_ keys are sent only as an API key. Legacy
    // service_role JWTs also need the Bearer header.
    useBearerToken: !privilegedKey.startsWith('sb_secret_'),
  };
}

function supabaseHeaders(config: Extract<SupabaseConfigResult, { status: 'ready' }>): Record<string, string> {
  return {
    apikey: config.privilegedKey,
    ...(config.useBearerToken ? { Authorization: `Bearer ${config.privilegedKey}` } : {}),
  };
}

function supabaseFailureDetail(status: number, body: string): string {
  if (status === 401 && (/grant select.*anon/i.test(body) || /permission denied.*worksheet_download_events/i.test(body))) {
    return publicKeyConfigurationDetail();
  }
  return `Supabase returned ${status}: ${body.slice(0, 300)}`;
}

function applicationVersion(): string {
  return process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12)
    || process.env.npm_package_version
    || 'development';
}

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

export function describeProblemSet(manifest: WeeklyWorksheetManifest) {
  const skills = new Map<string, SkillUsageSummary>();
  manifest.questions.forEach((question) => {
    const existing = skills.get(question.skillId);
    skills.set(question.skillId, {
      skillId: question.skillId,
      skillName: question.skillName,
      familyName: question.familyName,
      domainName: question.domain,
      questionCount: (existing?.questionCount ?? 0) + 1,
    });
  });

  return {
    startingPointId: 'manual-selection',
    totalQuestions: manifest.questions.length,
    skillCount: skills.size,
    skillSummary: [...skills.values()].sort((a, b) => a.skillId.localeCompare(b.skillId)),
    bandSummary: countBy(manifest.questions.map((question) => question.band)),
    styleSummary: countBy(manifest.questions.map((question) => question.style)),
    kindSummary: countBy(manifest.questions.map((question) => question.kind)),
  };
}

export async function recordWorksheetDownload(input: {
  manifest: WeeklyWorksheetManifest;
  userId: string;
  teacherEmail: string;
}): Promise<UsageTrackingResult> {
  const config = supabaseConfig();
  if (config.status !== 'ready') {
    return {
      status: config.status === 'invalid' ? 'failed' : 'not_configured',
      detail: config.detail,
    };
  }

  const summary = describeProblemSet(input.manifest);
  const event = {
    user_id: input.userId,
    teacher_email: input.teacherEmail.trim().toLowerCase(),
    event_type: 'weekly_worksheet_pack_downloaded',
    tool_mode: 'weekly_mixed_review',
    manifest_id: input.manifest.manifestId,
    starting_point_id: summary.startingPointId,
    total_questions: summary.totalQuestions,
    skill_count: summary.skillCount,
    skill_summary: summary.skillSummary,
    band_summary: summary.bandSummary,
    style_summary: summary.styleSummary,
    kind_summary: summary.kindSummary,
    application_version: applicationVersion(),
  };

  try {
    const response = await fetch(`${config.url}/rest/v1/${EVENT_TABLE}`, {
      method: 'POST',
      headers: {
        ...supabaseHeaders(config),
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(event),
      cache: 'no-store',
    });
    if (!response.ok) {
      const detail = supabaseFailureDetail(response.status, await response.text());
      console.error('worksheet_download_tracking_failed', { detail, manifestId: input.manifest.manifestId });
      return { status: 'failed', detail };
    }
    return { status: 'recorded' };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown tracking error';
    console.error('worksheet_download_tracking_failed', { detail, manifestId: input.manifest.manifestId });
    return { status: 'failed', detail };
  }
}

function emptyReport(status: 'not_configured' | 'failed', detail: string): UsageReport {
  return {
    status,
    detail,
    totalDownloads: 0,
    activeTeachers: 0,
    downloadsLast7Days: 0,
    teachers: [],
    startingPoints: [],
    skills: [],
    bands: [],
    styles: [],
    recent: [],
  };
}

function titleCase(value: string): string {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function summarizeUsageEvents(events: WorksheetDownloadEvent[]): UsageReport {
  const teacherMap = new Map<string, {
    downloads: number;
    questions: number;
    lastDownload: string;
    skills: Map<string, number>;
  }>();
  const startingPointMap = new Map<string, number>();
  const skillMap = new Map<string, { name: string; downloads: number; questions: number }>();
  const bandMap = new Map<string, number>();
  const styleMap = new Map<string, number>();
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

  events.forEach((event) => {
    const teacher = teacherMap.get(event.teacher_email) ?? {
      downloads: 0,
      questions: 0,
      lastDownload: event.created_at,
      skills: new Map<string, number>(),
    };
    teacher.downloads += 1;
    teacher.questions += event.total_questions;
    if (event.created_at > teacher.lastDownload) teacher.lastDownload = event.created_at;
    event.skill_summary.forEach((skill) => {
      teacher.skills.set(skill.skillName, (teacher.skills.get(skill.skillName) ?? 0) + skill.questionCount);
      const overall = skillMap.get(skill.skillId) ?? { name: skill.skillName, downloads: 0, questions: 0 };
      overall.downloads += 1;
      overall.questions += skill.questionCount;
      skillMap.set(skill.skillId, overall);
    });
    teacherMap.set(event.teacher_email, teacher);

    startingPointMap.set(event.starting_point_id, (startingPointMap.get(event.starting_point_id) ?? 0) + 1);
    Object.entries(event.band_summary).forEach(([band, count]) => bandMap.set(band, (bandMap.get(band) ?? 0) + count));
    Object.entries(event.style_summary).forEach(([style, count]) => styleMap.set(style, (styleMap.get(style) ?? 0) + count));
  });

  const descending = (a: NamedUsageCount, b: NamedUsageCount) => b.downloads - a.downloads || a.name.localeCompare(b.name);
  const teachers = [...teacherMap.entries()].map(([email, teacher]) => ({
    email,
    downloads: teacher.downloads,
    questions: teacher.questions,
    lastDownload: teacher.lastDownload,
    topSkills: [...teacher.skills.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 3)
      .map(([name]) => name),
  })).sort((a, b) => b.downloads - a.downloads || a.email.localeCompare(b.email));

  return {
    status: 'connected',
    totalDownloads: events.length,
    activeTeachers: teacherMap.size,
    downloadsLast7Days: events.filter((event) => new Date(event.created_at).getTime() >= sevenDaysAgo).length,
    teachers,
    startingPoints: [...startingPointMap.entries()]
      .map(([id, downloads]) => ({ id, name: id === 'custom' ? 'Custom setup' : titleCase(id), downloads }))
      .sort(descending),
    skills: [...skillMap.entries()]
      .map(([id, value]) => ({ id, name: value.name, downloads: value.downloads, questions: value.questions }))
      .sort((a, b) => (b.questions ?? 0) - (a.questions ?? 0) || a.name.localeCompare(b.name)),
    bands: [...bandMap.entries()]
      .map(([id, downloads]) => ({ id, name: titleCase(id), downloads }))
      .sort(descending),
    styles: [...styleMap.entries()]
      .map(([id, downloads]) => ({ id, name: id === 'applied' ? 'Applied or worded' : titleCase(id), downloads }))
      .sort(descending),
    recent: [...events].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 50),
  };
}

export async function loadUsageReport(): Promise<UsageReport> {
  const config = supabaseConfig();
  if (config.status !== 'ready') {
    return emptyReport(
      config.status === 'invalid' ? 'failed' : 'not_configured',
      config.detail,
    );
  }

  const fields = [
    'id', 'user_id', 'teacher_email', 'event_type', 'tool_mode', 'manifest_id',
    'starting_point_id', 'total_questions', 'skill_count', 'skill_summary',
    'band_summary', 'style_summary', 'kind_summary', 'application_version', 'created_at',
  ].join(',');

  try {
    const response = await fetch(
      `${config.url}/rest/v1/${EVENT_TABLE}?select=${fields}&order=created_at.desc&limit=5000`,
      {
        headers: supabaseHeaders(config),
        cache: 'no-store',
      },
    );
    if (!response.ok) {
      const detail = supabaseFailureDetail(response.status, await response.text());
      console.error('worksheet_usage_report_failed', { detail });
      return emptyReport('failed', detail);
    }
    return summarizeUsageEvents(WorksheetDownloadEventSchema.array().parse(await response.json()));
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown usage-report error';
    console.error('worksheet_usage_report_failed', { detail });
    return emptyReport('failed', detail);
  }
}
