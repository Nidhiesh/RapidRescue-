from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.models.driver import Driver
from app.models.driver_location import DriverLocation
from app.utils.security import get_current_driver
from app.schemas.location import LocationUpdateSchema, LocationUpdateResponse

router = APIRouter(prefix="/api/v1/drivers/me", tags=["Location"])


@router.post("/location", response_model=LocationUpdateResponse, status_code=status.HTTP_201_CREATED)
async def update_location(
    data: LocationUpdateSchema,
    current_driver: Driver = Depends(get_current_driver),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)

    # Parse timestamp if supplied
    recorded_at = now
    if data.timestamp:
        try:
            if isinstance(data.timestamp, (int, float)):
                # epoch ms or s
                ts_val = data.timestamp / 1000.0 if data.timestamp > 1e11 else data.timestamp
                recorded_at = datetime.fromtimestamp(ts_val, tz=timezone.utc)
            elif isinstance(data.timestamp, str):
                recorded_at = datetime.fromisoformat(data.timestamp.replace("Z", "+00:00"))
        except Exception:
            recorded_at = now

    location_entry = DriverLocation(
        driver_id=current_driver.id,
        latitude=data.latitude,
        longitude=data.longitude,
        accuracy_meters=data.accuracy,
        altitude_meters=data.altitude,
        heading_degrees=data.heading,
        speed_mps=data.speed,
        recorded_at=recorded_at,
    )

    db.add(location_entry)
    await db.commit()

    return LocationUpdateResponse(
        success=True,
        message="Location updated successfully",
        recordedAt=recorded_at.isoformat(),
    )
