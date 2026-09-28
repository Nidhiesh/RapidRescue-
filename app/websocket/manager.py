import json
import logging
from typing import Dict
from fastapi import WebSocket

logger = logging.getLogger("websocket_manager")


class ConnectionManager:
    def __init__(self):
        # Maps driver_id -> WebSocket connection
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, driver_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[driver_id] = websocket
        logger.info(f"Driver '{driver_id}' connected via WebSocket.")

    def disconnect(self, driver_id: str):
        if driver_id in self.active_connections:
            del self.active_connections[driver_id]
            logger.info(f"Driver '{driver_id}' disconnected from WebSocket.")

    async def send_event_to_driver(self, driver_id: str, event_type: str, data: dict) -> bool:
        """
        Sends a JSON event to a specific driver if connected.
        """
        websocket = self.active_connections.get(driver_id)
        if websocket:
            try:
                payload = {
                    "type": event_type,
                    "data": data
                }
                await websocket.send_text(json.dumps(payload))
                return True
            except Exception as e:
                logger.error(f"Error sending WS event to driver {driver_id}: {e}")
                self.disconnect(driver_id)
                return False
        return False

    async def broadcast_event(self, event_type: str, data: dict):
        payload = {
            "type": event_type,
            "data": data
        }
        message = json.dumps(payload)
        for driver_id, connection in list(self.active_connections.items()):
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting WS event to {driver_id}: {e}")
                self.disconnect(driver_id)


manager = ConnectionManager()
