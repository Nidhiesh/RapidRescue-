import asyncio

from sqlalchemy import select

from app.database.database import AsyncSessionLocal
from app.models.driver import Driver


async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Driver))
        drivers = result.scalars().all()

        print("\n========== DRIVERS ==========")
        print("TOTAL:", len(drivers))

        for d in drivers:
            print(
                f"{d.id} | "
                f"verification={d.verification_status} | "
                f"duty={d.duty_status} | "
                f"availability={d.availability_status}"
            )


if __name__ == "__main__":
    asyncio.run(main())