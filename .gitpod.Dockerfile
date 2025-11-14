FROM gitpod/workspace-full:latest

# Install Node.js LTS and Bun
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    curl -fsSL https://bun.sh/install | bash

# Add Bun to PATH
ENV PATH="/root/.bun/bin:$PATH"

# Install global Expo CLI
RUN npm install -g expo-cli

# Install additional dependencies for React Native development
RUN apt-get update && apt-get install -y \
    git \
    curl \
    build-essential \
    python3 \
    watchman \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

RUN echo "✅ Gitpod workspace ready for Expo development!"
