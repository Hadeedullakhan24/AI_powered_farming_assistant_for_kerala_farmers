from pydantic import BaseModel


class CropAdvisorRequest(BaseModel):
    latitude: float
    longitude: float
    soil_type: str
    irrigation: str