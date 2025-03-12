# Kafka for Event Hubs

Information on setting up Kafka via Azure Event Hubs.

## Application Setup Steps

Setup all the infrastructure from the root terraform directory

```shell
terraform apply
```

Get the primary connection string.

```shell
source get_primary_connection_string.sh
```

## Runtime Setup Steps

Some setup steps, which we need to clean up later, from the root directory...

```shell
asdf plugin add nodejs
asdf install nodejs 22.14.0
asdf set nodejs 22.14.0
```

```shell
npm install
```

## Sources

Based partially on the [official event hubs nodejs quickstart guide](https://github.com/Azure/azure-event-hubs-for-kafka/tree/master/quickstart/node).
