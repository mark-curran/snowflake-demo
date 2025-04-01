#!/bin/bash

# Get the primary connection string from terraform and save it as a local file.

# Navigate to the terraform directory
pushd ../terraform > /dev/null

# Capture the terraform output in JSON format
terraform_output=$(terraform output -json)

# Extract the "primary_connection_string" value
connection_string=$(echo "$terraform_output" | jq -r '.primary_connection_string.value')
bootstrap_server=$(echo $connection_string | awk -F\/ '{print $3":9093"}')

# Return to the original directory
popd > /dev/null

# Write the extracted value to the JSON file
echo "{ \"primary_connection_string\": \"$connection_string\", \"bootstrap_server\": \"$bootstrap_server\" }" > ../event_hub_connection.json

echo "Primary connection string has been saved to event_hub_connection.json"