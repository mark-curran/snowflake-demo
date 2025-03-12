// TODO: Zod library for type checking.
import * as fs from 'fs';
import logger from './logger';
import { z } from 'zod';
const file = fs.readFileSync('event_hub_connection.json', 'utf-8');

const terraformOutputSchema = z.object({
  primary_connection_string: z.string(),
});

type TerraformOutput = z.infer<typeof terraformOutputSchema>;

const parsedTerraformOutput: TerraformOutput = terraformOutputSchema.parse(
  JSON.parse(file),
);

const parseJson = JSON.parse(file);

logger.info('Stop here.');

export default parseJson;
