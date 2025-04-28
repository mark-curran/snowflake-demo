// Must come before any imports that use `TOPIC`
jest.mock('../src/connection', () => ({
  // To avoid having to add lots of app configuration to this unit test.
  TOPIC: 'mock-topic',
}));

const mockOrderValidator = jest.fn();
mockOrderValidator.mockReturnValue(true);

jest.mock('@snowflake-demo/schemas', () => ({
  orderValidator: mockOrderValidator,
}));

import { generateProducerInput } from '../src/dataGeneration';
import { ProducerInput } from '../src/rdkafkaSupplementaryTypes';

describe('generateProducerInput', () => {
  let producerInput: ProducerInput[];

  afterEach(() => {
    mockOrderValidator.mockClear();
  });

  it('Produces the right number of messsages.', () => {
    producerInput = generateProducerInput(3);
    expect(producerInput.length).toEqual(3);
  });
  it('It calls the validator on each message it produces.', () => {
    producerInput = generateProducerInput(3);
    producerInput.forEach((input, idx) => {
      const parsedMessage = JSON.parse(input.message!.toString('utf-8'));
      expect(mockOrderValidator).toHaveBeenNthCalledWith(
        idx + 1,
        parsedMessage,
      );
    });
  });
  it('throws if the validator is false', () => {
    mockOrderValidator.mockReturnValue(false);
    expect(() => {
      generateProducerInput(3);
    }).toThrow('is not a valid order object:');
  });
});
