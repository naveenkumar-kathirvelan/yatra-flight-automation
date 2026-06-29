import { Page, Locator, expect } from "@playwright/test";
import { Logger } from "./Logger";

export class WaitUtil {
  constructor(private page: Page) {}

  async waitForVisible(locator: Locator, label = "element"): Promise<void> {
    Logger.debug(`Waiting for ${label} to be visible`);
    await expect(locator).toBeVisible({ timeout: 15_000 });
  }

  async waitForHidden(locator: Locator, label = "element"): Promise<void> {
    Logger.debug(`Waiting for ${label} to be hidden`);
    await expect(locator).toBeHidden({ timeout: 15_000 });
  }

  async waitForEnabled(locator: Locator, label = "element"): Promise<void> {
    Logger.debug(`Waiting for ${label} to be enabled`);
    await expect(locator).toBeEnabled({ timeout: 15_000 });
  }

  async waitForURL(pattern: string | RegExp, timeout = 60_000): Promise<void> {
    Logger.debug(`Waiting for URL: ${pattern}`);
    await expect(this.page).toHaveURL(pattern, { timeout });
  }

  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  async waitForDOMContentLoaded(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
  }

  async waitForResponse(urlPattern: string | RegExp): Promise<unknown> {
    Logger.debug(`Waiting for network response matching: ${urlPattern}`);
    const response = await this.page.waitForResponse(
      (resp) =>
        (typeof urlPattern === "string"
          ? resp.url().includes(urlPattern)
          : urlPattern.test(resp.url())) && resp.ok(),
      { timeout: 30_000 },
    );
    return response.json().catch(() => null);
  }
}
