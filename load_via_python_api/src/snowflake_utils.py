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


def create_database_and_schema(connection: SnowflakeConnection) -> None:
    """Create the database this project will run inside of"""

    cursor = connection.cursor()

    cursor.execute(
        "CREATE DATABASE IF NOT EXISTS " + f"IDENTIFIER('{SNOWFLAKE_OBJECTS.database}')"
    )

    cursor.execute(f"USE IDENTIFIER('{SNOWFLAKE_OBJECTS.database}');")
    cursor.execute(
        "CREATE SCHEMA IF NOT EXISTS " + f"IDENTIFIER('{SNOWFLAKE_OBJECTS.schema}');"
    )

    cursor.close()


def create_small_warehouse(connection: SnowflakeConnection, warehouse: str) -> None:

    cursor = connection.cursor()

    cursor.execute(
        (
            "CREATE WAREHOUSE IF NOT EXISTS "
            + f"IDENTIFIER('{warehouse}')"
            + " WITH WAREHOUSE_SIZE = 'SMALL'"
        )
    )

    cursor.close()


def create_and_assign_roles(
    connection: SnowflakeConnection,
    role: str,
    database: str,
    schema: str,
    warehouse: str,
) -> None:
    """
    Create the role that will load the data into a table in <schema> using <warehouse>.

    Assigns that role the user running this python application.

    Args:
        connection (SnowflakeConnection): Snowflake connection.
        role (str): Name of the role
        database (str): The database the schema belongs to.
        schema (str): The schema the tables will be created in.
        warehouse (str): The compute warehouse for executing the data load.
    """
    cursor = connection.cursor()

    cursor.execute("CREATE ROLE IF NOT EXISTS " + f"IDENTIFIER('{role}')")

    cursor.execute(
        "GRANT USAGE ON DATABASE "
        + f"IDENTIFIER('{database}') "
        + f"TO ROLE IDENTIFIER('{role}')"
    )

    cursor.execute(
        "GRANT USAGE ON WAREHOUSE "
        + f"IDENTIFIER('{warehouse}')"
        + f"TO ROLE IDENTIFIER('{role}')"
    )

    cursor.execute(f"USE IDENTIFIER('{database}');")

    cursor.execute(
        "GRANT USAGE ON SCHEMA "
        + f"IDENTIFIER('{schema}') "
        + f"TO ROLE IDENTIFIER('{role}')"
    )

    # NOTE: In Snowflake the role that creates a table automatically owns it.
    cursor.execute(
        "GRANT CREATE TABLE ON SCHEMA "
        + f"IDENTIFIER('{schema}') "
        + f"TO ROLE IDENTIFIER('{role}')"
    )

    # NOTE: In this demo we only have one user.
    cursor.execute(
        "GRANT ROLE "
        + f"IDENTIFIER('{role}') "
        + f"TO USER IDENTIFIER('{connection.user}')"
    )

    cursor.close()
