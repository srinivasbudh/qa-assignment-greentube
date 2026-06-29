import fs from 'node:fs';
import path from 'node:path';

type EnvMap = Record<string, string>;

export type ApiLogLevel = 'none' | 'summary' | 'body';

export type ApiAutomationConfig = {
  baseUrl: string;
  acceptHeader: string;
  contentTypeHeader: string;
  timeoutMs: number;
  testDataSeed?: string;
  petIdMin: number;
  petIdMax: number;
  apiUsername?: string;
  apiPassword?: string;
  bearerToken?: string;
  ignoreHttpsErrors: boolean;
  logLevel: ApiLogLevel;
  logPretty: boolean;
  logMaxBodyChars: number;
  headers: Record<string, string>;
};

// Read and validate configuration once so a test run uses stable values.
let cachedEnvFile: EnvMap | undefined;
let cachedConfig: ApiAutomationConfig | undefined;

/** Trims an environment value and removes matching surrounding quotes. */
function parseEnvValue(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/** Parses supported .env lines into key-value pairs. */
function parseEnvFile(content: string): EnvMap {
  return content.split(/\r?\n/).reduce<EnvMap>((accumulator, rawLine) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      return accumulator;
    }

    const normalized = line.startsWith('export ') ? line.slice('export '.length).trim() : line;
    const separatorIndex = normalized.indexOf('=');
    if (separatorIndex === -1) {
      return accumulator;
    }

    const key = normalized.slice(0, separatorIndex).trim();
    const value = normalized.slice(separatorIndex + 1);
    if (key) {
      accumulator[key] = parseEnvValue(value);
    }
    return accumulator;
  }, {});
}

/** Loads and caches the selected environment file when it exists. */
function loadEnvFile(): EnvMap {
  if (cachedEnvFile) {
    return cachedEnvFile;
  }

  const envPath = path.resolve(process.cwd(), process.env.TEST_ENV_FILE || '.env');
  cachedEnvFile = fs.existsSync(envPath) ? parseEnvFile(fs.readFileSync(envPath, 'utf8')) : {};
  return cachedEnvFile;
}

/** Resolves a value using process, file, then fallback priority. */
function envValue(key: string, fallback?: string): string | undefined {
  return process.env[key] ?? loadEnvFile()[key] ?? fallback;
}

/** Reads a finite numeric setting or throws a clear configuration error. */
function numberValue(key: string, fallback: number): number {
  const value = envValue(key);
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${key} must be a number. Received: ${value}`);
  }
  return parsed;
}

/** Converts common boolean text values into true or false. */
function booleanValue(key: string, fallback: boolean): boolean {
  const value = envValue(key);
  if (!value) {
    return fallback;
  }

  if (['true', '1', 'yes', 'y'].includes(value.toLowerCase())) {
    return true;
  }

  if (['false', '0', 'no', 'n'].includes(value.toLowerCase())) {
    return false;
  }

  throw new Error(`Environment variable ${key} must be a boolean. Received: ${value}`);
}

/** Validates and returns the configured API logging level. */
function logLevelValue(): ApiLogLevel {
  const value = (envValue('API_LOG_LEVEL', 'none') || 'none').toLowerCase();
  if (['none', 'summary', 'body'].includes(value)) {
    return value as ApiLogLevel;
  }
  throw new Error(`Environment variable API_LOG_LEVEL must be none, summary, or body. Received: ${value}`);
}

/** Normalizes a base URL to end with exactly one slash. */
function normalizeBaseUrl(value: string): string {
  return `${value.replace(/\/+$/, '')}/`;
}

/** Builds bearer or basic authorization headers when credentials exist. */
function authHeaders(config: Pick<ApiAutomationConfig, 'apiUsername' | 'apiPassword' | 'bearerToken'>): Record<string, string> {
  if (config.bearerToken) {
    return { Authorization: `Bearer ${config.bearerToken}` };
  }

  if (config.apiUsername && config.apiPassword) {
    const token = Buffer.from(`${config.apiUsername}:${config.apiPassword}`).toString('base64');
    return { Authorization: `Basic ${token}` };
  }

  return {};
}

/** Returns the validated, cached configuration used by the test framework. */
export function getApiConfig(): ApiAutomationConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const baseUrl = normalizeBaseUrl(envValue('API_BASE_URL', 'https://petstore.swagger.io/v2')!);
  const acceptHeader = envValue('API_ACCEPT_HEADER', 'application/json')!;
  const contentTypeHeader = envValue('API_CONTENT_TYPE_HEADER', 'application/json')!;
  const apiUsername = envValue('API_USERNAME');
  const apiPassword = envValue('API_PASSWORD');
  const bearerToken = envValue('API_BEARER_TOKEN');

  cachedConfig = {
    baseUrl,
    acceptHeader,
    contentTypeHeader,
    timeoutMs: numberValue('API_TIMEOUT_MS', 60_000),
    testDataSeed: envValue('TEST_DATA_SEED'),
    ignoreHttpsErrors: booleanValue('API_IGNORE_HTTPS_ERRORS', false),
    logLevel: logLevelValue(),
    logPretty: booleanValue('API_LOG_PRETTY', true),
    logMaxBodyChars: numberValue('API_LOG_MAX_BODY_CHARS', 1200),
    petIdMin: numberValue('TEST_PET_ID_MIN', 100_000_000),
    petIdMax: numberValue('TEST_PET_ID_MAX', 999_999_999_999),
    apiUsername,
    apiPassword,
    bearerToken,
    headers: {
      Accept: acceptHeader,
      'Content-Type': contentTypeHeader,
      ...authHeaders({ apiUsername, apiPassword, bearerToken })
    }
  };

  return cachedConfig;
}

