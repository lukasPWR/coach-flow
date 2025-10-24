# CoachFlow

A modern SaaS platform designed to help personal trainers and coaches manage their clients, schedules, and progress tracking in one centralized application.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Tech Stack

### Frontend

- **Framework**: Vue.js 3
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Component Library**: shadcn-vue
- **Build Tool**: Vite

### Backend

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma

### AI

- **Gateway**: Openrouter.ai

### CI/CD & Hosting

- **CI/CD**: GitHub Actions
- **Hosting**: DigitalOcean (with Docker)

## Getting Started Locally

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- **Node.js**: `v22.14.0` (it's recommended to use a version manager like `nvm` and run `nvm use`).
- **npm** or another package manager.
- **PostgreSQL**: A running instance of PostgreSQL.

### Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Set up your environment variables. Create a `.env` file in the `backend` directory. You can copy the `.env.example` if it exists. At a minimum, you will need to provide the `DATABASE_URL`:
    ```env
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
    ```
4.  Run database migrations to set up your database schema:
    ```bash
    npx prisma migrate dev
    ```
5.  Start the development server:
    ```bash
    npm run start:dev
    ```
    The backend server will be running on `http://localhost:3000`.

### Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The frontend application will be running on `http://localhost:5173`.

## Available Scripts

### Backend (`/backend`)

- `npm run start:dev`: Starts the development server with hot-reloading.
- `npm run build`: Compiles the TypeScript code into JavaScript.
- `npm run test`: Runs unit tests.
- `npm run lint`: Lints the codebase.
- `npm run format`: Formats the codebase with Prettier.

### Frontend (`/frontend`)

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the application for production.
- `npm run preview`: Serves the production build locally for preview.
- `npm run lint`: Lints the codebase.
- `npm run format`: Formats the codebase with Prettier.

## Project Scope

The goal of CoachFlow is to provide a comprehensive tool for coaches. Key features include:

- **Client Management**: Keep track of all client information and history.
- **Scheduling**: Manage appointments and training sessions.
- **Progress Tracking**: Monitor client progress with metrics and notes.
- **Communication**: A centralized place for coach-client communication.

## Project Status

This project is currently **in development**.

## License

This project is currently **UNLICENSED**.
