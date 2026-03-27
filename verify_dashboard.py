import os
from playwright.sync_api import sync_playwright

def run_cuj(page):
    # Mock firebase auth and db via window.fakeDbData to bypass complex setup
    page.add_init_script("""
        window.fakeDbData = {
            currentUser: { uid: 'user1', displayName: 'Test User' },
            rounds: [
                { round_id: 'r1', status: 'active', date: new Date().toISOString().slice(0, 10), name: 'Test Event', location: 'Test Location' }
            ],
            scores: [
                { player_id: 'user1', score: 36, round_id: 'r1' }
            ],
            players: [
                { player_id: 'user1', uid: 'user1', name: 'Test User' }
            ],
            settings: { live_season: '2023' }
        };
    """)
    page.goto("http://localhost:3001")
    page.wait_for_timeout(2000)
    page.screenshot(path="/home/jules/verification/screenshots/dashboard.png")
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
