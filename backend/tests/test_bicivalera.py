"""BiciValera backend API tests: auth, stations, rides, impact, simulator."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://bike-fleet-monitor.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def new_user(session):
    email = f"TEST_{uuid.uuid4().hex[:8]}@valera.com"
    payload = {"name": "TEST User", "email": email, "password": "test1234"}
    r = session.post(f"{API}/auth/register", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "access_token" in data and "user" in data
    return {"email": email, "password": "test1234", "token": data["access_token"], "id": data["user"]["id"]}


@pytest.fixture(scope="module")
def auth_headers(new_user):
    return {"Authorization": f"Bearer {new_user['token']}"}


# --- Auth ---
def test_register_duplicate(session, new_user):
    r = session.post(f"{API}/auth/register", json={"name": "x", "email": new_user["email"], "password": "test1234"}, timeout=30)
    assert r.status_code == 400


def test_login_ok(session, new_user):
    r = session.post(f"{API}/auth/login", json={"email": new_user["email"], "password": new_user["password"]}, timeout=30)
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_login_bad_password(session, new_user):
    r = session.post(f"{API}/auth/login", json={"email": new_user["email"], "password": "wrong"}, timeout=30)
    assert r.status_code == 401


def test_me_ok(session, auth_headers, new_user):
    r = session.get(f"{API}/auth/me", headers=auth_headers, timeout=30)
    assert r.status_code == 200
    assert r.json()["email"].lower() == new_user["email"].lower()


def test_me_unauth(session):
    r = session.get(f"{API}/auth/me", timeout=30)
    assert r.status_code == 401


# --- Stations ---
def test_stations_list(session):
    r = session.get(f"{API}/stations", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) >= 1
    s0 = data[0]
    for k in ["id", "name", "lat", "lon", "available", "mechanical", "electric"]:
        assert k in s0


def test_station_detail(session):
    stations = session.get(f"{API}/stations", timeout=30).json()
    sid = stations[0]["id"]
    r = session.get(f"{API}/stations/{sid}", timeout=30)
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == sid and "bikes" in body


def test_station_not_found(session):
    r = session.get(f"{API}/stations/{uuid.uuid4()}", timeout=30)
    assert r.status_code == 404


# --- Rides ---
@pytest.fixture(scope="module")
def ride_pair(session):
    stations = session.get(f"{API}/stations", timeout=30).json()
    station = next((s for s in stations if s["available"] > 0), None)
    assert station, "no station with bikes"
    detail = session.get(f"{API}/stations/{station['id']}", timeout=30).json()
    return station["id"], detail["bikes"][0]["id"]


def test_rides_flow(session, auth_headers, ride_pair, new_user):
    station_id, bike_id = ride_pair
    # No active ride yet
    r = session.get(f"{API}/rides/active", headers=auth_headers, timeout=30)
    assert r.status_code == 200
    assert r.json() is None

    # Start ride
    r = session.post(f"{API}/rides/start", headers=auth_headers, json={"station_id": station_id, "bike_id": bike_id}, timeout=30)
    assert r.status_code == 200, r.text
    ride = r.json()
    assert ride["status"] == "active" and "_id" not in ride
    ride_id = ride["id"]

    # Second start should fail
    r2 = session.post(f"{API}/rides/start", headers=auth_headers, json={"station_id": station_id, "bike_id": bike_id}, timeout=30)
    assert r2.status_code == 400

    # Active present
    r = session.get(f"{API}/rides/active", headers=auth_headers, timeout=30)
    assert r.status_code == 200 and r.json()["id"] == ride_id

    # End ride
    r = session.post(f"{API}/rides/{ride_id}/end", headers=auth_headers, timeout=30)
    assert r.status_code == 200
    ended = r.json()
    assert ended["status"] == "completed"
    assert ended["distance_km"] > 0
    assert ended["co2_saved_kg"] > 0
    assert "_id" not in ended

    # End again -> 400
    r = session.post(f"{API}/rides/{ride_id}/end", headers=auth_headers, timeout=30)
    assert r.status_code == 400

    # History contains ride
    r = session.get(f"{API}/rides", headers=auth_headers, timeout=30)
    assert r.status_code == 200
    ids = [x["id"] for x in r.json()]
    assert ride_id in ids


def test_start_ride_invalid_bike(session, auth_headers, ride_pair):
    station_id, _ = ride_pair
    r = session.post(f"{API}/rides/start", headers=auth_headers, json={"station_id": station_id, "bike_id": str(uuid.uuid4())}, timeout=30)
    assert r.status_code == 400


# --- Impact / Simulator ---
def test_impact(session, auth_headers):
    r = session.get(f"{API}/impact", headers=auth_headers, timeout=30)
    assert r.status_code == 200
    body = r.json()
    assert body["user"]["rides"] >= 1
    assert body["user"]["co2_saved_kg"] > 0
    assert body["city"]["rides"] > 0
    assert body["city"]["distance_km"] > 0


def test_simulator(session):
    r = session.get(f"{API}/simulator", timeout=30)
    assert r.status_code == 200
    body = r.json()
    for k in ["total_bikes", "available", "in_use", "mechanical", "electric", "active_rides", "stations", "users", "moving_bikes", "timestamp"]:
        assert k in body
    assert body["total_bikes"] > 0
    assert body["stations"] > 0
