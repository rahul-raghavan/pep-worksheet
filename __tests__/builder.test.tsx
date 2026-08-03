import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BuilderClient from '@/app/builder/BuilderClient';

describe('weekly worksheet teacher workflow', () => {
  beforeEach(() => window.localStorage.clear());

  it('opens with the recommended six-skill, twelve-question workflow', () => {
    render(<BuilderClient email="teacher@pepschoolv2.com" />);
    expect(screen.getByRole('heading', { name: /build this week/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('12')).toBeInTheDocument();
    expect(screen.getAllByText(/Previously taught skill/i)).toHaveLength(6);
    expect(screen.getByRole('button', { name: /preview student pdf/i })).toBeEnabled();
    expect(screen.getByRole('heading', { name: /recent worksheets/i })).toBeInTheDocument();
  });
});
