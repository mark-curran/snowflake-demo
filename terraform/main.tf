terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "4.22.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "3.7.1"
    }
  }
  backend "azurerm" {}

}

provider "azurerm" {
  subscription_id = var.subscription_id
  features {}
}

module "event_hub" {
  source         = "../load_via_kafka/event_hubs/terraform"
  location       = var.az_subscription_default_location
  event_hub_name = "test-data"
}
