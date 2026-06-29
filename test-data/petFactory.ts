import { Pet } from '../utils/petTypes';
import { createTestDataGenerator, TestDataGenerator } from './dataGenerator';

/** Builds a valid generated pet and applies scenario-specific overrides. */
export function buildPet(overrides: Partial<Pet> = {}, generator: TestDataGenerator = createTestDataGenerator()): Pet {
  const id = overrides.id ?? generator.petId();

  return {
    id,
    category: overrides.category ?? generator.category(),
    name: overrides.name ?? generator.petName(),
    photoUrls: overrides.photoUrls ?? [generator.imageUrl()],
    tags: overrides.tags ?? generator.tags(2),
    status: overrides.status ?? 'available',
    ...overrides
  };
}

/** Builds an updated version of an existing pet for PUT scenarios. */
export function buildUpdatedPet(basePet: Pet, overrides: Partial<Pet> = {}, generator: TestDataGenerator = createTestDataGenerator()): Pet {
  return buildPet(
    {
      ...basePet,
      name: `${basePet.name}-updated`,
      status: 'sold',
      tags: generator.tags(2),
      ...overrides
    },
    generator
  );
}

/** Builds a payload with wrong field types for negative validation tests. */
export function buildInvalidPetPayload(): Record<string, unknown> {
  return {
    id: 'not-a-number',
    name: 123,
    photoUrls: 'not-an-array'
  };
}
