# Google Cloud Project Configuration
project_id = "boot41"
region     = "asia-south1"

# Container Deployment Configuration
service_name    = "hr-portal"
container_image = "asia-south1-docker.pkg.dev/boot41/a3/hr-portal"
container_tag   = "latest"

# Environment Variables (Optional)
environment_variables = {
  "DEBUG"        = "false"
  "LOG_LEVEL"    = "info"
  "NODE_ENV"    = "production"
  "PORT"        = "8000"
}
