FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate && pnpm install --frozen-lockfile

COPY . .
RUN pnpm run db:generate && pnpm run build
RUN pnpm prune --prod

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

EXPOSE 8080

CMD ["pnpm", "run", "start"]
