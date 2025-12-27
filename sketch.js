let panels = [];

let gridSize;
let rows;
let cols;
let offsetX, offsetY;
let padding = 8; // percentage
let resolution = 80; // number of panels along the smaller dimension

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100);
  noStroke();
  drawGrid();
}

function draw() {
  background(0);

  for (let i =0; i < panels.length; i++) {
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
      panels.push(new Panel(x, y, size, color(32, 92, panelBrightness), size * 0.05));
    }
  }
}

class Panel {
  constructor(x, y, size, color, cornerRadius) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
    this.cornerRadius = cornerRadius;
  }

  show() {
    fill(this.color);
    rect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size, this.cornerRadius);
  }
}