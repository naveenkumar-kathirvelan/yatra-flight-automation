import { test, expect } from "../../src/fixtures";
import { DateUtil } from "../../src/utils/DateUtil";
import { JsonReader } from "../../src/utils/JsonReader";
import {
  FlightSearchRequest,
  FlightSearchRequestRaw,
} from "../../src/models/FlightSearchRequest";

const rawData = JsonReader.readAll<FlightSearchRequestRaw>("flights.json");

const flightData: FlightSearchRequest[] = rawData.map((raw) => ({
  from: raw.from,
  to: raw.to,
  departureDate: DateUtil.futureDateISO(raw.departureDaysFromToday),
  returnDate:
    raw.returnDaysFromToday !== undefined
      ? DateUtil.futureDateISO(raw.returnDaysFromToday)
      : undefined,
  travellers: raw.travellers,
  cabinClass: raw.cabinClass,
  tripType: raw.tripType,
}));

test.describe("@regression Cheapest Fare — 5-Day Iteration (Assignment)", () => {
  for (const flight of flightData) {
    test(`5-day cheapest: ${flight.from} → ${flight.to} (${flight.travellers.adults} guests)`, async ({
      cheapestFareBusiness,
    }, testInfo) => {
      const { overall, allDays } =
        await cheapestFareBusiness.findCheapestAcross5Days(flight);

      expect(
        allDays.length,
        `No flights found across 5 days for ${flight.from} → ${flight.to}`,
      ).toBeGreaterThan(0);

      console.log(`\n  ✈  5-Day Cheapest Fare: ${flight.from} → ${flight.to}`);
      console.log(`  ${"─".repeat(55)}`);

      for (const day of allDays) {
        const marker = day.date === overall.date ? "  ◀ CHEAPEST" : "";
        console.log(
          `  ${day.dayLabel.padEnd(14)} | ` +
            `${String(day.ticketCount).padStart(4)} tickets | ` +
            `₹${day.cheapest.price.toLocaleString("en-IN").padStart(8)} (${day.cheapest.airline})${marker}`,
        );
      }

      console.log(`  ${"─".repeat(55)}`);
      console.log(
        `  Overall Cheapest → ${overall.cheapest.airline} ` +
          `₹${overall.cheapest.price.toLocaleString("en-IN")} on ${overall.dayLabel}\n`,
      );

      testInfo.annotations.push({
        type: "Overall Cheapest Fare",
        description:
          `${overall.cheapest.airline} ₹${overall.cheapest.price.toLocaleString("en-IN")} ` +
          `on ${overall.dayLabel} (${overall.cheapest.departure}–${overall.cheapest.arrival})`,
      });

      testInfo.annotations.push({
        type: "5-Day Ticket Counts",
        description: allDays
          .map(
            (d) =>
              `${d.dayLabel}: ${d.ticketCount} tickets, cheapest ₹${d.cheapest.price.toLocaleString("en-IN")}`,
          )
          .join(" | "),
      });

      expect(
        overall.cheapest.price,
        "Cheapest price must be positive",
      ).toBeGreaterThan(0);
      expect(
        overall.cheapest.airline.length,
        "Airline name must not be empty",
      ).toBeGreaterThan(0);

      const allPrices = allDays.map((d) => d.cheapest.price);
      const trueMin = Math.min(...allPrices);
      expect(overall.cheapest.price).toBe(trueMin);
    });
  }
});
