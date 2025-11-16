# Aimak Akshamy - City Newspaper

## Installation

pnpm install

## Development

pnpm dev

## Database

docker-compose up -d postgres redis
pnpm db:migrate

## Access

- Frontend: http://localhost:3000
- API: http://localhost:4000/api
- API Docs: http://localhost:4000/api/docs

## Deployment

For detailed deployment instructions to Render.com, see [DEPLOYMENT.md](./DEPLOYMENT.md)

### Quick Deploy to Render

1. Push your code to GitHub
2. Connect your repository to Render.com
3. Use the `render.yaml` Blueprint for automatic setup
4. Configure environment variables as described in DEPLOYMENT.md

For complete documentation in Russian, see [README_RU.md](./README_RU.md)
