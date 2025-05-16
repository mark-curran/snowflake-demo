#!/bin/bash

get_secret() {
    local secret_name="$1"
    eval "value=\$$secret_name"

    if [ -n "$envvar_value" ]; then
        echo "$envvar_value"
    elif [ -f "/run/secrets/$secret_name" ]; then 
        cat "/run/secrets/$secret_name"
    else
        echo "$secret_name not in environment and /run/secrets/$secret_name does not exist."
        return 1
    fi
}

if ! PRIMARY_CONNECTION_STRING=$(get_secret PRIMARY_CONNECTION_STRING); then
    echo "Failed to get secret PRIMARY_CONNECTION_STRING" >&2
    exit 1
fi
if ! BOOTSTRAP_SERVER=$(get_secret BOOTSTRAP_SERVER); then
    echo "Failed to get secret BOOTSTRAP_SERVER" >&2
    exit 1
fi
if ! SNOWFLAKE_ACCOUNT=$(get_secret SNOWFLAKE_ACCOUNT); then
    echo "Failed to get secret SNOWFLAKE_ACCOUNT" >&2
    exit 1
fi
if ! SNOWFLAKE_USER=$(get_secret SNOWFLAKE_USER); then
    echo "Failed to get secret SNOWFLAKE_USER" >&2
    exit 1
fi
if ! SNOWFLAKE_PRIVATE_KEY=$(get_secret SNOWFLAKE_PRIVATE_KEY); then
    echo "Failed to get secret SNOWFLAKE_PRIVATE_KEY" >&2
    exit 1
fi
if ! SNOWFLAKE_DATABASE=$(get_secret SNOWFLAKE_DATABASE); then
    echo "Failed to get secret SNOWFLAKE_DATABASE" >&2
    exit 1
fi

USERNAME='$ConnectionString'
CLUSTER_URL="$SNOWFLAKE_ACCOUNT.snowflakecomputing.com"


PROPERTIES_FILES_TEMPLATE="/tmp/shared-properties/template-connect-standalone.properties"
PROPERTIES_FILE="/shared-properties/connect-standalone.properties"
SNOWFLAKE_CONNECTOR_PROPERTIES_TEMPLATE="/tmp/shared-properties/template-snowflake-event-hub-connector.properties"
SNOWFLAKE_CONNECTOR_PROPERTIES_FILE="/shared-properties/snowflake-event-hub-connector.properties"

# NOTE: admin-client is useful for debugging your local setup, but is not called under regular 
# operating conditions.
if [ -f "/tmp/shared-properties/template-admin-client.properties" ]; then 
    ADMIN_PROPERTIES_TEMPLATE="/tmp/shared-properties/template-admin-client.properties"
    ADMIN_PROPERTIES_FILE="/shared-properties/admin-client.properties"
    # Prepare kafka admin client properties file.
    env PRIMARY_CONNECTION_STRING="$PRIMARY_CONNECTION_STRING" \
    env BOOTSTRAP_SERVER="$BOOTSTRAP_SERVER" \
    env USERNAME="$USERNAME" \
    envsubst < $ADMIN_PROPERTIES_TEMPLATE \
    > "$ADMIN_PROPERTIES_FILE"
else
    echo "No admin propreties file found. Skipping templating."
fi

# Prepare kafka connect properties file.
env PRIMARY_CONNECTION_STRING="$PRIMARY_CONNECTION_STRING" \
env BOOTSTRAP_SERVER="$BOOTSTRAP_SERVER" \
env USERNAME="$USERNAME" \
envsubst < tmp/shared-properties/template-connect-standalone.properties \
> "$PROPERTIES_FILE"

# Prepare the Snowflake properties file.
env SNOWFLAKE_USER="$SNOWFLAKE_USER" \
env SNOWFLAKE_DATABASE="$SNOWFLAKE_DATABASE" \
env SNOWFLAKE_SCHEMA="$SNOWFLAKE_SCHEMA" \
env STREAMING_DATA_ROLE="$STREAMING_DATA_ROLE" \
env CLUSTER_URL="$CLUSTER_URL" \
env SNOWFLAKE_PRIVATE_KEY="$SNOWFLAKE_PRIVATE_KEY"  \
env "TOPIC=$TOPIC" \
envsubst < $SNOWFLAKE_CONNECTOR_PROPERTIES_TEMPLATE \
> "$SNOWFLAKE_CONNECTOR_PROPERTIES_FILE"

echo 'Secrets injected into properties files.'