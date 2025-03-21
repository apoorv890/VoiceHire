FROM node:18-slim AS base

# Install Python and required dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-full \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Create Python virtual environment and install dependencies
RUN cd agent && \
    python3 -m venv venv && \
    . venv/bin/activate && \
    pip3 install --no-cache-dir -r requirements.txt

# Build the React frontend with production API URL
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8000

# Expose port 8000
EXPOSE 8000

# Create a startup script
RUN echo '#!/bin/bash\n\
# Start the Python agent in the background with nohup\n\
cd /app/agent && source venv/bin/activate && nohup python3 agent.py start > /app/agent/agent.log 2>&1 &\n\
\n\
# Start the Express server\n\
cd /app && node server/index.js\n\
' > /app/start.sh && chmod +x /app/start.sh

# Start both services
CMD ["/app/start.sh"]
