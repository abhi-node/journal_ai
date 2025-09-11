resource "aws_apigatewayv2_api" "http_api" {
  name          = local.api_name
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_vpc_link" "this" {
  name               = local.vpc_link_name
  subnet_ids         = local.vpc_link_subnets
  security_group_ids = [aws_security_group.vpc_link.id]
  lifecycle {
    precondition {
      condition     = length(local.vpc_link_subnets) >= 2
      error_message = "VPC Link requires at least two subnets; adjust apigw_excluded_az_ids to include only supported AZ IDs."
    }
  }
}

resource "aws_apigatewayv2_integration" "backend" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "HTTP_PROXY"
  connection_type        = "VPC_LINK"
  connection_id          = aws_apigatewayv2_vpc_link.this.id
  integration_method     = "ANY"
  payload_format_version = "1.0"
  # Direct connection to ECS service via service discovery - must use the ARN
  integration_uri      = aws_service_discovery_service.backend.arn
  timeout_milliseconds = 30000
}

resource "aws_apigatewayv2_route" "root" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /"
  target    = "integrations/${aws_apigatewayv2_integration.backend.id}"
}

resource "aws_apigatewayv2_route" "proxy" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.backend.id}"
}

resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "prod"
  auto_deploy = true
}

output "api_gateway_invoke_url" {
  value = "https://${aws_apigatewayv2_api.http_api.id}.execute-api.${var.aws_region}.amazonaws.com/prod"
}

output "api_gateway_id" {
  value = aws_apigatewayv2_api.http_api.id
  description = "ID of the API Gateway"
}

output "vpc_link_id" {
  value = aws_apigatewayv2_vpc_link.this.id
  description = "ID of the VPC Link"
}

# Build filtered subnet list for VPC Link (exclude unsupported AZ IDs if provided)
data "aws_subnet" "default_subnets" {
  for_each = toset(data.aws_subnets.default.ids)
  id       = each.value
}

locals {
  # If the caller did not provide excluded AZ IDs, apply a sane default for us-east-1
  # where API Gateway VPC Link commonly does not support use1-az3. Callers can override
  # via var.apigw_excluded_az_ids.
  apigw_excluded_az_ids_effective = length(var.apigw_excluded_az_ids) > 0 ? var.apigw_excluded_az_ids : (
    var.aws_region == "us-east-1" ? ["use1-az3"] : []
  )

  vpc_link_subnets = [
    for s in data.aws_subnet.default_subnets : s.id
    if length(local.apigw_excluded_az_ids_effective) == 0 || !contains(local.apigw_excluded_az_ids_effective, s.availability_zone_id)
  ]
}
