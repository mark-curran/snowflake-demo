
FROM eclipse-temurin:17 AS os_only

# Variables for setting up Kafka.
ARG KAFKA_VERSION=2.8.1
ARG SCALA_VERSION=2.13
ARG KAFKA_HOME=/opt/kafka
ARG USER_AND_GROUP_NAME=kafka

# Variables to setting up Snowflake connector.
ARG SNOWFLAKE_CONNECTOR_VERSION=2.2.1

# Create a Kafka user (best practice for security)
RUN groupadd -r $USER_AND_GROUP_NAME && useradd -r -g $USER_AND_GROUP_NAME $USER_AND_GROUP_NAME

# # Install OS dependencies
RUN apt-get update
RUN \
apt-get install -y \
gzip \
tar \
gettext-base \
jq

FROM os_only AS snowflake_connector

# Download and extract Kafka.
# TODO: Replace the COPY comamand with a `wget` command.
COPY tmp/kafka_${SCALA_VERSION}-${KAFKA_VERSION}.tgz /tmp/kafka_${SCALA_VERSION}-${KAFKA_VERSION}.tgz
# RUN wget https://archive.apache.org/dist/kafka/2.8.1/kafka_2.12-2.8.1.tgz

# Unzip the installation and move it to the installation directory
RUN \
tar -xvzf /tmp/kafka_${SCALA_VERSION}-${KAFKA_VERSION}.tgz -C /opt && \
rm /tmp/kafka_${SCALA_VERSION}-${KAFKA_VERSION}.tgz && \
mv /opt/kafka_$SCALA_VERSION-$KAFKA_VERSION $KAFKA_HOME

# Install additional libraries.
# TODO: Replace the COPY comamand with a `wget` command.
COPY tmp/snowflake-kafka-connector-${SNOWFLAKE_CONNECTOR_VERSION}.jar /tmp/snowflake-kafka-connector-${SNOWFLAKE_CONNECTOR_VERSION}.jar
RUN mv /tmp/snowflake-kafka-connector-${SNOWFLAKE_CONNECTOR_VERSION}.jar $KAFKA_HOME/libs

# TODO: Add more maven libraries as required.
# wget https://repo1.maven.org/maven2/net/snowflake/snowflake-ingest-sdk/2.1.0/snowflake-ingest-sdk-2.1.0.jar -O $pwd/kafka_2.12-2.8.1/libs/snowflake-ingest-sdk-2.1.0.jar
# wget https://repo1.maven.org/maven2/net/snowflake/snowflake-jdbc/3.14.5/snowflake-jdbc-3.14.5.jar -O $pwd/kafka_2.12-2.8.1/libs/snowflake-jdbc-3.14.5.jar
# wget https://repo1.maven.org/maven2/org/bouncycastle/bc-fips/1.0.1/bc-fips-1.0.1.jar -O $pwd/kafka_2.12-2.8.1/libs/bc-fips-1.0.1.jar
# wget https://repo1.maven.org/maven2/org/bouncycastle/bcpkix-fips/1.0.3/bcpkix-fips-1.0.3.jar -O $pwd/kafka_2.12-2.8.1/libs/bcpkix-fips-1.0.3.jar

# Give the kafka user ownership of the kafka binaries.
RUN chown -R kafka:kafka $KAFKA_HOME

# Execute kafka
USER kafka
WORKDIR $KAFKA_HOME
