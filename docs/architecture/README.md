# Architecture

The repository is an npm-workspaces monorepo containing independent web and API applications. The future mobile client will use the same REST API.

## Applications

- `apps/web` is the Next.js presentation client. It must not access the database directly or own authorization rules.
- `apps/api` is the NestJS REST API and the sole owner of authentication, authorization, business rules, and persistence.
- `apps/mobile` is reserved for a future React Native / Expo client.

## API Layers

- `domain`: business entities, value objects, repository contracts, and domain services. Keep this layer independent of NestJS and Prisma.
- `application`: use cases, application ports, and application DTOs. Coordinate domain behavior through interfaces.
- `infrastructure`: Prisma persistence adapters and implementations for external concerns such as JWT authentication.
- `presentation`: REST controllers, guards, decorators, and HTTP DTOs. Translate HTTP requests into application use cases.

Dependencies should point inward: presentation and infrastructure may depend on application and domain abstractions; domain should not depend on NestJS, Prisma, or HTTP concerns.

## Shared Packages

- `packages/shared-types` contains API contracts and types safe to share with clients.
- `packages/shared-validation` contains reusable Zod schemas where client-side validation is useful. The API remains responsible for validating all incoming requests.
- `packages/config` contains shared development and TypeScript configuration.