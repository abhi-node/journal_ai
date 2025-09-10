#!/bin/bash
# Script to import existing AWS resources into Terraform state
# This script is idempotent - it will only import resources that exist in AWS but not in Terraform state

set -euo pipefail

PROJECT="${PROJECT:-journalai}"
ENVIRONMENT="${ENVIRONMENT:-dev}"
PREFIX="${PROJECT}-${ENVIRONMENT}"

echo "Checking for existing Service Discovery resources..."

# Import Service Discovery namespace if it exists
NAMESPACE_NAME="${PREFIX}.local"
NAMESPACE_ID=$(aws servicediscovery list-namespaces --query "Namespaces[?Name=='$NAMESPACE_NAME'].Id | [0]" --output text 2>/dev/null || echo "")

if [ -n "$NAMESPACE_ID" ] && [ "$NAMESPACE_ID" != "None" ]; then
    echo "Found namespace $NAMESPACE_NAME with ID $NAMESPACE_ID"
    
    # Check if already in state
    if ! terraform state show aws_service_discovery_private_dns_namespace.this >/dev/null 2>&1; then
        echo "Importing namespace..."
        terraform import aws_service_discovery_private_dns_namespace.this "$NAMESPACE_ID"
    else
        echo "Namespace already in state"
    fi
    
    # Import Service Discovery service if it exists
    SERVICE_ARN=$(aws servicediscovery list-services --filters "Name=NAMESPACE_ID,Values=$NAMESPACE_ID" --query "Services[?Name=='backend'].Arn | [0]" --output text 2>/dev/null || echo "")
    
    if [ -n "$SERVICE_ARN" ] && [ "$SERVICE_ARN" != "None" ]; then
        SERVICE_ID=$(echo "$SERVICE_ARN" | awk -F'/' '{print $2}')
        echo "Found service backend with ID $SERVICE_ID"
        
        # Check if already in state
        if ! terraform state show aws_service_discovery_service.backend >/dev/null 2>&1; then
            echo "Importing service..."
            terraform import aws_service_discovery_service.backend "$SERVICE_ID"
        else
            echo "Service already in state"
        fi
    else
        echo "Service 'backend' not found in namespace"
    fi
else
    echo "Namespace $NAMESPACE_NAME not found"
fi

# Import Security Groups if they exist
DEFAULT_VPC_ID=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text 2>/dev/null || echo "")

if [ -n "$DEFAULT_VPC_ID" ]; then
    # ECS Tasks Security Group
    SG_ID=$(aws ec2 describe-security-groups --filters Name=group-name,Values="${PREFIX}-ecs-tasks-sg" Name=vpc-id,Values="$DEFAULT_VPC_ID" --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "")
    if [ -n "$SG_ID" ] && [ "$SG_ID" != "None" ]; then
        if ! terraform state show aws_security_group.ecs_tasks >/dev/null 2>&1; then
            echo "Importing ECS tasks security group $SG_ID"
            terraform import aws_security_group.ecs_tasks "$SG_ID"
        fi
    fi
    
    # VPC Link Security Group
    SG2_ID=$(aws ec2 describe-security-groups --filters Name=group-name,Values="${PREFIX}-apigw-vpc-link-sg" Name=vpc-id,Values="$DEFAULT_VPC_ID" --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "")
    if [ -n "$SG2_ID" ] && [ "$SG2_ID" != "None" ]; then
        if ! terraform state show aws_security_group.vpc_link >/dev/null 2>&1; then
            echo "Importing VPC link security group $SG2_ID"
            terraform import aws_security_group.vpc_link "$SG2_ID"
        fi
    fi
    
    # RDS Security Group
    SGRDS_ID=$(aws ec2 describe-security-groups --filters Name=group-name,Values="${PREFIX}-rds-sg" Name=vpc-id,Values="$DEFAULT_VPC_ID" --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "")
    if [ -n "$SGRDS_ID" ] && [ "$SGRDS_ID" != "None" ]; then
        if ! terraform state show aws_security_group.rds >/dev/null 2>&1; then
            echo "Importing RDS security group $SGRDS_ID"
            terraform import aws_security_group.rds "$SGRDS_ID"
        fi
    fi
fi

# Import API Gateway resources if they exist
API_NAME="${PREFIX}-http-api"
API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='$API_NAME'].ApiId | [0]" --output text 2>/dev/null || echo "")

if [ -n "$API_ID" ] && [ "$API_ID" != "None" ]; then
    echo "Found API Gateway $API_NAME with ID $API_ID"
    
    if ! terraform state show aws_apigatewayv2_api.http_api >/dev/null 2>&1; then
        echo "Importing API Gateway..."
        terraform import aws_apigatewayv2_api.http_api "$API_ID"
    fi
    
    # Import stage
    if ! terraform state show aws_apigatewayv2_stage.prod >/dev/null 2>&1; then
        echo "Importing API Gateway stage..."
        terraform import aws_apigatewayv2_stage.prod "$API_ID/prod"
    fi
    
    # Import VPC Link
    VPC_LINK_NAME="${PREFIX}-vpc-link"
    VPC_LINK_ID=$(aws apigatewayv2 get-vpc-links --query "Items[?Name=='$VPC_LINK_NAME'].VpcLinkId | [0]" --output text 2>/dev/null || echo "")
    
    if [ -n "$VPC_LINK_ID" ] && [ "$VPC_LINK_ID" != "None" ]; then
        if ! terraform state show aws_apigatewayv2_vpc_link.this >/dev/null 2>&1; then
            echo "Importing VPC Link..."
            terraform import aws_apigatewayv2_vpc_link.this "$VPC_LINK_ID"
        fi
    fi
    
    # Import integration
    INT_ID=$(aws apigatewayv2 get-integrations --api-id "$API_ID" --query "Items[0].IntegrationId" --output text 2>/dev/null || echo "")
    if [ -n "$INT_ID" ] && [ "$INT_ID" != "None" ]; then
        if ! terraform state show aws_apigatewayv2_integration.backend >/dev/null 2>&1; then
            echo "Importing API Gateway integration..."
            terraform import aws_apigatewayv2_integration.backend "$API_ID/$INT_ID"
        fi
    fi
    
    # Import routes
    ROOT_ROUTE_ID=$(aws apigatewayv2 get-routes --api-id "$API_ID" --query "Items[?RouteKey=='ANY /'].RouteId | [0]" --output text 2>/dev/null || echo "")
    if [ -n "$ROOT_ROUTE_ID" ] && [ "$ROOT_ROUTE_ID" != "None" ]; then
        if ! terraform state show aws_apigatewayv2_route.root >/dev/null 2>&1; then
            echo "Importing root route..."
            terraform import aws_apigatewayv2_route.root "$API_ID/$ROOT_ROUTE_ID"
        fi
    fi
    
    PROXY_ROUTE_ID=$(aws apigatewayv2 get-routes --api-id "$API_ID" --query "Items[?RouteKey=='ANY /{proxy+}'].RouteId | [0]" --output text 2>/dev/null || echo "")
    if [ -n "$PROXY_ROUTE_ID" ] && [ "$PROXY_ROUTE_ID" != "None" ]; then
        if ! terraform state show aws_apigatewayv2_route.proxy >/dev/null 2>&1; then
            echo "Importing proxy route..."
            terraform import aws_apigatewayv2_route.proxy "$API_ID/$PROXY_ROUTE_ID"
        fi
    fi
fi

echo "Import check complete"