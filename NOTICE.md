# Attribution and data licenses

## Geographic data

© OpenStreetMap contributors.

The source geographic database (`data-sources/campus.osm`) and the derived campus database (`public/data/campus.json`) are made available under the Open Data Commons Open Database License, version 1.0 (ODbL).

- Copyright / attribution: https://www.openstreetmap.org/copyright
- License text: https://opendatacommons.org/licenses/odbl/1-0/

Preserve the OpenStreetMap attribution when publishing this site or exported campus images. The app includes visible attribution and embeds it in PNG exports. Retain this notice and make the derived database available under the same license when distributing it.

## Runtime dependencies

Three.js is provided under the MIT License: https://github.com/mrdoob/three.js/blob/dev/LICENSE

Vite is provided under the MIT License: https://github.com/vitejs/vite/blob/main/LICENSE

## Reference photography

Official campus pages and photography are linked in SOURCES.md and within the app. These images are referenced for research only and are not bundled or redistributed as app assets. No ownership of those images is claimed.

## Affiliation

This is an independent campus visualization prototype, not an official Southwest University service. The decorative text emblem in the interface is not the university's official seal.

## Elevation data

Terrain Tiles / Mapzen, accessed 2026-09-23 from https://registry.opendata.aws/terrain-tiles/. SRTM terrain data courtesy of the U.S. Geological Survey. Regional source: approximately 30 m SRTM; the upstream global mosaic also uses other sources. The cached PNG and source hash are in `data-sources/terrain/`. Attribution details: https://github.com/tilezen/joerd/blob/master/docs/attribution.md .

`public/data/terrain.json` is a bilinearly resampled crop. The application derives level building/sports/water platforms and blends nearby slopes. These modifications are ours, not measurements or endorsements by the data providers. Preserve elevation attribution when redistributing the terrain or exporting images.
