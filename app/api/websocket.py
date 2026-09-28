import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status, Query

from app.utils.security import decode_access_token
from app.websocket.manager import manager as ws_manager

logger = logging.getLogger("websocket")
router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/driver")
async def driver_websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
):
    if not token:
        # Check authorization header if query param token not supplied
        auth_header = websocket.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        payload = decode_access_token(token)
        driver_id = payload.get("driver_id") or payload.get("sub")
        if not driver_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception as e:
        logger.error(f"WebSocket auth failed: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await ws_manager.connect(driver_id, websocket)
    try:
        while True:
            # Keep connection open and receive optional client messages/pings
            data = await websocket.receive_text()
            logger.info(f"Received WS message from driver {driver_id}: {data}")
    except WebSocketDisconnect:
        ws_manager.disconnect(driver_id)
    except Exception as e:
        logger.error(f"WebSocket error for driver {driver_id}: {e}")
        ws_manager.disconnect(driver_id)
