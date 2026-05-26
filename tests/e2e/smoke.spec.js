import { test, expect } from '@playwright/test';

test.describe('Diagrammer smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#canvas');
  });

  test('loads toolbar and canvas', async ({ page }) => {
    await expect(page.locator('#toolbar')).toBeVisible();
    await expect(page.locator('#canvas')).toBeVisible();
    await expect(page.locator('#btn-export')).toBeVisible();
  });

  test('draws a rectangle', async ({ page }) => {
    const canvas = page.locator('#canvas');
    const box = await canvas.boundingBox();
    await page.locator('[data-tool="rect"]').click();
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 220, box.y + 180);
    await page.mouse.up();
    await expect(page.locator('#btn-undo')).toBeEnabled();
  });

  test('keeps line tool active after drawing a line', async ({ page }) => {
    const canvas = page.locator('#canvas');
    const box = await canvas.boundingBox();
    await page.locator('[data-tool="line"]').click();
    await page.mouse.move(box.x + 80, box.y + 80);
    await page.mouse.down();
    await page.mouse.move(box.x + 180, box.y + 140);
    await page.mouse.up();

    await expect(page.locator('[data-tool="line"]')).toHaveClass(/active/);
    await expect(page.locator('[data-tool="select"]')).not.toHaveClass(/active/);

    const countBefore = await page.evaluate(() => window.__diagrammerShapes?.().length ?? 0);
    expect(countBefore).toBe(1);

    await page.mouse.move(box.x + 200, box.y + 80);
    await page.mouse.down();
    await page.mouse.move(box.x + 280, box.y + 160);
    await page.mouse.up();

    await expect(page.locator('[data-tool="line"]')).toHaveClass(/active/);
    await expect.poll(async () => {
      return page.evaluate(() => window.__diagrammerShapes?.().length ?? 0);
    }).toBe(2);
  });

  test('eraser marquee deletes multiple shapes', async ({ page }) => {
    const canvas = page.locator('#canvas');
    const box = await canvas.boundingBox();

    await page.locator('[data-tool="rect"]').click();
    await page.mouse.move(box.x + 80, box.y + 80);
    await page.mouse.down();
    await page.mouse.move(box.x + 160, box.y + 140);
    await page.mouse.up();

    await page.locator('[data-tool="rect"]').click();
    await page.mouse.move(box.x + 200, box.y + 80);
    await page.mouse.down();
    await page.mouse.move(box.x + 280, box.y + 140);
    await page.mouse.up();

    await expect.poll(async () => {
      return page.evaluate(() => window.__diagrammerShapes?.().length ?? 0);
    }).toBe(2);

    await page.locator('[data-tool="eraser"]').click();
    await page.mouse.move(box.x + 60, box.y + 60);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 160);
    await page.mouse.up();

    await expect.poll(async () => {
      return page.evaluate(() => window.__diagrammerShapes?.().length ?? 0);
    }).toBe(0);
  });

  test('returns to select tool after drawing a rectangle', async ({ page }) => {
    const canvas = page.locator('#canvas');
    const box = await canvas.boundingBox();
    await page.locator('[data-tool="rect"]').click();
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 220, box.y + 180);
    await page.mouse.up();

    await expect(page.locator('[data-tool="select"]')).toHaveClass(/active/);

    const countBefore = await page.evaluate(() => window.__diagrammerShapes?.().length ?? 0);
    expect(countBefore).toBeGreaterThan(0);
    await page.mouse.click(box.x + 40, box.y + 40);
    const countAfter = await page.evaluate(() => window.__diagrammerShapes?.().length ?? 0);
    expect(countAfter).toBe(countBefore);
  });

  test('undo disables after reverting draw', async ({ page }) => {
    const canvas = page.locator('#canvas');
    const box = await canvas.boundingBox();
    await page.locator('[data-tool="rect"]').click();
    await page.mouse.move(box.x + 80, box.y + 80);
    await page.mouse.down();
    await page.mouse.move(box.x + 160, box.y + 140);
    await page.mouse.up();
    await page.locator('#btn-undo').click();
    await expect(page.locator('#btn-undo')).toBeDisabled();
  });

  test('text tool creates one shape on click', async ({ page }) => {
    const canvas = page.locator('#canvas');
    await page.locator('[data-tool="text"]').click();
    await canvas.click({ position: { x: 200, y: 200 } });
    await expect(page.locator('#text-editor-wrap')).toHaveClass(/is-open/);
    await expect(page.locator('#btn-undo')).toBeEnabled();
  });

  test('text tool opens editor', async ({ page }) => {
    const canvas = page.locator('#canvas');
    await page.locator('[data-tool="text"]').click();
    await canvas.click({ position: { x: 150, y: 150 } });
    const wrap = page.locator('#text-editor-wrap');
    await expect(wrap).toHaveClass(/is-open/);
    const editor = page.locator('#text-editor');
    await expect(editor).toBeFocused();
    await editor.fill('Hello');
    await editor.blur();
    await expect(wrap).not.toHaveClass(/is-open/);
  });

  test('inline shape text stays centered, fitted, and uses shape fill while editing', async ({ page }) => {
    const canvas = page.locator('#canvas');
    const box = await canvas.boundingBox();
    await page.locator('[data-tool="rect"]').click();
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 220, box.y + 180);
    await page.mouse.up();

    await page.locator('[data-color="#ffd8d8"]').click();
    await page.mouse.dblclick(box.x + 160, box.y + 140);

    const editor = page.locator('#text-editor');
    await expect(editor).toBeFocused();
    const initialFontSize = await editor.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
    await editor.fill('This is a much longer label that should wrap and shrink to stay inside the shape.');

    const styles = await editor.evaluate((el) => {
      const computed = getComputedStyle(el);
      return {
        background: computed.backgroundColor,
        textAlign: computed.textAlign,
        fontSize: Number.parseFloat(computed.fontSize),
        paddingTop: Number.parseFloat(computed.paddingTop),
      };
    });
    expect(styles.background).toBe('rgb(255, 216, 216)');
    expect(styles.textAlign).toBe('center');
    expect(styles.fontSize).toBeLessThan(initialFontSize);
    expect(styles.paddingTop).toBeGreaterThan(4);
  });

  test('typing on a selected shape starts inline text edit', async ({ page }) => {
    const canvas = page.locator('#canvas');
    const box = await canvas.boundingBox();
    await page.locator('[data-tool="rect"]').click();
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 220, box.y + 180);
    await page.mouse.up();

    await page.keyboard.type('Hello');

    const editor = page.locator('#text-editor');
    await expect(editor).toBeFocused();
    await expect(editor).toHaveValue('Hello');
    await editor.blur();

    await expect.poll(async () => {
      return page.evaluate(() => window.__diagrammerShapes?.()[0]?.text ?? '');
    }).toBe('Hello');
  });

  test('keyboard shortcuts duplicate and undo', async ({ page }) => {
    const canvas = page.locator('#canvas');
    const box = await canvas.boundingBox();
    await page.locator('[data-tool="rect"]').click();
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 180, box.y + 160);
    await page.mouse.up();
    await expect(page.locator('#btn-undo')).toBeEnabled();

    const modifier = await page.evaluate(() =>
      navigator.platform.includes('Mac') ? 'Meta' : 'Control',
    );
    await page.keyboard.press(`${modifier}+a`);
    await page.keyboard.press(`${modifier}+d`);

    await expect.poll(async () => {
      return page.evaluate(() => window.__diagrammerShapes?.().length ?? 0);
    }).toBeGreaterThan(1);

    await page.keyboard.press(`${modifier}+z`);
    await expect.poll(async () => {
      return page.evaluate(() => window.__diagrammerShapes?.().length ?? 0);
    }).toBe(1);
  });
});
