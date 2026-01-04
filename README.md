# Student Mental Health System

A comprehensive web application for student mental health support, featuring a student portal, counsellor dashboard, and admin tools.

## Project Structure

- `apps/web-client`: React frontend (Vite + Tailwind CSS)
- `apps/api-server`: Node.js/Express backend
- `docs`: Documentation
- `infra`: Infrastructure configuration

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm (v9+)
- MongoDB Atlas account

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd student-mental-health
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup Environment Variables:
   - Copy `.env.example` to `.env` in `apps/api-server` and `apps/web-client` (create these files if they don't exist yet).
   - Fill in the required values (MONGO_URI, etc.).

### Running Locally

To run both frontend and backend in development mode:

```bash
npm run dev
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API Specification](docs/API_SPEC.md)
