#!/bin/bash

# Get the environment variables.
source ../.env

echo "Executing Terraform remote state setup script."

if [ -d .terraform ]; then
    echo "The .terraform folder exists, the remote state should exist."
else

    # Check if the resource group exists.
    echo "Checking if resource group $RESOURCE_GROUP_NAME exists."
    az group show --name $RESOURCE_GROUP_NAME > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "Resource group $RESOURCE_GROUP_NAME does not exist. Creating it."
        az group create --name $RESOURCE_GROUP_NAME
    else
        echo "Resource group $RESOURCE_GROUP_NAME already exists."
    fi

    # Create the storage account that manages the remote state.
    echo "Creating storage account if it doesn't already exist."
    STORAGE_ACCOUNT_NAME="tfstate$RANDOM$RANDOM$RANDOM"
    az storage account create --resource-group $RESOURCE_GROUP_NAME --name $STORAGE_ACCOUNT_NAME --sku Standard_LRS --encryption-services blob

    # Create a blob container for the remote state
    echo "Creating blob container called $BLOB_CONTAINER."
    az storage container create --name $BLOB_CONTAINER --account-name $STORAGE_ACCOUNT_NAME 

    # Reset the local terraform variables. 
    # NOTE: The terraform.tfvars is not committed to version control.
    echo "Fetching Azure subscription and its default location from the commnand line."
    AZ_SUBSCRIPTION_DEFAULT_LOCATION=$(az configure --list-defaults --query "[?name=='location'].value" -o tsv)
    SUBSCRIPTION_ID=$(az account show --query id -o tsv)
    echo "Resetting local terraform variables."
    rm terraform.tfvars
    touch terraform.tfvars
    echo "az_subscription_default_location = \"$AZ_SUBSCRIPTION_DEFAULT_LOCATION\"" >> terraform.tfvars
    echo "subscription_id = \"$SUBSCRIPTION_ID\"" >> terraform.tfvars
    echo "topic = \"$TOPIC\"" >> terraform.tfvars
    echo "partition_count = $PARTITION_COUNT" >> terraform.tfvars

    echo "Initializing Terraform bakend."
    terraform init \
        -backend-config="resource_group_name=$RESOURCE_GROUP_NAME" \
        -backend-config="storage_account_name=$STORAGE_ACCOUNT_NAME" \
        -backend-config="container_name=$BLOB_CONTAINER" \
        -backend-config="key=$BLOB_KEY_NAME"
fi
