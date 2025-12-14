FROM node:22.10

WORKDIR /app

# Install system dependencies required by Playwright
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Install Playwright browsers and dependencies
RUN npx playwright install --with-deps chromium

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]
