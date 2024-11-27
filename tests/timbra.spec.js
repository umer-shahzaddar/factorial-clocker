import { test } from '@playwright/test';
const account = JSON.parse(JSON.stringify(require('../account-data.json')));

const runs = Array.from({ length: 31 }, (_, index) => ({ run: index + 1 }));

runs.forEach(({ run }) => {
  test(`timbra ${run}`, async ({ page }) => {
    /* clean page */
    await page.goto('https://factorialhr.com/');
    await page.locator('//a[@id="login-link"]').hover();
    await page.click('//button[@class="fcm-button fcm-primary"]');
    /* login */
    await page.click('//a[@id="login-link"]');
    await page.fill('//input[@type="email"]', account.username);
    await page.fill('//input[@type="password"]', account.password);
    await page.click('//input[@type="submit"]/.');
    /* timbra */
    await page.click('//a[@href="/attendance/clock-in"]');
    await page.click('//div[@aria-label="Close"]');
    await page.locator('(//*[text()="domenica"])[1]').waitFor({ state: 'visible' });
    const missingHours = await page.locator('//span[@title="-8 ore"]').all();
    console.log('Giorni da timbrare: ' + missingHours.length);
    if (missingHours.length > 0) {
      await page.click(`((//span[@title="-8 ore"])[1]//ancestor::tr//following-sibling::tr//button//*[text()="Aggiungi"])[1]`);
      await page.locator('(//input)[1]').press('Digit9');
      await page.locator('(//input)[1]').press('Digit0');
      await page.locator('(//input)[2]').press('Digit1');
      await page.locator('(//input)[2]').press('Digit7');
      await page.locator('(//input)[2]').press('Digit0');
      await page.click('//button//*[text()="Invia"]')
      await page.locator('//*[text()="Salvato con successo"]').waitFor({ state: 'visible' });
    } else {
      console.log('Tutti i giorni con 8 ore vuote sono stati timbrati');
    }
  });
});


