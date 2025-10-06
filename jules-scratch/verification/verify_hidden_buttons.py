from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Go to the login page and log in
    page.goto("http://localhost:5173/login")
    page.get_by_placeholder("nombre@empresa.com").fill("test@example.com")
    page.get_by_placeholder("••••••••").fill("password")
    page.get_by_role("button", name="Ingresar").click()

    # Wait for navigation to the dashboard
    expect(page).to_have_url("http://localhost:5173/tablero")

    # Verify that the "Contabilidad" and "Prospectos" links are not visible
    contabilidad_link = page.get_by_role("button", name="Contabilidad")
    prospectos_link = page.get_by_role("link", name="Prospectos")

    expect(contabilidad_link).not_to_be_visible()
    expect(prospectos_link).not_to_be_visible()

    # Take a screenshot of the sidebar
    sidebar = page.locator('//div[contains(@class, "lg:w-64")]')
    sidebar.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)