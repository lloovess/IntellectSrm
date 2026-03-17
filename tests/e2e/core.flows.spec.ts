import { expect, test } from '@playwright/test';

const uniqueSuffix = Date.now().toString();
const createdName = `E2E Ученик ${uniqueSuffix}`;
const updatedName = `${createdName} Updated`;

test('dashboard and roles pages render', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Операционный дашборд' })).toBeVisible();

  await page.goto('/settings/roles');
  await expect(page.getByRole('heading', { name: 'Операционный дашборд' })).toBeVisible();
});

test('students create and edit flow works', async ({ page }) => {
  await page.goto('/students');
  await expect(page.getByRole('heading', { name: 'База учеников' })).toBeVisible();

  await page.getByRole('link', { name: 'Новый ученик' }).click();
  await expect(page.getByRole('heading', { name: 'Новый ученик' })).toBeVisible();

  const inputs = page.locator('input');
  await inputs.nth(0).fill(createdName);
  await inputs.nth(1).fill('+7 700 000 00 01');
  await page.getByRole('button', { name: 'Создать' }).click();

  await expect(page).toHaveURL(/\/students$/);
  const createdLink = page.getByRole('link', { name: createdName }).first();
  await expect(createdLink).toBeVisible();
  const href = await createdLink.getAttribute('href');
  const studentId = href?.split('/').pop();
  expect(studentId).toBeTruthy();

  await createdLink.click();
  await expect(page.getByRole('heading', { name: createdName })).toBeVisible();

  await page.goto('/students');
  const row = page.locator('tr', { has: page.locator(`a[href=\"/students/${studentId}\"]`) }).first();
  await row.getByRole('link', { name: 'Редактировать' }).click();

  await expect(page.getByRole('heading', { name: 'Редактирование ученика' })).toBeVisible();
  const editInputs = page.locator('input');
  await editInputs.nth(0).fill(updatedName);
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(page).toHaveURL(/\/students$/);
  await page.goto(`/students/${studentId}`);
  await expect(page.getByRole('heading', { name: updatedName })).toBeVisible();
});
