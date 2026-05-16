# CareDesk - 接骨院向け管理システム

接骨院・整骨院の予約・患者・請求・施術記録をワンストップで管理するSaaSシステムです。

- **フロントエンド**: React + Vite + Tailwind CSS
- **バックエンド**: Python FastAPI (OCI サーバー上)
- **データベース**: Oracle Autonomous Database
- **認証**: JWT トークンベース
- **課金**: Stripe 月額 ¥3,000/月

---

## ディレクトリ構成

```
caredesk/
├── src/                    # フロントエンド (React)
│   ├── api/
│   │   └── base44Client.js # 独自 fetch ベースの API クライアント
│   ├── lib/
│   │   ├── AuthContext.jsx # JWT 認証コンテキスト
│   │   └── app-params.js   # 環境変数ラッパー
│   ├── pages/              # 各ページコンポーネント
│   └── components/         # 再利用可能コンポーネント
├── backend/
│   ├── main.py             # FastAPI アプリケーション
│   ├── requirements.txt    # Python 依存関係
│   └── sql/
│       └── schema.sql      # Oracle DB スキーマ
├── entities/               # エンティティ定義 (JSON Schema)
├── .env.example            # 環境変数サンプル
└── README.md
```

---

## 環境構築手順

### 1. 前提条件

- Node.js 20 以上
- Python 3.11 以上
- Oracle Autonomous Database (ATP) インスタンス

### 2. リポジトリのクローン

```bash
git clone https://github.com/your-org/caredesk.git
cd caredesk
```

### 3. 環境変数の設定

```bash
cp .env.example .env
# .env を編集して実際の値を設定する
```

**設定が必要な変数:**

| 変数名 | 説明 |
|--------|------|
| `VITE_API_BASE_URL` | バックエンドAPI URL (本番: `https://api.caredesk.jp`) |
| `ORACLE_USER` | Oracle DB ユーザー名 |
| `ORACLE_PASSWORD` | Oracle DB パスワード |
| `ORACLE_DSN` | Oracle DB 接続文字列 (`host/service_name`) |
| `JWT_SECRET_KEY` | JWT 署名キー (32文字以上のランダム文字列) |
| `STRIPE_SECRET_KEY` | Stripe シークレットキー |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook シークレット |

### 4. データベースのセットアップ

Oracle Autonomous Database の SQL Worksheet または SQLcl で実行:

```bash
# backend/sql/schema.sql の内容を Oracle SQL Worksheet で実行
```

スーパー管理者アカウントの作成（schema.sql 末尾のコメントを参照）:

```bash
cd backend
python - <<'EOF'
from passlib.context import CryptContext
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
print(pwd.hash("your_admin_password_here"))
EOF
```

生成されたハッシュを使って INSERT 文を実行します。

### 5. バックエンドの起動

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API ドキュメント: http://localhost:8000/docs

### 6. フロントエンドの起動

```bash
# プロジェクトルートで
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開きます。

---

## 本番デプロイ (OCI + caredesk.jp)

### バックエンド (OCI Compute)

```ini
# /etc/systemd/system/caredesk-api.service
[Unit]
Description=CareDesk FastAPI Backend
After=network.target

[Service]
User=opc
WorkingDirectory=/home/opc/caredesk/backend
EnvironmentFile=/home/opc/caredesk/.env
ExecStart=/home/opc/caredesk/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable caredesk-api
sudo systemctl start caredesk-api
```

### フロントエンド (静的ファイル配信)

```bash
VITE_API_BASE_URL=https://api.caredesk.jp npm run build
# dist/ ディレクトリを nginx または OCI Object Storage で配信
```

nginx 設定例 (`/etc/nginx/conf.d/caredesk.conf`):

```nginx
server {
    listen 443 ssl;
    server_name caredesk.jp;
    root /var/www/caredesk/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Stripe 月額課金の設定

1. Stripe ダッシュボードで ¥3,000/月の Price を作成
2. `STRIPE_PRICE_ID` に Price ID を設定
3. Webhook エンドポイント `https://api.caredesk.jp/api/stripe/webhook` を登録
4. Webhook イベント: `customer.subscription.updated`, `customer.subscription.deleted`

---

## API エンドポイント一覧

| メソッド | パス | 説明 |
|--------|------|------|
| POST | `/api/auth/login` | ログイン (JWT 取得) |
| GET  | `/api/auth/me` | ログイン中ユーザー情報 |
| POST | `/api/auth/register` | 院登録 + アカウント作成 |
| GET  | `/api/{entity}` | 一覧取得 (sort, limit 対応) |
| GET  | `/api/{entity}/{id}` | 1件取得 |
| POST | `/api/{entity}` | 作成 |
| PUT  | `/api/{entity}/{id}` | 更新 |
| DELETE | `/api/{entity}/{id}` | 削除 |
| GET  | `/api/public/clinics/{slug}` | 公開: 院情報 (認証不要) |
| POST | `/api/public/appointments` | 公開: 予約作成 (認証不要) |
| POST | `/api/stripe/webhook` | Stripe webhook |

`{entity}` には `clinics`, `patients`, `appointments`, `staff`, `treatment-records`, `courses`, `invoices`, `reviews` が指定可能。

---

## マルチテナント設計

- 各エンティティに `clinic_id` カラムを持ちデータを院ごとに分離
- JWT トークンに `clinic_id` を埋め込み、API 側で自動フィルタリング
- スーパー管理者 (`is_super_admin=1`) のみ全院データにアクセス可能
- `/super-admin` 画面は全院統計を表示

---

## 開発メモ

### フロントエンド API クライアント

`src/api/base44Client.js` の `base44` オブジェクトを各ページで使用:

```js
import { base44 } from '@/api/base44Client';

// 一覧取得
base44.entities.Patient.list("-created_date")

// フィルター
base44.entities.Appointment.filter({ clinic_id })

// 作成
base44.entities.Invoice.create(data)

// 更新
base44.entities.Clinic.update(id, data)
```

### 認証フロー

1. `/login` でメール/パスワードを入力
2. `POST /api/auth/login` → JWT トークンを `localStorage` に保存
3. 以降のリクエストに `Authorization: Bearer <token>` を自動付与
4. ページリロード時は `GET /api/auth/me` でトークンを検証
5. ログアウト時は `localStorage` からトークンを削除
