# QA Assignment

This repository contains two QA deliverables in one flattened project:

1. Manual registration and login test scenarios for GameTwist.
2. Swagger Petstore API automation using Playwright and Cucumber.

## Project Structure

```text
qa-assignment/
├── Registration_Login_Test_Scenarios.md
├── README.md
├── package.json
├── package-lock.json
├── playwright.config.ts
├── cucumber.js
├── tsconfig.json
├── .env.example
├── .gitignore
├── config/
│   └── env.ts
├── helpers/
│   └── PetApiClient.ts
├── schemas/
│   ├── api-error-response.schema.json
│   └── pet-response.schema.json
├── utils/
│   ├── apiLogger.ts
│   ├── petTypes.ts
│   └── schemaValidator.ts
├── test-data/
│   ├── dataGenerator.ts
│   └── petFactory.ts
├── tests/
│   └── petstore.spec.ts
├── features/
│   └── petstore.feature
├── step-definitions/
│   └── petstore.steps.ts
├── support/
│   ├── hooks.ts
│   └── world.ts
└── scripts/
    └── run-with-log-level.js
```

## Manual QA Deliverable

[Registration_Login_Test_Scenarios.md](./Registration_Login_Test_Scenarios.md) contains:

- Registration and login scope.
- Positive, negative, boundary, and validation scenarios.
- Gherkin feature examples.
- Unit/component test candidates.
- Automation strategy, decision matrix, and principles.

The manual scenarios are documentation only; no UI automation project is included.

## API Automation

The automated suite tests the Swagger Petstore pet endpoints through Playwright's `APIRequestContext`. The same API client and test-data builders are reused by direct Playwright tests and Cucumber BDD scenarios.

### Covered Operations

- `POST /pet`
- `GET /pet/{petId}`
- `PUT /pet`
- `DELETE /pet/{petId}`
- Invalid ID
- Invalid request body
- Missing request body
- Unsupported HTTP method
- Runtime response-schema validation

## Prerequisites

- Node.js 18 or newer.
- npm.
- Network access to the configured API environment.

No browser installation is required because this is an API-only Playwright project.

## Installation

Run commands from the `qa-assignment` directory:

```bash
npm ci
```

Use `npm install` instead when intentionally updating dependencies.

## Environment Configuration

Create a local `.env` from the committed example:

```powershell
Copy-Item .env.example .env
```

Linux/macOS:

```bash
cp .env.example .env
```

Important variables:

| Variable | Purpose | Default |
|---|---|---|
| `API_BASE_URL` | API environment under test | `https://petstore.swagger.io/v2` |
| `API_TIMEOUT_MS` | Test timeout in milliseconds | `60000` |
| `API_IGNORE_HTTPS_ERRORS` | Ignore TLS certificate errors | `false` |
| `API_LOG_LEVEL` | `none`, `summary`, or `body` | `none` |
| `TEST_DATA_SEED` | Optional repeatable data seed | empty |
| `TEST_PET_ID_MIN` | Minimum generated pet ID | `100000000` |
| `TEST_PET_ID_MAX` | Maximum generated pet ID | `999999999999` |

Authentication can be supplied through `API_BEARER_TOKEN` or the `API_USERNAME` and `API_PASSWORD` pair. Never commit real credentials.

Process/CI environment variables override values from `.env`. Set `TEST_ENV_FILE` to load another file such as `.env.qa`.

## Running the Tests

```bash
# Validate TypeScript
npm run typecheck

# Direct Playwright API tests
npm test

# Cucumber BDD scenarios
npm run bdd
```

Logging variants:

```bash
npm run test:quiet
npm run test:summary
npm run test:verbose

npm run bdd:quiet
npm run bdd:summary
npm run bdd:verbose
```

Debugging and reports:

```bash
npm run test:debug
npm run report
```

The Cucumber HTML report is generated at `reports/cucumber-report.html`. Playwright generates `playwright-report/` and `test-results/` when applicable.

## Automation Architecture

```text
Playwright test or Cucumber scenario
                ↓
Generated scenario data
                ↓
PetApiClient
                ↓
Configured APIRequestContext
                ↓
Swagger Petstore
                ↓
Status, header, and body assertions
```

- `config/env.ts` loads and validates environment configuration.
- `helpers/PetApiClient.ts` centralizes endpoint calls and common assertions.
- `schemas/` defines the expected successful and error response contracts.
- `test-data/` creates dynamic valid and invalid payloads.
- `utils/apiLogger.ts` provides masked request/response logging.
- `utils/schemaValidator.ts` uses AJV to validate actual JSON responses at runtime.
- `tests/` contains direct Playwright tests.
- `features/`, `step-definitions/`, and `support/` provide executable BDD coverage.

## Generated and Local Files

The following are intentionally excluded by `.gitignore` and should not be committed:

- `node_modules/`
- `.env` and environment-specific variants
- `playwright-report/`
- `test-results/`
- `reports/`
- `coverage/`
- build output, caches, and log files

Keep `.env.example` committed because it documents the supported configuration without containing secrets.

## Known Limitation

Swagger Petstore is a shared public service. Its behavior can vary for malformed payloads, and data created by other users may affect stability. A controlled QA environment with a strict API contract is preferable for production-grade regression testing.
