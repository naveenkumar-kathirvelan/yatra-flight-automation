import { Locator, expect, Page } from "@playwright/test";
import { Logger } from "./Logger";

export class AssertionUtil {
  constructor(private page: Page) {}

  async assertVisible(locator: Locator, label: string): Promise<void> {
    Logger.info(`Assert visible: ${label}`);
    await expect(locator).toBeVisible();
  }

  async assertText(locator: Locator, expected: string): Promise<void> {
    Logger.info(`Assert text: "${expected}"`);
    await expect(locator).toHaveText(expected);
  }

  async assertContainsText(locator: Locator, text: string): Promise<void> {
    Logger.info(`Assert contains text: "${text}"`);
    await expect(locator).toContainText(text);
  }

  async assertURL(pattern: string | RegExp): Promise<void> {
    Logger.info(`Assert URL: ${pattern}`);
    await expect(this.page).toHaveURL(pattern);
  }

  async assertCount(locator: Locator, count: number): Promise<void> {
    Logger.info(`Assert count: ${count}`);
    await expect(locator).toHaveCount(count);
  }

  async assertGreaterThanCount(locator: Locator, min: number): Promise<void> {
    const count = await locator.count();
    Logger.info(`Assert count > ${min}, actual: ${count}`);
    if (count <= min) {
      throw new Error(`Expected count > ${min}, but got ${count}`);
    }
  }

  async assertTitle(expected: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(expected);
  }
}
