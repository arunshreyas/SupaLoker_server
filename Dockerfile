FROM node:20-bullseye-slim

# Set work directory
WORKDIR /app

# Install dependencies only (use lockfile if present)
COPY package.json package-lock.json* ./
RUN set -eux; \
    if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \
    else \
      npm install --omit=dev; \
    fi

# Copy app source
COPY . .

# Environment
ENV NODE_ENV=production \
    PORT=4001

# Use non-root user for security
USER node

# Expose runtime port (configurable via PORT env)
EXPOSE 4001

# Start the server
CMD ["npm", "start"]
