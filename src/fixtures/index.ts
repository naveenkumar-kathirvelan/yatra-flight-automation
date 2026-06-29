import { test as base, Page } from "@playwright/test";
import { FlightSearchBusiness } from "../business/FlightSearchBusiness";
import { CheapestFareBusiness } from "../business/CheapestFareBusiness";
import { SearchResultsPage } from "../pages/SearchResultsPage";
import { Logger } from "../utils/Logger";

type YatraFixtures = {
  flightBusiness: FlightSearchBusiness;
  cheapestFareBusiness: CheapestFareBusiness;
  searchResultsPage: SearchResultsPage;
};

export const test = base.extend<YatraFixtures>({
  flightBusiness: async (
    { page }: { page: Page },
    use: (v: FlightSearchBusiness) => Promise<void>,
  ) => {
    Logger.info("FlightSearchBusiness fixture: setup");
    await use(new FlightSearchBusiness(page));
    Logger.info("FlightSearchBusiness fixture: teardown");
  },

  cheapestFareBusiness: async (
    { page }: { page: Page },
    use: (v: CheapestFareBusiness) => Promise<void>,
  ) => {
    await use(new CheapestFareBusiness(page));
  },

  searchResultsPage: async (
    { page }: { page: Page },
    use: (v: SearchResultsPage) => Promise<void>,
  ) => {
    await use(new SearchResultsPage(page));
  },
});

export { expect } from "@playwright/test";
