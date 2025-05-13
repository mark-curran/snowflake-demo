# Kafka for Event Hubs

Information on setting up Kafka via Azure Event Hubs.

## Application Setup Steps

Setup all the infrastructure from the root terraform directory

```shell
terraform apply
```

Get the primary connection string and save it in a local file that is not version controlled.

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

Based very partially on the [official event hubs nodejs quickstart guide](https://github.com/Azure/azure-event-hubs-for-kafka/tree/master/quickstart/node), but largely built from the ground up by the repository author.

## EnvVars

Need to additionally define the `MODE` environment variable to run this app.
