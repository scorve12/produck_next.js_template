#!/usr/bin/env bash
# Run this once after cloning the template to initialize a new site.
# Usage: bash scripts/init.sh

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# ── helpers ──────────────────────────────────────────────────────────────────

print_step() { echo ""; echo "▶ $1"; }
error()      { echo "✗ $1" >&2; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || error "'$1' is required but not installed."
}

# Generate a v4 UUID without external deps
gen_uuid() {
  if command -v uuidgen >/dev/null 2>&1; then
    uuidgen | tr '[:upper:]' '[:lower:]'
  elif [ -r /proc/sys/kernel/random/uuid ]; then
    cat /proc/sys/kernel/random/uuid
  else
    # fallback: Python
    python3 -c "import uuid; print(uuid.uuid4())"
  fi
}

# ── 1. Project name ───────────────────────────────────────────────────────────

print_step "Project name"
read -rp "  Package name (e.g. my-site): " PROJECT_NAME
[ -z "$PROJECT_NAME" ] && error "Project name cannot be empty."

# ── 2. Tenant UUID ────────────────────────────────────────────────────────────

print_step "Tenant UUID"
NEW_UUID=$(gen_uuid)
read -rp "  Tenant UUID [enter to auto-generate: $NEW_UUID]: " USER_UUID
TENANT_UUID="${USER_UUID:-$NEW_UUID}"

# ── 3. Apply changes ──────────────────────────────────────────────────────────

print_step "Updating package.json"
PACKAGE_JSON="$ROOT/package.json"
# Replace "name" field
sed -i.bak "s/\"name\": \"[^\"]*\"/\"name\": \"$PROJECT_NAME\"/" "$PACKAGE_JSON" && rm "$PACKAGE_JSON.bak"

print_step "Updating tenant.ts"
TENANT_FILE="$ROOT/src/lib/supabase/tenant.ts"
sed -i.bak "s/\"00000000-0000-0000-0000-000000000000\"/\"$TENANT_UUID\"/" "$TENANT_FILE" && rm "$TENANT_FILE.bak"

# ── 4. .env.local ─────────────────────────────────────────────────────────────

print_step "Setting up .env.local"
ENV_EXAMPLE="$ROOT/.env.local.example"
ENV_LOCAL="$ROOT/.env.local"

if [ -f "$ENV_LOCAL" ]; then
  read -rp "  .env.local already exists. Overwrite? [y/N]: " OVERWRITE
  [[ "$OVERWRITE" =~ ^[Yy]$ ]] || { echo "  Skipped."; }
else
  cp "$ENV_EXAMPLE" "$ENV_LOCAL"
  # Pre-fill NEXT_PUBLIC_TENANT_ID
  sed -i.bak "s/^NEXT_PUBLIC_TENANT_ID=$/NEXT_PUBLIC_TENANT_ID=$TENANT_UUID/" "$ENV_LOCAL" && rm "$ENV_LOCAL.bak"
  echo "  Created .env.local — fill in Supabase keys and SMTP settings."
fi

# ── 5. Install dependencies ───────────────────────────────────────────────────

print_step "Installing dependencies"
require_cmd npm
npm install --prefix "$ROOT" --silent

# ── Done ──────────────────────────────────────────────────────────────────────

echo ""
echo "✓ Done!"
echo ""
echo "  Project : $PROJECT_NAME"
echo "  Tenant  : $TENANT_UUID"
echo ""
echo "  Next steps:"
echo "    1. Fill in .env.local (Supabase URL/keys, SMTP)"
echo "    2. Apply DB schema (see TEMPLATE.md §1.3)"
echo "    3. Insert initial admin: tenant_memberships (role='super_admin')"
echo "    4. npm run dev"
echo ""
