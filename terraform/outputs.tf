output "primary_connection_string" {
  value = module.event_hub.primary_connection_string
  sensitive = true
}
