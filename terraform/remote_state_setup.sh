#!/bin/bash

echo "Executing Terraform remote state setup script."

RESOURCE_GROUP_CONFIG_FILE="resource_group.json"
ACCOUNT_INFORMATION_FILE="account_information.json"

# Azure resource group and location
echo "Reading config file: $RESOURCE_GROUP_CONFIG_FILE"
RESOURCE_GROUP_NAME=$(jq -r '.RESOURCE_GROUP_NAME' $RESOURCE_GROUP_CONFIG_FILE)
RESOURCE_GROUP_TAG_NAME=$(jq -r '.RESOURCE_GROUP_TAG_NAME' $RESOURCE_GROUP_CONFIG_FILE)
BLOB_CONTAINER=$(jq -r '.BLOB_CONTAINTER' $RESOURCE_GROUP_CONFIG_FILE)
BLOB_KEY_NAME=$(jq -r '.BLOB_KEY_NAME' $RESOURCE_GROUP_CONFIG_FILE)

# Check if the account_information.json file exists
echo "Checking if $ACCOUNT_INFORMATION_FILE exists."
if [ -f "$ACCOUNT_INFORMATION_FILE" ]; then
    echo "Account information file exists. Reading STORAGE_ACCOUNT_NAME and AZ_SUBSCRIPTION_DEFAULT_LOCATION from it."
    
    # Read variables from the account information file.
    STORAGE_ACCOUNT_NAME=$(jq -r '.STORAGE_ACCOUNT_NAME' $ACCOUNT_INFORMATION_FILE)
    AZ_SUBSCRIPTION_DEFAULT_LOCATION=$(jq -r '.AZ_SUBSCRIPTION_DEFAULT_LOCATION' $ACCOUNT_INFORMATION_FILE)
    SUBSCRIPTION_ID=$(jq -r '.SUBSCRIPTION_ID' $ACCOUNT_INFORMATION_FILE)
else

    echo "Account information file does not exist, checking for storage account name."

    # Fetch the current subscription from the configured cli.
    echo "Fetching current subscription id."
    SUBSCRIPTION_ID=$(az account show --query "id" -o tsv)
    echo "Current subscruption id: $SUBSCRIPTION_ID"

    # Check if the resource group exists.
    echo "Checking if resource group $RESOURCE_GROUP_NAME exists."
    az group show --name $RESOURCE_GROUP_NAME > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "Resource group $RESOURCE_GROUP_NAME does not exist. Creating it."
        az group create --name $RESOURCE_GROUP_NAME
    else
        echo "Resource group $RESOURCE_GROUP_NAME already exists."
    fi

    # Check if the tag exists in the resource group
    echo "Checking if STORAGE_ACCOUNT_NAME exists as a tag on the resource group."
    STORAGE_ACCOUNT_NAME=$(az resource show --id /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP_NAME --query "tags.$RESOURCE_GROUP_TAG_NAME" -o tsv)

    # If the tag doesn't exist, create and store a new unique storage account name
    if [ -z "$STORAGE_ACCOUNT_NAME" ]; then
        echo "Tag $RESOURCE_GROUP_TAG_NAME not found. Generating a new storage account name."
        
        # Generate a globally unique storage account name using $RANDOM
        STORAGE_ACCOUNT_NAME="tfstate$RANDOM$RANDOM$RANDOM"
    
        echo "New storage account name: $STORAGE_ACCOUNT_NAME"
    fi

    # Add the tag to the resource group
    echo "Adding tag $RESOURCE_GROUP_TAG_NAME:$STORAGE_ACCOUNT_NAME to the resource group $RESOURCE_GROUP_NAME"
    az resource tag --tags $RESOURCE_GROUP_TAG_NAME=$STORAGE_ACCOUNT_NAME --id /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP_NAME

    # Store the generated storage account name in the local JSON file
    echo "Storing key value pair $RESOURCE_GROUP_TAG_NAME : $STORAGE_ACCOUNT_NAME in the file  $ACCOUNT_INFORMATION_FILE"
    echo "{\"STORAGE_ACCOUNT_NAME\": \"$STORAGE_ACCOUNT_NAME\"}" > $ACCOUNT_INFORMATION_FILE

    # Get the location used for the storage account and save that, too.
    echo "Storing the storage account default location in the file $ACCOUNT_INFORMATION_FILE"
    AZ_SUBSCRIPTION_DEFAULT_LOCATION=$(az configure --list-defaults --query "[?name=='location'].value" -o tsv)

    # Update the ACCOUNT_INFORMATION_FILE file.
    echo "Updating the account information file: $ACCOUNT_INFORMATION_FILE"
    TEMP_FILE=$(mktemp)
    jq '. + {"SUBSCRIPTION_ID": "'$SUBSCRIPTION_ID'", "AZ_SUBSCRIPTION_DEFAULT_LOCATION": "'$AZ_SUBSCRIPTION_DEFAULT_LOCATION'"}' \
    "$ACCOUNT_INFORMATION_FILE" > "$TEMP_FILE" \
    && mv "$TEMP_FILE" "$ACCOUNT_INFORMATION_FILE"
fi

# Registering the Microsoft.Storage resource provider.
echo "Attempting to register with the Microsoft.Storage resource provider and waiting for response."
az provider register --namespace Microsoft.Storage --wait

# Create the storage account using the fetched or newly generated name
echo "Creating storage account named $STORAGE_ACCOUNT_NAME if it doesn't already exist."
az storage account create --resource-group $RESOURCE_GROUP_NAME --name $STORAGE_ACCOUNT_NAME --sku Standard_LRS --encryption-services blob

# Create a blob container for the remote state
echo "Creating blob container called $BLOB_CONTAINER inside storage account $STORAGE_ACCOUNT_NAME if it doesn't already exist."
# TODO: Add the --resource-group $RESOURCE_GROUP_NAME to this command.
az storage container create --name $BLOB_CONTAINER --account-name $STORAGE_ACCOUNT_NAME 


echo ""
echo "Storage account $STORAGE_ACCOUNT_NAME and blob container $BLOB_CONTAINER should now exist."

# Get a key to access remote state and export it as an environment variable.
echo "Getting access key for remote state and exporting to environment variable ARM_ACCESS_KEY."
ACCOUNT_KEY=$(az storage account keys list --resource-group $RESOURCE_GROUP_NAME --account-name $STORAGE_ACCOUNT_NAME --query '[0].value' -o tsv)
export ARM_ACCESS_KEY=$ACCOUNT_KEY

echo ""
echo "Resources for Terraform remote state should now exist and variable ARM_ACCESS_KEY is set."

echo ""
echo "Resetting local terraform variables."
rm terraform.tfvars
touch terraform.tfvars
echo "az_subscription_default_location = \"$AZ_SUBSCRIPTION_DEFAULT_LOCATION\"" >> terraform.tfvars
echo "subscription_id = \"$SUBSCRIPTION_ID\"" >> terraform.tfvars

echo "Initializing Terraform bakend."
terraform init \
    -backend-config="resource_group_name=$RESOURCE_GROUP_NAME" \
    -backend-config="storage_account_name=$STORAGE_ACCOUNT_NAME" \
    -backend-config="container_name=$BLOB_CONTAINER" \
    -backend-config="key=$BLOB_KEY_NAME"
