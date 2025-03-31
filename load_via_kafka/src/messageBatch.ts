import { Producer } from 'node-rdkafka';
import logger from './logger';
import { busAck, decodeKey, ProducerInput } from './connection';

// TODO: Rename to ProducerBatch.
export class MessageBatch {
  private static activeProducers: Set<string> = new Set();
  private producer: Producer;
  private sendingBatch: boolean;
  private _busAcks: busAck[];
  public producerName: string;
  public batchSize: number;
  public pollInterval: number;
  public batchTimeout: number;

  constructor(
    producer: Producer,
    batchSize = 1,
    pollInterval = 100,
    batchTimeout = 5000,
    allowExistingDeliveryListeners = false,
  ) {
    // Check producer is connected.
    if (!producer.isConnected()) {
      throw new Error('Producer must be connected to use MessageBatch class.');
    }

    // Check the producer has a `name` attribute, which is not included in type definition.
    if ('name' in producer) {
      var nameAttribute = producer.name;
    } else {
      throw new Error(`Producer does not have a name.`);
    }

    // Check the name is not an empty string or undefined.
    if (MessageBatch.validProducerName(nameAttribute)) {
      // Cast as a string now that we know it's a valid name.
      const producerName = nameAttribute as string;

      logger.debug(`Adding producer named ${producerName} to a message batch.`);
      MessageBatch.addToActiveProducers(producerName);
      this.producerName = producerName;
      this.producer = producer;
    } else {
      throw new Error(`Producer name "${nameAttribute}" is not a valid name`);
    }

    // Check producer has no delivery report listeners.
    // TODO: Does 'delivery-report' belong to an enum?
    const existingListeners = producer.listenerCount('delivery-report');
    if (existingListeners > 0 && allowExistingDeliveryListeners) {
      throw new Error(
        `Producer named ${this.producerName} has existing delivery report listeners.` +
          'Set allowExistingDeliveryListeners to true to allow extra listeners.',
      );
    } else this.setDeliveryReportListener();

    // When you construct MessageBatch you haven't received any acks yet.
    this._busAcks = [];

    // Set remaining attributes.
    this.batchSize = batchSize;
    this.pollInterval = pollInterval;
    this.batchTimeout = batchTimeout;
    this.sendingBatch = false;
  }

  private static addToActiveProducers(producerName: string) {
    if (MessageBatch.activeProducers.has(producerName)) {
      throw new Error(
        `There already exists a MessageBatch with producer named ${producerName}`,
      );
    } else {
      MessageBatch.activeProducers.add(producerName);
    }
  }

  // TODO: Make this a helper function?
  private static validProducerName(producerName: unknown): boolean {
    return typeof producerName === 'string' && producerName.trim().length > 0;
  }

  private setDeliveryReportListener(): void {
    this.producer.on('delivery-report', (err, report) => {
      logger.debug(
        `Delivery report from producer ${this.producerName} ` +
          `Delivery report error: ${JSON.stringify(err)} ` +
          `Delivery report contents: ${JSON.stringify(report)} } ` +
          `Delivery repot key: ${decodeKey(report.key)}`,
      );

      this._busAcks.push({ err, report });
    });
  }

  get busAcks(): busAck[] {
    if (this.sendingBatch) {
      throw new Error(
        'Cannot access bus acknowledgements until sending is complete.',
      );
    }

    return this._busAcks;
  }

  public async sendBatch(producerInput: ProducerInput[]): Promise<void> {
    if (this.sendingBatch) {
      throw new Error(
        `Producer named ${this.producerName} is already sending a message batch.`,
      );
    } else {
      this.sendingBatch = true;
      this._busAcks = [];
    }

    const inputLength = producerInput.length;
    const timeStartSending = Date.now();

    if (inputLength > this.batchSize) {
      throw new Error(
        `Length of messages ${producerInput.length} cannot exceed size of maximum batch size ${this.batchSize}`,
      );
    }

    /*
    NOTE: This project integrates with EventsHub which doesn't support transaction scoped writes.
    */
    logger.debug(`Producing batch of length ${inputLength}`);
    producerInput.forEach((input) => {
      this.producer.produce(
        input.topic,
        input.partition,
        input.message,
        input.key,
        input.timestamp,
        input.opaque,
        input.headers,
      );
    });

    const timeStartWaiting = Date.now();
    for (;;) {
      logger.debug(
        `Producer ${this.producerName} entering loop where we wait for acknowledgements.`,
      );
      if (inputLength === this._busAcks.length) {
        logger.debug('All acknowledgements received.');
        break;
      }

      if (timeStartWaiting > timeStartSending + this.batchTimeout) {
        throw new Error(
          `Message batch from producer ${this.producerName} exceeded batch timeout.`,
        );
      }

      /*
      C++ and node-rdkafka documentation unclear whether this is blocking, but 
      according to the Rust documentation, callbacks are executed in the same
      execution thread that calls producer.poll()

      https://docs.rs/rdkafka/0.36.2/rdkafka/producer/index.html#async
      */
      this.producer.poll();

      // Sleep this thread until it's time to check the client for new events.
      await new Promise((resolve) => setTimeout(resolve, this.pollInterval));
    }

    logger.debug('Sending batch completed.');
    this.sendingBatch = false;
  }
}
