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

variable "nlb_name" {
  description = "Network Load Balancer name"
  type        = string
  default     = ""
}

variable "tg_name" {
  description = "NLB target group name"
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
