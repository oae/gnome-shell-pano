#!/usr/bin/env bash

set -e

## test if jasmine is installed
if ! command -v jasmine &>/dev/null; then

  echo "Couldn't find jasmine, get it on 'https://github.com/ptomato/jasmine-gjs'"
  exit 1

fi

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
ROOT_DIR=$(cd -- "$(dirname -- "${SCRIPT_DIR}")" &>/dev/null && pwd)

# remove old files
rm -rf "$ROOT_DIR/build/"

# compile files

yarn run tsc --outDir "$ROOT_DIR/build/"

# this is a dirty process
# but jasmine-gjs is not the best test framework, it doesn't find those dependencies otherwise (I t doesn't resolver absolute files or files inside node_modules)

ESCAPED_ROOT_DIR=$(printf '%s\n' "$ROOT_DIR" | sed -e 's/[\/&]/\\&/g')

find "$ROOT_DIR/build/" -type f -exec node "$ROOT_DIR/scripts/fix-jasmine-imports.js" "$ROOT_DIR" {} \+

# find "$ROOT_DIR/build/" -type f -exec sed -i "s/'@pano\\//'${ESCAPED_ROOT_DIR}\\/build\\/src\\//g" {} \+

#finally run jasmine

jasmine --module --verbose "$ROOT_DIR/build/tests/"
