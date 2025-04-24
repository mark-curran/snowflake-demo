import schema from '../../schema/order.json';
import { Ajv } from 'ajv';

const ajv = new Ajv();

export const orderValidator = ajv.compile(schema);
