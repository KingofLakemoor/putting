import { test, expect } from '@playwright/test';

test('Verify VenueDashboard renders PGA Leaderboard with mocked data', async ({ page }) => {
  // Mock Firebase dependencies and current user
  await page.addInitScript(() => {
    window.fakeAuth = {
      currentUser: { uid: 'user123', email: 'test@example.com', displayName: 'Test User' },
      isAdmin: false,
      isCoordinator: false,
    };
    window.fakeDbData = {
        putting_league_players: [
            { player_id: 'p1', uid: 'user123', name: 'Test User' },
            { player_id: 'p2', name: 'John Doe' },
        ],
        putting_league_courses: [
            {
                course_id: 'c1',
                name: 'Test Course',
                holes: [
                    {hole: 1, par: 2}, {hole: 2, par: 2}, {hole: 3, par: 3},
                    {hole: 4, par: 2}, {hole: 5, par: 2}, {hole: 6, par: 3},
                    {hole: 7, par: 2}, {hole: 8, par: 2}, {hole: 9, par: 3},
                    {hole: 10, par: 2}, {hole: 11, par: 2}, {hole: 12, par: 3},
                    {hole: 13, par: 2}, {hole: 14, par: 2}, {hole: 15, par: 3},
                    {hole: 16, par: 2}, {hole: 17, par: 2}, {hole: 18, par: 3},
                ]
            }
        ],
        putting_league_rounds: [
            {
                round_id: 'r1',
                player_id: 'p1',
                course_id: 'c1',
                status: 'active',
                scores: {
                    1: 1, // birdie
                    2: 2, // par
                    3: 5, // double bogey+
                    4: 3, // bogey
                }
            }
        ]
    };
  });

  // Temporarily bypass authentication in PrivateRoute for the test
  await page.route('**/src/components/PrivateRoute.jsx', async (route) => {
    const response = await route.fetch();
    let body = await response.text();
    body = body.replace('if (loading) return', 'return children; //');
    await route.fulfill({ response, body });
  });

  // Go to venue dashboard directly
  await page.goto('http://localhost:3000/venue');

  // Wait for the components to mount
  await page.waitForTimeout(2000);

  // Take a screenshot of the dashboard
  await page.screenshot({ path: 'venue_dashboard.png', fullPage: true });
});
