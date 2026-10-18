#!/usr/bin/env sh
set -e
cp scripts/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
echo "Installed Satori pre-commit hook -> .git/hooks/pre-commit"
