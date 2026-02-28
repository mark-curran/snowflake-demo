#!/bin/bash

# Render SQL to remove all the Snowflake resources.

set -euo pipefail

# Load the env file.
ENV_FILE="$(dirname "$0")/.env"
source "$ENV_FILE"

# Generate SQL
SQL=$(cat <<EOF
-- 1. Drop Database (cascades to schema, tables, file formats, etc.)
USE ROLE ACCOUNTADMIN;
DROP DATABASE IF EXISTS ${SNOWFLAKE_DATABASE};

-- 2. Drop Warehouses
USE ROLE ACCOUNTADMIN;
DROP WAREHOUSE IF EXISTS ${BULK_COPY_WAREHOUSE};
DROP WAREHOUSE IF EXISTS ${LOAD_STREAM_WAREHOUSE};

-- 3. Drop Roles
USE ROLE ACCOUNTADMIN;
DROP ROLE IF EXISTS ${BULK_LOAD_ROLE};
DROP ROLE IF EXISTS ${STREAMING_DATA_ROLE};
EOF
)

echo "$SQL"
