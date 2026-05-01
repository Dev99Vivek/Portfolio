from fastapi import FastAPI, APIRouter, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import hashlib
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="DEVIL Portfolio API")
api_router = APIRouter(prefix="/api")


# ---------- Utilities ----------
def now_iso():
    return datetime.now(timezone.utc).isoformat()


def client_fingerprint(req: Request) -> str:
    ip = req.client.host if req.client else "unknown"
    ua = req.headers.get("user-agent", "")
    raw = f"{ip}|{ua}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


# ---------- Models ----------
class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    message: str
    created_at: str = Field(default_factory=now_iso)


class ContactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    message: str = Field(min_length=1, max_length=2000)


class GuestbookEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    handle: str
    message: str
    color: str = "cyan"
    created_at: str = Field(default_factory=now_iso)


class GuestbookCreate(BaseModel):
    handle: str = Field(min_length=1, max_length=32)
    message: str = Field(min_length=1, max_length=240)
    color: Optional[str] = "cyan"


class TerminalLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    command: str
    visitor_id: str
    created_at: str = Field(default_factory=now_iso)


class TerminalLogCreate(BaseModel):
    command: str = Field(min_length=1, max_length=120)


class VisitPing(BaseModel):
    visitor_id: Optional[str] = None
    path: Optional[str] = "/"


class StatsOut(BaseModel):
    total_visits: int
    unique_visitors: int
    online_now: int
    messages: int
    guestbook_entries: int
    commands_run: int
    top_commands: List[dict]


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"name": "DEVIL Portfolio API", "status": "online", "time": now_iso()}


# ---- Contact ----
@api_router.post("/contact", response_model=ContactMessage)
async def create_contact(payload: ContactCreate):
    doc = ContactMessage(**payload.model_dump()).model_dump()
    await db.contact_messages.insert_one(doc.copy())
    return ContactMessage(**doc)


# ---- Guestbook ----
COLORS = {"cyan", "magenta", "violet", "green", "yellow", "red"}


@api_router.post("/guestbook", response_model=GuestbookEntry)
async def create_guest_entry(payload: GuestbookCreate):
    color = payload.color if payload.color in COLORS else "cyan"
    entry = GuestbookEntry(
        handle=payload.handle.strip()[:32],
        message=payload.message.strip()[:240],
        color=color,
    )
    doc = entry.model_dump()
    await db.guestbook.insert_one(doc.copy())
    return entry


@api_router.get("/guestbook", response_model=List[GuestbookEntry])
async def list_guest_entries(limit: int = 50):
    limit = max(1, min(limit, 200))
    docs = await db.guestbook.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return [GuestbookEntry(**d) for d in docs]


# ---- Terminal logs ----
@api_router.post("/terminal/log")
async def log_terminal(payload: TerminalLogCreate, request: Request):
    vid = client_fingerprint(request)
    log = TerminalLog(command=payload.command.strip()[:120], visitor_id=vid)
    await db.terminal_logs.insert_one(log.model_dump().copy())
    return {"ok": True}


# ---- Visits / online ----
@api_router.post("/visit")
async def visit(payload: VisitPing, request: Request):
    vid = payload.visitor_id or client_fingerprint(request)
    now = now_iso()
    doc = {
        "id": str(uuid.uuid4()),
        "visitor_id": vid,
        "path": (payload.path or "/")[:120],
        "created_at": now,
    }
    await db.visits.insert_one(doc.copy())
    # upsert presence (active in last 60s)
    await db.presence.update_one(
        {"visitor_id": vid},
        {"$set": {"visitor_id": vid, "last_seen": now}},
        upsert=True,
    )
    return {"ok": True, "visitor_id": vid}


@api_router.get("/online")
async def online(request: Request):
    cutoff = (datetime.now(timezone.utc) - timedelta(seconds=60)).isoformat()
    count = await db.presence.count_documents({"last_seen": {"$gte": cutoff}})
    return {"online": max(1, count)}


# ---- Stats ----
@api_router.get("/stats", response_model=StatsOut)
async def stats():
    total_visits = await db.visits.count_documents({})
    unique_visitors = len(await db.visits.distinct("visitor_id"))
    cutoff = (datetime.now(timezone.utc) - timedelta(seconds=60)).isoformat()
    online_now = await db.presence.count_documents({"last_seen": {"$gte": cutoff}})
    messages = await db.contact_messages.count_documents({})
    guest_entries = await db.guestbook.count_documents({})
    commands_run = await db.terminal_logs.count_documents({})

    pipeline = [
        {"$group": {"_id": "$command", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
    ]
    top_cmds_docs = await db.terminal_logs.aggregate(pipeline).to_list(5)
    top_commands = [{"command": d["_id"], "count": d["count"]} for d in top_cmds_docs]

    return StatsOut(
        total_visits=total_visits,
        unique_visitors=unique_visitors,
        online_now=max(1, online_now),
        messages=messages,
        guestbook_entries=guest_entries,
        commands_run=commands_run,
        top_commands=top_commands,
    )


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
