output "primary_connection_string" {
  value = module.event_hub.primary_connection_string
  sensitive = true
}

# Example primary connection string: "Endpoint=sb://big-apple.servicebus.windows.net/;SharedAccessKeyName=test-auth-rule;SharedAccessKey=helloworld"
# Example bootstrap server: "big-apple.servicebus.windows.net:9093"
output "bootstrap_server" {
  value =  "${split("/;",split("sb://",module.event_hub.primary_connection_string)[1])[0]}:9093"
  sensitive = true
}
