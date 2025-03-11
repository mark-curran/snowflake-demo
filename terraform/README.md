# Terraform Base Setup

Setup the remote state used by everything else in this demo.

## Setup

### Setup Azure cli

Sign up for an Azure account and install the [Azure cli tool](https://learn.microsoft.com/en-us/cli/azure/), which typically uses the alias `az`. Then run the cli setup script which will set a default region for the resources created in this project.

```shell
source cli_setup.sh
```

### Install Terraform cli

Install the Terraform cli. To do so using the asdf version manager, follow these steps.

```bash
asdf plugin add terraform
asdf install terraform 1.10.5
asdf set terraform 1.10.5
```

You may need to then run the command `export PATH="${ASDF_DATA_DIR:-$HOME/.asdf}/shims:$PATH"`. If you make widespread use of `asdf` then consider adding the command to your shell profile. 

### Configure Resource Group and Blob Storage for Remote State

This project stores the terraform remote state in Azure blob storage. It will create its own blob storage resource and resource group. These can be configured by editing the "resource_group.json" file.

### Run the Setup Script

Run the script, following the prompts to setup the storage account.

```bash
source remote_state_setup.sh
```

Note, that all relevant data will be saved as tags on the resource group. This means if a colleague has already run the setup script, then the script will pull the relevant value from the tag, and no new Azure resources will be created.

There are two important side effects of this scripts
* This script will export an access key for the remote state to the shell variable `ARM_ACCESS_KEY`.
* This script will create some git ignored files for variables that your terraform setup needs, such as a default Azure location and the randomly generated name of the storage account required to access the remote Terraform state.
