#!/usr/bin/env bash
#
# Verify the STEP-2 import-spec skeleton without depending on schema artifacts.

set -euo pipefail

required_paths=(
  "README.md"
  "LICENSING.md"
  "LICENSE-THROUGHSTONE"
  ".env.example"
  ".gitignore"
  "schema/README.md"
  "examples/README.md"
  "instructions/README.md"
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

  echo "import-spec skeleton structure ok"
}

main "$@"
