#!/bin/bash

# Bootstrap script for setting up the development environment
echo "Setting up development environment..."

# Copy .env.example to .env if it doesn't exist
if [ ! -f .env ]; then
  cp .env.example .env
  echo ".env file created from .env.example"
else
  echo ".env file already exists"
fi

# Install dependencies
pnpm install

