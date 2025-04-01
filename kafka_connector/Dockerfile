
FROM eclipse-temurin:24 AS base

# Set environment variables
ARG KAFKA_VERSION=2.8.1
ARG SCALA_VERSION=2.12
ARG KAFKA_HOME=/opt/kafka
ARG USER_AND_GROUP_NAME=kafka

# Create a Kafka user (best practice for security)
RUN groupadd -r $USER_AND_GROUP_NAME && useradd -r -g $USER_AND_GROUP_NAME $USER_AND_GROUP_NAME

# # Install OS dependencies
RUN apt-get update
RUN \
apt-get install -y \
# openssl \
    # vim \
    # bash \
gzip \
tar 
    # jq \
    # python3 \
    # python3-dev \

    # Download and extract Kafka.
# TODO: Replace the COPY comamand with a `wget` command.
COPY tmp/kafka_${SCALA_VERSION}-${KAFKA_VERSION}.tgz /tmp/kafka_${SCALA_VERSION}-${KAFKA_VERSION}.tgz
# RUN wget https://archive.apache.org/dist/kafka/2.8.1/kafka_2.12-2.8.1.tgz

# Unzip the installation.
RUN \
    tar -xvzf /tmp/kafka_${SCALA_VERSION}-${KAFKA_VERSION}.tgz -C /opt && \
    mv /opt/kafka_$SCALA_VERSION-$KAFKA_VERSION $KAFKA_HOME

# Clean up tmp files.
RUN rm /tmp/kafka_${SCALA_VERSION}-${KAFKA_VERSION}.tgz

# Give the kafka user ownership of the kafka binaries.
RUN chown -R kafka:kafka $KAFKA_HOME

# Execute kafka
USER kafka
WORKDIR $KAFKA_HOME



# FROM base AS kafka_builder


# RUN tar xvfz kafka_2.12-2.8.1.tgz -C $INSTALLATION_DIR

# FROM kafka_buider AS cleanup

# RUN rm -rf $INSTALLATION_DIR/kafka_2.12-2.8.1.tgz

# passwd=changeit  # Use the default password for the Java keystore, you should change it after finishing the lab
# directory=/home/azureuser/snowpipe-streaming # Installation directory

# cd $HOME
# mkdir -p $directory
# cd $directory
# pwd=`pwd`
# sudo yum clean all
# sudo yum -y install openssl vim-common java-1.8.0-openjdk-devel.x86_64 gzip tar jq python3-pip
# wget https://archive.apache.org/dist/kafka/2.8.1/kafka_2.12-2.8.1.tgz
# tar xvfz kafka_2.12-2.8.1.tgz -C $pwd
# rm -rf $pwd/kafka_2.12-2.8.1.tgz
# cd /tmp && cp /usr/lib/jvm/java-openjdk/jre/lib/security/cacerts kafka.client.truststore.jks
# cd /tmp && keytool -genkey -keystore kafka.client.keystore.jks -validity 300 -storepass $passwd -keypass $passwd -dname "CN=snowflake.com" -alias snowflake -storetype pkcs12

# #Snowflake kafka connector
# wget https://repo1.maven.org/maven2/com/snowflake/snowflake-kafka-connector/2.2.1/snowflake-kafka-connector-2.2.1.jar -O $pwd/kafka_2.12-2.8.1/libs/snowflake-kafka-connector-2.2.1.jar

# #Snowpipe streaming SDK
# wget https://repo1.maven.org/maven2/net/snowflake/snowflake-ingest-sdk/2.1.0/snowflake-ingest-sdk-2.1.0.jar -O $pwd/kafka_2.12-2.8.1/libs/snowflake-ingest-sdk-2.1.0.jar
# wget https://repo1.maven.org/maven2/net/snowflake/snowflake-jdbc/3.14.5/snowflake-jdbc-3.14.5.jar -O $pwd/kafka_2.12-2.8.1/libs/snowflake-jdbc-3.14.5.jar
# wget https://repo1.maven.org/maven2/org/bouncycastle/bc-fips/1.0.1/bc-fips-1.0.1.jar -O $pwd/kafka_2.12-2.8.1/libs/bc-fips-1.0.1.jar
# wget https://repo1.maven.org/maven2/org/bouncycastle/bcpkix-fips/1.0.3/bcpkix-fips-1.0.3.jar -O $pwd/kafka_2.12-2.8.1/libs/bcpkix-fips-1.0.3.jar