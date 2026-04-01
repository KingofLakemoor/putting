from playwright.sync_api import sync_playwright

def run_cuj(page):
    # check if any errors in console
    page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

    page.goto("http://localhost:3000/admin")
    page.wait_for_timeout(3000)

    print("Current URL:", page.url)

    page.screenshot(path="/home/jules/verification/screenshots/admin_redirect.png")
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
