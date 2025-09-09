locals {
  name_prefix = "${var.project}-${var.environment}"

  ecr_repo_name    = var.ecr_repository_name != "" ? var.ecr_repository_name : "${local.name_prefix}-backend"
  ecs_cluster_name = var.ecs_cluster_name != "" ? var.ecs_cluster_name : "${local.name_prefix}-cluster"
  ecs_service_name = var.ecs_service_name != "" ? var.ecs_service_name : "${local.name_prefix}-service"
  api_name         = var.api_name != "" ? var.api_name : "${local.name_prefix}-http-api"
  nlb_name         = var.nlb_name != "" ? var.nlb_name : "${local.name_prefix}-nlb"
  tg_name          = var.tg_name != "" ? var.tg_name : "${local.name_prefix}-tg"
  vpc_link_name    = var.vpc_link_name != "" ? var.vpc_link_name : "${local.name_prefix}-vpc-link"
}
