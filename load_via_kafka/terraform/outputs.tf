output "primary_connection_string" {
  value = azurerm_eventhub_namespace_authorization_rule.auth_rule.primary_connection_string
  sensitive = true
}
