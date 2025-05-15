# Demo Snowflake Code

A repository for interacting running and interacting with Snowflake.

## Local Environment Setup

First, make sure you have python installed in your environment. See the ".tool-versions" file in this repository to the required version.

Install the requirements using the command

```shell
pip install requirements.txt
```

then run the application using `python src/main.py` from the current directory.

## Generate Data Models

The data model in this app is generated from a jsonschema specification. Installing the `datamodel-code-generator` library as per the instructions above should suffice to register the binary, however, if using `asdf` you will need to reshim python using `asdf reshim python`.

To generate the data model used in this code run the following command

```shell
datamodel-codegen --input ../schema/customer.json --output customer.py --class-name Customer
```
