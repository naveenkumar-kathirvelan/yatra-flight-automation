export class DateUtil {
  static todayISO(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  static futureDateISO(daysFromNow: number): string {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  static futureMonthISO(monthsFromNow: number): string {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsFromNow);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  static toDisplayLabel(isoDate: string): string {
    const d = new Date(isoDate);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  static day(isoDate: string): number {
    return new Date(isoDate).getDate();
  }

  static monthName(isoDate: string): string {
    return new Date(isoDate).toLocaleString("en-IN", { month: "long" });
  }

  static monthYear(isoDate: string): string {
    return new Date(isoDate).toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }

  static parsePrice(raw: string): number {
    return parseInt(raw.replace(/[^0-9]/g, ""), 10) || 0;
  }

  static toAriaLabel(isoDate: string): string {
    const date = new Date(isoDate + "T00:00:00");
    const day = date.getDate();

    const ordinal = (n: number): string => {
      if (n > 3 && n < 21) return "th";
      switch (n % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };

    const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const year = date.getFullYear();

    return `Choose ${weekday}, ${month} ${day}${ordinal(day)}, ${year}`;
  }

  static addDays(isoDate: string, days: number): string {
    const date = new Date(isoDate + "T00:00:00");
    date.setDate(date.getDate() + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}
