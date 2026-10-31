import { expect, test } from '@playwright/test';

test('nav switches between the 5 screens', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByText('מוכנה לסבב של היום?')).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'ניווט ראשי' });
  for (const [label, check] of [
    ['תרגול', 'התרגול של היום'],
    ['פרופיל', 'הפרופיל שלי'],
    ['מילים', 'עוד אין כאן מילים'],
    ['התקדמות', 'המיומנויות שלך'],
    ['בית', 'מוכנה לסבב של היום?'],
  ]) {
    await nav.getByText(label).click();
    await expect(page.getByText(check).first()).toBeVisible();
    await expect(nav.getByText(label)).toHaveAttribute('aria-current', 'page');
  }
});

test('the character card swipes to the next character', async ({ page }) => {
  await page.goto('./');
  const card = page.locator('.hero');
  await expect(card).toHaveAttribute('aria-label', /Max/);
  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 6 });
  await page.mouse.up();
  await expect(card).not.toHaveAttribute('aria-label', /Max/);
});

test('settings hides the nav and links to the check screen', async ({ page }) => {
  await page.goto('./#/settings');
  await expect(page.getByRole('navigation', { name: 'ניווט ראשי' })).toHaveCount(0);
  await page.getByText('בדיקה שהכול עובד').click();
  await expect(page.locator('[data-check="server"]')).toBeVisible();
});

test('installable: manifest and icons', async ({ page, request }) => {
  await page.goto('./');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const m = await (await request.get(new URL(href!, page.url()).toString())).json();
  expect(m.display).toBe('standalone');
  expect(m.dir).toBe('rtl');
  for (const i of m.icons) expect((await request.get(new URL(i.src, page.url()).toString())).ok()).toBe(true);
  expect(m.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);
});
