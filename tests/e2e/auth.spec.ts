import { test, expect } from '@playwright/test';

test.describe('Auth UI and Flows', () => {
    // We use a clean storage state to ensure we are not logged in mockingly
    test.use({ storageState: { cookies: [], origins: [] } });

    test('renders login page correctly', async ({ page }) => {
        await page.goto('/login');

        // Check main elements
        await expect(page.getByRole('heading', { name: 'Вход в SRM' })).toBeVisible();
        await expect(page.locator('input[name="email"]')).toBeVisible();
        await expect(page.locator('input[name="password"]')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible();
    });

    test('renders lock page correctly', async ({ page }) => {
        await page.goto('/lock');

        // Check main elements
        await expect(page.getByRole('heading', { name: 'Сессия заблокирована' })).toBeVisible();
        await expect(page.locator('input[name="password"]')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Разблокировать' })).toBeVisible();
        await expect(page.getByRole('button', { name: /Выйти/ })).toBeVisible();
    });

    test('login validation works', async ({ page }) => {
        await page.goto('/login');

        // Submit empty form should trigger HTML5 validation, but let's try filling bad email
        await page.fill('input[name="email"]', 'bad-email');
        await page.fill('input[name="password"]', '123'); // too short

        // Need to bypass HTML5 validation for checking Zod output, or just let browser catch it
        // Actually the browser catches type="email". So let's test a valid email, but wrong password length
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', '123');
        await page.getByRole('button', { name: 'Войти' }).click();

        // Should show error from Server Action (Zod)
        await expect(page.locator('text=Пароль должен содержать минимум 6 символов')).toBeVisible();
    });
});
