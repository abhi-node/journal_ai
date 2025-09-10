variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "project" {
  description = "Project name prefix"
  type        = string
  default     = "journalai"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "ecr_repository_name" {
  description = "ECR repository name for backend image"
  type        = string
  default     = ""
}

variable "image_tag" {
  description = "Image tag to deploy (e.g., dev-latest or a SHA)"
  type        = string
  default     = "dev-latest"
}

variable "ecs_cluster_name" {
  description = "ECS cluster name"
  type        = string
  default     = ""
}

variable "ecs_service_name" {
  description = "ECS service name"
  type        = string
  default     = ""
}

variable "api_name" {
  description = "API Gateway HTTP API name"
  type        = string
  default     = ""
}


variable "vpc_link_name" {
  description = "API Gateway VPC Link name"
  type        = string
  default     = ""
}

variable "secret_key" {
  description = "App SECRET_KEY"
  type        = string
  sensitive   = true
  default     = ""
}

variable "openai_api_key" {
  description = "OpenAI API Key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "database_url" {
  description = "Database URL"
  type        = string
  default     = "postgresql://journalai:journalai@127.0.0.1:5432/journalai"
}

variable "redis_url" {
  description = "Redis URL"
  type        = string
  default     = "redis://127.0.0.1:6379/0"
}

# RDS Postgres configuration
variable "db_name" {
  description = "Postgres database name"
  type        = string
  default     = "journalai"
}

variable "db_username" {
  description = "Postgres master username"
  type        = string
  default     = "journalai"
}

variable "db_password" {
  description = "Postgres master password (leave empty to auto-generate)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "db_engine_version" {
  description = "Postgres engine version"
  type        = string
  default     = "15.7"
}

variable "db_allocated_storage" {
  description = "Allocated storage (GB)"
  type        = number
  default     = 20
}

variable "db_publicly_accessible" {
  description = "Whether RDS instance is publicly accessible"
  type        = bool
  default     = true
}

variable "apigw_excluded_az_ids" {
  description = "List of AZ IDs to exclude from API Gateway VPC Link subnets (e.g., [\"use1-az3\"])"
  type        = list(string)
  default     = []
}

variable "use_existing_namespace" {
  description = "Whether to use existing Service Discovery namespace"
  type        = bool
  default     = false
}
