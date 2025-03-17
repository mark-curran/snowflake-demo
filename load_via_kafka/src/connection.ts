// TODO: Zod library for type checking.
import * as fs from 'fs';
import logger from './logger';
import { z } from 'zod';

export type ConnectionData = {
  broker: string;
  password: string;
};
type TerraformOutput = z.infer<typeof terraformOutputSchema>;
const terraformOutputJson = fs.readFileSync(
  'event_hub_connection.json',
  'utf-8',
);

export function getConnectionData(): ConnectionData {
  logger.info('Retrieving connection data.');
  const parsedTerraformOutput: TerraformOutput = terraformOutputSchema.parse(
    JSON.parse(terraformOutputJson),
  );

  return {
    broker: getBrokerAddress(parsedTerraformOutput.primary_connection_string),
    password: parsedTerraformOutput.primary_connection_string,
  };
}
const terraformOutputSchema = z.object({
  primary_connection_string: z.string(),
});

function getBrokerAddress(primaryConnectionString: string): string {
  // TODO: Setup some unit tests.
  const broker = primaryConnectionString.split('//')[1].split('/')[0] + ':9093';

  return broker;
}
