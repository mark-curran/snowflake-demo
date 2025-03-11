resource "azurerm_resource_group" "event_hub_rg" {
  name     = "event_hub"
  location = var.location
}

resource "random_pet" "eventhub_namespace" {
  length    = 2
  separator = "-"
}

resource "azurerm_eventhub_namespace" "event_hub_namespace" {
  name                = random_pet.eventhub_namespace.id
  location            = azurerm_resource_group.event_hub_rg.location
  resource_group_name = azurerm_resource_group.event_hub_rg.name
  sku                 = "Standard"
  capacity            = 1
}

resource "azurerm_eventhub" "event_hub" {
  name              = var.event_hub_name
  namespace_id      = azurerm_eventhub_namespace.event_hub_namespace.id
  partition_count   = 2
  message_retention = 1
}
