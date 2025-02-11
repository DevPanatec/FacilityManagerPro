# Use Node.js LTS version
FROM node:20-alpine

# Establecer variables de entorno
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install ALL dependencies (including devDependencies) for build
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Expose the port the app runs on
EXPOSE 3000

# Start the application in production mode
CMD ["npm", "run", "start"] 