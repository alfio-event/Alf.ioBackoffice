#!/bin/sh
target=../App_Resources/iOS/build.xcconfig
if grep -q '^PROVISIONING_PROFILE_SPECIFIER' "$target"; then
  echo "signing settings already present in $target"
  exit 0
fi
cat ../fastlane/keys/build.xcconfig >> "$target"
