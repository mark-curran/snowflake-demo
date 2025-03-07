import csv
import json
from io import BytesIO, StringIO
from typing import TypedDict
from uuid import uuid4

from snowflake.connector import SnowflakeConnection, connect

from logger import logger


class Person(TypedDict):
    id: int
    name: str
    age: int


def main():

    load_sample_data()


def get_snowflake_connection() -> SnowflakeConnection:

    # TODO: Make a get_connection_config function.
    with open("connection_config.json", "r") as file:
        # TODO: Type definition for variable `config`.
        config = json.load(file)

    connection = connect(**config)

    return connection


def load_sample_data():
    logger.info("Loading synthetic data into Snowflake.")

    # TODO: Use a TypedDict for the input data.
    data = [
        {"id": 1, "name": "Alice", "age": 25},
        {"id": 2, "name": "Bob", "age": 30},
        {"id": 3, "name": "Mark", "age": 35},
    ]

    csv_buffer = StringIO()
    csv_writer = csv.writer(csv_buffer)
    csv_writer.writerow(["id", "name", "age"])
    for row in data:
        csv_writer.writerow(list(row.values()))
    logger.debug("Contents of sample csv \n %s", csv_buffer.getvalue())

    connection = get_snowflake_connection()
    temp_stage_name = "TEMP_STAGE_" + str(uuid4()).replace("-", "_")
    # TODO: Make table name configurable.
    table_name = "people"

    # TODO: Move database creation logic somewhere else.
    cursor = connection.cursor()
    database_name = "test_database"
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database_name}")
    cursor.close()

    try:
        logger.debug("Creating temporary stage.")

        cursor = connection.cursor()
        cursor.execute(f"USE DATABASE {database_name}")
        cursor.execute(
            f"""
            CREATE TABLE IF NOT EXISTS {table_name} (
                id INTEGER PRIMARY KEY,
                name STRING NOT NULL,
                age INTEGER
            );"""
        )

        cursor.execute(f"CREATE TEMPORARY STAGE {temp_stage_name}")
        cursor.execute(
            f"PUT file://data.csv @{temp_stage_name}",
            file_stream=BytesIO(csv_buffer.getvalue().encode("utf-8")),
        )

        cursor.execute(
            " ".join(
                [
                    f"COPY INTO {table_name}",
                    f"FROM @{temp_stage_name}/data.csv",
                    "FILE_FORMAT = (TYPE = CSV, SKIP_HEADER=1 );",
                ]
            )
        )
        connection.commit()
    except Exception as exc:
        logger.error("Executing rollback of data load into Snowflake.")
        connection.rollback()
        raise exc

    logger.info("Closing Snowflake connection.")
    connection.close()


if __name__ == "__main__":
    main()
