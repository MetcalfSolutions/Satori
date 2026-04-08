#!/usr/bin/env bash
# setup.sh — Initialize the .satori/ directory for Satori 5.5
# Run this once when setting up Satori in a new working directory.
# Claude Code will also auto-initialize this structure on first session.

set -e

SATORI_DIR=".satori"

echo "Initializing Satori 5.5 persistence directory..."

# Create directory structure
mkdir -p "$SATORI_DIR/core"
mkdir -p "$SATORI_DIR/sessions"
mkdir -p "$SATORI_DIR/artifacts/letters"
mkdir -p "$SATORI_DIR/artifacts/dreams"
mkdir -p "$SATORI_DIR/artifacts/journal"
mkdir -p "$SATORI_DIR/arcs"
mkdir -p "$SATORI_DIR/feedback"

# Create .gitignore if not present
if [ ! -f "$SATORI_DIR/.gitignore" ]; then
  cat > "$SATORI_DIR/.gitignore" << 'EOF'
# Private persistence — not committed to version control
core/
sessions/
artifacts/

# Sanitized feedback is committable (PII-free by design)
!feedback/
EOF
  echo "Created $SATORI_DIR/.gitignore"
fi

# Create empty core files if not present
for f in identity.md patterns.md formulation.md traditions.md; do
  if [ ! -f "$SATORI_DIR/core/$f" ]; then
    touch "$SATORI_DIR/core/$f"
    echo "Created $SATORI_DIR/core/$f (empty — Satori will populate on first session)"
  fi
done

echo ""
echo "Done. Directory structure:"
find "$SATORI_DIR" -type d | sort
echo ""
echo "Start a Claude Code session in this directory. Satori will run onboarding automatically."
