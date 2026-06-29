import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ApiWorld } from '../support/world';
import { buildInvalidPetPayload, buildPet, buildUpdatedPet } from '../test-data/petFactory';

/** Creates a pet and saves its response in scenario state. */
Given('I create a new pet with dynamic data', async function (this: ApiWorld) {
  this.currentPet = buildPet({}, this.data);
  this.createdResponse = await this.petApi.createPet(this.currentPet);
  await this.petApi.expectJsonResponse(this.createdResponse, 200);
});

/** Retrieves the pet created earlier in the scenario. */
When('I read the created pet', async function (this: ApiWorld) {
  this.readResponse = await this.petApi.readPet(this.currentPet!.id);
  await this.petApi.expectJsonResponse(this.readResponse, 200);
});

/** Updates the current pet and stores the API response. */
When('I update the created pet', async function (this: ApiWorld) {
  this.currentPet = buildUpdatedPet(this.currentPet!, {}, this.data);
  this.updatedResponse = await this.petApi.updatePet(this.currentPet);
  await this.petApi.expectJsonResponse(this.updatedResponse, 200);
});

/** Deletes the pet created earlier in the scenario. */
When('I delete the created pet', async function (this: ApiWorld) {
  this.deleteResponse = await this.petApi.deletePet(this.currentPet!.id);
  await this.petApi.expectJsonResponse(this.deleteResponse, 200);
});

/** Requests a pet using a deliberately invalid path ID. */
When('I request a pet using invalid ID {string}', async function (this: ApiWorld, petId: string) {
  this.latestResponse = await this.petApi.readPet(petId);
});

/** Sends a payload containing invalid field types. */
When('I create a pet with an invalid request body', async function (this: ApiWorld) {
  this.latestResponse = await this.petApi.createInvalidPet(buildInvalidPetPayload());
});

/** Sends a create request without a request body. */
When('I create a pet without a request body', async function (this: ApiWorld) {
  this.latestResponse = await this.petApi.createPetWithoutBody();
});

/** Calls an unsupported HTTP operation on the pet resource. */
When('I call an unsupported method for a pet', async function (this: ApiWorld) {
  this.latestResponse = await this.petApi.invalidMethodOnPet(123456789);
});

/** Compares create, read, and update responses for data consistency. */
Then('the created, read, and updated pet responses should be consistent', async function (this: ApiWorld) {
  const createdPet = await this.petApi.petResponseBody(this.createdResponse!);
  const readPet = await this.petApi.petResponseBody(this.readResponse!);
  const updatedPet = await this.petApi.petResponseBody(this.updatedResponse!);

  expect(readPet).toMatchObject(createdPet);
  expect(updatedPet).toMatchObject(this.currentPet!);

  await this.petApi.deletePet(this.currentPet!.id);
});

/** Confirms that a deleted pet returns a not-found response. */
Then('reading the deleted pet should return not found', async function (this: ApiWorld) {
  const response = await this.petApi.readPet(this.currentPet!.id);
  await this.petApi.expectJsonResponse(response, 404);
  const body = await this.petApi.apiErrorResponseBody(response);
  expect(body.message).toContain('Pet not found');
});

/** Confirms the exact not-found response for an invalid path ID. */
Then('the API should return an error response', async function (this: ApiWorld) {
  await this.petApi.expectJsonResponse(this.latestResponse!, 404);
  await this.petApi.apiErrorResponseBody(this.latestResponse!);
});

/** Documents the public sandbox's exact malformed-body defect. */
Then('the public sandbox should return its known server error', async function (this: ApiWorld) {
  await this.petApi.expectJsonResponse(this.latestResponse!, 500);
  await this.petApi.apiErrorResponseBody(this.latestResponse!);
});

/** Confirms the exact missing-body validation response. */
Then('the API should return a request validation error', async function (this: ApiWorld) {
  await this.petApi.expectJsonResponse(this.latestResponse!, 405);
  await this.petApi.apiErrorResponseBody(this.latestResponse!);
});

/** Confirms the exact unsupported-method response. */
Then('the API should return a method or validation error', async function (this: ApiWorld) {
  await this.petApi.expectJsonResponse(this.latestResponse!, 405);
});
