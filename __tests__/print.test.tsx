import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrintPage from '../src/app/print/page';

// Mock sessionStorage for jsdom
global.sessionStorage = {
  getItem: jest.fn(() => JSON.stringify([
    { id: '1', Topic: 'Fractions', Difficulty: 2, Front: 'Q1', Back: 'A1' },
    { id: '2', Topic: 'Decimals', Difficulty: 3, Front: 'Q2', Back: 'A2' },
  ])),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};

describe('/print page', () => {
  it('renders title and correct number of questions', () => {
    render(<PrintPage />);
    expect(screen.getByText(/PEP Schoolv2 \| Problem Set/i)).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Q1');
    expect(items[1]).toHaveTextContent('Q2');
  });
}); 