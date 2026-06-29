import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { FlightResult } from "../models/FlightResult";
import { CalendarComponent } from "../components/CalendarComponent";
import { FlightSearchRequest } from "../models/FlightSearchRequest";
import { Logger } from "../utils/Logger";

export type SortOption = "Price" | "Duration" | "Departure" | "Arrival";

export class SearchResultsPage extends BasePage {
  private readonly resultCards: Locator;
  private readonly loadingSpinner: Locator;
  private readonly totalCountLabel: Locator;
  private readonly sortDropdown: Locator;
  private readonly nonStopFilter: Locator;
  private readonly refundableFilter: Locator;
  private readonly nextDayBtn: Locator;
  private readonly prevDayBtn: Locator;
  private readonly calendar: CalendarComponent;

  constructor(page: Page) {
    super(page);

    this.calendar = new CalendarComponent(page);

    this.resultCards = page
      .locator(".js-flightItem > .flightItem")
      .filter({ has: page.locator(".booking-sec") });

    this.loadingSpinner = page.locator(
      ".loader, .spinner, [data-testid='loading']",
    );
    this.totalCountLabel = page
      .locator(".results-count, [data-testid='result-count']")
      .first();
    this.sortDropdown = page
      .locator(".sort-filter, [data-testid='sort-by']")
      .first();
    this.nonStopFilter = page
      .locator("label:has-text('Non Stop'), input[value='0']")
      .first();
    this.refundableFilter = page
      .locator("label:has-text('Refundable'), [data-filter='refundable']")
      .first();
    this.nextDayBtn = page.locator("div.next.slider-button").first();
    this.prevDayBtn = page.locator("div.prev.slider-button").first();
  }

  async waitForResults(): Promise<void> {
    Logger.info("Waiting for search results");

    await this.wait.waitForURL(/air-search-ui/, 60_000);
    await this.dismissAkamai();
    await this.resultCards.first().waitFor({ state: "visible", timeout: 60_000 });
    await this.waitForAllResults();

    Logger.info("Results loaded");
  }

  private async dismissAkamai(): Promise<void> {
    const akamai = this.page.locator("#sec-if-cpt-container");

    const appeared = await akamai
      .waitFor({ state: "visible", timeout: 5_000 })
      .then(() => true)
      .catch(() => false);

    if (appeared) {
      Logger.warn("Akamai overlay detected — waiting for it to clear");
      await akamai
        .waitFor({ state: "hidden", timeout: 60_000 })
        .catch(() => akamai.waitFor({ state: "detached", timeout: 60_000 }));
      Logger.info("Akamai overlay cleared");
    }
  }

  private async waitForAllResults(): Promise<void> {
    const pricesAvailable = await this.page
      .waitForFunction(
        () => {
          const cards = document.querySelectorAll(
            ".js-flightItem > .flightItem",
          );
          for (const card of Array.from(cards)) {
            const sec = card.querySelector(".booking-sec");
            if (!sec) continue;
            const fareEl = sec.querySelector("p[id^='fare-']");
            if (fareEl) {
              const digits =
                (fareEl as HTMLElement).innerText?.replace(/[^\d]/g, "") ?? "";
              if (digits.length >= 4) return true;
            }
            const candidates = sec.querySelectorAll("p, span");
            for (const el of Array.from(candidates)) {
              const digits =
                (el as HTMLElement).innerText?.replace(/[^\d]/g, "") ?? "";
              if (digits.length >= 4 && digits.length <= 8) return true;
            }
          }
          return false;
        },
        null,
        { timeout: 30_000 },
      )
      .then(() => true)
      .catch(() => false);

    if (!pricesAvailable) {
      Logger.warn("No price container found — skipping this day");
      return;
    }

    Logger.info("Price container confirmed — scrolling to load all cards");

    let previous = 0;
    let conf = 0;

    while (conf < 2) {
      await this.page.mouse.wheel(0, 50000);
      await this.page.waitForTimeout(1000);

      const current = await this.resultCards.count();
      if (current === previous) conf++;
      else {
        conf = 0;
        previous = current;
      }
    }

    if (previous === 0) {
      Logger.warn("No flights found after scrolling — skipping this day");
      return;
    }

    Logger.info(`Final card count: ${previous}`);
  }

  async getTicketCount(): Promise<number> {
    const count = await this.resultCards.count();
    Logger.info(`Found ${count} flight result cards`);
    return count;
  }

  async getTotalCountFromLabel(): Promise<number> {
    const text = await this.totalCountLabel.textContent().catch(() => "0");
    return parseInt((text || "0").replace(/[^0-9]/g, ""), 10);
  }

  async getAllResults(): Promise<FlightResult[]> {
    Logger.info("Extracting all flight results via single page.evaluate()");

    const results = await this.page.evaluate(
      (): Array<{
        airline: string;
        flightNumber: string;
        departure: string;
        arrival: string;
        duration: string;
        stops: number;
        price: number;
        cabinClass: string;
        refundable: boolean;
      }> => {
        const cards = Array.from(
          document.querySelectorAll<HTMLElement>(
            ".js-flightItem > .flightItem",
          ),
        ).filter((el) => el.querySelector(".booking-sec"));

        return cards.map((card) => {
          const txt = (sel: string, root: Element = card): string =>
            (
              root.querySelector(sel) as HTMLElement | null
            )?.innerText?.trim() ?? "";

          const priceSels = [
            ".booking-sec p[id^='fare-']",
            ".booking-sec .fare-value",
            ".booking-sec .fare",
            ".booking-sec .price",
            ".booking-sec p.bold",
          ];

          let priceRaw = "";
          for (const sel of priceSels) {
            const el = card.querySelector(sel) as HTMLElement | null;
            const text = el?.innerText?.trim() ?? "";
            if (text && /[\d,]+/.test(text)) {
              priceRaw = text;
              break;
            }
          }

          if (!priceRaw) {
            const bookingSec = card.querySelector(".booking-sec");
            if (bookingSec) {
              const allP = Array.from(bookingSec.querySelectorAll("p, span"));
              for (const el of allP) {
                const text = (el as HTMLElement).innerText?.trim() ?? "";
                if (/^[\d,]{4,}$/.test(text)) {
                  priceRaw = text;
                  break;
                }
              }
            }
          }

          const price = Number(priceRaw.replace(/[^\d]/g, ""));

          const outbound = card.querySelector(".flight-sch") as Element | null;
          const departure = outbound ? txt(".dtime .time", outbound) : "";
          const arrival = outbound ? txt(".atime .time", outbound) : "";
          const duration = outbound ? txt(".du", outbound) : "";
          const stopText = outbound
            ? txt(".stop-det span[aria-label]", outbound)
            : "";

          const stops = stopText.toLowerCase().includes("non")
            ? 0
            : Number(stopText.match(/\d+/)?.[0] ?? 0);

          const flightNum =
            (
              card.querySelector(
                "input[type='radio']",
              ) as HTMLInputElement | null
            )?.value?.trim() ?? "";

          return {
            airline: txt(".airline-name .text"),
            flightNumber: flightNum,
            departure,
            arrival,
            duration,
            stops,
            price,
            cabinClass: "Economy",
            refundable: false,
          };
        });
      },
    );

    Logger.info(`Extracted ${results.length} flight results`);
    return results;
  }

  async getCheapestFlight(): Promise<FlightResult> {
    Logger.info("Finding cheapest flight via single page.evaluate()");

    const cheapest = await this.page.evaluate(
      (): {
        airline: string;
        flightNumber: string;
        departure: string;
        arrival: string;
        duration: string;
        stops: number;
        price: number;
        cabinClass: string;
        refundable: boolean;
      } | null => {
        const cards = Array.from(
          document.querySelectorAll<HTMLElement>(
            ".js-flightItem > .flightItem",
          ),
        ).filter((el) => el.querySelector(".booking-sec"));

        const txt = (sel: string, root: Element): string =>
          (root.querySelector(sel) as HTMLElement | null)?.innerText?.trim() ??
          "";

        let cheapestCard: Element | null = null;
        let cheapestPrice = Number.MAX_SAFE_INTEGER;

        for (const card of cards) {
          const priceRaw = txt(".booking-sec p[id^='fare-']", card);
          const price = Number(priceRaw.replace(/[^\d]/g, ""));
          if (price > 0 && price < cheapestPrice) {
            cheapestPrice = price;
            cheapestCard = card;
          }
        }

        if (!cheapestCard) return null;

        const outbound = cheapestCard.querySelector(".flight-sch");
        const stopText = outbound
          ? txt(".stop-det span[aria-label]", outbound)
          : "";
        const stops = stopText.toLowerCase().includes("non")
          ? 0
          : Number(stopText.match(/\d+/)?.[0] ?? 0);

        return {
          airline: txt(".airline-name .text", cheapestCard),
          flightNumber: (
            (
              cheapestCard.querySelector(
                "input[type='radio']",
              ) as HTMLInputElement | null
            )?.value ?? ""
          ).trim(),
          departure: outbound ? txt(".dtime .time", outbound) : "",
          arrival: outbound ? txt(".atime .time", outbound) : "",
          duration: outbound ? txt(".du", outbound) : "",
          stops,
          price: cheapestPrice,
          cabinClass: "Economy",
          refundable: false,
        };
      },
    );

    if (!cheapest) throw new Error("No valid flights found");

    Logger.info(
      `Cheapest: ${cheapest.airline} ₹${cheapest.price.toLocaleString("en-IN")}`,
    );
    return cheapest;
  }

  async getExpectedCheapestPrice(): Promise<number> {
    const text = await this.page
      .locator("li:has(.smart-label.cheapest) .fare")
      .innerText()
      .catch(() => "0");
    return Number(text.replace(/[^\d]/g, ""));
  }

  async modifySearch(request: FlightSearchRequest): Promise<void> {
    Logger.info(
      `Modifying search: ${request.departureDate} → ${request.returnDate}`,
    );

    await this.page.locator('[aria-label="departure date input"]').click();
    await this.clickOpenCalendarDate(request.departureDate);

    if (request.returnDate) {
      await this.page.locator('[aria-label="arrival date input"]').click();
      await this.clickOpenCalendarDate(request.returnDate);
    }

    await this.page
      .getByRole("button", { name: /Search Again|Modify Search/i })
      .click();
    await this.waitForResults();
  }

  private async clickOpenCalendarDate(isoDate: string): Promise<void> {
    const targetTitle = this.buildDayTitle(isoDate);

    const targetMonthLabel = new Date(isoDate).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

    const picker = this.page
      .locator(".datepicker-wrapper:not(.ng-hide)")
      .first();

    await picker.waitFor({ state: "visible", timeout: 15_000 });

    const nextArrow = picker.locator("i[ng-click='nextLink();']");

    Logger.info(`Clicking date in open calendar: ${targetTitle}`);

    for (let i = 0; i < 12; i++) {
      const visibleMonth = picker.locator(".datepicker-month").filter({
        has: this.page.locator(".month-name", { hasText: targetMonthLabel }),
      });

      const monthLabel =
        (
          await visibleMonth.locator(".month-name").first().textContent()
        )?.trim() ?? "";

      Logger.debug(
        `Calendar showing: "${monthLabel}", target: "${targetMonthLabel}"`,
      );

      const dayCell = visibleMonth.locator(`.day-block[title="${targetTitle}"]`);

      if (
        await dayCell
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        await dayCell.first().click({ force: true });
        Logger.info(`✓ Clicked: ${targetTitle}`);
        return;
      }

      await nextArrow.click({ force: true });

      await this.page.waitForFunction(
        ({ prev }) => {
          const el = document.querySelector(
            ".datepicker-wrapper:not(.ng-hide) .month-name",
          );
          return el?.textContent?.trim() !== prev;
        },
        { prev: monthLabel },
      );
    }
  }

  private buildDayTitle(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  async clickNextDay(): Promise<void> {
    Logger.info("Clicking next day");
    await this.nextDayBtn.click();
    await this.waitForResults();
  }

  async selectCard(index: number): Promise<void> {
    Logger.info(`Selecting card ${index}`);
    await this.resultCards.first().waitFor({ state: "visible", timeout: 60_000 });
    await this.resultCards.nth(index).locator("button.view-fare-btn").click();
  }

  async sortBy(option: SortOption): Promise<void> {
    Logger.info(`Sorting by: ${option}`);
    await this.sortDropdown.selectOption(option).catch(async () => {
      await this.page
        .locator(
          `button:has-text('${option}'), [data-sort='${option.toLowerCase()}']`,
        )
        .first()
        .click();
    });
    await this.wait.waitForNetworkIdle();
  }

  async applyNonStopFilter(): Promise<void> {
    Logger.info("Applying Non Stop filter");
    await this.nonStopFilter.click();
    await this.wait.waitForNetworkIdle();
  }

  async applyRefundableFilter(): Promise<void> {
    Logger.info("Applying Refundable filter");
    await this.refundableFilter.click();
    await this.wait.waitForNetworkIdle();
  }
}
