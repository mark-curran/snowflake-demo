import { orderValidator } from '../src';

describe('order schema', () => {
  it('should compile with Ajv without throwing', () => {
    orderValidator;
  });
});
