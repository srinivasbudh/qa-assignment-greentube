import { APIResponse } from '@playwright/test';
import { getApiConfig } from '../config/env';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestLog = {
  method: HttpMethod;
  path: string;
  data?: unknown;
};

type ApiLogContext = {
  id: string;
  startedAt: number;
};

// Match common credential names before anything is written to test logs.
const sensitiveKeyPattern = /(authorization|cookie|token|password|secret|api[-_]?key|bearer)/i;
let requestSequence = 0;

/** Generates a process-scoped ID that pairs request and response logs. */
function nextRequestId(): string {
  requestSequence += 1;
  return `${process.pid}-${requestSequence.toString().padStart(3, '0')}`;
}

/** Applies ANSI color only when pretty logging is enabled. */
function color(text: string, code: number): string {
  if (!getApiConfig().logPretty) {
    return text;
  }
  return `\u001b[${code}m${text}\u001b[0m`;
}

/** Selects a console color based on the HTTP status family. */
function statusColor(status: number): number {
  if (status >= 200 && status < 300) {
    return 32;
  }
  if (status >= 300 && status < 400) {
    return 36;
  }
  if (status >= 400 && status < 500) {
    return 33;
  }
  return 31;
}

/** Partially masks string secrets while preserving useful diagnostics. */
function maskValue(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  if (value.length <= 8) {
    return '***';
  }
  return `${value.slice(0, 4)}***${value.slice(-2)}`;
}

/** Recursively masks sensitive object fields before logging. */
function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [
        key,
        sensitiveKeyPattern.test(key) ? maskValue(entryValue) : sanitize(entryValue)
      ])
    );
  }

  return value;
}

/** Serializes and truncates a value to the configured log size. */
function serialize(value: unknown): string {
  const { logMaxBodyChars } = getApiConfig();
  const text = typeof value === 'string' ? value : JSON.stringify(sanitize(value), null, 2);
  if (text.length <= logMaxBodyChars) {
    return text;
  }
  return `${text.slice(0, logMaxBodyChars)}... [truncated ${text.length - logMaxBodyChars} chars]`;
}

/** Selects compact or full sanitized headers for output. */
function headersForLog(headers: Record<string, string>, mode: 'compact' | 'full'): Record<string, string> {
  if (mode === 'full') {
    return sanitize(headers) as Record<string, string>;
  }

  const interestingHeaders = ['content-type', 'content-length', 'x-request-id', 'date'];
  return Object.fromEntries(
    Object.entries(headers)
      .filter(([key]) => interestingHeaders.includes(key.toLowerCase()))
      .map(([key, value]) => [key, sensitiveKeyPattern.test(key) ? String(maskValue(value)) : value])
  );
}

/** Reads a response body safely without allowing logging to fail a test. */
async function safeResponseBody(response: APIResponse): Promise<unknown> {
  const contentType = response.headers()['content-type'] || '';
  const raw = await response.text().catch(() => '');

  if (!raw) {
    return '';
  }

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  return raw;
}

export class ApiLogger {
  private readonly config = getApiConfig();

  /** Reports whether request/response logging is active. */
  isEnabled(): boolean {
    return this.config.logLevel !== 'none';
  }

  /** Logs request details and starts timing its matching response. */
  request(details: RequestLog): ApiLogContext {
    const context = {
      id: nextRequestId(),
      startedAt: Date.now()
    };

    if (!this.isEnabled()) {
      return context;
    }

    const method = color(details.method.padEnd(6), 35);
    const requestUrl = new URL(details.path, this.config.baseUrl).toString();
    const lines = [
      `\n${color(`[API ${context.id} REQUEST]`, 34)} ${method} ${requestUrl}`
    ];

    if (this.config.logLevel === 'body') {
      lines.push(color('Request headers:', 90), serialize(headersForLog(this.config.headers, 'full')));
      lines.push(color('Request body:', 90), details.data === undefined ? '<empty>' : serialize(details.data));
    }

    console.log(lines.join('\n'));
    return context;
  }

  /** Logs response status, timing, headers, and optionally its body. */
  async response(details: RequestLog, response: APIResponse, context: ApiLogContext): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    const durationMs = Date.now() - context.startedAt;
    const status = response.status();
    const statusText = color(`${status} ${response.statusText()}`.trim(), statusColor(status));
    const requestUrl = new URL(details.path, this.config.baseUrl).toString();
    const lines = [
      `${color(`[API ${context.id} RESPONSE]`, 34)} ${details.method.padEnd(6)} ${requestUrl} -> ${statusText} (${durationMs}ms)`
    ];

    const headers = headersForLog(response.headers(), this.config.logLevel === 'body' ? 'full' : 'compact');
    if (Object.keys(headers).length) {
      lines.push(color('Response headers:', 90), serialize(headers));
    }

    if (this.config.logLevel === 'body') {
      lines.push(color('Response body:', 90), serialize(await safeResponseBody(response)));
    }

    console.log(lines.join('\n'));
  }
}
