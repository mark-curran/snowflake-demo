#!/bin/bash

# E.g. 'australiasoutheast'
# See reference list here: https://learn.microsoft.com/en-us/azure/reliability/regions-list
echo "Enter default Azure region:"
read REGION


# Set your default region.
az configure --defaults location=$REGION

echo "Executing Azure login command."

# Create login prompt
az login

# Register with the storage provider so that you can create a remote terraform state.
echo "Attempting to register with the Microsoft.Storage resource provider and waiting for response."
az provider register --namespace Microsoft.Storage --wait