from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import math
import random
import uuid
import jwt
import bcrypt
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'bicivalera-super-secret-key-change-me')
JWT_ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_DAYS = 30

# CO2 emission factor for a car: ~0.21 kg CO2 per km avoided by biking
CO2_PER_KM = 0.21

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)


# ----------------------------- Helpers -----------------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


def create_token(user_id: str) -> str:
    payload = {
        'sub': user_id,
        'iat': datetime.now(timezone.utc),
        'exp': datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if creds is None:
        raise HTTPException(status_code=401, detail="No autenticado")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('sub')
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user


def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def user_public(user: dict) -> dict:
    return {"id": user["id"], "name": user["name"], "email": user["email"], "created_at": user.get("created_at")}


# ----------------------------- Models -----------------------------
class RegisterInput(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class StartRideInput(BaseModel):
    station_id: str
    bike_id: str


# ----------------------------- Seed data -----------------------------
# Valera, Estado Trujillo, Venezuela center ~ 9.317, -70.603
VALERA_STATIONS = [
    {"name": "Plaza Bolívar", "lat": 9.3175, "lon": -70.6036, "mech": 6, "elec": 4},
    {"name": "Av. Bolívar Centro", "lat": 9.3210, "lon": -70.6010, "mech": 5, "elec": 3},
    {"name": "Terminal La Cejita", "lat": 9.3055, "lon": -70.5990, "mech": 8, "elec": 2},
    {"name": "Parque Los Ilustres", "lat": 9.3260, "lon": -70.6075, "mech": 4, "elec": 6},
    {"name": "UVM Campus", "lat": 9.3300, "lon": -70.5950, "mech": 3, "elec": 5},
    {"name": "Mercado Principal", "lat": 9.3120, "lon": -70.6090, "mech": 7, "elec": 3},
    {"name": "Estadio Luis Aparicio", "lat": 9.3350, "lon": -70.6040, "mech": 5, "elec": 4},
    {"name": "Av. 15 Morón", "lat": 9.3155, "lon": -70.5940, "mech": 6, "elec": 5},
]


async def seed_data():
    count = await db.stations.count_documents({})
    if count > 0:
        return
    logger.info("Seeding BiciValera stations and fleet...")
    for s in VALERA_STATIONS:
        station_id = str(uuid.uuid4())
        capacity = s["mech"] + s["elec"] + 4
        station = {
            "id": station_id,
            "name": s["name"],
            "lat": s["lat"],
            "lon": s["lon"],
            "capacity": capacity,
            "created_at": now_iso(),
        }
        await db.stations.insert_one(station)
        bikes = []
        for _ in range(s["mech"]):
            bikes.append({
                "id": str(uuid.uuid4()),
                "code": f"M-{random.randint(1000, 9999)}",
                "type": "mechanical",
                "station_id": station_id,
                "status": "available",
                "battery": None,
                "created_at": now_iso(),
            })
        for _ in range(s["elec"]):
            bikes.append({
                "id": str(uuid.uuid4()),
                "code": f"E-{random.randint(1000, 9999)}",
                "type": "electric",
                "station_id": station_id,
                "status": "available",
                "battery": random.randint(45, 100),
                "created_at": now_iso(),
            })
        if bikes:
            await db.bikes.insert_many(bikes)
    logger.info("Seed complete.")


# ----------------------------- Auth routes -----------------------------
@api_router.post("/auth/register")
async def register(data: RegisterInput):
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una cuenta con este correo")
    user = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "email": data.email.lower(),
        "password": hash_password(data.password),
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    token = create_token(user["id"])
    return {"access_token": token, "user": user_public(user)}


@api_router.post("/auth/login")
async def login(data: LoginInput):
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
    token = create_token(user["id"])
    return {"access_token": token, "user": user_public(user)}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user_public(user)


# ----------------------------- Stations & fleet -----------------------------
@api_router.get("/stations")
async def get_stations():
    stations = await db.stations.find().to_list(1000)
    result = []
    for s in stations:
        bikes = await db.bikes.find({"station_id": s["id"], "status": "available"}).to_list(1000)
        mech = [b for b in bikes if b["type"] == "mechanical"]
        elec = [b for b in bikes if b["type"] == "electric"]
        result.append({
            "id": s["id"],
            "name": s["name"],
            "lat": s["lat"],
            "lon": s["lon"],
            "capacity": s["capacity"],
            "available": len(bikes),
            "mechanical": len(mech),
            "electric": len(elec),
        })
    return result


@api_router.get("/stations/{station_id}")
async def get_station(station_id: str):
    s = await db.stations.find_one({"id": station_id})
    if not s:
        raise HTTPException(status_code=404, detail="Estación no encontrada")
    bikes = await db.bikes.find({"station_id": station_id, "status": "available"}).to_list(1000)
    return {
        "id": s["id"],
        "name": s["name"],
        "lat": s["lat"],
        "lon": s["lon"],
        "capacity": s["capacity"],
        "bikes": [{"id": b["id"], "code": b["code"], "type": b["type"], "battery": b.get("battery")} for b in bikes],
    }


# ----------------------------- Rides (simulated rental) -----------------------------
@api_router.post("/rides/start")
async def start_ride(data: StartRideInput, user: dict = Depends(get_current_user)):
    active = await db.rides.find_one({"user_id": user["id"], "status": "active"})
    if active:
        raise HTTPException(status_code=400, detail="Ya tienes un viaje activo")
    bike = await db.bikes.find_one({"id": data.bike_id, "station_id": data.station_id})
    if not bike or bike["status"] != "available":
        raise HTTPException(status_code=400, detail="Bicicleta no disponible")
    station = await db.stations.find_one({"id": data.station_id})
    ride = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "bike_id": bike["id"],
        "bike_code": bike["code"],
        "bike_type": bike["type"],
        "start_station_id": data.station_id,
        "start_station_name": station["name"],
        "status": "active",
        "started_at": now_iso(),
        "ended_at": None,
        "distance_km": 0,
        "co2_saved_kg": 0,
        "duration_min": 0,
    }
    await db.rides.insert_one(ride)
    await db.bikes.update_one({"id": bike["id"]}, {"$set": {"status": "in_use"}})
    ride.pop("_id", None)
    return ride


@api_router.post("/rides/{ride_id}/end")
async def end_ride(ride_id: str, user: dict = Depends(get_current_user)):
    ride = await db.rides.find_one({"id": ride_id, "user_id": user["id"]})
    if not ride:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")
    if ride["status"] != "active":
        raise HTTPException(status_code=400, detail="El viaje ya finalizó")
    # Assign bike to a random destination station, simulate distance
    stations = await db.stations.find().to_list(1000)
    dest = random.choice(stations)
    start = await db.stations.find_one({"id": ride["start_station_id"]})
    distance = round(max(0.5, haversine_km(start["lat"], start["lon"], dest["lat"], dest["lon"]) + random.uniform(0.2, 1.5)), 2)
    started = datetime.fromisoformat(ride["started_at"])
    duration = max(1, round((datetime.now(timezone.utc) - started).total_seconds() / 60))
    # For simulation, base duration on distance if too short
    duration = max(duration, round(distance / 12 * 60))
    co2 = round(distance * CO2_PER_KM, 3)
    await db.rides.update_one({"id": ride_id}, {"$set": {
        "status": "completed",
        "ended_at": now_iso(),
        "end_station_id": dest["id"],
        "end_station_name": dest["name"],
        "distance_km": distance,
        "co2_saved_kg": co2,
        "duration_min": duration,
    }})
    await db.bikes.update_one({"id": ride["bike_id"]}, {"$set": {"status": "available", "station_id": dest["id"]}})
    updated = await db.rides.find_one({"id": ride_id})
    updated.pop("_id", None)
    return updated


@api_router.get("/rides")
async def get_rides(user: dict = Depends(get_current_user)):
    rides = await db.rides.find({"user_id": user["id"]}).sort("started_at", -1).to_list(1000)
    for r in rides:
        r.pop("_id", None)
    return rides


@api_router.get("/rides/active")
async def get_active_ride(user: dict = Depends(get_current_user)):
    ride = await db.rides.find_one({"user_id": user["id"], "status": "active"})
    if ride:
        ride.pop("_id", None)
    return ride


# ----------------------------- Impact dashboard -----------------------------
@api_router.get("/impact")
async def get_impact(user: dict = Depends(get_current_user)):
    my_rides = await db.rides.find({"user_id": user["id"], "status": "completed"}).to_list(1000)
    my_km = round(sum(r.get("distance_km", 0) for r in my_rides), 2)
    my_co2 = round(sum(r.get("co2_saved_kg", 0) for r in my_rides), 2)
    my_min = sum(r.get("duration_min", 0) for r in my_rides)

    all_completed = await db.rides.find({"status": "completed"}).to_list(100000)
    city_km = round(sum(r.get("distance_km", 0) for r in all_completed), 2)
    city_co2 = round(sum(r.get("co2_saved_kg", 0) for r in all_completed), 2)
    # Baseline city figures to make the panel feel alive
    city_km += 12480.5
    city_co2 += round(12480.5 * CO2_PER_KM, 2)
    total_rides_city = len(all_completed) + 3120

    trees = round(my_co2 / 21, 2)  # ~21 kg CO2 absorbed per tree per year

    return {
        "user": {
            "rides": len(my_rides),
            "distance_km": my_km,
            "co2_saved_kg": my_co2,
            "duration_min": my_min,
            "calories": round(my_km * 40),
            "trees_equivalent": trees,
        },
        "city": {
            "rides": total_rides_city,
            "distance_km": city_km,
            "co2_saved_kg": city_co2,
        },
    }


# ----------------------------- Real-time simulator -----------------------------
@api_router.get("/simulator")
async def simulator():
    total_bikes = await db.bikes.count_documents({})
    in_use = await db.bikes.count_documents({"status": "in_use"})
    available = await db.bikes.count_documents({"status": "available"})
    mech = await db.bikes.count_documents({"type": "mechanical"})
    elec = await db.bikes.count_documents({"type": "electric"})
    active_rides = await db.rides.count_documents({"status": "active"})
    users = await db.users.count_documents({})

    # Simulated moving bikes between stations for live map animation
    stations = await db.stations.find().to_list(1000)
    moving = []
    if len(stations) >= 2:
        for i in range(min(6, len(stations))):
            a = random.choice(stations)
            b = random.choice(stations)
            t = random.random()
            moving.append({
                "id": f"sim-{i}",
                "type": random.choice(["mechanical", "electric"]),
                "lat": a["lat"] + (b["lat"] - a["lat"]) * t,
                "lon": a["lon"] + (b["lon"] - a["lon"]) * t,
            })

    # simulate a little live jitter on active/available counts
    live_active = active_rides + random.randint(3, 9)
    return {
        "total_bikes": total_bikes,
        "available": available,
        "in_use": in_use,
        "mechanical": mech,
        "electric": elec,
        "active_rides": live_active,
        "stations": len(stations),
        "users": users + 480,
        "moving_bikes": moving,
        "timestamp": now_iso(),
    }


@api_router.get("/impact/trend")
async def impact_trend(user: dict = Depends(get_current_user)):
    rides = await db.rides.find({"user_id": user["id"], "status": "completed"}).to_list(100000)
    days = []
    labels_es = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    today = datetime.now(timezone.utc).date()
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        km = 0.0
        co2 = 0.0
        count = 0
        for r in rides:
            try:
                rd = datetime.fromisoformat(r["started_at"]).date()
            except Exception:
                continue
            if rd == d:
                km += r.get("distance_km", 0)
                co2 += r.get("co2_saved_kg", 0)
                count += 1
        days.append({
            "date": d.isoformat(),
            "label": labels_es[d.weekday()],
            "km": round(km, 2),
            "co2": round(co2, 2),
            "rides": count,
        })
    return {"days": days}


ACHIEVEMENTS = [
    {"id": "first_ride", "name": "Primer viaje", "desc": "Completa tu primer recorrido", "icon": "flag", "goal": 1, "metric": "rides"},
    {"id": "five_rides", "name": "Rodador", "desc": "Completa 5 viajes", "icon": "bicycle", "goal": 5, "metric": "rides"},
    {"id": "ten_rides", "name": "Ciclista urbano", "desc": "Completa 10 viajes", "icon": "trophy", "goal": 10, "metric": "rides"},
    {"id": "ten_km", "name": "10 km verdes", "desc": "Recorre 10 km en total", "icon": "map", "goal": 10, "metric": "km"},
    {"id": "fifty_km", "name": "Maratonista eco", "desc": "Recorre 50 km en total", "icon": "trending-up", "goal": 50, "metric": "km"},
    {"id": "co2_1", "name": "Aire limpio", "desc": "Evita 1 kg de CO₂", "icon": "leaf", "goal": 1, "metric": "co2"},
    {"id": "co2_5", "name": "Guardián verde", "desc": "Evita 5 kg de CO₂", "icon": "earth", "goal": 5, "metric": "co2"},
    {"id": "electric", "name": "Chispa eléctrica", "desc": "Usa una bici eléctrica", "icon": "flash", "goal": 1, "metric": "electric"},
]


@api_router.get("/achievements")
async def achievements(user: dict = Depends(get_current_user)):
    rides = await db.rides.find({"user_id": user["id"], "status": "completed"}).to_list(100000)
    stats = {
        "rides": len(rides),
        "km": round(sum(r.get("distance_km", 0) for r in rides), 2),
        "co2": round(sum(r.get("co2_saved_kg", 0) for r in rides), 2),
        "electric": sum(1 for r in rides if r.get("bike_type") == "electric"),
    }
    result = []
    for a in ACHIEVEMENTS:
        current = stats.get(a["metric"], 0)
        result.append({
            "id": a["id"],
            "name": a["name"],
            "desc": a["desc"],
            "icon": a["icon"],
            "goal": a["goal"],
            "progress": min(current, a["goal"]),
            "current": current,
            "unlocked": current >= a["goal"],
        })
    unlocked = sum(1 for r in result if r["unlocked"])
    return {"achievements": result, "unlocked": unlocked, "total": len(result)}


@api_router.get("/")
async def root():
    return {"message": "BiciValera API", "city": "Valera, Estado Trujillo"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_seed():
    await seed_data()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
