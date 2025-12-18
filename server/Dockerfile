FROM node:20-alpine

WORKDIR /app

# Install build dependencies for sqlite3 (python, make, g++) if needed
# Alpine usually provides prebuilts or we can use `sqlite3` package which has binaries.
# If rebuilding is needed:
# RUN apk add --no-cache python3 make g++

COPY package*.json ./

# Install dependencies (including dev for building TS)
RUN npm install

COPY . .

# Build TypeScript
RUN npm run build

# Remove devDependencies (optional, but good for size)
# RUN npm prune --production

EXPOSE 3000

CMD ["npm", "start"]
