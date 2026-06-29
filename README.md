# Yatra Flight Automation

End-to-end test automation framework for [yatra.com](https://www.yatra.com) built as an SDET assignment submission.

**Stack:** Playwright · TypeScript · Page Object Model · Allure · GitHub Actions

---

## What It Does

- Navigates to Yatra and performs a full flight search (origin, destination, dates, travellers)
- Verifies tickets are displayed and outputs the count
- Iterates over 5 consecutive days to find the cheapest available fare
- Data-driven — routes and parameters are defined in `test-data/flights.json`
- Runs on Chromium and Firefox in parallel

---

## Project Structure

```
yatra-playwright/
├── src/
│   ├── pages/          # Page Objects (BasePage, HomePage, SearchResultsPage)
│   ├── components/     # Reusable UI components (CityComponent, CalendarComponent, TravellerComponent)
│   ├── business/       # Business layer (FlightSearchBusiness, CheapestFareBusiness)
│   ├── models/         # TypeScript interfaces (FlightSearchRequest, FlightResult)
│   ├── fixtures/       # Custom Playwright fixtures
│   └── utils/          # Helpers (Logger, DateUtil, WaitUtil, AssertionUtil, JsonReader)
├── tests/
│   └── regression/     # Test specs (@regression)
├── test-data/          # JSON test data files
├── playwright.config.ts
└── tsconfig.json
```

### Architecture

```
Tests
  └── Business Layer
        └── Pages + Components
              └── Playwright Core
```

Tests describe **what** to verify. The business layer owns the **how**. Page and component objects own all locators and UI interactions.

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
npx playwright install
```

### Run Tests

```bash
# Full regression suite
npx playwright test --grep @regression

# Chromium only
npx playwright test --project=chromium

# Headed mode (browser visible)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

### Reports

```bash
# Playwright HTML report
npx playwright show-report

# Allure report
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

---

## Test Data

Defined in `test-data/flights.json`. Dates are stored as offsets from today and resolved at runtime — the data never goes stale.

| From       | To          | Departure    | Return       | Travellers |
|------------|-------------|--------------|--------------|------------|
| New York   | Sydney      | today        | today + 7    | 3 adults   |
| Boston     | Amsterdam   | today + 10   | today + 30   | 5 adults   |

To add a new route, add one JSON object to `flights.json` — no code changes required.

---

## Multi-Browser

Chromium is active by default. To enable additional browsers, uncomment the relevant project blocks in `playwright.config.ts`:

```bash
# Run a specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Business layer | Tests read as plain English; no UI code leaks into specs |
| Component Object Model | CityComponent and CalendarComponent are independent widgets — reused across pages without duplication |
| Custom fixtures | Pre-wired business objects injected into tests — zero setup boilerplate |
| Day-offset test data | `departureDaysFromToday: 10` resolves to a real date at runtime — test data never expires |
| Single `page.evaluate()` for extraction | One browser round-trip extracts all flight cards — significantly faster than per-element locator calls |
| Retry resilience | Navigation retries on HTTP/2 errors; search button retries if Yatra overlays swallow the click; Akamai bot-challenge is waited out |
| Allure + HTML + JUnit reporters | HTML for local development, Allure for stakeholder dashboards, JUnit for CI integration |
