import { ProducerInput } from './rdkafkaSupplementaryTypes';
import { TOPIC } from './connection';
import { orderValidator } from './validator';

export function generateProducerInput(numMessages: number): ProducerInput[] {
  const messages: ProducerInput[] = [];

  for (var j = 0; j < numMessages; j++) {
    const person = {
      id: j, // TODO: Replace with a more realistic non-colliding unique id.
      name: `Joey Joe Joe Junior Number ${j}`,
      age: 30 + j,
    };

    if (!orderValidator(person)) {
      throw new Error(
        `${JSON.stringify(person)} does not conform to the order schema.`,
      );
    }
    const value = Buffer.from(JSON.stringify(person), 'utf-8');

    const inputs: ProducerInput = {
      topic: TOPIC,
      partition: undefined,
      message: value,
      key: `${person.id}`,
    };

    messages.push(inputs);
  }

  return messages;
}

function generateMessageValue() {}
