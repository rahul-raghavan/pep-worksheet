"use client";
import React, { useState } from 'react';
import questions from '../../../data/questions.json';

const allTopics = Array.from(new Set((questions as any[]).map(q => q.Topic))).sort();

interface Row {
  topic: string;
  count: number;
  level: number;
}

export default function BuilderClient({ email }: { email: string }) {
  const [rows, setRows] = useState<Row[]>([
    { topic: allTopics[0] || '', count: 1, level: 1 },
  ]);
  const [seed, setSeed] = useState('');

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

  return (
    <div className="space-y-6">
      <div className="mb-2 text-gray-700">Welcome, {email}</div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 font-semibold">Select Topics, Counts, and Levels</div>
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
        <div className="mt-4 flex gap-4 items-center">
          <label className="text-sm">Seed (optional):</label>
          <input
            type="text"
            value={seed}
            onChange={e => setSeed(e.target.value)}
            className="border rounded px-2 py-1"
            placeholder="Leave blank for random"
          />
        </div>
        <div className="mt-6">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            disabled={!canPreview}
            // onClick={...} // Preview logic to be added next
          >
            Preview
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Total questions: {total} (max 25)
        </div>
      </div>
    </div>
  );
} 