# Sourcelander Backend

Backend API built with Strapi for the Sourcelander freelancer marketplace.

## Requirements

- Node.js >= 18.x
- Google Chrome (for Puppeteer scraping)

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

### Development (.env)

```env
HOST=0.0.0.0
PORT=1337
APP_KEYS=your-app-keys
API_TOKEN_SALT=your-token-salt
ADMIN_JWT_SECRET=your-admin-jwt-secret
JWT_SECRET=your-jwt-secret
TRANSFER_TOKEN_SALT=your-transfer-token-salt
```

### Production (additional variables)

```env
NODE_ENV=production
DATABASE_CLIENT=postgres
DATABASE_HOST=your-db-host
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=your-password
ENCRYPTION_KEY=your-encryption-key
URL=https://your-domain.com/
```

## Strapi Admin Permissions

After first run, configure permissions in **Settings > Users & Permissions > Roles > Public/Authenticated**:

### Required Public/Authenticated Permissions

| Content Type        | Actions           |
| ------------------- | ----------------- |
| `Search`            | `find`            |
| `Cached-freelancer` | `find`, `findOne` |
| `Email`             | `send`            |

## API Endpoints

| Method | Endpoint                                 | Description        |
| ------ | ---------------------------------------- | ------------------ |
| `GET`  | `/api/search/freelancers?query=X&page=1` | Search freelancers |
| `POST` | `/api/email/send`                        | Send contact email |
| `POST` | `/api/email/send-bulk`                   | Send bulk emails   |

## Scraping System

### Bootstrap Scraping

On server start, scrapes **8 pages** from Workana + Hubstaff for predefined queries:

- javascript, react, python, nodejs, web-development, mobile-development, design, ui-ux

### Weekly Cron

Every **Monday at 6 AM**, rescans all queries with 3 pages each.

### On-Demand

When a user searches a new query not in cache, scrapes 4 pages on the fly.

## Scripts

```bash
npm run dev      # Development with auto-reload
npm run build    # Build for production
npm run start    # Start production server
```
