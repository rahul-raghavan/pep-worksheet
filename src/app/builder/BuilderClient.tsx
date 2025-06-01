"use client";
import React, { useState } from 'react';
import questions from '../../../data/questions.json';
import { routeToPrint } from '../../utils/routeToPrint';

interface Question {
  Topic: string;
  // Add other fields if needed
}

const allTopics = Array.from(new Set((questions as Question[]).map(q => q.Topic))).sort();

interface Row {
  topic: string;
  count: number;
  level: number;
}

interface PreviewQuestion {
  id: string;
  Topic: string;
  Difficulty: number;
  Front: string;
  Back: string;
}

export default function BuilderClient({ email }: { email: string }) {
  const [rows, setRows] = useState<Row[]>([
    { topic: allTopics[0] || '', count: 1, level: 1 },
  ]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<PreviewQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = rows.reduce((sum, r) => sum + r.count, 0);
  const canAdd = rows.length < allTopics.length && total < 25;
  const canPreview =
    rows.length > 0 &&
    rows.every(r => r.topic && r.count > 0 && r.level >= 1 && r.level <= 5) &&
    new Set(rows.map(r => r.topic)).size === rows.length &&
    total > 0 &&
    total <= 25;

  function addRow() {
    const used = new Set(rows.map(r => r.topic));
    const next = allTopics.find(t => !used.has(t)) || '';
    setRows([...rows, { topic: next, count: 1, level: 1 }]);
  }
  function updateRow(i: number, row: Row) {
    setRows(rows.map((r, j) => (i === j ? row : r)));
  }
  function removeRow(i: number) {
    setRows(rows.filter((_, j) => j !== i));
  }

  async function handlePreview() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/worksheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to generate preview');
        setPreviewQuestions([]);
        setPreviewOpen(false);
        return;
      }
      setPreviewQuestions(data.problems || []);
      setPreviewOpen(true);
    } catch (e: any) {
      setError(e.message || 'Failed to generate preview');
      setPreviewQuestions([]);
      setPreviewOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-2 text-gray-700">Welcome, {email}</div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 font-semibold">Select Topics and Counts</div>
        <table className="w-full mb-4">
          <thead>
            <tr className="text-left text-sm text-gray-500">
              <th>Topic</th>
              <th>Count</th>
              <th>Level</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td>
                  <select
                    className="border rounded px-2 py-1"
                    value={row.topic}
                    onChange={e => updateRow(i, { ...row, topic: e.target.value })}
                  >
                    {allTopics.map(t => (
                      <option key={t} value={t} disabled={rows.some((r, j) => r.topic === t && j !== i)}>
                        {t}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    min={1}
                    max={25 - total + row.count}
                    className="border rounded px-2 py-1 w-16"
                    value={row.count}
                    onChange={e => {
                      const v = Math.max(1, Math.min(25 - total + row.count, Number(e.target.value)));
                      updateRow(i, { ...row, count: v });
                    }}
                  />
                </td>
                <td>
                  <select
                    className="border rounded px-2 py-1"
                    value={row.level}
                    onChange={e => updateRow(i, { ...row, level: Number(e.target.value) })}
                  >
                    {[1, 2, 3, 4, 5].map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </td>
                <td>
                  {rows.length > 1 && (
                    <button
                      className="text-xs text-red-500 hover:underline"
                      onClick={() => removeRow(i)}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          className="text-sm px-3 py-1 border rounded bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
          onClick={addRow}
          disabled={!canAdd}
        >
          Add Topic
        </button>
        <div className="mt-6">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            disabled={!canPreview || loading}
            onClick={handlePreview}
          >
            {loading ? 'Loading...' : 'Preview'}
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Total questions: {total} (max 25)
        </div>
        {error && (
          <div className="mt-4 text-sm text-red-600">{error}</div>
        )}
      </div>
      {/* Modal Preview */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="modal-content bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative flex flex-col" style={{ maxHeight: '80vh' }}>
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setPreviewOpen(false)}
              aria-label="Close preview"
            >
              ×
            </button>
            <div className="mb-4 font-semibold text-lg">Worksheet Preview</div>
            <div className="modal-questions flex-1 overflow-y-auto mb-6 pr-2">
              <ol start={1} className="list-decimal list-inside flex flex-col gap-2">
                {previewQuestions.map((q) => (
                  <li key={q.id}>
                    <span className="font-medium">{q.Front}</span>
                    <br />
                    <span className="text-xs text-gray-500">Topic: {q.Topic} &nbsp;|&nbsp; Level: {q.Difficulty}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="modal-footer flex justify-end gap-4">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={() => routeToPrint(previewQuestions, 'problems')}
              >
                Print / Save as PDF
              </button>
              <button
                className="px-4 py-2 bg-gray-700 text-white rounded"
                onClick={() => routeToPrint(previewQuestions, 'answers')}
              >
                Print Answers
              </button>
              <button
                className="px-4 py-2 ml-2 text-gray-600 border border-gray-300 rounded"
                onClick={() => setPreviewOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 