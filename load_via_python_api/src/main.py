from argparse import ArgumentParser
from io import BytesIO, StringIO

from config import (
    CUSTOMER_SETTINGS,
    SNOWFLAKE_CREDENTIALS,
    SNOWFLAKE_OBJECTS,
    SNOWFLAKE_ROLE,
)
from customer import Customer
from data_generator import create_fake_customer
from logger import logger
from snowflake.connector import SnowflakeConnection, connect
from snowflake_utils import (
    create_and_assign_roles,
    create_database_and_schema,
    create_small_warehouse,
    get_copy_into_command,
    get_create_customer_table_command,
)


def init_job(connection: SnowflakeConnection):

    logger.info("Create Snowflake objects.")
    connection = connect(
        account=SNOWFLAKE_CREDENTIALS.account,
        user=SNOWFLAKE_CREDENTIALS.user,
        private_key=SNOWFLAKE_CREDENTIALS.private_key,
    )

    logger.info("Creating database.")
    create_database_and_schema(connection)

    logger.info("Creating bulk loading warehouse.")
    create_small_warehouse(connection, SNOWFLAKE_OBJECTS.bulk_load_warehouse)
    logger.info("Creating streaming warehouse.")
    create_small_warehouse(connection, SNOWFLAKE_OBJECTS.streaming_warehouse)

    logger.info("Assigning permission to bulk loading role.")
    create_and_assign_roles(
        connection,
        SNOWFLAKE_ROLE.bulk_loading_role,
        SNOWFLAKE_OBJECTS.database,
        SNOWFLAKE_OBJECTS.schema,
        SNOWFLAKE_OBJECTS.bulk_load_warehouse,
    )
    logger.info("Assigning permission to stream loading role.")
    create_and_assign_roles(
        connection,
        SNOWFLAKE_ROLE.streaming_data_role,
        SNOWFLAKE_OBJECTS.database,
        SNOWFLAKE_OBJECTS.schema,
        SNOWFLAKE_OBJECTS.streaming_warehouse,
    )

    logger.info("Snowflake setup complete.")


def run(connection: SnowflakeConnection):

    logger.info("Loading fake customer data.")
    customers: list[Customer] = []
    for _ in range(CUSTOMER_SETTINGS.number_of_customers):
        customers.append(create_fake_customer())

    load_customer_data(connection, customers)


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


if __name__ == "__main__":

    parser = ArgumentParser(
        description="Init Snowflake objects and/or load fake customer data using those objects."
    )
    parser.add_argument(
        "--mode",
        nargs="+",
        choices=["init_job", "run"],
        help="Use 'init_job' for creating snowflake objects, 'run' for creating fake customers, or both.",
    )

    args = parser.parse_args()

    logger.info("Connecting to Snowflake")
    connection = connect(
        account=SNOWFLAKE_CREDENTIALS.account,
        user=SNOWFLAKE_CREDENTIALS.user,
        private_key=SNOWFLAKE_CREDENTIALS.private_key,
    )

    if "init_job" in args.mode:
        init_job(connection)
    if "run" in args.mode:
        run(connection)

    logger.info("End of main script, closing Snowflake connection.")
    connection.close()
