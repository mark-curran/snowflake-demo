import logger from './logger';
import { Producer, busAck, ProducerInput } from './rdkafkaSupplementaryTypes';
import { decodeKey } from './rdkafkaHelpers';

export class ProducerBatch {
  private static activeProducers: Set<Producer> = new Set();
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
      throw new Error('Producer must be connected to use ProducerBatch class.');
    }

    // Check the consumer isn't already in the active set.
    if (ProducerBatch.activeProducers.has(producer)) {
      throw new Error('There is already a producer batch with this producer.');
    } else {
      ProducerBatch.activeProducers.add(producer);
      this.producer = producer;
      this.producerName = (producer as any).name ?? 'unname_client';
    }

    // Check there are no active listeners to the 'delivery-report' event for this consumer.
    const existingListeners = producer.listenerCount('delivery-report');
    if (existingListeners > 0 && !allowExistingDeliveryListeners) {
      throw new Error(
        'Producer has existing delivery report listeners, ' +
          'set allowExistingDeliveryListeners to true to allow extra listeners.',
      );
    } else this.setDeliveryReportListener();

    // When you construct ProducerBatch you haven't received any acks yet.
    this._busAcks = [];

    // Set remaining attributes.
    this.batchSize = batchSize;
    this.pollInterval = pollInterval;
    this.batchTimeout = batchTimeout;
    this.sendingBatch = false;
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
      return Promise.reject(
        Error(
          `Producer named ${this.producerName} is already sending a message batch.`,
        ),
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

    for (;;) {
      let timeStartChecking = Date.now();
      logger.debug(
        `Producer ${this.producerName} entering loop where we check for acknowledgements.`,
      );
      if (inputLength === this._busAcks.length) {
        logger.debug('All acknowledgements received.');
        break;
      }

      if (timeStartChecking > timeStartSending + this.batchTimeout) {
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
