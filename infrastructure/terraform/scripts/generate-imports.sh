#!/bin/bash
# Generate import blocks with actual resource IDs from AWS
# This runs BEFORE terraform plan to create concrete import statements

set -euo pipefail

PROJECT="${PROJECT:-journalai}"
ENVIRONMENT="${ENVIRONMENT:-dev}"
AWS_REGION="${AWS_REGION:-us-east-1}"
PREFIX="${PROJECT}-${ENVIRONMENT}"

# Output file for generated imports
OUTPUT_FILE="imports_generated.tf"

echo "# Auto-generated import blocks - DO NOT EDIT MANUALLY" > $OUTPUT_FILE
echo "# Generated at $(date)" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Get VPC ID
VPC_ID=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text 2>/dev/null || echo "")
echo "# VPC ID: $VPC_ID" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# 1. Service Discovery Namespace
echo "# Service Discovery Namespace" >> $OUTPUT_FILE
NAMESPACE_NAME="${PREFIX}.local"
NAMESPACE_ID=$(aws servicediscovery list-namespaces --query "Namespaces[?Name=='$NAMESPACE_NAME'].Id | [0]" --output text 2>/dev/null || echo "")

if [ -n "$NAMESPACE_ID" ] && [ "$NAMESPACE_ID" != "None" ] && [ -n "$VPC_ID" ]; then
    echo "import {" >> $OUTPUT_FILE
    echo "  to = aws_service_discovery_private_dns_namespace.this" >> $OUTPUT_FILE
    echo "  id = \"${NAMESPACE_ID}:${VPC_ID}\"" >> $OUTPUT_FILE
    echo "}" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
    
    # 2. Service Discovery Service
    echo "# Service Discovery Service" >> $OUTPUT_FILE
    SERVICE_ARN=$(aws servicediscovery list-services --filters "Name=NAMESPACE_ID,Values=$NAMESPACE_ID" --query "Services[?Name=='backend'].Arn | [0]" --output text 2>/dev/null || echo "")
    if [ -n "$SERVICE_ARN" ] && [ "$SERVICE_ARN" != "None" ]; then
        SERVICE_ID=$(echo "$SERVICE_ARN" | awk -F'/' '{print $2}')
        echo "import {" >> $OUTPUT_FILE
        echo "  to = aws_service_discovery_service.backend" >> $OUTPUT_FILE
        echo "  id = \"$SERVICE_ID\"" >> $OUTPUT_FILE
        echo "}" >> $OUTPUT_FILE
        echo "" >> $OUTPUT_FILE
    fi
fi

# 3. Security Groups
if [ -n "$VPC_ID" ]; then
    echo "# Security Groups" >> $OUTPUT_FILE
    
    # ECS Tasks Security Group
    SG_ID=$(aws ec2 describe-security-groups --filters Name=group-name,Values="${PREFIX}-ecs-tasks-sg" Name=vpc-id,Values="$VPC_ID" --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "")
    if [ -n "$SG_ID" ] && [ "$SG_ID" != "None" ]; then
        echo "import {" >> $OUTPUT_FILE
        echo "  to = aws_security_group.ecs_tasks" >> $OUTPUT_FILE
        echo "  id = \"$SG_ID\"" >> $OUTPUT_FILE
        echo "}" >> $OUTPUT_FILE
        echo "" >> $OUTPUT_FILE
    fi
    
    # VPC Link Security Group
    SG2_ID=$(aws ec2 describe-security-groups --filters Name=group-name,Values="${PREFIX}-apigw-vpc-link-sg" Name=vpc-id,Values="$VPC_ID" --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "")
    if [ -n "$SG2_ID" ] && [ "$SG2_ID" != "None" ]; then
        echo "import {" >> $OUTPUT_FILE
        echo "  to = aws_security_group.vpc_link" >> $OUTPUT_FILE
        echo "  id = \"$SG2_ID\"" >> $OUTPUT_FILE
        echo "}" >> $OUTPUT_FILE
        echo "" >> $OUTPUT_FILE
    fi
    
    # RDS Security Group
    SGRDS_ID=$(aws ec2 describe-security-groups --filters Name=group-name,Values="${PREFIX}-rds-sg" Name=vpc-id,Values="$VPC_ID" --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "")
    if [ -n "$SGRDS_ID" ] && [ "$SGRDS_ID" != "None" ]; then
        echo "import {" >> $OUTPUT_FILE
        echo "  to = aws_security_group.rds" >> $OUTPUT_FILE
        echo "  id = \"$SGRDS_ID\"" >> $OUTPUT_FILE
        echo "}" >> $OUTPUT_FILE
        echo "" >> $OUTPUT_FILE
    fi
fi

# 4. API Gateway Resources
echo "# API Gateway Resources" >> $OUTPUT_FILE
API_NAME="${PREFIX}-http-api"
API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='$API_NAME'].ApiId | [0]" --output text 2>/dev/null || echo "")

if [ -n "$API_ID" ] && [ "$API_ID" != "None" ]; then
    echo "import {" >> $OUTPUT_FILE
    echo "  to = aws_apigatewayv2_api.http_api" >> $OUTPUT_FILE
    echo "  id = \"$API_ID\"" >> $OUTPUT_FILE
    echo "}" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
    
    # Stage
    echo "import {" >> $OUTPUT_FILE
    echo "  to = aws_apigatewayv2_stage.prod" >> $OUTPUT_FILE
    echo "  id = \"${API_ID}/prod\"" >> $OUTPUT_FILE
    echo "}" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
    
    # VPC Link
    VPC_LINK_NAME="${PREFIX}-vpc-link"
    VPC_LINK_ID=$(aws apigatewayv2 get-vpc-links --query "Items[?Name=='$VPC_LINK_NAME'].VpcLinkId | [0]" --output text 2>/dev/null || echo "")
    if [ -n "$VPC_LINK_ID" ] && [ "$VPC_LINK_ID" != "None" ]; then
        echo "import {" >> $OUTPUT_FILE
        echo "  to = aws_apigatewayv2_vpc_link.this" >> $OUTPUT_FILE
        echo "  id = \"$VPC_LINK_ID\"" >> $OUTPUT_FILE
        echo "}" >> $OUTPUT_FILE
        echo "" >> $OUTPUT_FILE
    fi
    
    # Integration
    INT_ID=$(aws apigatewayv2 get-integrations --api-id "$API_ID" --query "Items[0].IntegrationId" --output text 2>/dev/null || echo "")
    if [ -n "$INT_ID" ] && [ "$INT_ID" != "None" ]; then
        echo "import {" >> $OUTPUT_FILE
        echo "  to = aws_apigatewayv2_integration.backend" >> $OUTPUT_FILE
        echo "  id = \"${API_ID}/${INT_ID}\"" >> $OUTPUT_FILE
        echo "}" >> $OUTPUT_FILE
        echo "" >> $OUTPUT_FILE
    fi
    
    # Routes
    ROOT_ROUTE_ID=$(aws apigatewayv2 get-routes --api-id "$API_ID" --query "Items[?RouteKey=='ANY /'].RouteId | [0]" --output text 2>/dev/null || echo "")
    if [ -n "$ROOT_ROUTE_ID" ] && [ "$ROOT_ROUTE_ID" != "None" ]; then
        echo "import {" >> $OUTPUT_FILE
        echo "  to = aws_apigatewayv2_route.root" >> $OUTPUT_FILE
        echo "  id = \"${API_ID}/${ROOT_ROUTE_ID}\"" >> $OUTPUT_FILE
        echo "}" >> $OUTPUT_FILE
        echo "" >> $OUTPUT_FILE
    fi
    
    PROXY_ROUTE_ID=$(aws apigatewayv2 get-routes --api-id "$API_ID" --query "Items[?RouteKey=='ANY /{proxy+}'].RouteId | [0]" --output text 2>/dev/null || echo "")
    if [ -n "$PROXY_ROUTE_ID" ] && [ "$PROXY_ROUTE_ID" != "None" ]; then
        echo "import {" >> $OUTPUT_FILE
        echo "  to = aws_apigatewayv2_route.proxy" >> $OUTPUT_FILE
        echo "  id = \"${API_ID}/${PROXY_ROUTE_ID}\"" >> $OUTPUT_FILE
        echo "}" >> $OUTPUT_FILE
        echo "" >> $OUTPUT_FILE
    fi
fi

# 5. Resources with known names (always include these)
echo "# Resources with known names" >> $OUTPUT_FILE
cat >> $OUTPUT_FILE << 'EOF'
import {
  to = aws_ecr_repository.backend
  id = "journalai-dev-backend"
}

import {
  to = aws_iam_role.ecs_task_execution_role
  id = "journalai-dev-ecsTaskExecutionRole"
}

import {
  to = aws_cloudwatch_log_group.ecs
  id = "/ecs/journalai-dev-service"
}

import {
  to = aws_db_subnet_group.db
  id = "journalai-dev-db-subnets"
}

import {
  to = aws_ecs_cluster.this
  id = "journalai-dev-cluster"
}

import {
  to = aws_ecs_service.backend
  id = "journalai-dev-cluster/journalai-dev-service"
}

import {
  to = aws_db_instance.postgres
  id = "journalai-dev-db"
}
EOF

echo "Generated import blocks in $OUTPUT_FILE"
cat $OUTPUT_FILE