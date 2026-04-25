# Agents.md - SaleManager System

## Project Structure

```
/backend    - .NET 8 Web API (ASP.NET Core + EF Core + SQLite)
/frontend   - React 18 + TypeScript + Vite + TailwindCSS
/docs       - Plans and specifications
```

## Running the Application

### Backend (port 5001)
```bash
cd backend
dotnet restore
dotnet build
dotnet run
```
API at http://localhost:5001, Swagger UI at http://localhost:5001/swagger

### Frontend (port 3000)
```bash
cd frontend
npm install
npm run dev
```
Frontend at http://localhost:3000 (proxies API to backend:5001)

## Tech Stack

**Backend:** .NET 8, ASP.NET Core, Entity Framework Core (SQLite), JWT (BCrypt), Swagger

**Frontend:** React 18, TypeScript, Vite, TailwindCSS, Zustand (state), React Router v6, Axios, Lucide icons

## Key Files

- **Backend entry:** `backend/Program.cs` - DI setup, auth config, middleware pipeline
- **Database:** `backend/Data/AppDbContext.cs` - EF Core context, auto-creates on startup
- **Auth:** `backend/Services/AuthService.cs` - JWT generation, password hashing via BCrypt
- **Controllers:** `backend/Controllers/` - Auth, Users, Hospitals, Doctors
- **Middleware:** `backend/Middleware/` - Exception handling, JWT token extraction
- **Entities:** `backend/Entities/` - User, Hospital, Doctor, Deal, Order, Activity, Notification, Enums

## Entities (Domain Model)

- **User** - Sales, Manager, Admin roles
- **Hospital** - Medical facility
- **Doctor** - Doctor linked to hospital
- **Deal** - Sales deal/opp
- **Order** - Associated order
- **Activity** - Activity log
- **Notification** - User notifications

## Service/Repository Pattern

- `backend/Repositories/` - IRepository base + User, Hospital, Doctor repositories
- `backend/Services/` - IAuthService, IUserService, IHospitalService, IDoctorService

## Authentication

Protected endpoints require: `Authorization: Bearer <token>`

Seed users (auto-created on first run):
- Admin: `admin` / `Admin123!`
- Managers: `manager1`, `manager2` / `Manager123!`
- Sales: `sales1` - `sales5` / `Sales123!`

JWT expires after 24 hours.

## Conventions

- Repository pattern: `IRepository` + `Repository<T>` base class
- Service layer: `I{X}Service` + `XService` for business logic
- Custom exception middleware at top of pipeline
- JWT middleware extracts token and sets claims

## No Tests

Root `package.json` has no test script. Backend has no test project.

## Environment Config

Copy `.env.example` to `.env` for backend configuration:
- `ConnectionStrings__DefaultConnection=Data Source=salesystem.db`
- `Jwt__Key=...` (min 32 chars)
- `Jwt__Issuer=SalesSystem`
- `Jwt__Audience=SalesSystemApp`