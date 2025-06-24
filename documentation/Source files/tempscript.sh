#!/bin/bash

# --- Config ---
STACK_NAME="stack"  # Change if your stack name differs
AWS_REGION="us-east-1"     # Update if needed

# --- Fetch CloudFormation Outputs ---
echo "🔍 Fetching stack outputs..."
OUTPUTS=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION | jq -r '.Stacks[0].Outputs[] | {key: .OutputKey, value: .OutputValue} | join("=")')

# Parse outputs
for output in $OUTPUTS; do
  case "${output%=*}" in
    "UserPoolId") USER_POOL_ID="${output#*=}" ;;
    "UserPoolClientId") CLIENT_ID="${output#*=}" ;;
    "WebsiteURL") WEBSITE_URL="${output#*=}" ;;
    "ApiEndpoint") API_ENDPOINT="${output#*=}" ;;
    "CognitoDomain") COGNITO_DOMAIN="${output#*=}" ;;
  esac
done

# --- Generate Cognito Login URL ---
LOGIN_URL="https://${COGNITO_DOMAIN}.auth.${AWS_REGION}.amazoncognito.com/login?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${WEBSITE_URL}"

# --- Display Credentials ---
echo -e "\n🔑 === Frontend Credentials ==="
echo "AWS Region:         $AWS_REGION"
echo "Cognito UserPool ID: $USER_POOL_ID"
echo "Cognito Client ID:   $CLIENT_ID"
echo "Login URL:          $LOGIN_URL"
echo "Website URL:        $WEBSITE_URL"
echo "API Base URL:       $API_ENDPOINT"

# --- Test API ---
echo -e "\n🧪 === Testing API ==="

echo -e "\nPOST /api/products/laptop (sample):"
curl -s -X POST "${API_ENDPOINT}/api/products/tablet" \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Apple",
    "modelName": "iPad Pro",
    "memoryStorageCapacity": 256,
    "ram": 8,
    "displayResolutionMaximum": "2732x2048",
    "color": "Space Gray",
    "description": "12.9-inch Liquid Retina XDR display",
    "price": 1099.99,
    "category": "tablets",
    "imageUrl": "https://example.com/ipad-pro.jpg"
  }' | jq
  
echo "GET /api/products:"
curl -s "${API_ENDPOINT}/api/products" | jq
echo -e "\n✅ Done! Use the credentials above in your frontend."