# Use the official Node.js image
FROM node:20

# Set the working directory
WORKDIR /app

# Copy only what’s needed
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project
COPY . .

# Expose port your app runs on
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
