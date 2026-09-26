#!/usr/bin/env bash
#
# Build the testers' package: a small, email-friendly ZIP of the import
# directions, both schemas, and a few synthetic examples, for people who try
# WhoCue without cloning this repository.
#
# Output: dist/whocue-import-instructions-for-testers.zip (dist/ is ignored).
# The package's top-level README comes from packaging/testers/README.md; every
# other file is copied unchanged from the repository. The build fails if a
# listed file is missing or if a Markdown file in the package names a file the
# package doesn't carry, so a doc change can't leave testers with a dangling
# reference. (examples/README.md is exempt: it catalogs the whole fixture
# corpus, and the package carries only a few examples.)

set -euo pipefail

readonly PACKAGE_NAME="WhoCue-import-instructions-for-testers"
readonly OUTPUT="dist/whocue-import-instructions-for-testers.zip"

# Files copied into the package, relative to the repository root. Keep this in
# step with what the packaged docs link to; the reference check enforces it.
readonly PACKAGE_FILES=(
  "PROTOCOL.md"
  "LICENSE"
  "LICENSING.md"
  "LICENSE-THROUGHSTONE"
  "instructions/README.md"
  "instructions/llm-generator-instructions.md"
  "instructions/human-authoring-guide.md"
  "instructions/people-selection-guide.md"
  "instructions/generation-workflow.md"
  "instructions/handoff-export-processing.md"
  "schema/README.md"
  "schema/whocue-import-v1.schema.json"
  "schema/whocue-handoff-v1.schema.json"
  "examples/README.md"
  "examples/valid/minimal.json"
  "examples/valid/realistic-demo.json"
  "examples/valid/realistic-demo.zip"
  "examples/valid/package-file-image.json"
  "examples/valid/remote-url-image.json"
)

# Copies the listed files and the testers README into [package_dir].
stage_package() {
  local package_dir="$1"
  local path

  mkdir -p "${package_dir}"
  cp "packaging/testers/README.md" "${package_dir}/README.md"
  for path in "${PACKAGE_FILES[@]}"; do
    if [[ ! -f "${path}" ]]; then
      echo "missing package file: ${path}" >&2
      return 1
    fi
    mkdir -p "${package_dir}/$(dirname "${path}")"
    cp "${path}" "${package_dir}/${path}"
  done
}

# Prints every file path a Markdown file names: backticked paths ending in
# .md, .json, or .zip, and relative Markdown link targets.
referenced_paths() {
  local markdown_file="$1"

  {
    grep -oE '`(\.\./|\./)?[A-Za-z0-9_./-]+\.(md|json|zip)`' "${markdown_file}" |
      tr -d '`' || true
    grep -oE '\]\((\.\./|\./)?[A-Za-z0-9_./-]+\)' "${markdown_file}" |
      sed -E 's/^\]\(//; s/\)$//' || true
  } | sort -u
}

# Fails when a packaged Markdown file names a file the package lacks. A
# reference may be relative to the naming file or to the package root, the
# two conventions the docs use.
check_references() {
  local package_dir="$1"
  local markdown_file
  local reference
  local missing=0

  while IFS= read -r markdown_file; do
    if [[ "${markdown_file}" == "${package_dir}/examples/README.md" ]]; then
      continue
    fi
    while IFS= read -r reference; do
      [[ -z "${reference}" ]] && continue
      if [[ ! -e "$(dirname "${markdown_file}")/${reference}" &&
        ! -e "${package_dir}/${reference}" ]]; then
        echo "dangling reference in ${markdown_file#"${package_dir}"/}: ${reference}" >&2
        missing=1
      fi
    done < <(referenced_paths "${markdown_file}")
  done < <(find "${package_dir}" -name '*.md' -type f | sort)

  return "${missing}"
}

# Staging directory, global so the EXIT trap can still see it after main().
staging=""

main() {
  cd "$(dirname "$0")/.."

  staging="$(mktemp -d)"
  trap 'rm -rf "${staging}"' EXIT

  stage_package "${staging}/${PACKAGE_NAME}"
  check_references "${staging}/${PACKAGE_NAME}"

  mkdir -p dist
  rm -f "${OUTPUT}"
  local output_path
  output_path="$(pwd)/${OUTPUT}"
  (cd "${staging}" && zip -q -r -X "${output_path}" "${PACKAGE_NAME}")

  echo "testers package ok: ${OUTPUT} ($(find "${staging}/${PACKAGE_NAME}" -type f | wc -l | tr -d ' ') files)"
}

main "$@"
