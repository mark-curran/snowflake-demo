import { ProducerInput } from './rdkafkaSupplementaryTypes';
import { TOPIC } from './connection';
import { Order, orderValidator } from '@snowflake-demo/schemas';
import { faker } from '@faker-js/faker';

export function generateProducerInput(numMessages: number): ProducerInput[] {
  const messages: ProducerInput[] = [];

  for (var j = 0; j < numMessages; j++) {
    const order = generateOrder();

    if (!orderValidator(order)) {
      throw new Error(
        `${JSON.stringify(order)} is not a valid order object: ` +
          ` ${JSON.stringify(orderValidator.errors)}`,
      );
    }
    const value = Buffer.from(JSON.stringify(order), 'utf-8');

    const inputs: ProducerInput = {
      topic: TOPIC,
      partition: undefined,
      message: value,
      key: `${order.orderId}`,
    };

    messages.push(inputs);
  }

  return messages;
}

function generateOrder(): Order {
  return {
    orderId: faker.string.uuid(),
    customerId: faker.string.uuid(),
    orderDate: faker.date.recent().toISOString(),
    totalAmount: 3.8,
    items: [
      {
        productName: faker.commerce.productName(),
        price: parseFloat(faker.commerce.price({ min: 1, max: 2, dec: 2 })),
        productId: faker.string.uuid(),
        quantity: faker.number.int({ min: 1, max: 10 }),
      },
    ],
  };
}
