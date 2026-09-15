#!/usr/bin/env bash
# Copy the freshly built APK to where the backend serves it from, so the download link
# is never one build behind. Run after ./gradlew assembleDebug.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/frontend/android/app/build/outputs/apk/debug/app-debug.apk"
DST="$ROOT/backend/static/digi-sanrakshak.apk"
[ -f "$SRC" ] || { echo "no APK at $SRC - run ./gradlew assembleDebug first"; exit 1; }
mkdir -p "$(dirname "$DST")"
cp "$SRC" "$DST"
echo "published $(du -h "$DST" | cut -f1) -> backend/static/"
echo "commit and push; Render redeploys and the link serves the new build."
