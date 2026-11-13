# Attribution and data licenses

## Project code

Required Notice: Copyright (c) 2026 moonpleasee and contributors.

Project-owned code is offered under the PolyForm Noncommercial License 1.0.0.
The complete terms are in LICENSE. These terms apply to code the project authors
have the right to license. Third-party software, geographic data, elevation data,
and reference materials retain their respective licenses and notices below.
Commercial use outside the purposes permitted by that license requires prior,
separate written permission from the relevant rightsholders. Contact maintainer
moonpleasee through https://github.com/moonpleasee/swu_3dmap/issues to request
permission. An inquiry alone does not grant permission. Scope, duration and any
fees are subject to a separate agreement. Third-party rights remain governed by
their own terms.

## Geographic data

© OpenStreetMap contributors.

The source geographic database (`data-sources/campus.osm`) and the derived campus database (`public/data/campus.json`) are made available under the Open Data Commons Open Database License, version 1.0 (ODbL).

- Copyright / attribution: https://www.openstreetmap.org/copyright
- License text: https://opendatacommons.org/licenses/odbl/1-0/

Preserve the OpenStreetMap attribution when publishing this site or exported campus images. The app includes visible attribution and embeds it in PNG exports. Retain this notice and make the derived database available under the same license when distributing it.

## Runtime dependencies

Three.js is provided under the MIT License: https://github.com/mrdoob/three.js/blob/dev/LICENSE

Vite is provided under the MIT License: https://github.com/vitejs/vite/blob/main/LICENSE

The production frontend also includes polygon-clipping (MIT), splaytree (MIT),
and robust-predicates (Unlicense). Complete frontend dependency notices are in
`public/THIRD-PARTY-NOTICES.txt`, which is copied into the static distribution.

The backend uses Express, express-rate-limit, Helmet and Multer (MIT), and Sharp
(Apache-2.0). Playwright is a development dependency (Apache-2.0). Exact versions
and transitive dependency metadata are recorded in package-lock.json. Their
licenses and any notices accompanying optional native binaries remain applicable.

## Reference photography

Official campus pages and photography are linked in docs/SOURCES.md and within the app. These images are referenced for research only and are not bundled or redistributed as app assets. No ownership of those images is claimed.

## Affiliation

This is an independent campus visualization prototype, not an official Southwest University service. The decorative text emblem in the interface is not the university's official seal.

## Elevation data

Terrain Tiles / Mapzen, accessed 2026-09-23 from https://registry.opendata.aws/terrain-tiles/. SRTM terrain data courtesy of the U.S. Geological Survey. Regional source: approximately 30 m SRTM; the upstream global mosaic also uses other sources. The cached PNG and source hash are in `data-sources/terrain/`. Attribution details: https://github.com/tilezen/joerd/blob/master/docs/attribution.md .

`public/data/terrain.json` is a bilinearly resampled crop. The application derives level building/sports/water platforms and blends nearby slopes. These modifications are ours, not measurements or endorsements by the data providers. Preserve elevation attribution when redistributing the terrain or exporting images.
