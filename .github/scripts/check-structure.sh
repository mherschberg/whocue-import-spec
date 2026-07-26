#!/usr/bin/env bash
#
# Verify the import-spec repository structure.

set -euo pipefail

required_paths=(
  "README.md"
  "PROTOCOL.md"
  "LICENSING.md"
  "LICENSE-THROUGHSTONE"
  ".env.example"
  ".gitignore"
  "package.json"
  "package-lock.json"
  "scripts/validate-examples.mjs"
  "schema/README.md"
  "schema/whocue-import-v1.schema.json"
  "examples/README.md"
  "examples/valid"
  "examples/invalid"
  "instructions/README.md"
  "instructions/human-authoring-guide.md"
  "instructions/llm-generator-instructions.md"
  "instructions/people-selection-guide.md"
  ".github/workflows/ci.yml"
)

main() {
  local missing=0
  local path

  for path in "${required_paths[@]}"; do
    if [[ ! -e "${path}" ]]; then
      echo "missing required path: ${path}" >&2
      missing=1
    fi
  done

  if (( missing != 0 )); then
    return 1
  fi

  echo "import-spec repository structure ok"
}

main "$@"
