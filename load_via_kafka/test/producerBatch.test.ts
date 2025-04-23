import { ProducerBatch } from '../src/producerBatch';
import {
  Producer,
  ProducerInput,
  BusAck,
} from '../src/rdkafkaSupplementaryTypes';
import { TestRdkafkaProducer } from '../src/rdkafkaTestTypes';

const testProducerInput: ProducerInput = {
  topic: 'test-topic',
  partition: 1,
  message: Buffer.from(JSON.stringify({ foo: 'bar' }), 'utf-8'),
  key: 'test-key',
};
const busAck: BusAck = {
  report: {
    topic: testProducerInput.topic,
    partition: testProducerInput.partition as number,
    offset: 160,
    size: 57,
  },
};

function createMockProducer(): jest.Mocked<Producer> {
  return {
    on: jest.fn(),
    isConnected: jest.fn().mockReturnValue(true),
    disconnect: jest.fn(),
    connect: jest.fn(),
    listenerCount: jest.fn().mockReturnValue(0),
    produce: jest.fn(),
    poll: jest.fn(),
  };
}

function appendBusAck(producerBatch: ProducerBatch): TestRdkafkaProducer {
  (producerBatch as any)._busAcks.push(busAck);
  /* 
  The rdkafka library returns `this` when you call poll(), but our application
  code doesn't user the return value.
  */
  return undefined as unknown as TestRdkafkaProducer;
}

describe('ProducerBatch', () => {
  afterAll(() => {
    (ProducerBatch as any)['activeProducers'].clear();
  });

  describe('Constructor with default arguments', () => {
    const mockProducer = createMockProducer();

    afterEach(() => {
      (ProducerBatch as any)['activeProducers'].clear();
      mockProducer.isConnected.mockReturnValue(true);
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
    const mockProducer = createMockProducer();

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
    const mockProducer = createMockProducer();
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

  describe('Sending one batch', () => {
    const mockProducer = createMockProducer();
    const producerBatch = new ProducerBatch(mockProducer, 2, 10, 1000);

    afterEach(() => {
      (producerBatch as any)['sendingBatch'] = false;
      mockProducer.poll.mockReset();
    });

    describe('the batch is already sending', () => {
      it('rejects if you try to send another batch.', async () => {
        (producerBatch as any)['sendingBatch'] = true;

        await expect(
          producerBatch.sendBatch([testProducerInput]),
        ).rejects.toThrow(
          'Producer named unname_client is already sending a message batch.',
        );
      });
    });

    describe('the batch is not already sending', () => {
      it('rejects if the input length is longer than the batchsize.', async () => {
        await expect(
          producerBatch.sendBatch([
            testProducerInput,
            testProducerInput,
            testProducerInput,
          ]),
        ).rejects.toThrow(
          'Length of messages 3 cannot exceed size of maximum batch size 2.',
        );
      });
      it('Resolves with void if all messages are acknowledged', async () => {
        mockProducer.poll.mockImplementation(() => appendBusAck(producerBatch));

        await expect(
          producerBatch.sendBatch([testProducerInput]),
        ).resolves.toBe(undefined);
      });
      it('Rejects with a timeout error when not enough acks are received', async () => {
        mockProducer.poll.mockImplementationOnce(() =>
          appendBusAck(producerBatch),
        );

        await expect(
          producerBatch.sendBatch([testProducerInput, testProducerInput]),
        ).rejects.toThrow(
          'Message batch from producer unname_client exceeded batch timeout.',
        );
      });
    });
  });

  describe('Sending multiple batches', () => {
    const mockProducer = createMockProducer();
    const producerBatch = new ProducerBatch(mockProducer, 2, 10, 1000);

    beforeEach(() => {
      mockProducer.poll.mockReset();
    });

    it('first batch is successful', async () => {
      mockProducer.poll.mockImplementation(() => appendBusAck(producerBatch));
      await expect(
        producerBatch.sendBatch([testProducerInput, testProducerInput]),
      ).resolves.toBe(undefined);
    });

    it('second batch times out', async () => {
      mockProducer.poll.mockImplementationOnce(() =>
        appendBusAck(producerBatch),
      );
      await expect(
        producerBatch.sendBatch([testProducerInput, testProducerInput]),
      ).rejects.toThrow(
        'Message batch from producer unname_client exceeded batch timeout.',
      );
    });

    it('third batch is successful', async () => {
      mockProducer.poll.mockImplementation(() => appendBusAck(producerBatch));
      await expect(
        producerBatch.sendBatch([testProducerInput, testProducerInput]),
      ).resolves.toBe(undefined);
    });
  });
});
