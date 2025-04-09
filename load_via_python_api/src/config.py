"""
Get the config.
"""

from dataclasses import dataclass
from os import getenv


@dataclass(frozen=True)
class SNOWFLAKE_CREDENTIALS:
    account: str = getenv("SNOWFLAKE_ACCOUNT", "")
    user: str = getenv("SNOWFLAKE_USER", "")
    private_key: str = getenv("SNOWFLAKE_PRIVATE_KEY", "")


@dataclass(frozen=True)
class SNOWFLAKE_OBJECTS:
    database: str = getenv("SNOWFLAKE_DATABASE", "")
    schema: str = getenv("SNOWFLAKE_SCHEMA", "")
    warehouse: str = getenv("SNOWFLAKE_WAREHOUSE", "")


@dataclass(frozen=True)
class SNOWFLAKE_ROLE:
    # TODO: Eventually get rid of this role and manage with Terraform.
    role: str = getenv("SNOWFLAKE_ROLE", "")


@dataclass(frozen=True)
class CUSTOMER_OBJECTS:
    table: str = getenv("CUSTOMER_TABLE", "")
