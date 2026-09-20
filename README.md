# AI Customer Support Agent

This repository is a portfolio-quality full-stack support platform that combines PostgreSQL-backed operations, JWT-based admin access, and AI-assisted triage for customer service teams.

The project is designed to model an operational support workflow without inventing fake clients, production metrics, or unsupported claims. It demonstrates the architecture and implementation patterns behind a practical AI customer support system.

## Problem addressed

Support teams need to:

- manage customer records and cases
- review incoming conversations with urgency and context
- classify issues by intent and priority
- retrieve relevant knowledge articles
- draft a high-quality support response quickly
- monitor workload from a dashboard

This application provides a working monorepo scaffold to handle those tasks with a backend API, a PostgreSQL database, and a professional web dashboard.

## Implemented features

- PostgreSQL schema for admins, customers, conversations, messages, knowledge articles, and audit logs
- secure admin authentication with password hashing and JWT validation
- protected API routes with admin/manager/agent role checks
- customer and conversation management endpoints
- knowledge-base listing, search, updates, and deletion
- dashboard summary endpoint for active workloads
- AI intent classification and urgency detection with fallback logic when OpenAI is unavailable
- AI-assisted response drafting grounded in knowledge content
- Next.js dashboard UI for a support operations workspace
- Docker Compose setup for running PostgreSQL locally
- meaningful tests for the support AI workflow

## Architecture

- Frontend: Next.js + React + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL with pgcrypto, indexes, and seeded admin account
- Shared package: interface and type definitions used across apps
- AI layer: OpenAI-compatible chat completions with deterministic local fallback behavior

## AI workflow

The application uses AI for meaningful support tasks:

1. classify the incoming customer message intent
2. detect urgency and priority
3. retrieve knowledge articles relevant to the issue
4. draft a suggested response that can be reviewed before sending

If an API key is not configured, the system still returns reasonable fallback classifications and response text so the core workflow remains functional in local development.

## Database overview

The main PostgreSQL tables are:

- admins
- customers
- conversations
- conversation_messages
- knowledge_articles
- audit_logs

The startup flow creates the schema automatically and inserts a default admin when missing.

## API overview

Key routes include:

- POST /api/auth/login
- GET /api/auth/me
- GET /api/customers
- POST /api/customers
- GET /api/conversations
- POST /api/conversations
- GET /api/conversations/:id/messages
- POST /api/conversations/:id/messages
- PATCH /api/conversations/:id/status
- GET /api/knowledge
- POST /api/knowledge
- PATCH /api/knowledge/:id
- DELETE /api/knowledge/:id
- GET /api/dashboard/summary
- POST /api/ai/classify-intent
- POST /api/ai/detect-priority
- POST /api/ai/generate-response

## Security notes

- secrets are kept in environment variables
- passwords are hashed with bcrypt
- JWTs are validated on protected routes
- no secret values are committed into the repository
- request validation uses Zod schemas before persistence or AI processing

## Environment variables

Copy .env.example to a local .env file and adjust values for your environment.

```bash
cp .env.example .env
```

Required settings include:

- NEXT_PUBLIC_APP_NAME
- NEXT_PUBLIC_API_URL
- API_PORT
- DATABASE_URL
- OPENAI_API_KEY
- OPENAI_MODEL
- JWT_SECRET
- JWT_EXPIRES_IN
- SEED_ADMIN_EMAIL
- SEED_ADMIN_PASSWORD

## Local development

```bash
npm install
npm run typecheck
npm run lint
npm run test
npm run build
npm run dev:web
npm run dev:api
```

Alternatively, bring up PostgreSQL through Docker:

```bash
docker compose up --build
```

## Testing

The project includes automated tests for the core AI workflow:

- intent classification
- urgency detection
- response drafting

These tests validate the real support logic instead of mock-only behavior.

## Project structure

```text
ai-customer-support-agent/
├── apps/
│   ├── api/
│   │   └── src/
│   └── web/
│       └── app/
├── packages/
│   └── shared/
├── tests/
├── .env.example
├── .gitignore
├── docker-compose.yml
├── LICENSE
├── package.json
├── README.md
├── tsconfig.base.json
├── tsconfig.json
└── ...
```

## Future improvements

- database migration tooling and seed management
- more advanced vector search for knowledge retrieval
- richer analytics views for support teams
- end-to-end UI flows and admin management screens
- stronger observation and audit controls across AI actions

## License

This project is licensed under the MIT License.
