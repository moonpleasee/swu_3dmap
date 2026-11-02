#!/bin/sh
# Run from the project root. The short pause gives a consistent DB + files snapshot.
set -eu
mkdir -p backups
dest="backups/campus-$(date +%Y%m%d-%H%M%S).tgz"
docker compose stop app
trap 'docker compose start app >/dev/null' EXIT
docker compose run --rm --no-deps --user root -T --entrypoint tar app -C /data -czf - . > "$dest"
test -s "$dest"
echo "Saved $dest. Copy to another machine/private backup location."
