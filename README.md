# Pixel Duel Game

A 2D pixelated game where players can create characters, challenge others to duels, and stake points.

## Features

- User authentication (register/login)
- Character creation with country selection
- Points-based economy system
- Open space for player interaction
- Duel arena for PvP combat
- Stake points in duels and win rewards

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (development), PostgreSQL (production)
- **Authentication**: NextAuth.js

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/pixel-duel-game.git
   cd pixel-duel-game
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit the `.env` file with your configuration.

4. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
pixel-duel-game/
├── prisma/               # Database schema and migrations
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (auth)/       # Authentication routes
│   │   ├── (game)/       # Game routes
│   │   ├── api/          # API routes
│   ├── components/       # React components
│   │   ├── auth/         # Authentication components
│   │   ├── game/         # Game components
│   │   ├── ui/           # UI components (shadcn)
│   ├── lib/              # Utility functions and shared code
│   │   ├── db/           # Database utilities
│   ├── types/            # TypeScript type definitions
```

## Development Roadmap

1. **Milestone 1**: User Auth + Basic UI
2. **Milestone 2**: Character Creation
3. **Milestone 3**: Open Space + Basic Movement
4. **Milestone 4**: Duel Arena + Challenges
5. **Milestone 5**: Polish & Responsiveness
6. **Milestone 6**: Testing & Deployment

## License

This project is licensed under the MIT License - see the LICENSE file for details.
