import json
from dataclasses import dataclass
from io import BytesIO, StringIO

from config import CUSTOMER_SETTINGS, SNOWFLAKE_CREDENTIALS, SNOWFLAKE_OBJECTS
from customer import Customer
from data_generator import create_fake_customer
from logger import logger
from snowflake.connector import SnowflakeConnection, connect
from snowflake_utils import (
    create_copy_customer_objects,
    get_copy_into_command,
    get_create_customer_table_command,
)


def main():

    connection = connect(
        account=SNOWFLAKE_CREDENTIALS.account,
        user=SNOWFLAKE_CREDENTIALS.user,
        private_key=SNOWFLAKE_CREDENTIALS.private_key,
    )

    create_copy_customer_objects(connection)

    customers: list[Customer] = []
    for _ in range(CUSTOMER_SETTINGS.number_of_customers):
        customers.append(create_fake_customer())

    load_customer_data(connection, customers)

    logger.info("End of main script, closing Snowflake connection.")
    connection.close()


def load_customer_data(
    connection: SnowflakeConnection, customers: list[Customer]
) -> None:

    file_buffer = StringIO()
    for customer in customers:
        file_buffer.write(customer.model_dump_json() + "\n")

    cursor = connection.cursor()
    temp_stage_name = "customer_temporary_stage"

    try:
        cursor.execute(f"USE DATABASE IDENTIFIER('{SNOWFLAKE_OBJECTS.database}')")
        cursor.execute(f"USE SCHEMA IDENTIFIER('{SNOWFLAKE_OBJECTS.schema}')")
        cursor.execute(
            f"CREATE OR REPLACE FILE FORMAT {CUSTOMER_SETTINGS.file_format_name} "
            + "TYPE = 'JSON' "
            + "STRIP_OUTER_ARRAY = FALSE "
            + "MULTI_LINE = FALSE;"
        )
        cursor.execute(f"CREATE OR REPLACE TEMPORARY STAGE {temp_stage_name}")

        cursor.execute(
            f"PUT file://customer_data.json @{temp_stage_name}",
            file_stream=BytesIO(file_buffer.getvalue().encode("utf-8")),
        )
        cursor.execute(get_create_customer_table_command())
        cursor.execute(get_copy_into_command(temp_stage_name))

        cursor.execute(f"DROP STAGE {temp_stage_name}")
    except Exception as exc:
        logger.error("Executing rollback of data load into Snowflake.")
        connection.rollback()
        raise exc


# TODO: Depreceate the Snowflake streaming attributes.
@dataclass
class SnowflakeStreamingAttributes:
    database_name: str
    streaming_schema: str
    streaming_user: str
    streaming_user_role: str
    streaming_warehouse: str


# TODO: Depreceate the streaming objects.
def get_snowflake_attributes() -> SnowflakeStreamingAttributes:

    with open("snowflake_streaming_attributes.json", "r") as file:
        config = json.load(file)

    return SnowflakeStreamingAttributes(**config)


# TODO: Depreceate the streaming objects.
def streaming_schema_and_database():
    # Create the streaming database, schema and warehouse.
    connection = get_snowflake_connection()
    snowflake_streaming_attributes = get_snowflake_attributes()

    # TODO: Transaction scoping.
    # TODO: Make the user role a member of the database.
    cursor = connection.cursor()

    cursor.execute(
        "CREATE OR REPLACE ROLE "
        + f"IDENTIFIER('{snowflake_streaming_attributes.streaming_user_role}')"
    )

    # Configure the database.
    cursor.execute(
        "CREATE DATABASE IF NOT EXISTS "
        + f"IDENTIFIER('{snowflake_streaming_attributes.database_name}')"
    )
    cursor.execute(
        "GRANT USAGE ON DATABASE "
        + f"IDENTIFIER('{snowflake_streaming_attributes.database_name}') "
        + f"TO ROLE IDENTIFIER('{snowflake_streaming_attributes.streaming_user_role}')"
    )

    # Configure the warehouse.
    cursor.execute(
        (
            "CREATE OR REPLACE WAREHOUSE "
            + f"IDENTIFIER('{snowflake_streaming_attributes.streaming_warehouse}')"
            + " WITH WAREHOUSE_SIZE = 'SMALL'"
        )
    )
    cursor.execute(
        "GRANT USAGE ON WAREHOUSE "
        + f"IDENTIFIER('{snowflake_streaming_attributes.streaming_warehouse}')"
        + f"TO ROLE IDENTIFIER('{snowflake_streaming_attributes.streaming_user_role}')"
    )

    # Configure the schema.
    cursor.execute(f"USE IDENTIFIER('{snowflake_streaming_attributes.database_name}');")
    cursor.execute(
        "CREATE OR REPLACE SCHEMA "
        + f"IDENTIFIER('{snowflake_streaming_attributes.streaming_schema}');"
    )
    cursor.execute(
        "GRANT USAGE ON SCHEMA "
        + f"IDENTIFIER('{snowflake_streaming_attributes.streaming_schema}') "
        + f"TO ROLE IDENTIFIER('{snowflake_streaming_attributes.streaming_user_role}')"
    )
    # NOTE: In Snowflake the role that creates a table automatically owns it.
    cursor.execute(
        "GRANT CREATE TABLE ON SCHEMA "
        + f"IDENTIFIER('{snowflake_streaming_attributes.streaming_schema}') "
        + f"TO ROLE IDENTIFIER('{snowflake_streaming_attributes.streaming_user_role}')"
    )

    # NOTE: In this demo we only have one user.
    cursor.execute(
        "GRANT ROLE "
        + f"IDENTIFIER('{snowflake_streaming_attributes.streaming_user_role}') "
        + f"TO USER IDENTIFIER('{connection.user}')"
    )


if __name__ == "__main__":

    main()
