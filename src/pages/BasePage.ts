import { Page } from "@playwright/test";
import { WaitUtil } from "../utils/WaitUtil";
import { AssertionUtil } from "../utils/AssertionUtil";
import { Logger } from "../utils/Logger";

export abstract class BasePage {
  protected readonly wait: WaitUtil;
  protected readonly assert: AssertionUtil;

  constructor(protected readonly page: Page) {
    this.wait = new WaitUtil(page);
    this.assert = new AssertionUtil(page);
  }

  async navigate(path = ""): Promise<void> {
    const baseURL = process.env.BASE_URL || "https://www.yatra.com";
    const url = `${baseURL}${path}`;
    Logger.info(`Navigating to: ${url}`);

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await this.page.goto(url, { waitUntil: "domcontentloaded" });
        return;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const isHttp2Error =
          msg.includes("ERR_HTTP2_PROTOCOL_ERROR") ||
          msg.includes("ERR_HTTP2") ||
          msg.includes("net::");
        if (isHttp2Error && attempt < 3) {
          Logger.warn(`Navigation attempt ${attempt} failed (${msg}) — retrying...`);
          await this.page.waitForTimeout(2000);
        } else {
          throw err;
        }
      }
    }
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  async getCurrentURL(): Promise<string> {
    return this.page.url();
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }
}
