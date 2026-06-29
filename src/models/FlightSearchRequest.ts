export type TripType = "one-way" | "round-trip" | "multi-city";
export type CabinClass = "Economy" | "Premium Economy" | "Business" | "First";

export interface Travellers {
  adults: number;
  children: number;
  infants: number;
}

export interface FlightSearchRequest {
  from: string;
  to: string;
  departureDate: string;   // YYYY-MM-DD (resolved at runtime from daysFromToday fields)
  returnDate?: string;
  travellers: Travellers;
  cabinClass: CabinClass;
  tripType: TripType;
}

/**
 * Raw shape stored in flights.json — dates expressed as day-offsets from today
 * so the data never goes stale.
 */
export interface FlightSearchRequestRaw {
  from: string;
  to: string;
  departureDaysFromToday: number;   // 0 = today, 7 = today+7, etc.
  returnDaysFromToday?: number;     // absent = one-way
  travellers: Travellers;
  cabinClass: CabinClass;
  tripType: TripType;
}
