# Service Discovery namespace - fully managed by Terraform
resource "aws_service_discovery_private_dns_namespace" "this" {
  name        = "${var.project}-${var.environment}.local"
  description = "Private namespace for ${var.project} ${var.environment}"
  vpc         = data.aws_vpc.default.id
  
  lifecycle {
    create_before_destroy = true
  }
}

# Service Discovery service - fully managed by Terraform
resource "aws_service_discovery_service" "backend" {
  name = "backend"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.this.id

    dns_records {
      ttl  = 10
      type = "A"
    }
    
    # Add SRV record to include port information
    dns_records {
      ttl  = 10
      type = "SRV"
    }

    routing_policy = "MULTIVALUE"
  }

  # ECS handles health checks automatically
  # No health_check_custom_config needed
  
  lifecycle {
    create_before_destroy = true
  }
}

output "service_discovery_arn" {
  value       = aws_service_discovery_service.backend.arn
  description = "ARN of the service discovery service for backend"
}