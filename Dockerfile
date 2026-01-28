# Node.js Dockerfile for Hugging Face Spaces (Docker runtime)

FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    gnupg \
  && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y nodejs \
  && apt-get purge -y gnupg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production || npm install --production

# Copy source
COPY . .

ENV NODE_ENV=production
# HF Spaces exposes a dynamic $PORT; default to 7860 for local runs
ENV PORT=8000

EXPOSE 8000

CMD ["node", "app.js"]


