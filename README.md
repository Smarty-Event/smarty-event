# SmartyEvents

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Frontend: Next.js](https://img.shields.io/badge/Frontend-Next.js-black?logo=next.js)](https://nextjs.org/)
[![Backend: NestJS](https://img.shields.io/badge/Backend-NestJS-red?logo=nestjs)](https://nestjs.com/)
[![Database: Prisma](https://img.shields.io/badge/Database-Prisma-teal?logo=prisma)](https://www.prisma.io/)
[![Stellar](https://img.shields.io/badge/Stellar-SDK-purple?logo=stellar)](https://stellar.org)

SmartyEvents is a multi-tenant event ticketing platform powered by the Stellar blockchain. It enables organizations to host events, manage tickets, coordinate multi-session agendas with speakers, and issue blockchain-backed tickets as custom Stellar assets. Attendees enjoy true digital ownership of their tickets, and event managers gain secure verification tools using HMAC-SHA256 tokens and on-chain ownership checks.

## ✨ Key Features

### For Event Organizers (Tenants)

- **Multi-Tenant Architecture**: Manage separate branding, custom domains, and stellar configuration accounts per organization under isolated data profiles.
- **Agendas & Speaker Management**: Schedule tracks and sessions, list speakers, and structure event itineraries dynamically.
- **Tiered Ticketing**: Design custom ticket classes (e.g. VIP, General Admission, Early Bird) with custom price tiers and capacity bounds.
- **Promotional Discounts**: Define event-wide discount codes with custom percentage limits and usage caps.

### For Attendees

- **Stellar-Backed Tickets**: True ticket ownership represented as custom Stellar assets on the Stellar Testnet.
- **Secure Ticket Check-In**: Check-in safely at event gates via HMAC-SHA256 signature tokens designed for fast, offline, and fraud-resistant verification.
- **Multi-Method Checkout**: Purchase tickets using Stellar USDC, traditional card networks, or bank transfers.

### Technical Highlights

- **Turborepo Monorepo**: Extremely fast build pipelines, type sharing, and task caching.
- **Type-Safe Database Access**: Relational PostgreSQL database managed via Prisma ORM.
- **Stellar Integration Package**: Wrapper package around the `stellar-sdk` handling keys, asset creation, ticket minting, and trustline/ownership checks.

## 🏗 Project Structure

The repository is organized as a monorepo containing application suites and shared packages:

### Applications

- **`apps/api/`**: NestJS application providing the central REST endpoints, tenant separation, event itineraries, ticketing endpoints, and Stellar configurations.
- **`apps/web/`**: Next.js application representing the consumer and portal frontend.

### Shared Packages

- **`packages/database/`**: Shared client setup containing the Prisma schema definitions and migration configurations for PostgreSQL.
- **`packages/stellar/`**: Helper library wrapping the `stellar-sdk` for wallet keypair generation, ticket asset issuing, minting, and verification.
- **`packages/ui/`**: Shared React UI components (button, card, etc.) utilized across the frontend workspace.
- **`packages/eslint-config/`** & **`packages/typescript-config/`**: Shared linting and compiler configuration presets.

---

## 🛠 Tech Stack

- **Blockchain**: [Stellar](https://stellar.org) (using `stellar-sdk` v13)
- **Frontend**: [Next.js 16](https://nextjs.org/) (React 19, TypeScript)
- **Backend**: [NestJS 10](https://nestjs.com/) (TypeScript, RxJS)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Monorepo Engine**: [Turborepo](https://turbo.build/) with `npm` Workspaces

---

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v10 or higher)
- [PostgreSQL](https://www.postgresql.org/) (database running locally or in the cloud)

### Manual Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Smarty-Event/smarty-event.git
   cd smarty-events
   ```

2. **Install workspace dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root of the project (or inside `packages/database` and `apps/api` depending on deployment environment) with the following variables:

   ```env
   # Database connection URL (PostgreSQL)
   DATABASE_URL="postgresql://<username>:<password>@localhost:5432/smarty_events?schema=public"

   # Add additional API or Stellar environment variables as needed
   PORT=3001
   ```

4. **Generate and apply Database Schemas:**
   From the root directory, generate the Prisma client:

   ```bash
   npx turbo run db:generate
   ```

   Push the schema to your PostgreSQL instance:

   ```bash
   npx turbo run db:push
   ```

5. **Start Dev Servers (All Applications):**
   ```bash
   npm run dev
   ```
   This command starts the NestJS API server (`http://localhost:3001`) and the Next.js Web server (`http://localhost:3000`) concurrently.

### 🐳 Dockerized Setup (Recommended)

You can run the entire platform stack (Next.js web portal, NestJS backend API, PostgreSQL database, and Prisma Studio) using Docker. We provide a shell script `manage.sh` at the root of the project to manage the lifecycle of the stack.

1. **Start the Docker Stack:**
   ```bash
   ./manage.sh --start
   ```
   This spins up the database, API, web frontend, and database studio containers, wait for them to initialize, and prints out a configuration dashboard:
   - **Next.js Web App:** `http://localhost:3000`
   - **NestJS REST API:** `http://localhost:3001`
   - **Prisma Studio:** `http://localhost:5555` (Web-based database viewer)
   - **Database Connection:** Host connection at `localhost:5433` (User: `shield` | Password: `shield` | DB: `smarty_events`)

2. **Stop the Docker Stack:**
   ```bash
   ./manage.sh --stop
   ```
   This stops and tears down all running containers, volumes, and network layers.

3. **Rebuild the Docker Stack:**
   ```bash
   ./manage.sh --rebuild
   ```
   This rebuilds the Docker images from scratch without using cached layers, then starts the stack.

---

## 💻 Available Scripts

You can run these scripts using `npm run <command>` or `npx turbo run <command>`:

- `npm run dev` - Start all apps and watch-mode tools concurrently
- `npm run build` - Compile all apps and library packages for production
- `npm run lint` - Run ESLint across all projects
- `npm run format` - Format code across all directories with Prettier
- `npm run check-types` - Validate Typescript compilation safety across the monorepo

To target a specific package or application, utilize Turborepo's filter feature:

```bash
npx turbo dev --filter=web    # Runs only Next.js frontend
npx turbo dev --filter=api    # Runs only NestJS backend
```

---

## 🔒 Security

For details on security protocols, secure offline QR tickets (using HMAC tokens), and vulnerability reporting, please review our security practices or raise an issue.

## 🤝 Contributing

We welcome contributions!

1. Fork this repository.
2. Create your feature branch (`git checkout -b feature/cool-feature`).
3. Commit your changes (`git commit -m 'Add some cool feature'`).
4. Push to the branch (`git push origin feature/cool-feature`).
5. Open a Pull Request.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
