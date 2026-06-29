import { After, Before } from '@cucumber/cucumber';
import { ApiWorld } from './world';

/** Creates isolated API resources before each Cucumber scenario. */
Before(async function (this: ApiWorld) {
  await this.init();
});

/** Releases API resources after each scenario, including failures. */
After(async function (this: ApiWorld) {
  await this.cleanup();
});
