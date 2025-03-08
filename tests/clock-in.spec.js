import { test } from '@playwright/test';
require('dotenv').config({ path: './.env.local' });

const url = 'https://factorialhr.com/';
const acceptCookiesButton = '//button[@class="fcm-button fcm-primary"]';
const loginButton = '//a[@id="login-link"]';
const emailInput = '//input[@type="email"]';
const passwordInput = '//input[@type="password"]';
const submitButton = '//input[@type="submit"]/.';
const clockInButton = '//a[@href="/attendance/clock-in"]';
const closeModalButton = '//div[@aria-label="Close"]';
const row = '(//tr)[10]';
const daysWith8Missing = '//span[@title="-8 ore"]';
const daysWith4Missing = '//span[@title="-4 ore"]';
const expandButton = `((${daysWith8Missing})[1]//ancestor::tr//button)[2]`;
const addButton = `((${daysWith8Missing})[1]//ancestor::tr//following-sibling::tr//button//*[text()="Aggiungi"])[1]`;
const hInput = '(//input)[1]';
const mInput = '(//input)[2]';
const saveButton = '//button//*[text()="Invia"]';
const savedLabel = '//*[text()="Salvato con successo"]';
const invalidCredentialsLabel = '//*[contains(text(), "Invalid email or password")]';

class utils {
  static MISSING_DAYS = 31;
  static LOGIN_FAILED = false;
}

const runs = Array.from({ length: utils.MISSING_DAYS }, (_, index) => ({ run: index + 1 }));

runs.forEach(({ run }) => {
  test(`clock-in 9 to 17 ${run}`, async ({ context, page }) => {

    await context.addCookies([{
      "name": "fmc-consent",
      "value": '{"ad_storage":"granted","ad_user_data":"granted","ad_personalization":"granted","analytics_storage":"granted","functionality_storage":"granted"}',
      "domain": "factorialhr.com",
      "path": "/"
    }]);

    if (utils.MISSING_DAYS === 0 || utils.LOGIN_FAILED) test.skip();
    await login(page);
    await openClockInPage(page);
    await fill8HourDays(page);
  });
});

async function login(page) {
  const username = process.env.USERNAME;
  const password = process.env.PASSWORD;

  await page.goto(url);
  await page.locator(loginButton).hover();
  //await page.click(acceptCookiesButton);
  await page.click(loginButton);
  await page.fill(emailInput, username);
  await page.fill(passwordInput, password);
  await page.click(submitButton);
  utils.LOGIN_FAILED = await page.locator(invalidCredentialsLabel).isVisible();
  if (utils.LOGIN_FAILED) test.skip("Invalid credentials");
}

async function openClockInPage(page) {
  await page.click(clockInButton);
  //await page.locator(closeModalButton).last().waitFor({ state: 'visible' });
  await page.waitForTimeout(5000);
  const closeModalButtons = await page.locator(closeModalButton).all();
  for (let i = closeModalButtons.length; i > 0; i--) {
    await closeModalButtons[i - 1].click();
  }
  await page.locator(row).waitFor({ state: 'visible' });
}

async function fill8HourDays(page) {
  const missingDays = await page.locator(daysWith8Missing).all();
  utils.MISSING_DAYS = missingDays.length;
  console.log('Giorni da timbrare: ' + utils.MISSING_DAYS);
  if (utils.MISSING_DAYS > 0) {
    const isVisible = await page.locator(addButton).isVisible();
    if (!isVisible) await page.click(expandButton);
    await page.click(addButton);
    await page.locator(hInput).press('Digit9');
    await page.locator(hInput).press('Digit0');
    await page.locator(mInput).press('Digit1');
    await page.locator(mInput).press('Digit7');
    await page.locator(mInput).press('Digit0');
    await page.click(saveButton)
    await page.locator(savedLabel).waitFor({ state: 'visible' });
  } else {
    console.log('Tutti i giorni con 8 ore vuote sono stati timbrati');
  }
}