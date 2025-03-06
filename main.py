import snowflake.connector as connector
import json

with open("connection_config.json", "r") as file:
    config = json.load(file)

with connector.connect(**config) as conn:
    with conn.cursor() as cur:
        print(cur.execute("SELECT 1;").fetchall())
