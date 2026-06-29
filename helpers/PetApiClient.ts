import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { ApiLogger } from '../utils/apiLogger';
import { Pet } from '../utils/petTypes';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class PetApiClient {
  private readonly logger = new ApiLogger();

  /** Creates a client around a configured Playwright request context. */
  constructor(private readonly request: APIRequestContext) {}

  /** Executes an API request and applies consistent request/response logging. */
  private async send(
    method: HttpMethod,
    path: string,
    action: () => Promise<APIResponse>,
    data?: unknown
  ): Promise<APIResponse> {
    const logContext = this.logger.request({ method, path, data });
    const response = await action();
    await this.logger.response({ method, path, data }, response, logContext);
    return response;
  }

  /** Creates a pet using a valid contract payload. */
  async createPet(pet: Pet): Promise<APIResponse> {
    return this.send('POST', 'pet', () => this.request.post('pet', { data: pet }), pet);
  }

  /** Retrieves a pet by numeric or deliberately invalid test ID. */
  async readPet(petId: number | string): Promise<APIResponse> {
    const path = `pet/${petId}`;
    return this.send('GET', path, () => this.request.get(path));
  }

  /** Replaces an existing pet with the supplied state. */
  async updatePet(pet: Pet): Promise<APIResponse> {
    return this.send('PUT', 'pet', () => this.request.put('pet', { data: pet }), pet);
  }

  /** Deletes a pet by ID. */
  async deletePet(petId: number | string): Promise<APIResponse> {
    const path = `pet/${petId}`;
    return this.send('DELETE', path, () => this.request.delete(path));
  }

  /** Sends an intentionally invalid payload for negative testing. */
  async createInvalidPet(data: unknown): Promise<APIResponse> {
    return this.send('POST', 'pet', () => this.request.post('pet', { data }), data);
  }

  /** Sends a create request without a body to test validation behavior. */
  async createPetWithoutBody(): Promise<APIResponse> {
    return this.send('POST', 'pet', () => this.request.post('pet'));
  }

  /** Calls an unsupported pet operation to verify method handling. */
  async invalidMethodOnPet(petId: number | string): Promise<APIResponse> {
    const path = `pet/${petId}`;
    const data = { status: 'sold' };
    return this.send('PATCH', path, () => this.request.patch(path, { data }), data);
  }

  /** Asserts an exact status and a JSON response content type. */
  async expectJsonResponse(response: APIResponse, expectedStatus: number): Promise<void> {
    expect(response.status()).toBe(expectedStatus);
    expect(response.headers()['content-type']).toContain('application/json');
  }

  /** Parses a JSON response using the caller's expected body type. */
  async responseBody<T>(response: APIResponse): Promise<T> {
    return response.json() as Promise<T>;
  }
}
