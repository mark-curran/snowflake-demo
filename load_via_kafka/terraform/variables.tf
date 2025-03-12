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
