# P's favourites — React V1

This is the React/Vite version of the site.

## Important: don't open index.html with `file://`
YouTube can return Error 153 when the page has no normal HTTP Referer/origin.

### Run locally
1. Install Node.js.
2. Open a terminal in this folder.
3. Run:
   `npm install`
4. Then:
   `npm run dev`
5. Open the `http://localhost:...` address Vite gives you.

The React app already sets the YouTube `origin` to the current site.

## Current test links
- 9UDkYz64ehA
- G_eZ-piYwu0
- WOZSI2_m-3o
- 1usErKKsNGM

The displayed title is read from the YouTube player metadata, so we are not guessing the names.
