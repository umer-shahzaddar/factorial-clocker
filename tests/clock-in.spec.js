import { test } from '@playwright/test';
const fs = require('fs');
const path = require('path');
let account;

try {
  // Attempt to read the account-data.json file
  const accountDataPath = path.resolve(__dirname, '../account-data.json');
  const fileContent = fs.readFileSync(accountDataPath, 'utf-8');
  account = JSON.parse(fileContent);
} catch (error) {
  // Fallback to environment variables if the file is not found or invalid
  console.warn('account-data.json not found or invalid. Using environment variables.');
  account = {
    username: process.env.FACTORIAL_USERNAME || 'default_username',
    password: process.env.FACTORIAL_PASSWORD || 'default_password',
  };
}
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
const addButton = `((${daysWith8Missing})[1]//ancestor::tr//following-sibling::tr//button//*[text()="Aggiungi"])[1]`;
const hInput = '(//input)[1]';
const mInput = '(//input)[2]';
const saveButton = '//button//*[text()="Invia"]';
const savedLabel = '//*[text()="Salvato con successo"]';

class utils {
  static MISSING_DAYS = 31;
}

const runs = Array.from({ length: utils.MISSING_DAYS }, (_, index) => ({ run: index + 1 }));

runs.forEach(({ run }) => {
  test(`clock-in 9 to 17 ${run}`, async ({ page }) => {
    if (utils.MISSING_DAYS === 0) test.skip();
    await login(page);
    await openClockInPage(page);
    await fill8HourDays(page);
  });
});

async function login(page) {
  const username = account.username;
  const password = account.password;

  await page.goto(url);
  await page.locator(loginButton).hover();
  await page.click(acceptCookiesButton);
  await page.click(loginButton);
  await page.fill(emailInput, username);
  await page.fill(passwordInput, password);
  await page.click(submitButton);
}

async function openClockInPage(page) {
  await page.click(clockInButton);
  await page.locator(closeModalButton).last().waitFor({ state: 'visible' });
  const closeModalButtons = await page.locator(closeModalButton).all();
  for (let i = closeModalButtons.length; i > 0; i--) {
    await closeModalButtons[i-1].click();
  }
  await page.locator(row).waitFor({ state: 'visible' });
}

async function fill8HourDays(page) {
  const missingDays = await page.locator(daysWith8Missing).all();
  utils.MISSING_DAYS = missingDays.length;
  console.log('Giorni da timbrare: ' + utils.MISSING_DAYS);
  if (utils.MISSING_DAYS > 0) {
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