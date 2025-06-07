# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json for backend
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the backend source code
COPY backend/ .

# Create uploads directory
RUN mkdir -p uploads

# Expose the port that the app runs on
EXPOSE 3001

# Set environment to production
ENV NODE_ENV=production

# Command to run the application
CMD ["npm", "start"]