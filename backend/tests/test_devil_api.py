"""Backend tests for DEVIL Portfolio API."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://velocity-engine-kit.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Health ----------
class TestHealth:
    def test_root(self, client):
        r = client.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "DEVIL Portfolio API"
        assert data["status"] == "online"
        assert "time" in data


# ---------- Visit & Online ----------
class TestVisitOnline:
    def test_visit_and_online(self, client):
        vid = f"TEST_{uuid.uuid4().hex[:10]}"
        r = client.post(f"{API}/visit", json={"visitor_id": vid, "path": "/test"})
        assert r.status_code == 200
        body = r.json()
        assert body["ok"] is True
        assert body["visitor_id"] == vid

        r2 = client.get(f"{API}/online")
        assert r2.status_code == 200
        data = r2.json()
        assert "online" in data
        assert isinstance(data["online"], int)
        assert data["online"] >= 1

    def test_visit_default_visitor_id(self, client):
        # omit visitor_id -> server should fingerprint
        r = client.post(f"{API}/visit", json={"path": "/"})
        assert r.status_code == 200
        body = r.json()
        assert body["ok"] is True
        assert isinstance(body["visitor_id"], str)
        assert len(body["visitor_id"]) > 0


# ---------- Stats ----------
class TestStats:
    def test_stats_shape(self, client):
        r = client.get(f"{API}/stats")
        assert r.status_code == 200
        data = r.json()
        for key in [
            "total_visits", "unique_visitors", "online_now",
            "messages", "guestbook_entries", "commands_run", "top_commands",
        ]:
            assert key in data, f"missing {key}"
        assert isinstance(data["top_commands"], list)
        assert data["online_now"] >= 1


# ---------- Contact ----------
class TestContact:
    def test_contact_valid(self, client):
        payload = {
            "name": "TEST_User",
            "email": "test@example.com",
            "message": "Hello from pytest",
        }
        r = client.post(f"{API}/contact", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == payload["name"]
        assert data["email"] == payload["email"]
        assert data["message"] == payload["message"]
        assert "id" in data and isinstance(data["id"], str)
        assert "created_at" in data

    def test_contact_invalid_email(self, client):
        r = client.post(f"{API}/contact", json={
            "name": "x", "email": "not-an-email", "message": "hi"
        })
        assert r.status_code == 422

    def test_contact_missing_fields(self, client):
        r = client.post(f"{API}/contact", json={"name": "only-name"})
        assert r.status_code == 422


# ---------- Guestbook ----------
class TestGuestbook:
    def test_create_and_list(self, client):
        handle = f"TEST_{uuid.uuid4().hex[:6]}"
        msg = "TEST signal"
        r = client.post(f"{API}/guestbook", json={
            "handle": handle, "message": msg, "color": "magenta"
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["handle"] == handle
        assert data["message"] == msg
        assert data["color"] == "magenta"
        assert "id" in data

        # list
        r2 = client.get(f"{API}/guestbook")
        assert r2.status_code == 200
        entries = r2.json()
        assert isinstance(entries, list)
        handles = [e["handle"] for e in entries]
        assert handle in handles
        # newest first: our entry should be within first few entries
        assert entries[0]["created_at"] >= entries[-1]["created_at"]

    def test_guestbook_invalid_color_fallback(self, client):
        r = client.post(f"{API}/guestbook", json={
            "handle": "TEST_color", "message": "hi", "color": "nope"
        })
        assert r.status_code == 200
        assert r.json()["color"] == "cyan"

    def test_guestbook_too_long_message_validation(self, client):
        r = client.post(f"{API}/guestbook", json={
            "handle": "x" * 100, "message": "y" * 500, "color": "cyan"
        })
        # pydantic validator rejects > max_length
        assert r.status_code == 422


# ---------- Terminal ----------
class TestTerminal:
    def test_terminal_log_increments_commands(self, client):
        before = client.get(f"{API}/stats").json()["commands_run"]
        r = client.post(f"{API}/terminal/log", json={"command": "TEST_help"})
        assert r.status_code == 200
        assert r.json()["ok"] is True
        after = client.get(f"{API}/stats").json()["commands_run"]
        assert after == before + 1

    def test_terminal_log_empty_rejected(self, client):
        r = client.post(f"{API}/terminal/log", json={"command": ""})
        assert r.status_code == 422
