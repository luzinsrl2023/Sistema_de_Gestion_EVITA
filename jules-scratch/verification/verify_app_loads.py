import asyncio
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        try:
            # Increase navigation timeout and wait until the page is fully loaded
            await page.goto("http://localhost:5173/", timeout=60000, wait_until='load')

            # Wait for the login button to be visible
            login_button = page.get_by_role("button", name="Iniciar Sesión")

            # Wait for the element to be visible with an explicit timeout
            await login_button.wait_for(state='visible', timeout=30000)

            # Take a screenshot
            await page.screenshot(path="jules-scratch/verification/verification.png")
            print("Screenshot taken successfully.")

        except PlaywrightTimeoutError:
            print("Timeout error: The page or a specific element took too long to load.")
            await page.screenshot(path="jules-scratch/verification/error.png")
        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="jules-scratch/verification/error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())