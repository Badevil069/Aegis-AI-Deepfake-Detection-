# deploy.ps1
# Deploy Aura Aegis to Google Cloud Run

$PROJECT_ID = "project-deepfake-492800"
$REGION = "us-central1"
$SERVICE_NAME = "aura-aegis"

Write-Host "Configuring Google Cloud CLI to use project $PROJECT_ID..." -ForegroundColor Cyan
gcloud config set project $PROJECT_ID

Write-Host "Deploying $SERVICE_NAME to Cloud Run..." -ForegroundColor Cyan

# The --source . flag will automatically use the Dockerfile to build and push via Cloud Build
gcloud run deploy $SERVICE_NAME `
    --source . `
    --region $REGION `
    --allow-unauthenticated `
    --project $PROJECT_ID

Write-Host "Deployment Completed Successfully!" -ForegroundColor Green
