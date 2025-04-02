#!/bin/bash

SECRET_PATH="/run/secrets/event_hub_credentials"
PROPERTIES_FILES_TEMPLATE="/tmp/shared-properties/template-connect-standalone.properties"
PROPERTIES_FILE="/shared-properties/connect-standalone.properties"
ADMIN_PROPERTIES_TEMPLATE="/tmp/shared-properties/template-admin-client.properties"
ADMIN_PROPERTIES_FILE="/shared-properties/admin-client.properties"

PRIMARY_CONNECTION_STRING=$(jq -r '.primary_connection_string' "$SECRET_PATH")
BOOTSTRAP_SERVER=$(jq -r '.bootstrap_server' "$SECRET_PATH")
USERNAME='$ConnectionString'

env PRIMARY_CONNECTION_STRING="$PRIMARY_CONNECTION_STRING" \
env BOOTSTRAP_SERVER="$BOOTSTRAP_SERVER" \
env USERNAME="$USERNAME" \
envsubst < tmp/shared-properties/template-connect-standalone.properties \
> "$PROPERTIES_FILE"

env PRIMARY_CONNECTION_STRING="$PRIMARY_CONNECTION_STRING" \
env BOOTSTRAP_SERVER="$BOOTSTRAP_SERVER" \
env USERNAME="$USERNAME" \
envsubst < $ADMIN_PROPERTIES_TEMPLATE \
> "$ADMIN_PROPERTIES_FILE"

echo 'Secrets injected into properties file.'