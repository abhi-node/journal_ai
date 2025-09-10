# Backend configuration
# This file is used when backend variables are provided
# If no backend config is provided, Terraform will use local state

terraform {
  backend "s3" {
    # Configuration provided via -backend-config flags in CI/CD
    # bucket         = provided via CLI
    # key            = provided via CLI  
    # region         = provided via CLI
    # dynamodb_table = provided via CLI (optional)
  }
}