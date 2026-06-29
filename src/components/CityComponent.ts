import { Page, Locator } from "@playwright/test";
import { Logger } from "../utils/Logger";
import { WaitUtil } from "../utils/WaitUtil";

export class CityComponent {
  private readonly wait: WaitUtil;
  private readonly originInput: Locator;
  private readonly destinationInput: Locator;

  constructor(private readonly page: Page) {
    this.wait = new WaitUtil(page);
    this.originInput = page.getByLabel("Departure From", { exact: false }).first();
    this.destinationInput = page.getByLabel("Going To", { exact: false }).first();
  }

  async selectOrigin(city: string): Promise<void> {
    Logger.info(`Selecting origin city: ${city}`);
    await this.fillAndPick(this.originInput, city);
  }

  async selectDestination(city: string): Promise<void> {
    Logger.info(`Selecting destination city: ${city}`);
    await this.fillAndPick(this.destinationInput, city);
  }

  private async fillAndPick(input: Locator, city: string): Promise<void> {
    await this.wait.waitForVisible(input, "city input");
    await input.click();

    const searchBox = this.page.getByRole("textbox", {
      name: /Departure From|Going To/i,
    });
    await this.wait.waitForVisible(searchBox, "city search box");
    await searchBox.fill(city);

    const suggestion = this.page.getByText(new RegExp(`^${city}`, "i")).first();
    await this.wait.waitForVisible(suggestion, `${city} suggestion`);
    await suggestion.click();

    Logger.info(`City selected: ${city}`);
  }
}
