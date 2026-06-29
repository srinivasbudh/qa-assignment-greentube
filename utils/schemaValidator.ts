import Ajv, { AnySchemaObject, ValidateFunction } from 'ajv';

const ajv = new Ajv({
  allErrors: true,
  strict: true
});

const validators = new Map<string, ValidateFunction>();

/** Compiles each named schema once and reuses it across the test run. */
function validatorFor(schemaName: string, schema: AnySchemaObject): ValidateFunction {
  const existing = validators.get(schemaName);
  if (existing) {
    return existing;
  }

  const validator = ajv.compile(schema);
  validators.set(schemaName, validator);
  return validator;
}

/** Validates runtime response data and returns it with its verified type. */
export function validateSchema<T>(schemaName: string, schema: AnySchemaObject, data: unknown): T {
  const validator = validatorFor(schemaName, schema);
  if (!validator(data)) {
    const details = ajv.errorsText(validator.errors, {
      dataVar: 'response',
      separator: '; '
    });
    throw new Error(`Response does not match the ${schemaName} schema: ${details}`);
  }

  return data as T;
}
