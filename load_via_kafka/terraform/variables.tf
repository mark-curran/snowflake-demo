variable "location" {
  description = "Location where the event hub namespace will be deployed."
  type        = string
  nullable    = false
}

variable "event_hub_name" {
  description = "Name of the event hub."
  type        = string
  nullable    = false
}

variable "auth_rule_name" {
  description = "Name of the authorisation rule used to produce and consume from the event hub."
  type = string
  nullable = false
}

variable "partition_count" {
  description = "Number of partitions in the event hub."
  type = number
  nullable = false
}