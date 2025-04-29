resource "azurerm_resource_group" "rg" {
  name     = "rg-containers"
  location = var.location
}

resource "random_pet" "acr_name" {
  length    = 2
  separator = "_"
}

resource "random_uuid" "aci_identity_name" {}

locals {
  split_name = split("_",random_pet.acr_name.id)
  first_word = local.split_name[0]
  second_word = join("",[upper(substr(local.split_name[1],0,1)), substr(local.split_name[1],1,100)])
  camel_case_name = join("", [local.first_word,local.second_word])
  # TODO: Give camel_case_name a different variable name.
  # camel_case_name = lower(substr(random_pet.example.id, 0, 1)) + substr(random_pet.example.id, 1, -1)
}

resource "azurerm_container_registry" "acr" {
  name = local.camel_case_name
  location = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku = "Basic"
}

resource "azurerm_user_assigned_identity" "aci_identity" {
  # TODO: Associate this identity with container instances.
  name = random_uuid.aci_identity_name.result
  location = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

resource "azurerm_role_assignment" "acr_pull" {
  scope = azurerm_container_registry.acr.id
  role_definition_name = "AcrPull"
  principal_id = azurerm_user_assigned_identity.aci_identity.principal_id
}