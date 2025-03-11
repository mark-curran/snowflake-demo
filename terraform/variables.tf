variable "az_subscription_default_location" {
  description = "Default location of the Azure subscription."
  type        = string
}

variable "subscription_id" {
  description = "The Azure subscription id."
  type        = string
  nullable    = false
}
