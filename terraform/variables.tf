variable "az_subscription_default_location" {
  description = "Default location of the Azure subscription."
  type        = string
}

variable "subscription_id" {
  description = "The Azure subscription id."
  type        = string
  nullable    = false
}

variable "topic" {
  description = "The name of the topic (or EventHub) data will be published to."
  type = string
  nullable = false
}


variable "partition_count" {
  description = "Number of partitions in the event hub."
  type = number
  nullable = false
}