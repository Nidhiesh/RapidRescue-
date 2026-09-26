from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator


class EmergencyCreateResponse(BaseModel):
    success: bool = True
    message: str = "Emergency created successfully"
    emergency_id: str
    status: str = "SEARCHING"


class EmergencyDetailSchema(BaseModel):
    id: str
    patient_id: str
    front_photo_url: str
    rear_photo_url: str
    latitude: float
    longitude: float
    accuracy: float
    timestamp: Optional[datetime] = None
    created_at: datetime
    status: str
    assigned_ambulance_id: Optional[str] = None
    assigned_driver_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class EmergencyStatusResponse(BaseModel):
    success: bool = True
    emergency_id: str
    status: str
    data: Optional[EmergencyDetailSchema] = None


class EmergencyCancelResponse(BaseModel):
    success: bool = True
    message: str = "Emergency cancelled successfully"
    emergency_id: str
    status: str = "CANCELLED"
