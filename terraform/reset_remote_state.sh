#!/bin/bash

# Get the environment variables.
source ../.env

# Use this codee block during development to wipe the local and remote state and start afresh.
OLD_STORAGE_ACCOUNT=""
echo "Removing terraform state point .terraform/"
rm -rf .terraform
echo "Deleting previous storage account $OLD_STORAGE_ACCOUNT"
az storage account delete --resource-group $RESOURCE_GROUP_NAME --name $OLD_STORAGE_ACCOUNT --yes
echo "Deleting resource group $RESOURCE_GROUP_NAME"
az group delete --name $RESOURCE_GROUP_NAME --yes