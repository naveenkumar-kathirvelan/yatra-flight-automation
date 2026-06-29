import { Page } from "@playwright/test";
import { FlightSearchBusiness } from "./FlightSearchBusiness";
import { FlightResult } from "../models/FlightResult";
import { FlightSearchRequest } from "../models/FlightSearchRequest";
import { DateUtil } from "../utils/DateUtil";
import { Logger } from "../utils/Logger";

export interface DailyResult {
  date: string;
  dayLabel: string;
  cheapest: FlightResult;
  ticketCount: number;
}

export class CheapestFareBusiness {
  private readonly searchBusiness: FlightSearchBusiness;

  constructor(private readonly page: Page) {
    this.searchBusiness = new FlightSearchBusiness(page);
  }

  async findCheapestAcross5Days(request: FlightSearchRequest): Promise<{
    overall: DailyResult;
    allDays: DailyResult[];
  }> {
    const req: FlightSearchRequest = { ...request };

    Logger.info(
      `5-day cheapest search: ${req.from} → ${req.to} from ${req.departureDate}`,
    );

    await this.searchBusiness.search(req);

    const day0Count = await this.searchBusiness.results.getTicketCount();
    if (day0Count === 0) {
      throw new Error(
        `No flights found on Day 1 (${req.departureDate}) for ${req.from} → ${req.to}. ` +
          `Route may not be served or dates are unavailable.`,
      );
    }

    const allDays: DailyResult[] = [];

    for (let day = 0; day < 5; day++) {
      const dateLabel = request.departureDate;
      Logger.info(
        `--- Day ${day + 1}: ${DateUtil.toDisplayLabel(dateLabel)} ---`,
      );

      if (day > 0) {
        req.departureDate = DateUtil.addDays(req.departureDate, 1);
        if (req.returnDate) {
          req.returnDate = DateUtil.addDays(req.returnDate, 1);
        }
        await this.searchBusiness.modifySearch(req);
      }

      const ticketCount = await this.searchBusiness.results.getTicketCount();
      Logger.info(`Ticket count: ${ticketCount}`);

      if (ticketCount === 0) {
        Logger.warn(`No results on day ${day + 1}, skipping`);
        continue;
      }

      const flights = await this.searchBusiness.results.getAllResults();
      const validFlights = flights.filter((f) => f.price > 0);

      if (validFlights.length === 0) {
        Logger.warn(`All prices were 0 on day ${day + 1}, skipping`);
        continue;
      }

      const prices = validFlights.map((f) => f.price).sort((a, b) => a - b);
      console.table(prices);

      const expected = await this.searchBusiness.results
        .getExpectedCheapestPrice()
        .catch(() => -1);

      const calculated = prices[0];
      console.log({
        day: day + 1,
        date: req.departureDate,
        expected,
        calculated,
      });

      if (expected > 0 && calculated !== expected) {
        Logger.warn(
          `Price mismatch on day ${day + 1}: extracted ₹${calculated}, badge shows ₹${expected}`,
        );
      }

      const cheapest = validFlights.reduce((a, b) =>
        a.price < b.price ? a : b,
      );
      Logger.info(
        `Day ${day + 1} cheapest: ${cheapest.airline} ₹${cheapest.price.toLocaleString("en-IN")}`,
      );

      allDays.push({
        date: req.departureDate,
        dayLabel: DateUtil.toDisplayLabel(req.departureDate),
        cheapest,
        ticketCount,
      });
    }

    if (allDays.length === 0) {
      throw new Error("No results found across any of the 5 days");
    }

    const overall = allDays.reduce((a, b) =>
      a.cheapest.price < b.cheapest.price ? a : b,
    );
    Logger.info(
      `Overall cheapest: ${overall.cheapest.airline} ₹${overall.cheapest.price.toLocaleString("en-IN")} on ${overall.dayLabel}`,
    );

    return { overall, allDays };
  }

  async findCheapest(request: FlightSearchRequest): Promise<FlightResult> {
    Logger.info(`Finding cheapest: ${request.from} → ${request.to}`);
    await this.searchBusiness.search(request);

    const flights = await this.searchBusiness.results.getAllResults();
    if (flights.length === 0) throw new Error("No flight results found");

    const cheapest = flights.reduce((a, b) => (a.price < b.price ? a : b));
    Logger.info(
      `Cheapest: ${cheapest.airline} ₹${cheapest.price.toLocaleString("en-IN")} (${cheapest.departure} – ${cheapest.arrival})`,
    );
    return cheapest;
  }
}
