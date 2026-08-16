const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const tilesDir = path.join(__dirname, '..', 'assets', 'tiles');
const singleTile = PNG.sync.read(fs.readFileSync(path.join(tilesDir, 'tile-single.png')));
const cliffTile = PNG.sync.read(fs.readFileSync(path.join(tilesDir, 'tile-cliff.png')));
const cornerTile = PNG.sync.read(fs.readFileSync(path.join(tilesDir, 'tile-corner.png')));

console.log('Single tile:', singleTile.width, 'x', singleTile.height);
console.log('Cliff tile:', cliffTile.width, 'x', cliffTile.height);
console.log('Corner tile:', cornerTile.width, 'x', cornerTile.height);
