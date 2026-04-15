import { render, screen, act } from "@testing-library/react";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";

test("renders sign in initially", async () => {
  await act(async () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );
  });

  // Unauthenticated users are shown the sign in form, not the leaderboard link initially
  const clubTitles = screen.getAllByText(/Club 602/i);
  expect(clubTitles.length).toBeGreaterThan(0);
});
