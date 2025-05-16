"""
Get the config.
"""

from dataclasses import dataclass
from os import getenv
from pathlib import Path


def get_secret(name: str) -> str:
    """
    Fetch a secret from environment variables, and if not found, read value from
    /run/secret/<name> instead.

    Args:
        name (str): Name of the environment variable.

    Returns:
        str: Value of the secret.
    """
    env_value = getenv(name)
    if env_value:
        return env_value

    secret_path = Path(f"/run/secrets/{name}")
    if secret_path.exists():
        return secret_path.read_text(encoding="utf-8")
    else:
        raise ValueError("Path %s does not exist", secret_path.absolute())


@dataclass(frozen=True)
class APPLICATION_SETTINGS:
    log_level: str = getenv("LOG_LEVEL", "INFO")


@dataclass(frozen=True)
class SNOWFLAKE_CREDENTIALS:
    account: str = get_secret("SNOWFLAKE_ACCOUNT")
    user: str = get_secret("SNOWFLAKE_USER")
    private_key: str = get_secret("SNOWFLAKE_PRIVATE_KEY")


@dataclass(frozen=True)
class SNOWFLAKE_OBJECTS:
    database: str = get_secret("SNOWFLAKE_DATABASE")
    schema: str = get_secret("SNOWFLAKE_SCHEMA")
    bulk_load_warehouse: str = get_secret("BULK_COPY_WAREHOUSE")
    streaming_warehouse: str = get_secret("LOAD_STREAM_WAREHOUSE")


@dataclass(frozen=True)
class SNOWFLAKE_ROLE:
    bulk_loading_role: str = get_secret("BULK_LOAD_ROLE")
    streaming_data_role: str = get_secret("STREAMING_DATA_ROLE")


@dataclass(frozen=True)
class CUSTOMER_SETTINGS:
    table: str = getenv("CUSTOMER_TABLE", "")
    number_of_customers: int = int(getenv("NUMBER_OF_CUSTOMERS", "0"))
    file_format_name: str = getenv("CUSTOMER_JSON_FORMAT", "customer_json_format")
