import { Page, Locator } from "@playwright/test";
import { DateUtil } from "../utils/DateUtil";
import { Logger } from "../utils/Logger";
import { WaitUtil } from "../utils/WaitUtil";

export class CalendarComponent {
  private readonly wait: WaitUtil;
  private readonly calendarContainer: Locator;
  private readonly monthYearLabel: Locator;

  constructor(private readonly page: Page) {
    this.wait = new WaitUtil(page);
    this.calendarContainer = page.locator(".react-datepicker");
    this.monthYearLabel = page.locator(
      ".react-datepicker__month-container .react-datepicker__current-month",
    );
  }

  async selectDeparture(isoDate: string): Promise<void> {
    Logger.info(`Selecting departure date: ${isoDate}`);
    await this.page
      .getByRole("button", { name: "Departure Date inputbox" })
      .click();
    await this.wait.waitForVisible(this.calendarContainer, "calendar");
    await this.dismissPromoPopup();
    await this.clickDate(isoDate);
    Logger.info(`Departure date set: ${DateUtil.toDisplayLabel(isoDate)}`);
  }

  async selectReturn(isoDate: string): Promise<void> {
    Logger.info(`Selecting return date: ${isoDate}`);
    await this.page
      .getByRole("button", { name: "Return Date inputbox" })
      .click();
    await this.wait.waitForVisible(this.calendarContainer, "calendar");
    await this.dismissPromoPopup();
    await this.clickDate(isoDate);
    Logger.info(`Return date set: ${DateUtil.toDisplayLabel(isoDate)}`);
  }

  async selectResultsDeparture(isoDate: string): Promise<void> {
    Logger.info(`Selecting results departure date: ${isoDate}`);
    await this.page
      .locator(".datepicker-month")
      .nth(0)
      .locator(`.day-block[title="${this.buildDayTitle(isoDate)}"]`)
      .click();
  }

  async selectResultsReturn(isoDate: string): Promise<void> {
    Logger.info(`Selecting results return date: ${isoDate}`);
    await this.page
      .locator(".datepicker-month")
      .nth(1)
      .locator(`.day-block[title="${this.buildDayTitle(isoDate)}"]`)
      .click();
  }

  private async dismissPromoPopup(): Promise<void> {
    const closeBtn = this.page
      .locator(
        ".promopopup-close, .popup-close, [class*='promo'] [class*='close']",
      )
      .first();
    if (await closeBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await closeBtn.click().catch(() => {});
      Logger.info("Dismissed promo popup");
    }
  }

  private monthToInt(monthYear: string): number {
    const d = new Date(monthYear + " 01");
    return d.getFullYear() * 12 + d.getMonth();
  }

  private async clickDate(isoDate: string): Promise<void> {
    const localDate = new Date(isoDate + "T00:00:00");

    const targetMonthYear = localDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    const ariaLabel = DateUtil.toAriaLabel(isoDate);
    const targetInt = this.monthToInt(targetMonthYear);

    Logger.info(`Target month: ${targetMonthYear}`);
    Logger.info(`Target aria-label: ${ariaLabel}`);

    for (let i = 0; i < 24; i++) {
      const visibleMonths = await this.monthYearLabel.allTextContents();
      const trimmed = visibleMonths.map((m) => m.trim());

      Logger.info(`[i=${i}] Calendar shows: ${trimmed.join(" | ")}`);

      if (trimmed.includes(targetMonthYear)) {
        Logger.info(`[i=${i}] Target month found — clicking day`);
        break;
      }

      // Compare target vs first visible month to decide direction
      const firstVisibleInt = this.monthToInt(trimmed[0]);
      const goBack = targetInt < firstVisibleInt;

      Logger.info(`[i=${i}] ${goBack ? "Going BACK" : "Going NEXT"}`);

      await this.page.evaluate(
        (direction: string) => {
          const selector =
            direction === "back"
              ? ".react-datepicker__navigation--previous"
              : ".react-datepicker__navigation--next";
          const btns = Array.from(
            document.querySelectorAll<HTMLElement>(selector),
          );
          // Click the visible one (the other has visibility:hidden)
          const visible = btns.find(
            (b) => b.style.visibility !== "hidden" && b.offsetParent !== null,
          );
          visible?.click();
        },
        goBack ? "back" : "next",
      );

      await this.page.waitForTimeout(600);

      if (i === 23) {
        const finalMonths = await this.monthYearLabel.allTextContents();
        throw new Error(
          `Could not navigate to ${targetMonthYear}. ` +
            `Final calendar shows: ${finalMonths.map((m) => m.trim()).join(" | ")}`,
        );
      }
    }

    const dayCell = this.page.locator(
      `[aria-label="${ariaLabel}"]:not(.react-datepicker__day--disabled):not(.react-datepicker__day--outside-month)`,
    );

    await this.wait.waitForVisible(dayCell, ariaLabel);
    await dayCell.click();
    Logger.info(`Clicked: ${ariaLabel}`);
  }

  private buildDayTitle(isoDate: string): string {
    return new Date(isoDate + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
}
