#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting deployment to Google Cloud Run..."

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

# Fix IAM Permissions for Cloud Build
echo "🔧 Checking and fixing IAM permissions for the default compute service account..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "Granting roles/storage.admin to $SERVICE_ACCOUNT..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/storage.admin" > /dev/null 2>&1 || echo "⚠️ Could not assign storage.admin automatically. You may need Project IAM Admin permissions."

echo "Granting roles/cloudbuild.builds.builder to $SERVICE_ACCOUNT..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/cloudbuild.builds.builder" > /dev/null 2>&1 || echo "⚠️ Could not assign cloudbuild.builds.builder automatically."

# Deploy to Cloud Run
echo "🚀 Initiating Cloud Run deployment..."
gcloud run deploy veloce-ai-studio \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 80

echo "✅ Cloud Run Deployment successfully completed!"
