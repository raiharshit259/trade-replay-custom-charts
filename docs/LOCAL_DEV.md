# Local Development

This repository supports a self-contained local stack with Docker Compose profiles.

## Prerequisites

- Docker Desktop running
- Node.js and npm installed

## Environment Files

Required files at repository root:

- .env
- .env.secrets

Validation command:

```bash
npm run env:check
```

## Service Groups

Compose profiles are grouped as:

- infra: mongodb, redis, kafka
- apps: backend, worker, kafka-service, chart-service
- logo: logo-service
- tools: prometheus, grafana, jenkins

## Logo Service Modes

Backend logo behavior is controlled by:

- LOGO_SERVICE_ENABLED=true|false
- LOGO_SERVICE_MODE=local|remote|disabled
- LOGO_SERVICE_URL=<remote logo service base URL>

Recommended for chart-engine local development:

- LOGO_SERVICE_ENABLED=true
- LOGO_SERVICE_MODE=remote
- LOGO_SERVICE_URL set in .env.secrets to the production logo-service URL

If you want logo features fully off locally:

- LOGO_SERVICE_ENABLED=false
- LOGO_SERVICE_MODE=disabled

## Start Commands

Start only infra services:

```bash
npm run dev:infra
```

Start observability and CI tools:

```bash
npm run dev:tools
```

Start local app stack (without logo-service):

```bash
npm run dev:up
```

Start local app stack with logo-service:

```bash
npm run dev:up:full
```

The `dev:up` command does not start logo-service. `dev:up:full` starts it explicitly via the `logo` profile.

## Stop and Reset

Stop all containers:

```bash
npm run dev:down
```

Stop and wipe local volumes:

```bash
npm run dev:reset
```

Stream service logs:

```bash
npm run dev:logs
```

## Local Endpoints

- Backend health: http://localhost:4000/api/health
- Chart service health: http://localhost:4010/api/health
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001
- Jenkins: http://localhost:8081

## Verification Flow

```bash
npm run env:check
npm run dev:up
npm run typecheck
npm run build
npm run test:e2e
```
