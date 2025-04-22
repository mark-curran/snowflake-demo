import { ProducerBatch } from '../src/producerBatch';
import {
  Producer,
  Client,
  ProducerInput,
} from '../src/rdkafkaSupplementaryTypes';

const mockClient: jest.Mocked<Client> = {
  on: jest.fn(),
  isConnected: jest.fn(),
  disconnect: jest.fn(),
  connect: jest.fn(),
  listenerCount: jest.fn(),
};

const mockProducer: jest.Mocked<Producer> = {
  on: jest.fn(),
  isConnected: jest.fn().mockReturnValue(true),
  disconnect: jest.fn(),
  connect: jest.fn(),
  listenerCount: jest.fn().mockReturnValue(0),
  produce: jest.fn(),
  poll: jest.fn(),
};

const testProducerInput: ProducerInput = {
  topic: 'test-topic',
  partition: 1,
  message: Buffer.from(JSON.stringify({ foo: 'bar' }), 'utf-8'),
  key: 'test-key',
};

function resetMocksAndStaticVariables(): void {
  // Clear the private static variable after very test.
  (ProducerBatch as any)['activeProducers'].clear();

  // Reset the return values.
  mockProducer.isConnected.mockReturnValue(true);
  mockProducer.listenerCount.mockReturnValue(0);
}

describe('ProducerBatch', () => {
  afterEach(() => {
    resetMocksAndStaticVariables();
  });

  describe('Constructor with default arguments', () => {
    afterEach(() => {
      /*
      Need to reset the mock a few extra times becuase we modify the arugments passed
      into the constructor.
      */
      resetMocksAndStaticVariables();
    });

    it('throws if the producer is not connected', () => {
      expect(() => {
        mockProducer.isConnected.mockReturnValue(false);
        new ProducerBatch(mockProducer);
      }).toThrow('Producer must be connected to use ProducerBatch class.');
    });
    it('throws if the producer is already in the active set.', () => {
      expect(() => {
        new ProducerBatch(mockProducer);
        new ProducerBatch(mockProducer);
      }).toThrow('There is already a producer batch with this producer.');
    });
    it('throws if there is an existing delivery report listener', () => {
      // Return any random integer greater than zero.
      mockProducer.listenerCount.mockImplementation(
        () => Math.floor(Math.random() * 100) + 1,
      );
      expect(() => {
        new ProducerBatch(mockProducer);
      }).toThrow(
        'Producer has existing delivery report listeners, ' +
          'set allowExistingDeliveryListeners to true to allow extra listeners.',
      );
    });
  });

  describe('Constructor that permits additional listeners', () => {
    it('Does not throw if there are additional listeners', () => {
      // Return any random integer greater than zero.
      mockProducer.listenerCount.mockImplementation(
        () => Math.floor(Math.random() * 100) + 1,
      );
      // This line shouldn't throw.
      new ProducerBatch(mockProducer, 1, 1, 1, true);
    });
  });

  describe('Accessing bus acks.', () => {
    describe('If a batch is already sending', () => {
      it('throws if you try to access the bus acks', () => {
        const producerBatch = new ProducerBatch(mockProducer);
        (producerBatch as any)['sendingBatch'] = true;
        expect(() => {
          producerBatch.busAcks;
        }).toThrow(
          'Cannot access bus acknowledgements until sending is complete.',
        );
      });
    });
  });

  describe('Sending batch', () => {
    describe('the batch is already sending', () => {
      it('throws if you try to send another batch.', async () => {
        const producerBatch = new ProducerBatch(mockProducer);
        (producerBatch as any)['sendingBatch'] = true;
        await expect(
          producerBatch.sendBatch([testProducerInput]),
        ).rejects.toThrow(
          'Producer named unname_client is already sending a message batch.',
        );
      });
    });
  });
});
