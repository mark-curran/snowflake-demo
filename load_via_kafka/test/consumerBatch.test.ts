import { EventEmitter } from 'stream';
import { ConsumerBatch } from '../src/consumerBatch';
import { AsyncQueue } from '../src/asyncQueue';
import {
  Consumer,
  TopicPartitionOffset,
  Message,
} from '../src/rdkafkaSupplementaryTypes';

function createMockConsumer(): jest.Mocked<Consumer> {
  return {
    on: jest.fn(),
    isConnected: jest.fn().mockReturnValue(true),
    disconnect: jest.fn(),
    connect: jest.fn(),
    listenerCount: jest.fn().mockReturnValue(0),
    consume: jest.fn(),
    assign: jest.fn(),
    subscription: jest.fn().mockReturnValue(['test-topic']),
    subscribe: jest.fn(),
    seek: jest.fn(),
  };
}

const initTopicPartitionOffset: TopicPartitionOffset = {
  topic: 'test-topic',
  partition: 1,
  offset: 10,
};

async function consumptionCallback(message: Message): Promise<void> {
  return;
}

describe('ConsumerBatch', () => {
  afterAll(() => {
    (ConsumerBatch as any)['activeConsumers'].clear();
  });

  describe('constructor with default arguments', () => {
    const mockConsumer = createMockConsumer();

    afterEach(() => {
      (ConsumerBatch as any)['activeConsumers'].clear();
      mockConsumer.isConnected.mockReturnValue(true);
    });

    it('throws if the consumer is disconnected', () => {
      mockConsumer.isConnected.mockReturnValue(false);
      expect(() => {
        new ConsumerBatch(
          mockConsumer,
          initTopicPartitionOffset,
          consumptionCallback,
        );
      }).toThrow('Consumer must be connected to use the consumeBatch class.');
    });
    it('throws if there is already a ConsumerBatch with that consumer', () => {
      expect(() => {
        new ConsumerBatch(
          mockConsumer,
          initTopicPartitionOffset,
          consumptionCallback,
        );
        new ConsumerBatch(
          mockConsumer,
          initTopicPartitionOffset,
          consumptionCallback,
        );
      }).toThrow('There is already a consumer batch with this consumer');
    });
    it('throws if the consumer is not already subscribed to the topic.', () => {
      expect(() => {
        new ConsumerBatch(
          mockConsumer,
          { ...initTopicPartitionOffset, topic: 'another-topic' },
          consumptionCallback,
        );
      }).toThrow('KafkaConsumer is not subscribed to another-topic');
    });
  });

  describe('constructor that permits additional listeners', () => {
    const mockConsumer = createMockConsumer();

    it('Does not throw if there are additional listeners', () => {
      // Return any random integer greater than zero.
      mockConsumer.listenerCount.mockImplementation(
        () => Math.floor(Math.random() * 100) + 1,
      );
      // This line shouldn't throw.
      new ConsumerBatch(
        mockConsumer,
        initTopicPartitionOffset,
        consumptionCallback,
      );
    });
  });

  describe('consuming a single batch', () => {
    const mockConsumer = createMockConsumer();

    it(
      'awaits the consumption callback once for each consumer message' +
        ' and backs off when the buffer is empty',
      async () => {
        const mockConsumptionCallback = jest.fn(async (msg: Message) => {
          // We are only asserting the mock is called, so do nothing with the input.
          msg;
          return;
        });

        const consumerBatch = new ConsumerBatch(
          mockConsumer,
          initTopicPartitionOffset,
          mockConsumptionCallback,
          5,
          1000,
        );

        const messages: Message[] = Array.from({ length: 3 }, (_, i) => ({
          value: Buffer.from(JSON.stringify({ foo: 'bar' }), 'utf-8'),
          size: 10,
          topic: 'test-topic',
          offset: 10 + i,
          partition: 1,
        }));

        // Mocking and extending EventEmitter requires a hugely complicated mock, instead
        // we randomly and asychronously add messages to the private message buffer.
        const messageBuffer = (consumerBatch as any)[
          'messageBuffer'
        ] as AsyncQueue<Message>;
        messages.forEach((msg) => {
          setTimeout(
            () => {
              messageBuffer.push(msg);
            },
            Math.floor(Math.random() * 50),
          );
        });

        // Act
        await consumerBatch.consumeInBatches(3);

        // Sort calls to the mock by their offset, then assert.
        expect(
          mockConsumptionCallback.mock.calls
            .map((call) => call[0])
            .sort((a, b) => a.offset - b.offset),
        ).toEqual(messages);
      },
    );
  });
});
