# Wedding AI Planner

A comprehensive SaaS application for planning weddings with AI assistance.

## Status

This project has been analyzed and repaired to fix a critical 404 error and establish a stable foundation for future development. The authentication system (Clerk) has been temporarily mocked to allow for development without requiring external service credentials.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui, React Query
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Auth**: Clerk
- **Deployment**: Docker

## Getting Started

### Prerequisites

- **Node.js**: Version 18 or higher.
- **Docker & Docker Compose**: Required to run the local PostgreSQL database.

### Local Development Setup

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd wedding-ai-planner
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the database container**
    This command will start a PostgreSQL database in a Docker container.
    ```bash
    docker-compose up -d
    ```

4.  **Set up environment variables**
    Create `.env.local` file with database connection:
    ```bash
    DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wedding_planner?schema=public"
    ```

5.  **Apply database schema**
    This command will create the necessary tables in the database based on the Prisma schema.
    ```bash
    npx prisma migrate dev
    ```
    Or if you prefer to push without migration history:
    ```bash
    npx prisma db push
    ```

6.  **Run the application**
    ```bash
    npm run dev
    ```

The application will be available at [http://localhost:3000](http://localhost:3000). You will be automatically logged in with a mock user and redirected to the dashboard.

## Project Structure Highlights

-   `src/app/`: Contains the Next.js App Router structure.
    -   `src/app/page.tsx`: The public landing page.
    -   `src/app/dashboard/`: The main application interface after logging in.
-   `src/app/api/`: API routes for handling backend logic.
-   `src/lib/auth-mock.ts`: A simple mock for the authentication system, allowing development without real user accounts.
-   `prisma/`: Contains the Prisma schema (`schema.prisma`) defining the database models.
-   `docker-compose.yml`: Defines the local development environment, including the PostgreSQL database service.

## License

Private
