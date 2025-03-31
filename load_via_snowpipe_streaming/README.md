# JVM Setup Instructions

From the root of the repository.

```shell
asdf plugin add java
asdf install java
asdf plugin add maven
asdf install maven
```

From the subfolder "load_via_snowpipe_streaming/"

```shell
mvn clean install
mvn compile
```

## Sources

Based partially on [this walkthrough](https://quickstarts.snowflake.com/guide/getting_started_with_snowpipe_streaming_azure_eventhubs/index.html#0).
