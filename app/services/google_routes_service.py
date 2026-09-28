import os
import httpx


GOOGLE_ROUTES_URL = (
    "https://routes.googleapis.com/directions/v2:computeRoutes"
)


async def calculate_route(
    origin_lat: float,
    origin_lon: float,
    destination_lat: float,
    destination_lon: float,
):
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")

    if not api_key:
        raise RuntimeError("GOOGLE_MAPS_API_KEY is not configured")

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": (
            "routes.duration,"
            "routes.staticDuration,"
            "routes.distanceMeters"
        ),
    }

    payload = {
        "origin": {
            "location": {
                "latLng": {
                    "latitude": origin_lat,
                    "longitude": origin_lon,
                }
            }
        },
        "destination": {
            "location": {
                "latLng": {
                    "latitude": destination_lat,
                    "longitude": destination_lon,
                }
            }
        },
        "travelMode": "DRIVE",
        "routingPreference": "TRAFFIC_AWARE",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            GOOGLE_ROUTES_URL,
            headers=headers,
            json=payload,
        )

    response.raise_for_status()

    data = response.json()

    routes = data.get("routes", [])

    if not routes:
        raise RuntimeError("Google Routes returned no route")

    route = routes[0]

    duration_seconds = float(
        route["duration"].rstrip("s")
    )

    distance_meters = route["distanceMeters"]

    return {
        "distance_km": distance_meters / 1000,
        "eta_minutes": duration_seconds / 60,
    }