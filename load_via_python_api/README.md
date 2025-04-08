# Demo Snowflake Code

A repository for interacting running and interacting with Snowflake.

## Local Environment Setup

## Install Requirements

Install the requirements file.

```shell
pip install requirements.txt
```

## Generate an Authentication Key-Pair

Create a private RSA key

```shell
openssl genrsa 2048 | openssl pkcs8 -topk8 -inform PEM -out rsa_key.p8 -nocrypt
```

Then create a public RSA key from the private one

```shell
openssl rsa -in rsa_key.p8 -pubout -out rsa_key.pub
```

Copy the public key from the file "rsa_key.pub" and set the `RSA_PUBLIC_KEY` variable your Snowflake demo environment.

```sql
ALTER USER example_user SET RSA_PUBLIC_KEY='JERUEHtcve...'
```

Create a file "connection_config.json" in the root of this repository

```json
{
  "account": "<my-account>",
  "user": "<user-name>",
  "private_key_file": "<path-to-private-key>",
  "warehouse": "<warehouse>"
}
```

## Generate Data Models

```shell
datamodel-codegen --input ../schema/customer.json --output customer.py --class-name Customer
datamodel-codegen --input ../schema/order.json --output order.py --class-name Order
```

## (Optional) Setup asdf

Install the [asdf runtime manager](https://asdf-vm.com/) to set the current version of python 3.13.1.
