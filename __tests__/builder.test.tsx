import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BuilderClient from '@/app/builder/BuilderClient';

describe('weekly worksheet teacher workflow', () => {
  beforeEach(() => window.localStorage.clear());

  it('opens with sensible sheet defaults but asks the teacher to choose content', () => {
    render(<BuilderClient email="teacher@pepschoolv2.com" />);
    expect(screen.getByRole('heading', { name: /build this week/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('12')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /choose what to revisit/i })).toBeInTheDocument();
    expect(screen.queryByText(/choose a starting point/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /preview student pdf/i })).toBeDisabled();
    fireEvent.click(screen.getAllByRole('button', { name: /add a balanced mix/i })[0]);
    expect(screen.getByText(/mixed family added/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /preview student pdf/i })).toBeEnabled();
    expect(screen.getByRole('heading', { name: /recent worksheets/i })).toBeInTheDocument();
  });
});
