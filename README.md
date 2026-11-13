# Procurement & Tender Bidding Platform

## Overview

A monorepo foundation for an independent web application and REST API. Product requirements and planned capabilities are documented in [Project-overview.md](Project-overview.md).

## Architecture

- `apps/web`: Next.js 15, TypeScript, Tailwind CSS, and shadcn/ui.
- `apps/api`: NestJS REST API with Clean Architecture boundaries, PostgreSQL, Prisma, and backend-managed JWT authentication and RBAC.
- `apps/mobile`: reserved for a future React Native / Expo client consuming the same API.
- `packages/shared-types`: shared TypeScript contracts.
- `packages/shared-validation`: shared Zod schemas where appropriate.
- `packages/config`: shared TypeScript and development configuration.
- `infrastructure`: reserved for deployment and infrastructure configuration.
- `docs`: architecture and technical documentation.

The API is the only application responsible for authentication, authorization, business rules, and database access. The web and future mobile clients communicate with it over REST.

## Repository Layout

```text
apps/
	web/                 Next.js frontend
	api/                 NestJS backend
	mobile/              Reserved for future Expo app
packages/
	shared-types/        Cross-application TypeScript types
	shared-validation/   Shared Zod schemas
	config/              Shared development configuration
infrastructure/        Deployment and infrastructure configuration
docs/                  Architecture and technical documentation
```

## Development

This repository currently contains structure and configuration only. No application functionality, Prisma schema, or database migrations have been added. Workspace commands and local setup instructions will be documented as implementation begins.

Use the empty variable names in `.env.example` as a reference for local environment configuration. Keep secrets in local, ignored environment files and never commit them.

## Collaboration

Use feature branches and pull requests. Coordinate REST contracts and shared package changes between the frontend and backend developers. The API owns business rules, authorization, and persistence; web and mobile clients consume its public REST contract.

## Project Status

Architecture and project structure. Implementation has not started.