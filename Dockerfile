# Use Node.js LTS version as base image
FROM node:lts-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy app source code
COPY . .

# Expose port 5005
EXPOSE 5005

# Command to run the application
CMD ["npm", "start"]