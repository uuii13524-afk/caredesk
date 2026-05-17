"""
CareDesk FastAPI Backend
接骨院向け管理システム - Oracle Autonomous Database対応
"""

import os
import uuid
from datetime import datetime, timedelta
from typing import Optional, Any

import oracledb
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

load_dotenv()

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(title="CareDesk API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-secret-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", 60 * 24 * 7))  # 1 week

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ---------------------------------------------------------------------------
# Oracle DB
# ---------------------------------------------------------------------------

def get_db():
    """Oracle Autonomous Database connection (thin mode - no client needed)."""
    conn = oracledb.connect(
        user=os.getenv("ORACLE_USER"),
        password=os.getenv("ORACLE_PASSWORD"),
        dsn=os.getenv("ORACLE_DSN"),
        config_dir=os.getenv("ORACLE_WALLET_DIR"),
        wallet_location=os.getenv("ORACLE_WALLET_DIR"),
        wallet_password=os.getenv("ORACLE_WALLET_PASSWORD"),
    )
    try:
        yield conn
    finally:
        conn.close()


def _convert_val(val):
    """Convert Oracle LOB objects and other special types to Python primitives."""
    if val is None:
        return val
    if hasattr(val, "read"):
        return val.read()
    return val


def row_to_dict(cursor, row) -> dict:
    cols = [col[0].lower() for col in cursor.description]
    return {col: _convert_val(val) for col, val in zip(cols, row)}


def rows_to_list(cursor, rows) -> list[dict]:
    if not rows:
        return []
    cols = [col[0].lower() for col in cursor.description]
    return [{col: _convert_val(val) for col, val in zip(cols, row)} for row in rows]


def new_id() -> str:
    return str(uuid.uuid4())


def now_str() -> str:
    return datetime.utcnow().isoformat()

# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="認証が必要です",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise exc
        return {
            "id": user_id,
            "clinic_id": payload.get("clinic_id"),
            "role": payload.get("role", "admin"),
            "is_super_admin": payload.get("is_super_admin", False),
        }
    except JWTError:
        raise exc

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterUserRequest(BaseModel):
    email: str
    password: str
    clinic_name: str
    slug: str
    phone: Optional[str] = None
    address: Optional[str] = None

# ---------------------------------------------------------------------------
# AUTH endpoints
# ---------------------------------------------------------------------------

@app.post("/api/auth/login", response_model=TokenResponse)
def login(req: LoginRequest, db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute(
        "SELECT id, password_hash, clinic_id, role, is_super_admin "
        "FROM caredesk_users WHERE email = :1",
        [req.email],
    )
    row = cursor.fetchone()
    if not row or not pwd_context.verify(req.password, row[1]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません",
        )
    user_id, _, clinic_id, role, is_super_admin = row
    token = create_access_token({
        "sub": str(user_id),
        "clinic_id": str(clinic_id) if clinic_id else None,
        "role": role or "admin",
        "is_super_admin": bool(is_super_admin),
    })
    return {"access_token": token, "token_type": "bearer"}


@app.get("/api/auth/me")
def get_me(current_user=Depends(get_current_user), db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute(
        "SELECT id, email, role, clinic_id, is_super_admin, created_date "
        "FROM caredesk_users WHERE id = :1",
        [current_user["id"]],
    )
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
    return row_to_dict(cursor, row)


@app.post("/api/auth/register", status_code=201)
def register(req: RegisterUserRequest, db=Depends(get_db)):
    """新規院登録 + オーナーアカウント作成"""
    cursor = db.cursor()

    # Email uniqueness check
    cursor.execute("SELECT id FROM caredesk_users WHERE email = :1", [req.email])
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="このメールアドレスは既に使用されています")

    # Slug uniqueness check
    cursor.execute("SELECT id FROM caredesk_clinics WHERE slug = :1", [req.slug])
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="このURLスラッグは既に使用されています")

    clinic_id = new_id()
    user_id = new_id()
    trial_end = (datetime.utcnow() + timedelta(days=30)).strftime("%Y-%m-%d")
    hashed = pwd_context.hash(req.password)
    now = now_str()

    cursor.execute(
        """INSERT INTO caredesk_clinics
           (id, name, slug, owner_email, phone, address,
            subscription_status, trial_end_date, monthly_fee, created_date)
           VALUES (:1,:2,:3,:4,:5,:6,'trial',:7,3000,:8)""",
        [clinic_id, req.clinic_name, req.slug, req.email,
         req.phone, req.address, trial_end, now],
    )
    cursor.execute(
        """INSERT INTO caredesk_users
           (id, email, password_hash, clinic_id, role, is_super_admin, created_date)
           VALUES (:1,:2,:3,:4,'admin',0,:5)""",
        [user_id, req.email, hashed, clinic_id, now],
    )
    db.commit()

    token = create_access_token({
        "sub": user_id,
        "clinic_id": clinic_id,
        "role": "admin",
        "is_super_admin": False,
    })
    return {"access_token": token, "token_type": "bearer", "clinic_id": clinic_id}

# ---------------------------------------------------------------------------
# Generic CRUD helpers
# ---------------------------------------------------------------------------

# Table mapping: API path segment → Oracle table name
ENTITY_TABLES: dict[str, str] = {
    "clinics":            "caredesk_clinics",
    "patients":           "caredesk_patients",
    "appointments":       "caredesk_appointments",
    "staff":              "caredesk_staff",
    "treatment-records":  "caredesk_treatment_records",
    "courses":            "caredesk_courses",
    "invoices":           "caredesk_invoices",
    "reviews":            "caredesk_reviews",
}

# Tenant-scoped entities (auto-filter by clinic_id)
TENANT_ENTITIES = {
    "patients", "appointments", "staff",
    "treatment-records", "courses", "invoices", "reviews",
}

# Allowed sort columns per entity (whitelist to prevent SQL injection)
ALLOWED_SORT_COLS: dict[str, set[str]] = {
    "clinics":           {"created_date", "name"},
    "patients":          {"created_date", "name", "last_visit_date"},
    "appointments":      {"appointment_date", "created_date"},
    "staff":             {"created_date", "name"},
    "treatment-records": {"record_date", "created_date"},
    "courses":           {"created_date", "purchase_date"},
    "invoices":          {"invoice_date", "created_date"},
    "reviews":           {"review_date", "created_date"},
}

# Allowed filter params per entity (whitelist)
ALLOWED_FILTERS: dict[str, set[str]] = {
    "clinics":           {"slug", "id", "subscription_status"},
    "patients":          {"clinic_id", "is_lapsed"},
    "appointments":      {"clinic_id", "patient_id", "appointment_date", "status"},
    "staff":             {"clinic_id", "is_active", "role"},
    "treatment-records": {"clinic_id", "patient_id", "record_date"},
    "courses":           {"clinic_id", "patient_id", "status"},
    "invoices":          {"clinic_id", "patient_id", "payment_status"},
    "reviews":           {"clinic_id", "staff_id"},
}


def _resolve_table(entity: str) -> str:
    if entity not in ENTITY_TABLES:
        raise HTTPException(status_code=404, detail=f"エンティティ '{entity}' は存在しません")
    return ENTITY_TABLES[entity]


def _tenant_clause(entity: str, current_user: dict) -> tuple[str, list]:
    """Returns (WHERE clause fragment, params) for tenant isolation."""
    if current_user.get("is_super_admin"):
        return "", []
    clinic_id = current_user.get("clinic_id")
    if not clinic_id:
        return "1=0", []  # no access
    if entity in TENANT_ENTITIES:
        return "clinic_id = :tenant_clinic_id", [clinic_id]
    if entity == "clinics":
        return "id = :tenant_clinic_id", [clinic_id]
    return "", []


def _build_order(entity: str, sort_param: Optional[str]) -> str:
    if not sort_param:
        return "ORDER BY created_date DESC"
    descending = sort_param.startswith("-")
    col = sort_param.lstrip("-").lower()
    allowed = ALLOWED_SORT_COLS.get(entity, set())
    if col not in allowed:
        col = "created_date"
    direction = "DESC" if descending else "ASC"
    return f"ORDER BY {col} {direction}"

# ---------------------------------------------------------------------------
# Entity list / filter
# ---------------------------------------------------------------------------

@app.get("/api/{entity}")
def list_or_filter(
    entity: str,
    request: Request,
    sort: Optional[str] = Query(None),
    limit: Optional[int] = Query(None, ge=1, le=5000),
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    table = _resolve_table(entity)
    cursor = db.cursor()

    where_parts: list[str] = []
    params: list[Any] = []

    # Tenant isolation
    tenant_clause, tenant_params = _tenant_clause(entity, current_user)
    if tenant_clause:
        where_parts.append(tenant_clause)
        params.extend(tenant_params)

    # Extra filter params from query string
    allowed_filters = ALLOWED_FILTERS.get(entity, set())
    for key, value in request.query_params.items():
        if key in ("sort", "limit"):
            continue
        if key in allowed_filters and value:
            placeholder = f":filter_{key}"
            where_parts.append(f"{key} = {placeholder}")
            params.append(value)

    where_sql = f"WHERE {' AND '.join(where_parts)}" if where_parts else ""
    order_sql = _build_order(entity, sort)
    limit_sql = f"FETCH FIRST {limit} ROWS ONLY" if limit else ""

    sql = f"SELECT * FROM {table} {where_sql} {order_sql} {limit_sql}"
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    return rows_to_list(cursor, rows)

# ---------------------------------------------------------------------------
# Entity get by ID
# ---------------------------------------------------------------------------

@app.get("/api/{entity}/{item_id}")
def get_entity(
    entity: str,
    item_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    table = _resolve_table(entity)
    cursor = db.cursor()

    where_parts = ["id = :item_id"]
    params: list[Any] = [item_id]

    tenant_clause, tenant_params = _tenant_clause(entity, current_user)
    if tenant_clause:
        where_parts.append(tenant_clause)
        params.extend(tenant_params)

    sql = f"SELECT * FROM {table} WHERE {' AND '.join(where_parts)}"
    cursor.execute(sql, params)
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="レコードが見つかりません")
    return row_to_dict(cursor, row)

# ---------------------------------------------------------------------------
# Entity create
# ---------------------------------------------------------------------------

@app.post("/api/{entity}", status_code=201)
def create_entity(
    entity: str,
    payload: dict,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    table = _resolve_table(entity)
    cursor = db.cursor()

    # Inject tenant clinic_id if entity is tenant-scoped
    if entity in TENANT_ENTITIES and "clinic_id" not in payload:
        payload["clinic_id"] = current_user.get("clinic_id")

    payload["id"] = new_id()
    payload["created_date"] = now_str()

    cols = ", ".join(payload.keys())
    placeholders = ", ".join(f":{k}" for k in payload.keys())
    sql = f"INSERT INTO {table} ({cols}) VALUES ({placeholders})"

    cursor.execute(sql, payload)
    db.commit()

    # Return the created record
    cursor.execute(f"SELECT * FROM {table} WHERE id = :id", {"id": payload["id"]})
    row = cursor.fetchone()
    return row_to_dict(cursor, row)

# ---------------------------------------------------------------------------
# Entity update
# ---------------------------------------------------------------------------

@app.put("/api/{entity}/{item_id}")
def update_entity(
    entity: str,
    item_id: str,
    payload: dict,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    table = _resolve_table(entity)
    cursor = db.cursor()

    # Verify record exists and belongs to this tenant
    where_parts = ["id = :check_id"]
    check_params: list[Any] = [item_id]
    tenant_clause, tenant_params = _tenant_clause(entity, current_user)
    if tenant_clause:
        where_parts.append(tenant_clause)
        check_params.extend(tenant_params)

    cursor.execute(
        f"SELECT id FROM {table} WHERE {' AND '.join(where_parts)}",
        check_params,
    )
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="レコードが見つかりません")

    # Remove immutable fields
    for immutable in ("id", "clinic_id", "created_date"):
        payload.pop(immutable, None)

    payload["updated_date"] = now_str()

    set_clause = ", ".join(f"{k} = :{k}" for k in payload.keys())
    payload["_id"] = item_id
    sql = f"UPDATE {table} SET {set_clause} WHERE id = :_id"

    cursor.execute(sql, payload)
    db.commit()

    # Return updated record
    cursor.execute(f"SELECT * FROM {table} WHERE id = :id", {"id": item_id})
    row = cursor.fetchone()
    return row_to_dict(cursor, row)

# ---------------------------------------------------------------------------
# Entity delete
# ---------------------------------------------------------------------------

@app.delete("/api/{entity}/{item_id}", status_code=204)
def delete_entity(
    entity: str,
    item_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    table = _resolve_table(entity)
    cursor = db.cursor()

    where_parts = ["id = :item_id"]
    params: list[Any] = [item_id]
    tenant_clause, tenant_params = _tenant_clause(entity, current_user)
    if tenant_clause:
        where_parts.append(tenant_clause)
        params.extend(tenant_params)

    cursor.execute(
        f"SELECT id FROM {table} WHERE {' AND '.join(where_parts)}", params
    )
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="レコードが見つかりません")

    cursor.execute(f"DELETE FROM {table} WHERE id = :id", {"id": item_id})
    db.commit()

# ---------------------------------------------------------------------------
# Public endpoint: clinic lookup by slug (for online booking - no auth needed)
# ---------------------------------------------------------------------------

@app.get("/api/public/clinics/{slug}")
def get_public_clinic(slug: str, db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute(
        "SELECT id, name, slug, address, phone, business_hours, treatment_menu "
        "FROM caredesk_clinics WHERE slug = :1",
        [slug],
    )
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="院が見つかりません")
    return row_to_dict(cursor, row)


@app.get("/api/public/clinics/{slug}/appointments")
def get_public_appointments(slug: str, db=Depends(get_db)):
    """公開予約ページ用: 空き時間確認"""
    cursor = db.cursor()
    cursor.execute("SELECT id FROM caredesk_clinics WHERE slug = :1", [slug])
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="院が見つかりません")
    clinic_id = row[0]

    cursor.execute(
        "SELECT appointment_date, appointment_time, status FROM caredesk_appointments "
        "WHERE clinic_id = :1 AND status != 'cancelled' "
        "ORDER BY appointment_date, appointment_time",
        [clinic_id],
    )
    rows = cursor.fetchall()
    return rows_to_list(cursor, rows)


@app.post("/api/public/appointments", status_code=201)
def create_public_appointment(payload: dict, db=Depends(get_db)):
    """公開予約フォームから予約を作成（認証不要）"""
    required = ("clinic_id", "patient_name", "appointment_date", "appointment_time", "treatment_type")
    for field in required:
        if field not in payload:
            raise HTTPException(status_code=422, detail=f"{field} は必須です")

    cursor = db.cursor()
    cursor.execute(
        "SELECT id FROM caredesk_clinics WHERE id = :1", [payload["clinic_id"]]
    )
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="院が見つかりません")

    payload["id"] = new_id()
    payload.setdefault("status", "confirmed")
    payload["created_date"] = now_str()

    cols = ", ".join(payload.keys())
    placeholders = ", ".join(f":{k}" for k in payload.keys())
    cursor.execute(
        f"INSERT INTO caredesk_appointments ({cols}) VALUES ({placeholders})", payload
    )
    db.commit()
    return {"id": payload["id"], "status": payload["status"]}

# ---------------------------------------------------------------------------
# Stripe webhook (月額課金)
# ---------------------------------------------------------------------------

@app.post("/api/stripe/webhook")
async def stripe_webhook(request: Request, db=Depends(get_db)):
    """Stripe webhookでサブスクリプションステータスを更新"""
    import stripe  # pip install stripe

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event_type = event["type"]

    if event_type == "customer.subscription.updated":
        sub = event["data"]["object"]
        customer_id = sub["customer"]
        new_status = "active" if sub["status"] == "active" else "suspended"
        cursor = db.cursor()
        cursor.execute(
            "UPDATE caredesk_clinics SET subscription_status = :1, "
            "stripe_customer_id = :2 WHERE stripe_customer_id = :3",
            [new_status, customer_id, customer_id],
        )
        db.commit()

    elif event_type == "customer.subscription.deleted":
        sub = event["data"]["object"]
        customer_id = sub["customer"]
        cursor = db.cursor()
        cursor.execute(
            "UPDATE caredesk_clinics SET subscription_status = 'cancelled' "
            "WHERE stripe_customer_id = :1",
            [customer_id],
        )
        db.commit()

    return {"received": True}

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "CareDesk API"}

# Static assets
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os as _os

app.mount("/assets", StaticFiles(directory=_os.path.join(_os.path.dirname(__file__), "../dist/assets")), name="assets")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    index = _os.path.join(_os.path.dirname(__file__), "../dist/index.html")
    if _os.path.exists(index):
        return FileResponse(index)
    raise HTTPException(status_code=404)
