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
- apps: backend, worker, kafka-service, chart-service, logo-service
- tools: prometheus, grafana, jenkins

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
