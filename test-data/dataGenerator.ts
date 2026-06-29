import { getApiConfig } from '../config/env';

const adjectives = [
  'amber',
  'brave',
  'calm',
  'dapper',
  'eager',
  'fuzzy',
  'gentle',
  'happy',
  'mighty',
  'swift'
];

const animals = [
  'akita',
  'beagle',
  'collie',
  'doodle',
  'husky',
  'maltese',
  'persian',
  'poodle',
  'retriever',
  'terrier'
];

const categories = ['qa-category', 'smoke-suite', 'regression-suite', 'contract-suite'];
const tags = ['automation', 'api', 'playwright', 'cucumber', 'generated'];

/** Converts a text seed into a stable unsigned numeric seed. */
function hashSeed(seed: string): number {
  return seed.split('').reduce((hash, character) => {
    return (hash * 31 + character.charCodeAt(0)) >>> 0;
  }, 2166136261);
}

export class TestDataGenerator {
  private sequence = 0;
  private state: number;

  /** Creates an isolated pseudo-random generator for one test flow. */
  constructor(seed = getApiConfig().testDataSeed || `${Date.now()}-${process.env.PW_TEST_WORKER_INDEX || '0'}`) {
    this.state = hashSeed(seed);
  }

  /** Returns the next deterministic fraction between zero and one. */
  private nextFraction(): number {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }

  /** Returns a pseudo-random integer within an inclusive range. */
  integer(min: number, max: number): number {
    return Math.floor(this.nextFraction() * (max - min + 1)) + min;
  }

  /** Picks one pseudo-random item from a non-empty collection. */
  pick<T>(values: readonly T[]): T {
    return values[this.integer(0, values.length - 1)];
  }

  /** Creates a worker-aware suffix to reduce parallel data collisions. */
  suffix(): string {
    this.sequence += 1;
    return `${Date.now().toString(36)}-${process.env.PW_TEST_WORKER_INDEX || '0'}-${this.sequence}-${this.integer(1000, 9999)}`;
  }

  /** Generates a pet ID within the configured safe range. */
  petId(): number {
    const { petIdMin, petIdMax } = getApiConfig();
    return this.integer(petIdMin, petIdMax);
  }

  /** Generates a readable, unique pet name. */
  petName(prefix = 'qa-pet'): string {
    return `${prefix}-${this.pick(adjectives)}-${this.pick(animals)}-${this.suffix()}`;
  }

  /** Generates a valid Petstore category object. */
  category() {
    return {
      id: this.integer(1, 99),
      name: this.pick(categories)
    };
  }

  /** Generates the requested number of Petstore tag objects. */
  tags(count = 1) {
    return Array.from({ length: count }, (_, index) => ({
      id: this.integer(100, 999) + index,
      name: this.pick(tags)
    }));
  }

  /** Generates a syntactically valid placeholder image URL. */
  imageUrl(): string {
    return `https://example.test/pets/${this.pick(animals)}-${this.suffix()}.png`;
  }
}

/** Creates a test-data generator with an optional repeatable seed. */
export function createTestDataGenerator(seed?: string): TestDataGenerator {
  return new TestDataGenerator(seed);
}
