#!/bin/bash

# Script to regenerate test certificates for Auth0 Extension Tools
# Generates new RSA key pairs and self-signed certificates for testing

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="$SCRIPT_DIR/tests/mocks/certs.json"

echo -e "${BLUE}🔄 Regenerating test certificates for Auth0 Extension Tools${NC}"

# Check if OpenSSL is available
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}❌ Error: OpenSSL is not installed or not in PATH${NC}"
    echo -e "${YELLOW}💡 Please install OpenSSL:${NC}"
    echo "   macOS: brew install openssl"
    echo "   Ubuntu/Debian: sudo apt-get install openssl"
    echo "   CentOS/RHEL: sudo yum install openssl"
    exit 1
fi

echo -e "${GREEN}✅ OpenSSL found: $(openssl version)${NC}"

# Create temporary directory for certificate generation
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo -e "${BLUE}📁 Using temporary directory: $TEMP_DIR${NC}"

# Function to generate a certificate set (private key, public key, and certificate)
generate_cert_set() {
    local name=$1
    local temp_prefix="$TEMP_DIR/$name"
    
    echo -e "${BLUE}🔑 Generating certificate set for: $name${NC}"
    
    # Generate private key (2048-bit RSA)
    openssl genrsa -out "${temp_prefix}_private.pem" 2048 2>/dev/null
    
    # Generate public key from private key
    openssl rsa -pubout -in "${temp_prefix}_private.pem" -out "${temp_prefix}_public.pem" 2>/dev/null
    
    # Generate self-signed certificate (valid for 1 year)
    openssl req -new -x509 \
        -key "${temp_prefix}_private.pem" \
        -out "${temp_prefix}_cert.pem" \
        -days 365 \
        -subj "/C=US/ST=Test/L=TestCity/O=Auth0 Extension Test/CN=${name}.example.com" \
        2>/dev/null
    
    echo -e "${GREEN}  ✓ Generated private key, public key, and certificate for $name${NC}"
}

# Function to convert PEM to JSON format (with \r\n line endings)
pem_to_json() {
    local file=$1
    # Read file and convert newlines to \r\n for JSON format
    cat "$file" | awk '{printf "%s\\r\\n", $0}' | sed 's/\\r\\n$//'
}

# Generate certificates for both 'bar' and 'foo'
generate_cert_set "bar"
generate_cert_set "foo"

echo -e "${BLUE}📝 Creating JSON file...${NC}"

# Ensure output directory exists
mkdir -p "$(dirname "$OUTPUT_FILE")"

# Create the JSON structure
cat > "$OUTPUT_FILE" << EOF
{
  "bar": {
    "private": "$(pem_to_json "$TEMP_DIR/bar_private.pem")",
    "public": "$(pem_to_json "$TEMP_DIR/bar_public.pem")",
    "cert": "$(pem_to_json "$TEMP_DIR/bar_cert.pem")"
  },
  "foo": {
    "private": "$(pem_to_json "$TEMP_DIR/foo_private.pem")",
    "public": "$(pem_to_json "$TEMP_DIR/foo_public.pem")",
    "cert": "$(pem_to_json "$TEMP_DIR/foo_cert.pem")"
  }
}
EOF

echo -e "${GREEN}✅ Certificate generation complete!${NC}"
echo -e "${GREEN}📄 New certificates saved to: $OUTPUT_FILE${NC}"
echo -e "${GREEN}🔐 Both 'bar' and 'foo' certificate sets have been regenerated${NC}"

# Display some info about the generated certificates
echo -e "\n${BLUE}📋 Certificate Information:${NC}"
for name in bar foo; do
    echo -e "\n${YELLOW}$name certificate:${NC}"
    openssl x509 -in "$TEMP_DIR/${name}_cert.pem" -noout -subject -dates 2>/dev/null
done

echo -e "\n${GREEN}🎉 Certificate regeneration completed successfully!${NC}"
