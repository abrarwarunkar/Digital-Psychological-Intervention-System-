# System Architecture

## Overview

The Student Mental Health System is a monolithic repository containing a React frontend and a Node.js/Express backend. It uses MongoDB for data persistence and integrates with various external services for authentication, email, and AI capabilities.

## Components

### Frontend (`apps/web-client`)
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router DOM
- **HTTP Client**: Axios

### Backend (`apps/api-server`)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (Access + Refresh Tokens)

### External Services
- **Database**: MongoDB Atlas
- **Email**: SendGrid / AWS SES
- **Storage**: AWS S3 (or compatible object storage)
- **AI/ML**: OpenAI API / Hugging Face (via backend proxy)

## Data Flow

1. **User Interaction**: Users interact with the React frontend.
2. **API Requests**: Frontend sends HTTP requests to the Backend API.
3. **Authentication**: Requests to protected routes are validated via JWT middleware.
4. **Business Logic**: Controllers execute business logic, interacting with Services.
5. **Data Persistence**: Services use Mongoose models to query/update MongoDB.
6. **External Calls**: Services may call external APIs (AI, Email, Storage).

## Directory Structure

```
/student-mental-health
├── apps
│   ├── web-client  # Frontend application
│   └── api-server  # Backend application
├── docs            # Documentation
└── infra           # Infrastructure configuration
```
