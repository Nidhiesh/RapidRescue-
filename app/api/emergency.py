from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.services.emergency_service import EmergencyService
from app.services.dispatch_service import DispatchService
from app.utils.file_utils import validate_image_file, save_upload_file
from app.schemas.emergency import (
    EmergencyCreateResponse,
    EmergencyStatusResponse,
    EmergencyCancelResponse,
    EmergencyDetailSchema,
)

router = APIRouter(prefix="/api/v1/emergencies", tags=["Emergencies"])


@router.post("", response_model=EmergencyCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_emergency(
    front_photo: UploadFile = File(..., description="Front vehicle photo"),
    rear_photo: UploadFile = File(..., description="Rear vehicle photo"),
    latitude: float = Form(..., description="Latitude (-90 to 90)"),
    longitude: float = Form(..., description="Longitude (-180 to 180)"),
    accuracy: float = Form(..., description="GPS accuracy (non-negative)"),
    timestamp: Optional[str] = Form(None, description="ISO timestamp string"),
    patient_id: Optional[str] = Form(None, description="Patient identifier"),
    device_id: Optional[str] = Form(None, description="Device identifier"),
    patient_device_id: Optional[str] = Form(None, description="Patient or Device identifier"),
    priority: Optional[str] = Form(None, description="Priority: CRITICAL, HIGH, NORMAL"),
    db: AsyncSession = Depends(get_db),
):
    # 1. Identifier validation
    identifier = patient_id or device_id or patient_device_id
    if not identifier or not identifier.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient or device identifier is required (patient_id or device_id)."
        )

    # 2. Coordinate & accuracy validation
    if not (-90.0 <= latitude <= 90.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Latitude must be between -90 and 90 degrees."
        )

    if not (-180.0 <= longitude <= 180.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Longitude must be between -180 and 180 degrees."
        )

    if accuracy < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Accuracy cannot be negative."
        )

    # 3. Photo validations
    validate_image_file(front_photo, "front_photo")
    validate_image_file(rear_photo, "rear_photo")

    # 4. Save photo files
    front_db_path, front_url = await save_upload_file(front_photo, prefix="front")
    rear_db_path, rear_url = await save_upload_file(rear_photo, prefix="rear")

    # 5. Parse timestamp
    parsed_timestamp: Optional[datetime] = None
    if timestamp:
        try:
            clean_ts = timestamp.replace("Z", "+00:00")
            parsed_timestamp = datetime.fromisoformat(clean_ts)
        except Exception:
            parsed_timestamp = datetime.now(timezone.utc)

    # 6. Create emergency in DB
    emergency = await EmergencyService.create_emergency(
        db=db,
        patient_id=identifier.strip(),
        front_photo_path=front_url,  # Store standard relative URL path
        rear_photo_path=rear_url,
        latitude=latitude,
        longitude=longitude,
        accuracy=accuracy,
        timestamp=parsed_timestamp,
        priority=priority,
    )

    # 7. Automatically dispatch offer to nearest eligible candidate driver
    await DispatchService.dispatch_to_next_candidate(db, str(emergency.id))

    return EmergencyCreateResponse(
        success=True,
        message="Emergency created successfully",
        emergency_id=str(emergency.id),
        status=emergency.status,
    )


@router.get("/{emergency_id}", response_model=EmergencyStatusResponse)
async def get_emergency_status(
    emergency_id: str,
    db: AsyncSession = Depends(get_db),
):
    emergency = await EmergencyService.get_emergency_by_id(db, emergency_id)

    detail = EmergencyDetailSchema(
        id=str(emergency.id),
        patient_id=emergency.patient_id,
        front_photo_url=emergency.front_photo_path,
        rear_photo_url=emergency.rear_photo_path,
        latitude=emergency.latitude,
        longitude=emergency.longitude,
        accuracy=emergency.accuracy,
        timestamp=emergency.timestamp,
        created_at=emergency.created_at,
        status=emergency.status,
        assigned_ambulance_id=emergency.assigned_ambulance_id,
        assigned_driver_id=emergency.assigned_driver_id,
    )

    return EmergencyStatusResponse(
        success=True,
        emergency_id=str(emergency.id),
        status=emergency.status,
        data=detail,
    )


@router.post("/{emergency_id}/cancel", response_model=EmergencyCancelResponse)
async def cancel_emergency(
    emergency_id: str,
    db: AsyncSession = Depends(get_db),
):
    emergency = await EmergencyService.cancel_emergency(db, emergency_id)

    return EmergencyCancelResponse(
        success=True,
        message="Emergency cancelled successfully",
        emergency_id=str(emergency.id),
        status=emergency.status,
    )
