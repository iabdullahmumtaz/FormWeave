# FormWeave

Form builder SaaS with drag-and-drop questions, conditional logic, analytics, and Typeform-style public submissions.

## Features

- Drag-and-drop form builder (text, email, choice, rating)
- Conditional show/hide rules (AND/OR)
- Analytics: views, starts, completions, drop-off
- One-question-at-a-time public submission UI
- Multi-page UI: home, builder, analytics, public fill

## Tech Stack

| Layer    | Technology              |
|----------|-------------------------|
| Backend  | TypeScript, Node.js, Express, Mongoose, tsx |
| Frontend | TypeScript, React, Vite, React Router       |
| DnD      | @dnd-kit (typed drag-and-drop)              |
| Styling  | Tailwind CSS            |

## Ports

| Service | Port |
|---------|------|
| UI      | 5025 |
| API     | 6025 |

## Quick Start

```bash
cp .env.example .env
npm run install:all
npm run dev
```

- **UI:** http://localhost:5025
- **API:** http://localhost:6025

## Project Structure

```
FormWeave/
├── backend/          # Express API
├── frontend/         # React form builder
├── docker-compose.yml
└── package.json
```

## License

MIT
