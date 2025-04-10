import logging
from sys import stdout
from time import gmtime

from config import APPLICATION_SETTINGS

# Configure the logger
logging.basicConfig(
    # TODO: Configurable log level.
    level=APPLICATION_SETTINGS.log_level,
    # logging.INFO,  # Default log level INFO
    format="%(asctime)s UTC "
    + "- %(levelname)s"
    + "- %(module)s:%(lineno)d "
    + "- %(message)s",
    handlers=[logging.StreamHandler(stdout)],  # Print logs to stdout
)

# Ensure timestamps are in UTC
logging.Formatter.converter = gmtime

# Create a logger instance
logger = logging.getLogger(__name__)
