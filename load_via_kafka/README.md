# Kafka for Event Hubs

Information on setting up Kafka via Azure Event Hubs.

## Local Environment Setup

Install requirements using this command.

```shell
npm install
```

Compile and run the code using `tsc && node dist/src/index.js` and run the tests using `npm run test`.

## Sources

This app was based very loosely on the [official event hubs nodejs quickstart guide](https://github.com/Azure/azure-event-hubs-for-kafka/tree/master/quickstart/node), but was largely built from the ground up by the repository author because EventHubs does not implement the full kafka protocol.
