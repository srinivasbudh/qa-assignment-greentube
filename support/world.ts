import { setWorldConstructor, World } from '@cucumber/cucumber';
import { APIRequestContext, APIResponse, request } from '@playwright/test';
import { getApiConfig } from '../config/env';
import { PetApiClient } from '../helpers/PetApiClient';
import { createTestDataGenerator, TestDataGenerator } from '../test-data/dataGenerator';
import { Pet } from '../utils/petTypes';

export class ApiWorld extends World {
  // Scenario state is shared only between steps in the current scenario.
  requestContext!: APIRequestContext;
  petApi!: PetApiClient;
  data!: TestDataGenerator;
  currentPet?: Pet;
  createdResponse?: APIResponse;
  readResponse?: APIResponse;
  updatedResponse?: APIResponse;
  deleteResponse?: APIResponse;
  latestResponse?: APIResponse;

  /** Initializes isolated request and test-data resources for a scenario. */
  async init(): Promise<void> {
    const apiConfig = getApiConfig();
    this.data = createTestDataGenerator();
    this.requestContext = await request.newContext({
      baseURL: apiConfig.baseUrl,
      extraHTTPHeaders: apiConfig.headers,
      ignoreHTTPSErrors: apiConfig.ignoreHttpsErrors
    });
    this.petApi = new PetApiClient(this.requestContext);
  }

  /** Disposes the scenario's Playwright request context. */
  async cleanup(): Promise<void> {
    await this.requestContext?.dispose();
  }
}

setWorldConstructor(ApiWorld);

