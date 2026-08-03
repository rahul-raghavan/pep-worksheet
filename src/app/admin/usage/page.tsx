import { notFound } from 'next/navigation';
import { auth, signOut } from '@/auth';
import { isPrivateAdminEmail } from '@/lib/access';
import { loadUsageReport, type WorksheetUsageEvent } from '@/lib/usage';

export const dynamic = 'force-dynamic';

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
}

function problemSetDescription(event: WorksheetUsageEvent): string {
  return event.skill_summary
    .map((skill) => `${skill.skillName} (${skill.questionCount})`)
    .join(' · ');
}

function activityLabel(event: WorksheetUsageEvent): string {
  return event.event_type === 'weekly_worksheet_pack_downloaded'
    ? 'Complete pack downloaded'
    : 'Student PDF created';
}

function summaryText(summary: Record<string, number>, label: (key: string) => string = (key) => key): string {
  return Object.entries(summary)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, count]) => `${label(key)} ${count}`)
    .join(' · ');
}

export default async function UsagePage() {
  const session = await auth();
  if (!isPrivateAdminEmail(session?.user?.email)) notFound();
  const report = await loadUsageReport();

  return (
    <main className="app-page">
      <header className="app-header">
        <a className="brand-lockup" href="/builder" aria-label="PEP Worksheet Generator home">
          <span className="brand-mark">P</span>
          <span><strong>PEP Worksheet Generator</strong><small>Elementary mathematics</small></span>
        </a>
        <nav className="app-header-actions" aria-label="Account">
          <a href="/builder">Worksheet builder</a>
          <form
            action={async () => {
              'use server';
              await signOut();
            }}
          >
            <button className="sign-out-button">Sign out</button>
          </form>
        </nav>
      </header>

      <div className="usage-shell">
        <section className="usage-heading">
          <div>
            <div className="hero-kicker">Private administrator view</div>
            <h1>Worksheet usage tracker</h1>
            <p>
              Each distinct student worksheet is counted once, whether it was first created through Preview or a complete-pack download.
              Complete-pack downloads are counted separately. Failed generations are not counted.
              No student names, group labels, questions or answers are stored.
            </p>
          </div>
          <a className="usage-refresh" href="/admin/usage">Refresh data</a>
        </section>

        {report.status !== 'connected' && (
          <section className={`usage-health usage-health-${report.status}`}>
            <strong>{report.status === 'not_configured' ? 'Tracking setup required' : 'Tracking connection needs attention'}</strong>
            <p>{report.detail}</p>
            <small>Downloads still work when tracking is unavailable. Keep the event table private: never grant SELECT access to anon or authenticated browser roles.</small>
          </section>
        )}

        <section className="usage-stat-grid" aria-label="Usage totals">
          <article><strong>{report.worksheetsCreated}</strong><span>distinct worksheets created</span></article>
          <article><strong>{report.packDownloads}</strong><span>complete packs downloaded</span></article>
          <article><strong>{report.activeTeachers}</strong><span>teachers who created worksheets</span></article>
          <article><strong>{report.worksheetsLast7Days}</strong><span>new worksheets in the last 7 days</span></article>
        </section>

        {report.status === 'connected' && report.worksheetsCreated === 0 && (
          <div className="usage-empty">Tracking is connected. The first successful preview or complete-pack download will appear here.</div>
        )}

        {report.worksheetsCreated > 0 && (
          <>
            <section className="usage-panel">
              <div className="section-heading">
                <div><span className="section-number">01</span><h2>Use by teacher</h2></div>
                <p>A worksheet is counted once per exact question set. Complete-pack downloads remain a separate measure.</p>
              </div>
              <div className="usage-table-wrap">
                <table className="usage-table">
                  <thead><tr><th>Teacher</th><th>Worksheets</th><th>Complete packs</th><th>Questions generated</th><th>Most-used skills</th><th>Latest</th></tr></thead>
                  <tbody>
                    {report.teachers.map((teacher) => (
                      <tr key={teacher.email}>
                        <td><strong>{teacher.email}</strong></td>
                        <td>{teacher.worksheets}</td>
                        <td>{teacher.packDownloads}</td>
                        <td>{teacher.questions}</td>
                        <td>{teacher.topSkills.join(' · ')}</td>
                        <td>{formatDate(teacher.lastActivity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="usage-breakdown-grid">
              <article className="usage-panel">
                <h2>Practice bands generated</h2>
                <p>Counts questions at Support, Core and Stretch rather than whole downloads.</p>
                <ol>{report.bands.map((item) => <li key={item.id}><span>{item.name}</span><strong>{item.count}</strong></li>)}</ol>
              </article>
              <article className="usage-panel">
                <h2>Question styles generated</h2>
                <p>Counts direct and applied questions across distinct worksheets.</p>
                <ol>{report.styles.map((item) => <li key={item.id}><span>{item.name}</span><strong>{item.count}</strong></li>)}</ol>
              </article>
            </section>

            <section className="usage-panel">
              <div className="section-heading">
                <div><span className="section-number">02</span><h2>Skills selected</h2></div>
                <p>“Sheets” is how many distinct worksheets contained the skill; “questions” is its total practice volume.</p>
              </div>
              <div className="usage-skill-grid">
                {report.skills.map((skill) => (
                  <article key={skill.id}>
                    <strong>{skill.name}</strong>
                    <span>{skill.count} sheets · {skill.questions} questions</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="usage-panel">
              <div className="section-heading">
                <div><span className="section-number">03</span><h2>Recent activity</h2></div>
                <p>The latest 50 successful student-PDF creations and complete-pack downloads, newest first.</p>
              </div>
              <div className="usage-table-wrap">
                <table className="usage-table usage-recent-table">
                  <thead><tr><th>When</th><th>Teacher</th><th>Action</th><th>Problem set</th><th>Band and style</th></tr></thead>
                  <tbody>
                    {report.recent.map((event) => (
                      <tr key={event.id}>
                        <td>{formatDate(event.created_at)}</td>
                        <td>{event.teacher_email}</td>
                        <td><strong>{activityLabel(event)}</strong></td>
                        <td><strong>{event.total_questions} questions</strong><small>{problemSetDescription(event)}</small></td>
                        <td>
                          <span>{summaryText(event.band_summary)}</span>
                          <small>{summaryText(event.style_summary, (key) => key === 'applied' ? 'worded' : key)}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
