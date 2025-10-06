from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the login page
        page.goto("https://articulosdelimpiezaevita.netlify.app/")

        # Fill in the email and password
        page.get_by_label("Email").fill("gerente@evita.com")
        page.get_by_label("Contraseña").fill("gerente123")

        # Click the login button
        page.get_by_role("button", name="Iniciar Sesión").click()

        # Wait for navigation and verify successful login by finding the logout button
        logout_button = page.get_by_role("button", name="Cerrar Sesión")
        expect(logout_button).to_be_visible()

        # Take a screenshot of the dashboard
        page.screenshot(path="jules-scratch/verification/verification.png")
        print("Screenshot taken successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        # Clean up
        context.close()
        browser.close()

with sync_playwright() as playwright:
    run(playwright)