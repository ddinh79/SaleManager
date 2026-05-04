# Sales Execution System - Backend

## Setup

1. Install .NET 8 SDK
2. Navigate to `/backend`
3. Run: dotnet restore
4. Run: dotnet build
5. Run: dotnet run

API will be available at http://localhost:5100

## Seed Data

Auto-created on first run:
- 1 Admin: admin / Admin123!
- 2 Managers: manager1, manager2 / Manager123!
- 5 Sales Members: sales1-sales5 / Sales123!
- 5 Hospitals
- 3 Sample Doctors

## JWT Authentication

All protected endpoints require:
Authorization: Bearer <token>

Token expires after 24 hours.