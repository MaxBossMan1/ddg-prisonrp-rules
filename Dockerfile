# Use a Debian-based Node image (avoids Alpine musl build issues)
FROM node:18-slim AS base

# Install native build dependencies required by sharp & better-sqlite3
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        python3 \
        make \
        g++ \
        pkg-config \
        libvips-dev \
        sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Set workdir
WORKDIR /app

# Copy backend package files and install only production deps (these include native modules)
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend source
COPY backend/ .

# Ensure uploads dir exists
RUN mkdir -p uploads

EXPOSE 3001
ENV NODE_ENV=production

CMD ["npm", "start"]