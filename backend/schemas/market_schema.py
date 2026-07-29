from pydantic import BaseModel


class MarketRequest(BaseModel):
    crop: str
    district: str