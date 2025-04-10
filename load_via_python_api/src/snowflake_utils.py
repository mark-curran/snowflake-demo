from config import CUSTOMER_SETTINGS, SNOWFLAKE_OBJECTS, SNOWFLAKE_ROLE
from snowflake.connector import SnowflakeConnection


def get_copy_into_command(temp_stage_name: str) -> str:
    return f"""
COPY INTO {CUSTOMER_SETTINGS.table} (
    "customerId",
    "firstName",
    "lastName",
    "phone",
    "address"
)
FROM (
SELECT
    $1:customerId::STRING,
    $1:firstName::STRING,
    $1:lastName::STRING,
    $1:phone::STRING,
    $1:address::OBJECT
FROM @{temp_stage_name}/customer_data.json
(FILE_FORMAT => {CUSTOMER_SETTINGS.file_format_name})
);
"""


def get_create_customer_table_command() -> str:
    return f"""
    CREATE TABLE IF NOT EXISTS {CUSTOMER_SETTINGS.table} (
        "customerId" STRING PRIMARY KEY,
        "firstName" STRING,
        "lastName" STRING,
        "phone" STRING,
        "address" OBJECT
    );
    """


def create_copy_customer_objects(connection: SnowflakeConnection) -> None:
    """
    Create the database, schema, warehouse and roles for copying customer
    data into Snowflake.

    Assigns the role to the user who opened the connection.
    """

    cursor = connection.cursor()
    cursor.execute(
        "CREATE ROLE IF NOT EXISTS " + f"IDENTIFIER('{SNOWFLAKE_ROLE.role}')"
    )

    # Configure the database.
    cursor.execute(
        "CREATE DATABASE IF NOT EXISTS " + f"IDENTIFIER('{SNOWFLAKE_OBJECTS.database}')"
    )
    cursor.execute(
        "GRANT USAGE ON DATABASE "
        + f"IDENTIFIER('{SNOWFLAKE_OBJECTS.database}') "
        + f"TO ROLE IDENTIFIER('{SNOWFLAKE_ROLE.role}')"
    )

    # Configure the warehouse.
    cursor.execute(
        (
            "CREATE WAREHOUSE IF NOT EXISTS "
            + f"IDENTIFIER('{SNOWFLAKE_OBJECTS.warehouse}')"
            + " WITH WAREHOUSE_SIZE = 'SMALL'"
        )
    )
    cursor.execute(
        "GRANT USAGE ON WAREHOUSE "
        + f"IDENTIFIER('{SNOWFLAKE_OBJECTS.warehouse}')"
        + f"TO ROLE IDENTIFIER('{SNOWFLAKE_ROLE.role}')"
    )

    # Configure the schema.
    cursor.execute(f"USE IDENTIFIER('{SNOWFLAKE_OBJECTS.database}');")
    cursor.execute(
        "CREATE SCHEMA IF NOT EXISTS " + f"IDENTIFIER('{SNOWFLAKE_OBJECTS.schema}');"
    )
    cursor.execute(
        "GRANT USAGE ON SCHEMA "
        + f"IDENTIFIER('{SNOWFLAKE_OBJECTS.schema}') "
        + f"TO ROLE IDENTIFIER('{SNOWFLAKE_ROLE.role}')"
    )
    # NOTE: In Snowflake the role that creates a table automatically owns it.
    cursor.execute(
        "GRANT CREATE TABLE ON SCHEMA "
        + f"IDENTIFIER('{SNOWFLAKE_OBJECTS.schema}') "
        + f"TO ROLE IDENTIFIER('{SNOWFLAKE_ROLE.role}')"
    )

    # NOTE: In this demo we only have one user.
    cursor.execute(
        "GRANT ROLE "
        + f"IDENTIFIER('{SNOWFLAKE_ROLE.role}') "
        + f"TO USER IDENTIFIER('{connection.user}')"
    )

    cursor.close()
