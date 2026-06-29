import { Page, Locator } from "@playwright/test";
import { CabinClass, Travellers } from "../models/FlightSearchRequest";
import { Logger } from "../utils/Logger";
import { WaitUtil } from "../utils/WaitUtil";

/**
 * TravellerComponent — manages the traveller count and cabin class selector.
 */
export class TravellerComponent {
  private readonly wait: WaitUtil;
  private readonly travellerToggle: Locator;
  private readonly travellerPanel: Locator;
  private readonly doneBtn: Locator;

  constructor(private readonly page: Page) {
    this.wait = new WaitUtil(page);

    this.travellerToggle = page.getByRole("combobox", {
      name: "Travellers class inputbox",
    });

    this.travellerPanel = page.locator("#traveller_container");

    this.doneBtn = page.getByRole("button", {
      name: "Done",
    });
  }

  async open(): Promise<void> {
    Logger.info("Opening traveller panel");
    await this.travellerToggle.click();
    await this.wait.waitForVisible(this.travellerPanel, "traveller panel");
  }

  async setCabin(cabinClass: CabinClass): Promise<void> {
    Logger.info(`Setting cabin class: ${cabinClass}`);

    await this.page.locator(`label[aria-label="${cabinClass}"]`).click();
  }

  async done(): Promise<void> {
    Logger.info("Closing traveller panel");

    await this.doneBtn.click();

    await this.wait.waitForHidden(this.travellerPanel, "traveller panel");
  }
  async setTravellers(travellers: Travellers): Promise<void> {
    await this.open();

    const travellerCard = this.page.locator("#travellers_card_section0");

    const adultList = travellerCard.locator("ul").nth(0);
    const childList = travellerCard.locator("ul").nth(1);
    const infantList = travellerCard.locator("ul").nth(2);

    await adultList
      .getByRole("listitem", {
        name: `Select age ${travellers.adults}`,
      })
      .click();

    await childList
      .getByRole("listitem", {
        name: `Select age ${travellers.children}`,
      })
      .click();

    await infantList
      .getByRole("listitem", {
        name: `Select age ${travellers.infants}`,
      })
      .click();

    Logger.info(
      `Travellers set: ${travellers.adults}/${travellers.children}/${travellers.infants}`,
    );
  }

  private async adjustCount(
    plusBtn: Locator,
    minusBtn: Locator,
    current: number,
    target: number,
  ): Promise<void> {
    const diff = target - current;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) await plusBtn.click();
    } else if (diff < 0) {
      for (let i = 0; i < Math.abs(diff); i++) await minusBtn.click();
    }
  }
}
