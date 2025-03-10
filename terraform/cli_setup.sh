#!/bin/bash

echo "Enter default Azure region:"
read REGION


# Set your default region.
az configure --defaults location=$REGION

echo "Executing Azure login command."

# Create login prompt
az login