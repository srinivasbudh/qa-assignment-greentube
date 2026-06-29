import { expect, test } from '@playwright/test';
import { PetApiClient } from '../helpers/PetApiClient';
import { createTestDataGenerator } from '../test-data/dataGenerator';
import { buildInvalidPetPayload, buildPet, buildUpdatedPet } from '../test-data/petFactory';

test.describe('Swagger Petstore pet API', () => {
  /** Verifies that create, read, and update operations preserve pet state. */
  test('POST -> GET -> PUT preserves consistent pet data', {
    tag: ['@smoke', '@regression']
  }, async ({ request }) => {
    const api = new PetApiClient(request);
    const data = createTestDataGenerator();
    const createdPet = buildPet({}, data);

    const postResponse = await api.createPet(createdPet);
    await api.expectJsonResponse(postResponse, 200);
    const postBody = await api.petResponseBody(postResponse);
    expect(postBody).toMatchObject(createdPet);

    const getResponse = await api.readPet(createdPet.id);
    await api.expectJsonResponse(getResponse, 200);
    const getBody = await api.petResponseBody(getResponse);
    expect(getBody).toMatchObject(postBody);

    const updatedPet = buildUpdatedPet(createdPet, {}, data);
    const putResponse = await api.updatePet(updatedPet);
    await api.expectJsonResponse(putResponse, 200);
    const putBody = await api.petResponseBody(putResponse);
    expect(putBody).toMatchObject(updatedPet);

    const getUpdatedResponse = await api.readPet(createdPet.id);
    await api.expectJsonResponse(getUpdatedResponse, 200);
    const getUpdatedBody = await api.petResponseBody(getUpdatedResponse);
    expect(getUpdatedBody).toMatchObject(putBody);

    await api.deletePet(createdPet.id);
  });

  /** Verifies that a deleted pet can no longer be retrieved. */
  test('DELETE removes pet and subsequent read returns not found', {
    tag: '@regression'
  }, async ({ request }) => {
    const api = new PetApiClient(request);
    const pet = buildPet();

    await api.createPet(pet);
    const deleteResponse = await api.deletePet(pet.id);
    await api.expectJsonResponse(deleteResponse, 200);
    await api.apiErrorResponseBody(deleteResponse);

    const deletedReadResponse = await api.readPet(pet.id);
    await api.expectJsonResponse(deletedReadResponse, 404);
    const body = await api.apiErrorResponseBody(deletedReadResponse);
    expect(body.message).toContain('Pet not found');
  });

  /** Verifies validation behavior for a non-numeric path ID. */
  test('GET with invalid ID returns not found', {
    tag: '@regression'
  }, async ({ request }) => {
    const api = new PetApiClient(request);
    const response = await api.readPet('invalid-id');

    await api.expectJsonResponse(response, 404);
    const body = await api.apiErrorResponseBody(response);
    expect(body.message).toBeTruthy();
  });

  /** Documents the public sandbox's exact malformed-body defect. */
  test('POST with invalid request body returns the known sandbox server error', {
    tag: '@regression'
  }, async ({ request }) => {
    const api = new PetApiClient(request);
    const response = await api.createInvalidPet(buildInvalidPetPayload());

    await api.expectJsonResponse(response, 500);
    await api.apiErrorResponseBody(response);
  });

  /** Verifies that a create request without a body is rejected. */
  test('POST with missing request body returns method not allowed', {
    tag: '@regression'
  }, async ({ request }) => {
    const api = new PetApiClient(request);
    const response = await api.createPetWithoutBody();

    await api.expectJsonResponse(response, 405);
    await api.apiErrorResponseBody(response);
  });

  /** Verifies error handling for an unsupported HTTP method. */
  test('Unsupported HTTP method returns method not allowed', {
    tag: '@regression'
  }, async ({ request }) => {
    const api = new PetApiClient(request);
    const response = await api.invalidMethodOnPet(123456789);

    await api.expectJsonResponse(response, 405);
  });
});
