export interface FlightResult {
  airline: string;
  flightNumber: string;
  departure: string;    // HH:MM
  arrival: string;      // HH:MM
  duration: string;     // e.g. "3h 20m"
  stops: number;
  price: number;        // in INR
  cabinClass: string;
  refundable: boolean;
}

export interface FlightResultCard {
  index: number;
  result: FlightResult;
}
