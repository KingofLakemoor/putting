import { render, screen } from '@testing-library/react';
import App from './App';

test('renders leaderboard link', () => {
  render(<App />);
  const linkElements = screen.getAllByText(/Leaderboard/i);
  expect(linkElements.length).toBeGreaterThan(0);
});
