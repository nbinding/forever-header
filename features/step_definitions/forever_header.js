const { Builder, By } = require('selenium-webdriver');
const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const assert = require('assert');

let driver;

Before(async () => {
  driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(
      new (require('selenium-webdriver/chrome').Options)()
        .addArguments('--headless=new')
        .addArguments('--no-sandbox')
        .addArguments('--disable-dev-shm-usage')
        .addArguments('--allow-file-access-from-files')
    )
    .build();
});

After(async () => {
  if (driver) {
    await driver.quit();
  }
});

Given('I open the Forever Header page', async () => {
  const url = 'file://' + require('path').resolve(__dirname, '../../index.html');
  await driver.get(url);
});

When('I select the {string} shape', async shape => {
  const select = await driver.findElement(By.id('shape-selector'));
  await select.sendKeys(shape);
});

When('I apply the shape', async () => {
  const btn = await driver.findElement(By.id('apply-shape'));
  const prev = await driver.findElement(By.id('halftone-path')).getAttribute('d');
  await btn.click();
  driver.prevPath = prev;
});

Then('the halftone path should update', async () => {
  const path = await driver.findElement(By.id('halftone-path')).getAttribute('d');
  assert.notStrictEqual(path, driver.prevPath);
});

When('I enter the icon class {string}', async cls => {
  const input = await driver.findElement(By.id('icon-input'));
  await input.clear();
  await input.sendKeys(cls);
});

When('I apply the icon', async () => {
  const btn = await driver.findElement(By.id('apply-icon'));
  const prev = await driver.findElement(By.id('fa-icon-overlay')).getText();
  await btn.click();
  driver.prevIcon = prev;
});

Then('the displayed icon should change', async () => {
  await driver.sleep(500);
  const text = await driver.findElement(By.id('fa-icon-overlay')).getText();
  assert.notStrictEqual(text, driver.prevIcon);
});

When('I toggle the dither colour', async () => {
  const path = await driver.findElement(By.id('dither-path'));
  driver.prevFill = await path.getAttribute('fill');
  await driver.findElement(By.id('toggle-dither')).click();
});

Then('the halftone fill should invert', async () => {
  const fill = await driver.findElement(By.id('dither-path')).getAttribute('fill');
  assert.notStrictEqual(fill, driver.prevFill);
});

When('I download the image', async () => {
  const btn = await driver.findElement(By.id('download-image'));
  await btn.click();
});

Then('a PNG download should be triggered', async () => {
  // check that a link element with data URL appears
  const handles = await driver.findElements(By.css('a[download]'));
  assert.ok(handles.length > 0);
  const href = await handles[0].getAttribute('href');
  assert.ok(href.startsWith('data:image/png'));
});

When('I resize the window to {int} by {int}', async (w, h) => {
  await driver.manage().window().setRect({ width: w, height: h });
});

Then('the header should remain visible', async () => {
  const box = await driver.findElement(By.css('.rounded-box'));
  const displayed = await box.isDisplayed();
  assert.ok(displayed);
});
