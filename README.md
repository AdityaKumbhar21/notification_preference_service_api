# Notification Preference System

A Node.js + TypeScript backend service for managing user notification preferences across organizations, groups, topics, and channels. Built with **Inversify** for dependency injection following OOP and IoC principles.

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **IoC Container**: Inversify (Dependency Injection)

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/AdityaKumbhar21/notification_preference_service_api.git
cd notification_preference_service_api

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL
```

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/notification_db"
PORT=3000
```

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### Initial Setup - Create Admin User

⚠️ **Important**: You need to manually create the first admin user before using the API.

1. Open Prisma Studio:
   ```bash
   npx prisma studio
   ```

2. Create an **Organization** first

3. Create a **User** with:
   - `email`: your admin email
   - `role`: `ADMIN`
   - `organizationId`: the organization ID from step 2

4. Use this admin user's ID in the `x-user-id` header for admin-protected routes.

### Running the Server

```bash
# Development with auto-reload (recommended)
npm run dev

# Start without auto-reload
npm start

# Or directly with tsx
npx tsx src/server.ts
```

Server runs on `http://localhost:3000`

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `nodemon --exec tsx src/server.ts` | Development with auto-reload on file changes |
| `npm start` | `tsx src/server.ts` | Start the server |
| `npm run build` | `tsc` | Compile TypeScript to JavaScript |

---

## Architecture

### Dependency Injection with Inversify

This project uses **Inversify** for IoC (Inversion of Control) to manage dependencies. All services and controllers are injectable classes.

#### DI Container Setup (`src/container.ts`)

```typescript
// Service identifiers
export const TYPES = {
    PrismaClient: Symbol.for("PrismaClient"),
    DecisionService: Symbol.for("DecisionService"),
    ValidationService: Symbol.for("ValidationService"),
    UserController: Symbol.for("UserController"),
    // ... more controllers
};

// Container bindings
container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(new PrismaClient());
container.bind<DecisionService>(TYPES.DecisionService).to(DecisionService).inSingletonScope();
```

#### Injectable Service Example

```typescript
@injectable()
export class DecisionService {
    constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}
    
    async isNotificationAllowed(input: DecisionInput): Promise<DecisionResult> {
        // ... logic
    }
}
```

#### Injectable Controller Example

```typescript
@injectable()
export class PreferenceController {
    constructor(
        @inject(TYPES.PrismaClient) private prisma: PrismaClient,
        @inject(TYPES.DecisionService) private decisionService: DecisionService
    ) {}
}
```

---

## Data Model

### Entity Relationship

```
Organization (1) ──────< (N) User
     │
     └──────< (N) Group ──────< (N) Topic
                   │                  │
                   │                  │
            UserGroupPref      UserTopicPref
            (per user)         (per user + channel)
```

### Models

#### Organization
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Unique organization name |
| createdAt | DateTime | Creation timestamp |

#### User
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| email | String | Unique email address |
| role | Enum | `ADMIN` or `CUSTOMER` |
| organizationId | UUID | Foreign key to Organization |

#### Group
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Group name (unique within org) |
| organizationId | UUID | Foreign key to Organization |

#### Topic
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Topic name (unique within group) |
| groupId | UUID | Foreign key to Group |

#### UserGroupPref
| Field | Type | Description |
|-------|------|-------------|
| userId | UUID | Foreign key to User |
| groupId | UUID | Foreign key to Group |
| enabled | Boolean | Whether group is enabled (default: true) |

#### UserTopicPref
| Field | Type | Description |
|-------|------|-------------|
| userId | UUID | Foreign key to User |
| topicId | UUID | Foreign key to Topic |
| channel | Enum | Channel type |
| enabled | Boolean | Whether channel is enabled (default: false) |

### Channels (Fixed)
- `EMAIL`
- `SMS`
- `PUSH`
- `IN_APP`
- `CHAT`
- `WHATSAPP`

---

## API Endpoints

### Organizations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/orgs` | Create organization | - |
| GET | `/orgs/:orgId/customers` | Get all customers in org | - |

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/users` | Create user | ADMIN |

### Groups

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/groups/create` | Create group | ADMIN |
| GET | `/groups/org/:orgId` | Get groups with topics | ADMIN |

### Topics

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/topics/create` | Create topic | ADMIN |

### Preferences

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| PATCH | `/preferences/groups` | Update group preference | CUSTOMER |
| PATCH | `/preferences/topics` | Update topic+channel preference | CUSTOMER |
| GET | `/preferences/users/:userId` | Get all preferences for user | - |
| POST | `/preferences/decision` | Check if notification allowed | - |

---

## Decision Logic

The core decision endpoint answers: **"Should notification X be sent to user Y on channel Z?"**

### Algorithm

```
1. Validate user exists → Error if not found
2. Validate topic exists → Error if not found
3. Validate channel is valid → Error if invalid
4. Check group preference for user:
   - If group DISABLED → Return { allowed: false }
   - If group ENABLED (or no preference, default enabled) → Continue
5. Check topic+channel preference for user:
   - If channel ENABLED → Return { allowed: true }
   - If channel DISABLED or NO PREFERENCE → Return { allowed: false }
```

### Key Rules

| Scenario | Result |
|----------|--------|
| Group disabled | `allowed: false` (regardless of topic settings) |
| Group enabled + channel enabled | `allowed: true` |
| Group enabled + channel disabled | `allowed: false` |
| Group enabled + no preference set | `allowed: false` (default blocked) |

---

## Example API Calls with Responses

### 1. Create Organization

```bash
curl -X POST http://localhost:3000/orgs \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp"}'
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Organization created successfully",
  "data": {
    "id": "e055bdec-085f-4274-b498-4cbe4c0924a8",
    "name": "Acme Corp",
    "createdAt": "2025-12-02T13:46:37.060Z"
  }
}
```

**Response (409 Conflict - duplicate):**
```json
{
  "success": false,
  "message": "Organization with this name already exists"
}
```

### 2. Get Customers for Organization

```bash
curl http://localhost:3000/orgs/<org-id>/customers
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Customers fetched successfully",
  "data": [
    {
      "id": "5c9c2165-2403-424b-acef-91b407ccb121",
      "email": "customer@acme.com",
      "role": "CUSTOMER",
      "organizationId": "e055bdec-085f-4274-b498-4cbe4c0924a8",
      "createdAt": "2025-12-02T13:52:14.447Z"
    }
  ]
}
```

### 3. Create User (Requires ADMIN)

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "x-user-id: <admin-user-id>" \
  -d '{
    "email": "customer@acme.com",
    "organizationId": "<org-id>",
    "role": "CUSTOMER"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "5c9c2165-2403-424b-acef-91b407ccb121",
    "email": "customer@acme.com",
    "role": "CUSTOMER",
    "organizationId": "e055bdec-085f-4274-b498-4cbe4c0924a8",
    "createdAt": "2025-12-02T13:52:14.447Z"
  }
}
```

**Response (409 Conflict - duplicate email):**
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

**Response (403 Forbidden - not admin):**
```json
{
  "success": false,
  "message": "Forbidden: Insufficient permissions"
}
```

### 4. Create Group (Requires ADMIN)

```bash
curl -X POST http://localhost:3000/groups/create \
  -H "Content-Type: application/json" \
  -H "x-user-id: <admin-user-id>" \
  -d '{
    "name": "Marketing",
    "organizationId": "<org-id>"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Group created successfully",
  "data": {
    "id": "ff33f5d1-b626-422c-8475-a30f4d2340a1",
    "name": "Marketing",
    "organizationId": "e055bdec-085f-4274-b498-4cbe4c0924a8",
    "createdAt": "2025-12-02T13:52:26.840Z"
  }
}
```

### 5. Get Groups for Organization (Requires ADMIN)

```bash
curl http://localhost:3000/groups/org/<org-id> \
  -H "x-user-id: <admin-user-id>"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Groups fetched successfully",
  "data": [
    {
      "id": "ff33f5d1-b626-422c-8475-a30f4d2340a1",
      "name": "Marketing",
      "organizationId": "e055bdec-085f-4274-b498-4cbe4c0924a8",
      "createdAt": "2025-12-02T13:52:26.840Z",
      "topics": [
        {
          "id": "a1a403b2-0cc2-40e1-a80a-4392f6beb967",
          "name": "Promotions",
          "groupId": "ff33f5d1-b626-422c-8475-a30f4d2340a1"
        }
      ]
    }
  ]
}
```

### 6. Create Topic (Requires ADMIN)

```bash
curl -X POST http://localhost:3000/topics/create \
  -H "Content-Type: application/json" \
  -H "x-user-id: <admin-user-id>" \
  -d '{
    "name": "Promotions",
    "groupId": "<group-id>"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Topic created successfully",
  "data": {
    "id": "a1a403b2-0cc2-40e1-a80a-4392f6beb967",
    "name": "Promotions",
    "groupId": "ff33f5d1-b626-422c-8475-a30f4d2340a1"
  }
}
```

### 7. Update Group Preference (Requires CUSTOMER)

```bash
curl -X PATCH http://localhost:3000/preferences/groups \
  -H "Content-Type: application/json" \
  -H "x-user-id: <customer-user-id>" \
  -d '{
    "userId": "<customer-user-id>",
    "groupId": "<group-id>",
    "enabled": true
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Group preferences updated successfully",
  "data": {
    "userId": "5c9c2165-2403-424b-acef-91b407ccb121",
    "groupId": "ff33f5d1-b626-422c-8475-a30f4d2340a1",
    "enabled": true
  }
}
```

### 8. Update Topic+Channel Preference (Requires CUSTOMER)

```bash
curl -X PATCH http://localhost:3000/preferences/topics \
  -H "Content-Type: application/json" \
  -H "x-user-id: <customer-user-id>" \
  -d '{
    "userId": "<customer-user-id>",
    "topicId": "<topic-id>",
    "channel": "EMAIL",
    "enabled": true
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Topic preferences updated successfully",
  "data": {
    "userId": "5c9c2165-2403-424b-acef-91b407ccb121",
    "topicId": "a1a403b2-0cc2-40e1-a80a-4392f6beb967",
    "channel": "EMAIL",
    "enabled": true
  }
}
```

### 9. Get User Preferences (Structured View)

```bash
curl http://localhost:3000/preferences/users/<user-id>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "group": "Marketing",
      "enabled": true,
      "topics": [
        {
          "topic": "Promotions",
          "channels": {
            "EMAIL": true,
            "SMS": false,
            "PUSH": false,
            "IN_APP": false,
            "CHAT": false,
            "WHATSAPP": false
          }
        }
      ]
    }
  ]
}
```

### 10. Decision API - Check if Notification Allowed

```bash
curl -X POST http://localhost:3000/preferences/decision \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<user-id>",
    "topicId": "<topic-id>",
    "channel": "EMAIL"
  }'
```

**Response (200 OK - Allowed):**
```json
{
  "success": true,
  "data": {
    "allowed": true
  }
}
```

**Response (200 OK - Not Allowed):**
```json
{
  "success": true,
  "data": {
    "allowed": false
  }
}
```

---

## Project Structure

```
src/
├── controllers/          # Injectable controller classes
│   ├── orgControllers.ts
│   ├── userController.ts
│   ├── groupController.ts
│   ├── topicController.ts
│   └── prefernceController.ts
├── middlewares/
│   └── role.ts           # Role-based access control
├── routes/
│   ├── org.ts
│   ├── user.ts
│   ├── group.ts
│   ├── topics.ts
│   └── preference.ts
├── services/             # Injectable service classes
│   ├── decision.ts       # Core notification decision logic
│   └── validation.ts
├── prisma/
│   └── schema.prisma     # Database schema
├── container.ts          # Inversify IoC container setup
├── di-types.ts           # DI type symbols
├── prisma.ts             # Prisma client instance
├── types.ts              # TypeScript interfaces
└── server.ts             # Express app entry point
```

---
