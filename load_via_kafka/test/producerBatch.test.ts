// import { ProducerBatch } from '../src/producerBatch';
// import { Producer, Client, KafkaProducerEvents } from '../src/rdkafkaTypes';

// const mockClient: jest.Mocked<Client<KafkaProducerEvents>> = {
//   // Only need the following methods.
//   disconnect: jest.fn(),
//   connect: jest.fn(),
//   on: jest.fn(),
//   isConnected: jest.fn(),
// } as unknown as jest.Mocked<Client<KafkaProducerEvents>>;

// const mockProducer: jest.Mocked<Producer> = {
//   // Only need the following methods.
//   ...mockClient,
//   name: 'test-producer',
//   produce: jest.fn(),
//   poll: jest.fn(),
// } as unknown as jest.Mocked<Producer>;

// describe('ProducerBatch', () => {
//   it('Does something', () => {
//     expect(true).toBe(true);
//   });
// });
