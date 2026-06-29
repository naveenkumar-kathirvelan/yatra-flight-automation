import { Page } from "@playwright/test";
import { HomePage } from "../pages/HomePage";
import { SearchResultsPage } from "../pages/SearchResultsPage";
import { CityComponent } from "../components/CityComponent";
import { CalendarComponent } from "../components/CalendarComponent";
import { FlightSearchRequest } from "../models/FlightSearchRequest";
import { Logger } from "../utils/Logger";
import { TravellerComponent } from "../components/TravellerComponent";

export class FlightSearchBusiness {
  private readonly home: HomePage;
  private readonly city: CityComponent;
  private readonly calendar: CalendarComponent;
  readonly results: SearchResultsPage;
  readonly traveller: TravellerComponent;

  constructor(private readonly page: Page) {
    this.home = new HomePage(page);
    this.city = new CityComponent(page);
    this.calendar = new CalendarComponent(page);
    this.results = new SearchResultsPage(page);
    this.traveller = new TravellerComponent(page);
  }

  async search(request: FlightSearchRequest): Promise<void> {
    Logger.info(`Starting flight search: ${request.from} → ${request.to}`);

    await this.home.open();
    await this.home.dismissPopups();
    await this.city.selectOrigin(request.from);
    await this.city.selectDestination(request.to);
    await this.calendar.selectDeparture(request.departureDate);
    if (request.returnDate) {
      await this.calendar.selectReturn(request.returnDate);
    }
    await this.traveller.setTravellers(request.travellers);
    await this.traveller.setCabin(request.cabinClass);
    await this.traveller.done();
    await this.home.clickSearch();
    await this.results.waitForResults();

    Logger.info(`Flight search complete: ${request.from} → ${request.to}`);
  }

  async modifySearch(request: FlightSearchRequest) {
    await this.results.modifySearch(request);
  }
}
