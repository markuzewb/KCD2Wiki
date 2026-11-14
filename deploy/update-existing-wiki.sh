#!/usr/bin/env bash
# KCD2RP Wiki v0.4 safe update: no changes to data/ or installed secrets.
set -Eeuo pipefail
SOURCE="${1:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)}"
DEST="${2:-/srv/kcd2rp-wiki}"
if [[ ! -f "$SOURCE/server.js" || ! -f "$SOURCE/wiki-icons-api.js" || ! -f "$SOURCE/catalog/icons.json" || ! -f "$SOURCE/catalog/item-icon-map.json" ]]; then
  echo 'Source must be the unpacked KCD2RP Wiki v0.4 directory' >&2;exit 2
fi
if [[ ! -d "$DEST" ]];then echo "Installed directory not found: $DEST" >&2;exit 2;fi
if [[ "$(realpath -m "$SOURCE")" == "$(realpath -m "$DEST")" ]];then
 echo 'Source and destination must be different directories' >&2;exit 2
fi
mkdir -p "$DEST/public" "$DEST/catalog" "$DEST/tools" "$DEST/data"
for entry in wiki.json game-catalog.json map-markers.json;do
 if [[ -f "$DEST/data/$entry" ]];then
  cp -p -- "$DEST/data/$entry" "$DEST/data/${entry%.json}.before-v04.$(date -u +%Y%m%dT%H%M%SZ).json"
 fi
done
# Never copy or overwrite data/*. The site owns edited articles, catalog overrides and media.
cp -a -- "$SOURCE/server.js" "$SOURCE/game-catalog-api.js" "$SOURCE/wiki-extra-api.js" "$SOURCE/wiki-icons-api.js" "$SOURCE/package.json" "$DEST/"
cp -a -- "$SOURCE/public/." "$DEST/public/"
cp -a -- "$SOURCE/catalog/." "$DEST/catalog/"
cp -a -- "$SOURCE/tools/." "$DEST/tools/"
cp -a -- "$SOURCE/README.md" "$SOURCE/THIRD_PARTY_NOTICES.md" "$DEST/"
for f in server.js game-catalog-api.js wiki-extra-api.js wiki-icons-api.js public/app.js public/wiki-extra.js public/wiki-icons.js;do
 node --check "$DEST/$f"
done
if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet kcd2rp-wiki 2>/dev/null;then
 systemctl restart kcd2rp-wiki
 echo 'Restarted kcd2rp-wiki'
else echo 'Restart the running Wiki manually if needed.'
fi
cat <<'END'
KCD2RP Wiki v0.4 installed. Updated item icons, recipes, icon gallery, assets.
These were NOT replaced:
 data/wiki.json           - edited articles
 data/game-catalog.json   - imported catalog override
 data/map-markers.json    - atlas markers
 data/media/items/        - manually uploaded item images
 /etc/kcd2rp-wiki.env     - production credentials
Verify GET /api/icons/meta and GET /api/game/items after restart.
END
