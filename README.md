# Mobile App Framework

A full-stack mobile application framework built with a **Spring Boot** backend and a **React Native (Expo)** frontend. It provides a production-ready foundation with authentication, role-based access control, admin user management, internationalization, and theming out of the box.

## Architecture Overview

```
mobile-app/                    backend/
  React Native (Expo)            Spring Boot 3.4
  React Navigation v7            Spring Security + JWT
  i18next                        Spring Data JPA + H2
  AsyncStorage                   Liquibase migrations
       |                         Thymeleaf (email)
       |    Accept-Language       MessageSource (i18n)
       +----- HTTP/REST --------+
              Bearer JWT
```

The mobile app communicates with the backend exclusively through a REST API. Authentication is stateless via JWT tokens. The user's language preference is sent on every request via the `Accept-Language` header, and the backend returns localized responses.

---

## Features

- **Authentication** -- Register, login, email verification, and JWT-based session management
- **Role-Based Access** -- `ROLE_USER` and `ROLE_ADMIN` with endpoint-level security
- **Admin Panel** -- Full user management (view, edit, enable/disable, lock/unlock, delete)
- **Internationalization** -- English, French, and Spanish across both frontend and backend
- **Theming** -- Light, dark, and system-adaptive color schemes
- **Email Verification** -- HTML email templates with localized content
- **Persistent Auth** -- Token stored locally; auto-login on app restart

---

## Prerequisites

| Tool        | Version |
|-------------|---------|
| Java        | 17+     |
| Maven       | 3.6+    |
| Node.js     | 18+     |
| npm         | 9+      |

For email testing (optional): [Mailpit](https://github.com/axllent/mailpit)

```bash
docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit
```

Mailpit captures all outgoing SMTP emails and provides a web UI at `http://localhost:8025` to inspect them. The backend is already configured to send mail to `localhost:1025`, so no additional configuration is needed. Mailpit can also be installed without Docker via Homebrew (`brew install mailpit`) or as a standalone binary -- see the [Mailpit repo](https://github.com/axllent/mailpit) for details.

---

## Getting Started

### 1. Launch the Backend

```bash
cd backend
mvn spring-boot:run
```

The API starts on **http://localhost:8080**. On first launch, Liquibase creates the database schema and an admin account is initialized automatically.

**Default admin credentials:**

| Field    | Value              |
|----------|--------------------|
| Username | `admin`            |
| Password | `admin`            |
| Email    | `admin@mobileapp.com` |

The H2 file database is stored at `./data/mobileapp.mv.db`. To reset the database, stop the server and delete the `data/` directory.

**H2 Console** (development only): http://localhost:8080/h2-console
- JDBC URL: `jdbc:h2:file:./data/mobileapp`
- Username: `sa` / Password: (empty)

### 2. Launch the Mobile App

```bash
cd mobile-app
npm install
npx expo start
```

Then press:
- **a** to open on an Android emulator
- **i** to open on an iOS simulator
- **w** to open in a web browser

The API base URL is configured automatically:
- Android emulator: `http://10.0.2.2:8080/api`
- iOS simulator / web: `http://localhost:8080/api`

---

## Project Structure

```
claude-mobile-app/
├── backend/
│   └── src/main/java/com/mobileapp/backend/
│       ├── config/          SecurityConfig, I18nConfig, AdminInitializer
│       ├── controller/      AuthController, UserController, AdminController
│       ├── dto/             Request/response objects
│       ├── entity/          JPA entities (User, Role, VerificationToken)
│       ├── exception/       GlobalExceptionHandler
│       ├── repository/      Spring Data JPA repositories
│       ├── security/        JWT provider, filter, entry point, user details
│       ├── service/         AuthService, UserService, EmailService
│       └── util/            Messages (i18n helper)
│   └── src/main/resources/
│       ├── application.yml
│       ├── db/changelog/    Liquibase migration files
│       ├── templates/       Thymeleaf email templates
│       ├── messages.properties       English (default)
│       ├── messages_fr.properties    French
│       └── messages_es.properties    Spanish
│
├── mobile-app/
│   └── src/
│       ├── screens/         Login, Register, Home, Settings, AdminUsers, AdminUserDetail
│       ├── navigation/      AppNavigator, CustomDrawerContent
│       ├── services/        api.ts (REST client with token management)
│       ├── context/         AuthContext, ThemeContext
│       ├── theme/           Color definitions (light/dark)
│       ├── i18n/            i18next config + locale JSON files (en, fr, es)
│       └── __tests__/       Unit and integration tests
│
├── k8s/                     Kubernetes manifests
│   ├── namespace.yml
│   ├── configmap.yml
│   ├── secret.yml
│   ├── postgres.yml
│   ├── backend-deployment.yml
│   ├── backend-service.yml
│   └── ingress.yml
│
├── docker-compose.yml       Local dev (backend + PostgreSQL + Mailpit)
└── data/                    H2 database files (generated at runtime)
```

---

## API Endpoints

### Public (no authentication required)

| Method | Path                    | Description             |
|--------|-------------------------|-------------------------|
| POST   | `/api/auth/register`    | Register a new user     |
| POST   | `/api/auth/login`       | Login, returns JWT      |
| GET    | `/api/auth/verify?token=` | Verify email address  |

### Authenticated (`ROLE_USER`)

| Method | Path            | Description              |
|--------|-----------------|--------------------------|
| GET    | `/api/user/me`  | Get current user profile |

### Admin (`ROLE_ADMIN`)

| Method | Path                                    | Description                  |
|--------|-----------------------------------------|------------------------------|
| GET    | `/api/admin/users`                      | List all users               |
| GET    | `/api/admin/users/{id}`                 | Get user by ID               |
| PUT    | `/api/admin/users/{id}`                 | Update user profile          |
| PUT    | `/api/admin/users/{id}/toggle-enabled`  | Enable or disable account    |
| PUT    | `/api/admin/users/{id}/toggle-locked`   | Lock or unlock account       |
| DELETE | `/api/admin/users/{id}`                 | Delete user                  |
| GET    | `/api/admin/users/{id}/token`           | Get verification token       |
| DELETE | `/api/admin/users/{id}/token`           | Delete verification token    |
| POST   | `/api/admin/users/{id}/token`           | Regenerate verification token|

All endpoints return JSON. Protected endpoints require a `Bearer` token in the `Authorization` header.

---

## Internationalization

The app supports **English**, **French**, and **Spanish**.

**Frontend:** Users select their language in the Settings screen. The choice is persisted to `AsyncStorage` and applied immediately via `react-i18next`. Translation files live in `mobile-app/src/i18n/locales/`.

**Backend:** Every API request includes an `Accept-Language` header. Spring's `AcceptHeaderLocaleResolver` resolves the locale, and `MessageSource` returns messages from the corresponding `messages_xx.properties` file. Validation errors, exception messages, and email templates are all localized.

---

## Theming

The Settings screen provides three options:
- **Light** -- White backgrounds, dark text
- **Dark** -- Dark backgrounds, light text
- **System** -- Follows the device OS preference

Theme state is managed via React Context and persisted in `AsyncStorage`.

---

## Running Tests

### Backend (125 tests)

```bash
cd backend
mvn test
```

Tests include unit tests (services, security, exception handling) and integration tests (full request lifecycle with `@SpringBootTest`). JaCoCo enforces a minimum of 80% line coverage and 70% branch coverage.

### Mobile App (111 tests)

```bash
cd mobile-app
npx jest
```

Tests cover screens, navigation, context providers, theme switching, and the login flow integration.

---

## Configuration

### Backend (`application.yml`)

| Property                   | Default                           | Description                  |
|----------------------------|-----------------------------------|------------------------------|
| `server.port`              | `8080`                            | API server port              |
| `app.jwt.secret`           | (base64 string)                   | JWT signing key              |
| `app.jwt.expiration-ms`    | `86400000` (24h)                  | JWT token lifetime           |
| `app.cors.allowed-origins` | `http://localhost:3000,...`        | Allowed CORS origins         |
| `spring.mail.host`         | `localhost`                       | SMTP server host             |
| `spring.mail.port`         | `1025`                            | SMTP server port             |
| `spring.datasource.url`    | `jdbc:h2:file:./data/mobileapp`   | Database connection URL      |

### Mobile App (`src/services/api.ts`)

The API base URL is set per platform in `api.ts`. For a physical device or custom backend host, update the `BASE_URL` constant.

---

## Docker

### docker-compose (local development)

Start the backend with PostgreSQL and Mailpit:

```bash
docker compose up --build
```

| Service  | URL                         | Description              |
|----------|-----------------------------|--------------------------|
| Backend  | http://localhost:8080       | Spring Boot API          |
| Mailpit  | http://localhost:8025       | Email testing UI         |
| Postgres | localhost:5432              | PostgreSQL database      |

The backend uses the `prod` Spring profile inside Docker, connecting to PostgreSQL instead of H2. Mailpit captures outgoing emails on SMTP port 1025.

To stop and remove volumes:

```bash
docker compose down -v
```

### Build the image only

```bash
docker build -t mobileapp-backend ./backend
```

The Dockerfile uses a multi-stage build (Maven build + JRE-only runtime) and runs as a non-root user.

---

## Kubernetes

Deploy to a Kubernetes cluster:

```bash
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/
```

This creates the `mobileapp` namespace with:

| Resource           | Kind         | Description                                  |
|--------------------|------------- |----------------------------------------------|
| `namespace.yml`    | Namespace    | `mobileapp` namespace                        |
| `configmap.yml`    | ConfigMap    | Non-sensitive config (DB host, mail, CORS)    |
| `secret.yml`       | Secret       | DB credentials, JWT secret, admin password    |
| `postgres.yml`     | StatefulSet  | PostgreSQL 16 with 1Gi PVC                   |
| `backend-deployment.yml` | Deployment | Backend (2 replicas) with health probes |
| `backend-service.yml` | Service   | ClusterIP on port 80 → 8080                  |
| `ingress.yml`      | Ingress      | nginx ingress routing `/` → backend          |

**Before deploying to production**, update `k8s/secret.yml` with real base64-encoded credentials:

```bash
echo -n 'your-real-password' | base64
```

---

## Security Notes

- **JWT secret** must be changed before deploying to production
- **H2 console** should be disabled in production (`spring.h2.console.enabled=false`)
- **CORS origins** should be restricted to your actual frontend domain
- **Admin password** should be changed after first login
- Passwords are hashed with BCrypt (cost factor 12)
- Sessions are fully stateless (no server-side session, no cookies)

---

## Tech Stack

| Layer    | Technology                                                  |
|----------|-------------------------------------------------------------|
| Backend  | Java 17, Spring Boot 3.4, Spring Security, Spring Data JPA |
| Auth     | JWT (jjwt 0.12), BCrypt                                    |
| Database | H2 (dev), PostgreSQL 16 (prod), Liquibase                  |
| Email    | Spring Mail, Thymeleaf templates                            |
| Frontend | React Native 0.83, Expo 55, TypeScript 5.9                 |
| Navigation| React Navigation 7 (Stack + Drawer)                       |
| i18n     | i18next + react-i18next (frontend), Spring MessageSource (backend) |
| Testing  | JUnit 5, Mockito, Spring Test (backend); Jest, React Testing Library (frontend) |
