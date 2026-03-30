from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:3000/admin")
    page.wait_for_timeout(3000)

    # Let's add the fakeDbData after loading the page, maybe the React app needs to be evaluated first?
    page.evaluate("""
        window.fakeAuth = {
            currentUser: { uid: 'admin_uid', email: 'admin@test.com' },
            isAdmin: true,
            isCoordinator: true
        };
        window.fakeDbData = {
            rounds: [
                { round_id: '1', name: 'Round 1', date: 'invalid', location: 'Course A', status: 'Active' },
                { round_id: '2', name: 'Round 2', date: '2023-10-27T10:00:00Z', location: 'Course B', status: 'Completed' },
                { round_id: '3', name: 'Round 3', date: null, location: 'Course C', status: 'Active' },
                { round_id: '4', name: 'Round 4', date: undefined, location: 'Course D', status: 'Archived' }
            ],
            scores: [
                { score_id: 's1', round_id: '1', player_id: 'p1', score: 36 },
                { score_id: 's2', round_id: '3', player_id: 'p2', score: 40 },
                { score_id: 's3', round_id: '4', player_id: 'p1', score: 38 }
            ],
            players: [
                { player_id: 'p1', name: 'John D.', uid: 'uid1' },
                { player_id: 'p2', name: 'Jane S.', uid: 'uid2' }
            ],
            courses: [],
            coordinators: [],
            settings: {}
        };
    """)

    # Try navigating to trigger a re-render
    page.goto("http://localhost:3000/admin")
    page.wait_for_timeout(3000)
    print("Current URL:", page.url)

    # Let's see if there's an overlay
    page.evaluate("document.getElementById('webpack-dev-server-client-overlay')?.remove()")

    # Try logging to console to see what the page says
    page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

    # Take a screenshot to see if it even rendered the Admin dashboard
    page.screenshot(path="/home/jules/verification/screenshots/admin_scores.png")

    try:
        page.get_by_text("Manage Scores").click()
    except:
        pass

    page.wait_for_timeout(2000)
    page.screenshot(path="/home/jules/verification/screenshots/admin_scores_after.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
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
