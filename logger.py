import logging
import sys
from time import gmtime

# Configure the logger
logging.basicConfig(
    level=logging.INFO,  # Default log level INFO
    format="%(asctime)s UTC "
    + "- %(levelname)s"
    + "- %(module)s:%(lineno)d "
    + "- %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],  # Print logs to stdout
)

# Ensure timestamps are in UTC
logging.Formatter.converter = gmtime

# Create a logger instance
logger = logging.getLogger(__name__)
