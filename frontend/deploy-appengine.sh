#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting deployment to Google App Engine..."

# Ensure the user is authenticated
echo "Checking Google Cloud authentication..."
gcloud auth print-identity-token > /dev/null 2>&1 || {
    echo "❌ You are not authenticated. Please run 'gcloud auth login' first."
    exit 1
}

# Prompt for Project ID if not set
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    read -p "Enter your Google Cloud Project ID: " PROJECT_ID
    gcloud config set project $PROJECT_ID
fi

echo "📦 Deploying to project: $PROJECT_ID"

# Deploy to App Engine
gcloud app deploy app.yaml --quiet

echo "✅ App Engine Deployment successfully completed!"
