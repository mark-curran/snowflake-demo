import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ajv = new Ajv();
addFormats(ajv);

const schemaPath = resolve(__dirname, 'order.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

export const orderValidator = ajv.compile(schema);
