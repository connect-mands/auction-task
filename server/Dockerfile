# Production API image — set DATABASE_URL, JWT_SECRET, etc. at run time.
# Use Debian slim to avoid Alpine musl/OpenSSL runtime issues with Prisma.
FROM node:20-bookworm-slim
WORKDIR /app
ENV PRISMA_CLI_BINARY_TARGETS=debian-openssl-3.0.x
COPY package.json ./
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/index.js"]
