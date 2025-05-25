import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BuilderClient from '../src/app/builder/BuilderClient';

// Mock window.open and print
const printMock = jest.fn();
const focusMock = jest.fn();
const winMock = { print: printMock, focus: focusMock, onload: null };
window.open = jest.fn(() => winMock as any);

// Mock sessionStorage
window.sessionStorage = {
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};

describe('BuilderClient', () => {
  it('clicking Print opens new window and calls print', async () => {
    render(<BuilderClient email="test@pepschoolv2.com" />);
    // Fill in a valid row
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '2' } });
    // Click Preview
    const previewBtn = screen.getByText('Preview');
    fireEvent.click(previewBtn);
    // Simulate worksheet API response
    await waitFor(() => expect(screen.getByText('Worksheet Preview')).toBeInTheDocument());
    // Click Print
    const printBtn = screen.getByText('Print / Save as PDF');
    fireEvent.click(printBtn);
    // Simulate window load and print
    if (winMock.onload) winMock.onload();
    expect(window.open).toHaveBeenCalledWith('/print?mode=problems', '_blank');
    await waitFor(() => expect(printMock).toHaveBeenCalled());
  });
}); 