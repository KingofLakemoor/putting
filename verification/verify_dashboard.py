import os
from playwright.sync_api import sync_playwright

def run_cuj(page):
    # Mock firebase auth and db via window.fakeDbData to bypass complex setup
    page.add_init_script("""
        window.fakeDbData = {
            currentUser: { uid: 'user1', displayName: 'Test User' },
            rounds: [
                {
                    round_id: 'r1',
                    status: 'active',
                    date: new Date().toISOString().slice(0, 10),
                    event_round_name: 'Test Event',
                    course_id: 'c1',
                    player_id: 'user1',
                    player_name: 'Rick',
                    scores: { '1': 3, '2': 1, '3': 2 },
                    opponent_id: 'user2',
                    opponent_scores: { '1': 2, '2': 3, '3': 2 }
                }
            ],
            scores: [
                { player_id: 'user1', score: 36, round_id: 'r1' }
            ],
            players: [
                { player_id: 'user1', uid: 'user1', name: 'Rick' },
                { player_id: 'user2', uid: 'user2', name: 'Brendan' }
            ],
            courses: [
                {
                    course_id: 'c1',
                    name: 'Test Course',
                    holes: [
                        { hole: 1, par: 2 },
                        { hole: 2, par: 2 },
                        { hole: 3, par: 3 }
                    ]
                }
            ],
            settings: { live_season: '2023' }
        };
    """)
    page.goto("http://localhost:3000/venue")
    page.wait_for_timeout(2000)

    # Remove webpack overlay if it exists
    page.evaluate("document.getElementById('webpack-dev-server-client-overlay')?.remove()")

    page.screenshot(path="/home/jules/verification/screenshots/dashboard_relative_score.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
