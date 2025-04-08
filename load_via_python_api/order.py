# generated by datamodel-codegen:
#   filename:  order.json
#   timestamp: 2025-04-08T06:12:14+00:00

from __future__ import annotations

from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


class Item(BaseModel):
    productId: str = Field(..., description="Product identifier.")
    productName: str = Field(..., description="Name of the product.")
    quantity: int = Field(..., description="Quantity of the product ordered.")
    price: float = Field(..., description="Price per unit of the product.")


class Order(BaseModel):
    orderId: str = Field(..., description="Unique identifier for the order.")
    customerId: str = Field(..., description="The customer who placed the order.")
    orderDate: datetime = Field(
        ..., description="The date and time when the order was placed."
    )
    totalAmount: float = Field(..., description="Total amount for the order.")
    items: List[Item] = Field(..., description="List of items in the order.")
