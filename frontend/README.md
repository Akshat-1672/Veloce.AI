# Veloce.AI - Google Cloud Deployment

This project is fully configured for deployment on Google Cloud. Since I am an AI assistant, I cannot execute commands directly on your Google Cloud account. You will need to run one of the following commands in your **Google Cloud Shell** or local terminal (with the gcloud CLI installed).

## Option 1: Deploy to Google Cloud Run (Recommended)
Cloud Run will build the Dockerfile and host the Nginx container automatically.

1. Open your terminal or Google Cloud Shell.
2. Make the script executable:
   ```bash
   chmod +x deploy-cloudrun.sh
   ```
3. Execute the deployment script:
   ```bash
   ./deploy-cloudrun.sh
   ```
*(Alternatively, you can run: `gcloud run deploy veloce-ai-studio --source . --platform managed --region us-central1 --allow-unauthenticated --port 80`)*

## Option 2: Deploy to Google App Engine
App Engine will host the raw files as a highly scalable static website.

1. Open your terminal or Google Cloud Shell.
2. Make the script executable:
   ```bash
   chmod +x deploy-appengine.sh
   ```
3. Execute the deployment script:
   ```bash
   ./deploy-appengine.sh
   ```
*(Alternatively, you can run: `gcloud app deploy app.yaml --quiet`)*

---
**Note on API Keys:** Ensure that your deployment environment is configured to inject the `API_KEY` environment variable so the Gemini SDK can authenticate successfully.
