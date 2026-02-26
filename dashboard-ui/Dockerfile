FROM node:18-alpine

WORKDIR /app

# Copy package info
COPY package*.json ./

# Install dependencies cleanly
RUN npm install

# Copy application source
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Run the dev server 
CMD ["npm", "run", "dev"]
