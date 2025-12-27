let panels = [];

let gridSize;
let rows;
let cols;
let offsetX, offsetY;
let padding = 8; // percentage
let resolution = 40; // number of panels along the smaller dimension

let cornerRadius = 0.0; // percentage

let maxElevation = 60; // degrees

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100);
  noStroke();
  drawGrid();
}

function draw() {
  background(0);

  // Find current sun position
  const sunCell = findSunCell(cols, rows);

  for (let i = 0; i < panels.length; i++) {
    // Highlight sun cell if above horizon
    if (sunCell) {
      const sunIndex = sunCell.x * rows + sunCell.y;
      if (i === sunIndex) {
        const originalColor = panels[i].color;
        panels[i].color = color(60, 100, 100); // Bright yellow for sun
        panels[i].show();
        panels[i].color = originalColor; // Restore original color
        continue;
      }
    }
    panels[i].show();
  }
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  drawGrid();
}

function drawGrid() {
  gridSize = floor(min(width, height) / resolution);
  cols = floor(width * 0.85 / gridSize);
  rows = floor(height * 0.8 / gridSize);

  // Calculate actual grid dimensions
  let gridWidth = cols * gridSize;
  let gridHeight = rows * gridSize;

  // Center the grid
  offsetX = (width - gridWidth) / 2;
  offsetY = (height - gridHeight) / 2;

  // Create panels
  panels = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let x = i * gridSize + offsetX + gridSize / 2;
      let y = j * gridSize + offsetY + gridSize / 2;
      let size = gridSize - (gridSize * padding) / 100;

      let panelBrightness = map(j, 0, rows - 1, 100, 10);
      panels.push(new Panel(x, y, size, color(32, 92, panelBrightness), size * cornerRadius));
    }
  }
}

function findSunCell(gridCols, gridRows) {
  const london = { lat: 51.5074, lon: -0.1278 };

  // TESTING: Set specific time (hour, minute)
  const now = new Date();
  now.setHours(12, 0, 0); // 12:00 noon

  const sunPos = getSunPosition(london.lat, london.lon, now);

  if (sunPos.elevation < 0) {
    return null;
  }

  // Map azimuth 90° (East) to 270° (West) across the grid
  // 90° = left edge (0), 180° = center, 270° = right edge (gridCols-1)
  if (sunPos.azimuth < 90 || sunPos.azimuth > 270) {
    return null; // Sun is in the northern half, outside our view
  }

  const cellX = Math.floor(((sunPos.azimuth - 90) / 180) * gridCols);
  const cellY = Math.floor((1 - (sunPos.elevation / maxElevation)) * gridRows);

  return {
    x: constrain(cellX, 0, gridCols - 1),
    y: constrain(cellY, 0, gridRows - 1),
    azimuth: sunPos.azimuth,
    elevation: sunPos.elevation
  };
}

function getSunPosition(lat, lon, date) {
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;

  const time = date.getTime();
  const JD = (time / 86400000) + 2440587.5;
  const n = JD - 2451545.0;

  let L = (280.460 + 0.9856474 * n) % 360;
  let g = (357.528 + 0.9856003 * n) % 360;
  const lambda = (L + 1.915 * Math.sin(g * rad) + 0.020 * Math.sin(2 * g * rad)) % 360;
  const epsilon = 23.439 - 0.0000004 * n;

  let RA = deg * Math.atan2(Math.cos(epsilon * rad) * Math.sin(lambda * rad), Math.cos(lambda * rad));
  RA = (RA + 360) % 360;

  const delta = deg * Math.asin(Math.sin(epsilon * rad) * Math.sin(lambda * rad));

  const GMST = (280.460 + 360.9856474 * n) % 360;
  const LST = (GMST + lon) % 360;

  let H = (LST - RA + 360) % 360;
  if (H > 180) H = H - 360;

  const latRad = lat * rad;
  const HRad = H * rad;
  const deltaRad = delta * rad;

  const elevation = deg * Math.asin(
    Math.sin(latRad) * Math.sin(deltaRad) +
    Math.cos(latRad) * Math.cos(deltaRad) * Math.cos(HRad)
  );

  let azimuth = deg * Math.atan2(
    -Math.sin(HRad),
    Math.cos(latRad) * Math.tan(deltaRad) - Math.sin(latRad) * Math.cos(HRad)
  );
  azimuth = (azimuth + 360) % 360;

  return { azimuth, elevation };
}