'use client';
import React, { useEffect, useState } from 'react';
import '../../../styles/print.css';

interface Question {
  id: string;
  Topic: string;
  Difficulty: number;
  Front: string;
  Back: string;
}

export default function PrintPage() {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [mode, setMode] = useState<'problems' | 'answers'>('problems');

  useEffect(() => {
    const url = new URL(window.location.href);
    setMode((url.searchParams.get('mode') as 'problems' | 'answers') || 'problems');
    try {
      const stored = sessionStorage.getItem('worksheet');
      if (stored) setQuestions(JSON.parse(stored));
      else setQuestions([]);
    } catch {
      setQuestions([]);
    }
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  if (questions === null) return null;

  return (
    <div className="print-root" style={{ height: '100%' }}>
      <h1 className="title">
        {mode === 'answers'
          ? 'PEP Schoolv2 | Problem Set Date: _______ | Answers'
          : 'PEP Schoolv2 | Problem Set | Name: ____________'}
      </h1>
      <ol className="questions">
        {questions.map((q, i) => (
          <li key={q.id}>
            {mode === 'answers' ? q.Back : q.Front}
          </li>
        ))}
      </ol>
      <div className="footer">Generated on: {today}</div>
    </div>
  );
} 