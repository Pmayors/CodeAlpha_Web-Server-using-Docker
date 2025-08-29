# Use official Node.js LTS image
# Use an official Node.js runtime as a base image
FROM node:16-alpine

# Set working directory inside container
WORKDIR /app

# Copy only package files first for layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose the port the backend runs on
EXPOSE 3000

# Start the backend server
CMD ["npm", "start"]

