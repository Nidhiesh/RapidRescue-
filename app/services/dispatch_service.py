import asyncio
import logging
import uuid

from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from fastapi import HTTPException, status

from app.models.driver import (
    Driver,
    VerificationStatus,
    DutyStatus,
    AvailabilityStatus,
)
from app.models.driver_location import DriverLocation
from app.models.emergency import Emergency, EmergencyStatus
from app.models.emergency_response import EmergencyResponse, ResponseAction

from app.utils.distance import haversine_distance_km
from app.websocket.manager import manager as ws_manager

# NEW: Google traffic-aware ETA service
from app.services.google_routes_service import calculate_route


logger = logging.getLogger("dispatch_service")


# ============================================================
# DISPATCH TIMEOUT CONFIGURATION
# ============================================================

TIMEOUT_PRIORITY_MAP = {
    "CRITICAL": 20,
    "HIGH": 40,
    "NORMAL": 60,
}


class DispatchService:

    # ========================================================
    # GET LATEST DRIVER LOCATION
    # ========================================================

    @staticmethod
    async def get_latest_driver_location(
        db: AsyncSession,
        driver_id: str,
    ) -> Optional[DriverLocation]:

        stmt = (
            select(DriverLocation)
            .where(
                DriverLocation.driver_id == driver_id
            )
            .order_by(
                desc(DriverLocation.recorded_at)
            )
            .limit(1)
        )

        return (
            await db.execute(stmt)
        ).scalar_one_or_none()


    # ========================================================
    # FIND ELIGIBLE CANDIDATES
    #
    # NOW:
    #   1. Find verified/online/available drivers
    #   2. Get latest GPS
    #   3. Check GPS freshness
    #   4. Ask Google Routes API for ETA
    #   5. Rank by traffic-aware ETA
    #
    # FALLBACK:
    #   If Google fails, use Haversine distance
    # ========================================================

    @staticmethod
    async def find_eligible_candidates(
        db: AsyncSession,
        pickup_lat: float,
        pickup_lon: float,
        max_stale_seconds: int = 60,
    ) -> List[Dict[str, Any]]:

        # ----------------------------------------------------
        # Find drivers that are:
        # VERIFIED
        # ONLINE
        # AVAILABLE
        # ----------------------------------------------------

        stmt = select(Driver).where(
            Driver.verification_status
            == VerificationStatus.VERIFIED.value,

            Driver.duty_status
            == DutyStatus.ONLINE.value,

            Driver.availability_status
            == AvailabilityStatus.AVAILABLE.value,
        )

        drivers = (
            await db.execute(stmt)
        ).scalars().all()


        now = datetime.now(timezone.utc)

        candidates = []


        # ----------------------------------------------------
        # Process each driver
        # ----------------------------------------------------

        for driver in drivers:

            # -----------------------------------------------
            # Get latest GPS location
            # -----------------------------------------------

            loc = await DispatchService.get_latest_driver_location(
                db,
                driver.id,
            )

            if not loc:
                continue


            # -----------------------------------------------
            # Check stale GPS
            # -----------------------------------------------

            rec_at = loc.recorded_at

            if rec_at.tzinfo is None:
                rec_at = rec_at.replace(
                    tzinfo=timezone.utc
                )

            time_diff = (
                now - rec_at
            ).total_seconds()


            if time_diff > max_stale_seconds:
                logger.warning(
                    f"Skipping driver {driver.id}: "
                    f"GPS location is {time_diff:.1f}s old"
                )
                continue


            # -----------------------------------------------
            # Calculate straight-line distance
            #
            # Used as:
            #   - fallback
            #   - informational value
            # -----------------------------------------------

            straight_distance_km = (
                haversine_distance_km(
                    pickup_lat,
                    pickup_lon,
                    loc.latitude,
                    loc.longitude,
                )
            )


            # -----------------------------------------------
            # Google traffic-aware ETA
            # -----------------------------------------------

            try:

                route = await calculate_route(

                    origin_lat=loc.latitude,
                    origin_lon=loc.longitude,

                    destination_lat=pickup_lat,
                    destination_lon=pickup_lon,
                )


                distance_km = route[
                    "distance_km"
                ]

                eta_minutes = route[
                    "eta_minutes"
                ]


                candidates.append({

                    "driver": driver,

                    "location": loc,

                    "distance_km": distance_km,

                    "straight_distance_km":
                        straight_distance_km,

                    "eta_minutes": eta_minutes,

                    "eta_source": "google_routes",

                })


                logger.info(
                    f"Driver {driver.id}: "
                    f"ETA={eta_minutes:.1f} min, "
                    f"distance={distance_km:.2f} km"
                )


            except Exception as e:

                # -------------------------------------------
                # Google API failure fallback
                # -------------------------------------------

                logger.warning(
                    f"Google ETA failed for "
                    f"driver {driver.id}: {e}"
                )


                candidates.append({

                    "driver": driver,

                    "location": loc,

                    "distance_km":
                        straight_distance_km,

                    "straight_distance_km":
                        straight_distance_km,

                    "eta_minutes": None,

                    "eta_source": "haversine_fallback",

                })


        # ====================================================
        # SORT BY ETA
        #
        # Google ETA candidates come first.
        # Fallback candidates come afterward.
        # ====================================================

        candidates.sort(
            key=lambda c: (

                c["eta_minutes"] is None,

                (
                    c["eta_minutes"]
                    if c["eta_minutes"] is not None
                    else float("inf")
                ),

            )
        )


        return candidates


    # ========================================================
    # DISPATCH TO NEXT CANDIDATE
    # ========================================================

    @staticmethod
    async def dispatch_to_next_candidate(
        db: AsyncSession,
        emergency_id_str: str,
    ) -> Optional[Dict[str, Any]]:

        try:

            emergency_uuid = uuid.UUID(
                emergency_id_str
            )

        except ValueError:

            return None


        # ----------------------------------------------------
        # Lock emergency row
        # ----------------------------------------------------

        stmt = (
            select(Emergency)
            .where(
                Emergency.id == emergency_uuid
            )
            .with_for_update()
        )

        emergency = (
            await db.execute(stmt)
        ).scalar_one_or_none()


        if (
            not emergency
            or emergency.status
            != EmergencyStatus.SEARCHING.value
        ):

            return None


        # ----------------------------------------------------
        # Find drivers who already responded
        # ----------------------------------------------------

        resp_stmt = (
            select(
                EmergencyResponse.driver_id
            )
            .where(
                EmergencyResponse.request_id
                == emergency_id_str
            )
        )

        responded_driver_ids = set(
            (
                await db.execute(
                    resp_stmt
                )
            ).scalars().all()
        )


        # ----------------------------------------------------
        # Find eligible drivers
        # ----------------------------------------------------

        all_candidates = (
            await DispatchService.find_eligible_candidates(

                db=db,

                pickup_lat=emergency.latitude,

                pickup_lon=emergency.longitude,

            )
        )


        # ----------------------------------------------------
        # Remove drivers who already responded
        # ----------------------------------------------------

        eligible_candidates = [

            c
            for c in all_candidates

            if c["driver"].id
            not in responded_driver_ids

        ]


        # ----------------------------------------------------
        # No candidates
        # ----------------------------------------------------

        if not eligible_candidates:

            emergency.current_candidate_driver_id = None

            emergency.response_deadline = None

            await db.commit()

            logger.warning(
                f"No eligible drivers available "
                f"for emergency {emergency_id_str}"
            )

            return None


        # ----------------------------------------------------
        # Select fastest candidate
        # ----------------------------------------------------

        top_candidate = (
            eligible_candidates[0]
        )

        driver: Driver = (
            top_candidate["driver"]
        )

        dist_km: float = (
            top_candidate["distance_km"]
        )

        eta_minutes = (
            top_candidate.get(
                "eta_minutes"
            )
        )

        eta_source = (
            top_candidate.get(
                "eta_source"
            )
        )


        # ----------------------------------------------------
        # Determine timeout
        # ----------------------------------------------------

        priority_upper = (
            emergency.priority
            or "CRITICAL"
        ).upper()


        timeout_seconds = (
            TIMEOUT_PRIORITY_MAP.get(
                priority_upper,
                60,
            )
        )


        now = datetime.now(
            timezone.utc
        )


        deadline = (
            now
            + timedelta(
                seconds=timeout_seconds
            )
        )


        # ----------------------------------------------------
        # Update emergency dispatch state
        # ----------------------------------------------------

        emergency.current_candidate_driver_id = (
            driver.id
        )

        emergency.dispatch_offered_at = now

        emergency.response_deadline = deadline


        await db.commit()


        # ----------------------------------------------------
        # WebSocket payload
        # ----------------------------------------------------

        created_at_iso = (

            emergency.created_at.isoformat()

            if emergency.created_at

            else now.isoformat()

        )


        ws_payload = {

            "emergencyId":
                str(emergency.id),

            "pickup": {

                "latitude":
                    emergency.latitude,

                "longitude":
                    emergency.longitude,

            },

            "priority":
                priority_upper,

            "createdAt":
                created_at_iso,

            "responseDeadline":
                deadline.isoformat(),

            "timeoutSeconds":
                timeout_seconds,

            "distanceKm":
                round(
                    dist_km,
                    2,
                ),

            "etaMinutes": (

                round(
                    eta_minutes,
                    1,
                )

                if eta_minutes
                is not None

                else None

            ),

            "etaSource":
                eta_source,

        }


        # ----------------------------------------------------
        # Send dispatch offer
        # ----------------------------------------------------

        await ws_manager.send_event_to_driver(

            driver_id=driver.id,

            event_type="EMERGENCY_DISPATCH",

            data=ws_payload,

        )


        # ----------------------------------------------------
        # Schedule timeout
        # ----------------------------------------------------

        asyncio.create_task(

            DispatchService.schedule_timeout_check(

                emergency_id_str=
                    emergency_id_str,

                offered_driver_id=
                    driver.id,

                timeout_seconds=
                    timeout_seconds,

            )

        )


        logger.info(

            f"Emergency {emergency_id_str} "
            f"offered to driver {driver.id} | "
            f"ETA={eta_minutes} min | "
            f"distance={dist_km:.2f} km | "
            f"source={eta_source}"

        )


        return {

            "driver_id":
                driver.id,

            "distance_km":
                dist_km,

            "eta_minutes":
                eta_minutes,

            "eta_source":
                eta_source,

            "timeout_seconds":
                timeout_seconds,

            "response_deadline":
                deadline,

        }


    # ========================================================
    # AUTOMATIC TIMEOUT CHECK
    # ========================================================

    @staticmethod
    async def schedule_timeout_check(
        emergency_id_str: str,
        offered_driver_id: str,
        timeout_seconds: int,
    ):

        await asyncio.sleep(
            timeout_seconds
        )


        from app.database.database import (
            AsyncSessionLocal
        )


        async with AsyncSessionLocal() as db:

            try:

                emergency_uuid = uuid.UUID(
                    emergency_id_str
                )


                stmt = (
                    select(Emergency)
                    .where(
                        Emergency.id
                        == emergency_uuid
                    )
                    .with_for_update()
                )


                emergency = (
                    await db.execute(stmt)
                ).scalar_one_or_none()


                if not emergency:
                    return


                # ------------------------------------------------
                # Prevent stale timeout processing
                # ------------------------------------------------

                if (

                    emergency.status
                    != EmergencyStatus.SEARCHING.value

                    or emergency.current_candidate_driver_id
                    != offered_driver_id

                ):

                    return


                now = datetime.now(
                    timezone.utc
                )


                # ------------------------------------------------
                # Record TIMEOUT
                # ------------------------------------------------

                resp_record = EmergencyResponse(

                    request_id=
                        emergency_id_str,

                    driver_id=
                        offered_driver_id,

                    action=
                        ResponseAction.TIMEOUT.value,

                    response_timestamp=
                        now,

                )


                db.add(
                    resp_record
                )


                # ------------------------------------------------
                # Keep driver AVAILABLE
                # ------------------------------------------------

                driver_stmt = (
                    select(Driver)
                    .where(
                        Driver.id
                        == offered_driver_id
                    )
                )


                driver = (
                    await db.execute(
                        driver_stmt
                    )
                ).scalar_one_or_none()


                if (

                    driver

                    and driver.duty_status
                    == DutyStatus.ONLINE.value

                ):

                    driver.availability_status = (
                        AvailabilityStatus.AVAILABLE.value
                    )

                    driver.updated_at = now


                emergency.current_candidate_driver_id = None

                emergency.response_deadline = None


                await db.commit()


                # ------------------------------------------------
                # Notify driver
                # ------------------------------------------------

                await ws_manager.send_event_to_driver(

                    driver_id=
                        offered_driver_id,

                    event_type=
                        "DISPATCH_TIMEOUT",

                    data={

                        "requestId":
                            emergency_id_str,

                        "status":
                            "TIMEOUT",

                    },

                )


                # ------------------------------------------------
                # Try next candidate
                # ------------------------------------------------

                await DispatchService.dispatch_to_next_candidate(

                    db,

                    emergency_id_str,

                )


            except Exception as e:

                await db.rollback()

                logger.error(

                    f"Error in "
                    f"schedule_timeout_check "
                    f"for {emergency_id_str}: "
                    f"{e}"

                )


    # ========================================================
    # DRIVER ACCEPT / REJECT / TIMEOUT
    # ========================================================

    @staticmethod
    async def respond_to_dispatch(

        db: AsyncSession,

        driver: Driver,

        request_id_str: str,

        action_str: str,

    ) -> EmergencyResponse:


        action_upper = (
            action_str.upper()
        )


        if action_upper not in [

            ResponseAction.ACCEPT.value,

            ResponseAction.REJECT.value,

            ResponseAction.TIMEOUT.value,

        ]:

            raise HTTPException(

                status_code=
                    status.HTTP_400_BAD_REQUEST,

                detail=
                    "Invalid action. "
                    "Allowed actions: "
                    "ACCEPT, REJECT, TIMEOUT.",

            )


        # ----------------------------------------------------
        # Parse emergency UUID
        # ----------------------------------------------------

        try:

            emergency_uuid = uuid.UUID(
                request_id_str
            )

        except ValueError:

            raise HTTPException(

                status_code=
                    status.HTTP_400_BAD_REQUEST,

                detail=
                    "Invalid emergency request ID "
                    "format. Must be a valid UUID.",

            )


        now = datetime.now(
            timezone.utc
        )


        # ====================================================
        # ACCEPT
        # ====================================================

        if action_upper == ResponseAction.ACCEPT.value:


            stmt = (
                select(Emergency)
                .where(
                    Emergency.id
                    == emergency_uuid
                )
                .with_for_update()
            )


            emergency = (
                await db.execute(stmt)
            ).scalar_one_or_none()


            if not emergency:

                raise HTTPException(

                    status_code=
                        status.HTTP_404_NOT_FOUND,

                    detail=
                        f"Emergency request "
                        f"'{request_id_str}' "
                        f"not found.",

                )


            # ------------------------------------------------
            # Prevent double assignment
            # ------------------------------------------------

            if (

                emergency.assigned_driver_id

                or emergency.status in [

                    EmergencyStatus.ACCEPTED.value,

                    EmergencyStatus.ASSIGNED.value,

                    EmergencyStatus.COMPLETED.value,

                ]

            ):

                raise HTTPException(

                    status_code=
                        status.HTTP_409_CONFLICT,

                    detail=
                        "Incident already assigned "
                        "to another responder",

                )


            # ------------------------------------------------
            # Verify candidate
            # ------------------------------------------------

            if (

                emergency.current_candidate_driver_id

                and emergency.current_candidate_driver_id
                != driver.id

            ):

                raise HTTPException(

                    status_code=
                        status.HTTP_409_CONFLICT,

                    detail=
                        "Incident dispatch offer "
                        "expired or assigned "
                        "to another responder",

                )


            # ------------------------------------------------
            # Assign
            # ------------------------------------------------

            emergency.assigned_driver_id = (
                driver.id
            )

            emergency.current_candidate_driver_id = None

            emergency.response_deadline = None

            emergency.status = (
                EmergencyStatus.ACCEPTED.value
            )

            emergency.accepted_at = now


            # ------------------------------------------------
            # Driver becomes BUSY
            # ------------------------------------------------

            driver.availability_status = (
                AvailabilityStatus.BUSY.value
            )

            driver.updated_at = now


        # ====================================================
        # REJECT / TIMEOUT
        # ====================================================

        else:

            stmt = (
                select(Emergency)
                .where(
                    Emergency.id
                    == emergency_uuid
                )
                .with_for_update()
            )


            emergency = (
                await db.execute(stmt)
            ).scalar_one_or_none()


            if not emergency:

                raise HTTPException(

                    status_code=
                        status.HTTP_404_NOT_FOUND,

                    detail=
                        f"Emergency request "
                        f"'{request_id_str}' "
                        f"not found.",

                )


            if (

                emergency.current_candidate_driver_id
                == driver.id

            ):

                emergency.current_candidate_driver_id = None

                emergency.response_deadline = None


            # ------------------------------------------------
            # Driver remains available
            # ------------------------------------------------

            if (

                driver.duty_status
                == DutyStatus.ONLINE.value

            ):

                driver.availability_status = (
                    AvailabilityStatus.AVAILABLE.value
                )

                driver.updated_at = now


        # ====================================================
        # RECORD RESPONSE
        # ====================================================

        resp_record = EmergencyResponse(

            request_id=
                request_id_str,

            driver_id=
                driver.id,

            action=
                action_upper,

            response_timestamp=
                now,

        )


        db.add(
            resp_record
        )


        await db.commit()

        await db.refresh(
            resp_record
        )


        # ====================================================
        # ACK DRIVER
        # ====================================================

        await ws_manager.send_event_to_driver(

            driver_id=
                driver.id,

            event_type=
                "DISPATCH_RESPONSE_ACK",

            data={

                "requestId":
                    request_id_str,

                "action":
                    action_upper,

                "status":
                    emergency.status,

            },

        )


        # ====================================================
        # REJECT/TIMEOUT → NEXT CANDIDATE
        # ====================================================

        if action_upper in [

            ResponseAction.REJECT.value,

            ResponseAction.TIMEOUT.value,

        ]:

            await DispatchService.dispatch_to_next_candidate(

                db,

                request_id_str,

            )


        return resp_record


    # ========================================================
    # COMPLETE INCIDENT
    # ========================================================

    @staticmethod
    async def complete_incident(

        db: AsyncSession,

        driver: Driver,

        request_id_str: str,

    ) -> Emergency:


        try:

            emergency_uuid = uuid.UUID(
                request_id_str
            )

        except ValueError:

            raise HTTPException(

                status_code=
                    status.HTTP_400_BAD_REQUEST,

                detail=
                    "Invalid emergency request ID "
                    "format. Must be a valid UUID.",

            )


        stmt = (
            select(Emergency)
            .where(
                Emergency.id
                == emergency_uuid
            )
            .with_for_update()
        )


        emergency = (
            await db.execute(stmt)
        ).scalar_one_or_none()


        if not emergency:

            raise HTTPException(

                status_code=
                    status.HTTP_404_NOT_FOUND,

                detail=
                    f"Emergency request "
                    f"'{request_id_str}' "
                    f"not found.",

            )


        now = datetime.now(
            timezone.utc
        )


        # ----------------------------------------------------
        # Complete emergency
        # ----------------------------------------------------

        emergency.status = (
            EmergencyStatus.COMPLETED.value
        )

        emergency.completed_at = now

        emergency.current_candidate_driver_id = None

        emergency.response_deadline = None


        # ----------------------------------------------------
        # Driver becomes available again
        # ----------------------------------------------------

        if (

            driver.duty_status
            == DutyStatus.ONLINE.value

        ):

            driver.availability_status = (
                AvailabilityStatus.AVAILABLE.value
            )


        driver.updated_at = now


        await db.commit()

        await db.refresh(
            emergency
        )


        # ----------------------------------------------------
        # Notify driver
        # ----------------------------------------------------

        await ws_manager.send_event_to_driver(

            driver_id=
                driver.id,

            event_type=
                "REQUEST_UPDATE",

            data={

                "requestId":
                    request_id_str,

                "status":
                    "COMPLETED",

            },

        )


        return emergency