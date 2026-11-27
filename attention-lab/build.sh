#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
destination=${1:?Indiquer un répertoire de sortie}
mkdir -p "$destination"
cp -R index.html attention-lab missions-albert "$destination/"
rm -f "$destination/attention-lab/build.sh"
