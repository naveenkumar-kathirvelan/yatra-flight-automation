import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";
import { Logger } from "../utils/Logger";

export class HomePage extends BasePage {
  private readonly popupCloseBtn: Locator;
  private readonly loginCloseBtn: Locator;
  private readonly cookieBanner: Locator;
  private readonly flightsTab: Locator;
  private readonly hotelsTab: Locator;
  private readonly oneWayRadio: Locator;
  private readonly roundTripRadio: Locator;
  private readonly multiCityRadio: Locator;
  private readonly searchButton: Locator;

  constructor(page: Page) {
    super(page);

    this.popupCloseBtn = page
      .locator(".ui-dialog-titlebar-close, .close-btn, [aria-label='Close']")
      .first();
    this.loginCloseBtn = page
      .locator("#loginClose, .login-close, [data-dismiss='modal']")
      .first();
    this.cookieBanner = page.locator("#cookiePopupDiv, .cookie-banner").first();
    this.flightsTab = page
      .locator("a[href*='flights'], li:has-text('Flights')")
      .first();
    this.hotelsTab = page
      .locator("a[href*='hotels'], li:has-text('Hotels')")
      .first();
    this.oneWayRadio = page
      .locator("input[value='O'], label:has-text('One Way')")
      .first();
    this.roundTripRadio = page
      .locator("input[value='R'], label:has-text('Round Trip')")
      .first();
    this.multiCityRadio = page
      .locator("input[value='M'], label:has-text('Multi City')")
      .first();
    this.searchButton = page.getByRole("button", {
      name: "Search",
      exact: true,
    });
  }

  async open(): Promise<void> {
    Logger.info("Opening Yatra homepage");
    await this.navigate("/");
    await this.wait.waitForDOMContentLoaded();
  }

  async dismissPopups(): Promise<void> {
    Logger.info("Dismissing overlays/popups");
    if (await this.cookieBanner.isVisible().catch(() => false)) {
      await this.cookieBanner.click().catch(() => {});
    }
    if (await this.loginCloseBtn.isVisible().catch(() => false)) {
      await this.loginCloseBtn.click().catch(() => {});
      await this.wait.waitForHidden(this.loginCloseBtn, "login modal");
    }
    if (await this.popupCloseBtn.isVisible().catch(() => false)) {
      await this.popupCloseBtn.click().catch(() => {});
    }
  }

  async clickFlightsTab(): Promise<void> {
    Logger.info("Clicking Flights tab");
    await this.flightsTab.click();
    await this.wait.waitForDOMContentLoaded();
  }

  async selectOneWay(): Promise<void> {
    Logger.info("Selecting One Way trip");
    await this.oneWayRadio.click();
  }

  async selectRoundTrip(): Promise<void> {
    Logger.info("Selecting Round Trip");
    await this.roundTripRadio.click();
  }

  async selectMultiCity(): Promise<void> {
    Logger.info("Selecting Multi City");
    await this.multiCityRadio.click();
  }

  async clickSearch(): Promise<void> {
    Logger.info("Clicking Search Flights button");
    await this.wait.waitForEnabled(this.searchButton, "Search button");
    await this.searchButton.click();

    for (let attempt = 1; attempt <= 3; attempt++) {
      const navigated = await this.page
        .waitForURL(/air-search-ui/, { timeout: 8_000 })
        .then(() => true)
        .catch(() => false);

      if (navigated) return;

      Logger.warn(
        `Search navigation not detected (attempt ${attempt}/3) — retrying`,
      );
      await this.page.keyboard.press("Escape");
      await this.page.waitForTimeout(500);
      await this.searchButton.click();
    }
  }
}
