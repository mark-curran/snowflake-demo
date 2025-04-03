#!/bin/bash

SECRET_PATH="/run/secrets/event_hub_credentials"
CONNECTION_CONFIG_PATH="/run/secrets/connection_config"
PRIVATE_KEY_PATH="/run/secrets/private_key"
STREAMING_CONFIG_PATH="/tmp/snowflake-streaming-attributes.json"

PROPERTIES_FILES_TEMPLATE="/tmp/shared-properties/template-connect-standalone.properties"
PROPERTIES_FILE="/shared-properties/connect-standalone.properties"
ADMIN_PROPERTIES_TEMPLATE="/tmp/shared-properties/template-admin-client.properties"
ADMIN_PROPERTIES_FILE="/shared-properties/admin-client.properties"
SNOWFLAKE_CONNECTOR_PROPERTIES_TEMPLATE="/tmp/shared-properties/template-snowflake-event-hub-connector.properties"
SNOWFLAKE_CONNECTOR_PROPERTIES_FILE="/shared-properties/snowflake-event-hub-connector.properties"

PRIMARY_CONNECTION_STRING=$(jq -r '.primary_connection_string' "$SECRET_PATH")
BOOTSTRAP_SERVER=$(jq -r '.bootstrap_server' "$SECRET_PATH")
USERNAME='$ConnectionString'

# Prepare kafka connect properties file.
env PRIMARY_CONNECTION_STRING="$PRIMARY_CONNECTION_STRING" \
env BOOTSTRAP_SERVER="$BOOTSTRAP_SERVER" \
env USERNAME="$USERNAME" \
envsubst < tmp/shared-properties/template-connect-standalone.properties \
> "$PROPERTIES_FILE"

# Prepare kafka admin client properties file.
env PRIMARY_CONNECTION_STRING="$PRIMARY_CONNECTION_STRING" \
env BOOTSTRAP_SERVER="$BOOTSTRAP_SERVER" \
env USERNAME="$USERNAME" \
envsubst < $ADMIN_PROPERTIES_TEMPLATE \
> "$ADMIN_PROPERTIES_FILE"

# Prepare Snowflake Event Hub Connector property file.
account_id=$(jq -r '.account' "$CONNECTION_CONFIG_PATH")
CLUSTER_URL=$account_id.snowflakecomputing.com
SNOWFLAKE_USER=$(jq -r '.user' "$CONNECTION_CONFIG_PATH")
PRIVATE_KEY_VALUE=$(cat $PRIVATE_KEY_PATH | grep -v PRIVATE | tr -d '\n')


SNOWFLAKE_DB=$(jq -r '.database_name' "$STREAMING_CONFIG_PATH")
SNOWFLAKE_SCHEMA=$(jq -r '.streaming_schema' "$STREAMING_CONFIG_PATH")
STREAMING_ROLE=$(jq -r '.streaming_user_role' "$STREAMING_CONFIG_PATH")

# TODO: Continue injecting the table, database and user information.

env CLUSTER_URL="$CLUSTER_URL" \
env SNOWFLAKE_USER="$SNOWFLAKE_USER" \
env PRIVATE_KEY_VALUE="$PRIVATE_KEY_VALUE" \
env SNOWFLAKE_DB="$SNOWFLAKE_DB" \
env SNOWFLAKE_SCHEMA="$SNOWFLAKE_SCHEMA" \
env STREAMING_ROLE="$STREAMING_ROLE" \
envsubst < $SNOWFLAKE_CONNECTOR_PROPERTIES_TEMPLATE \
> "$SNOWFLAKE_CONNECTOR_PROPERTIES_FILE"

echo 'Secrets injected into properties files.'