let triangles = [];
let boids = [];
let boidsCount;

let gridSize;
let rows;
let cols;
let offsetX, offsetY;

let boidSize;
let boidSpeed;
let boidForce;
let boidSlowRadius;

function setup() {
  createCanvas(windowWidth, windowHeight);
  cursor(HAND);

  gridSize = floor(min(width, height) / 4);
  boidSize = gridSize * 0.5;
  boidSpeed = min(width, height) / 100; // Speed proportional to canvas size
  boidForce = boidSpeed / 4; // Force proportional to speed
  boidSlowRadius = min(width, height) / 5; // Slow radius proportional to canvas size

  cols = floor(width * 0.8 / gridSize);
  rows = floor(height * 0.8 / gridSize);

  boidsCount = floor((cols * rows) / 5);

  // Calculate actual grid dimensions
  let gridWidth = cols * gridSize;
  let gridHeight = rows * gridSize;

  // Center the grid
  offsetX = (width - gridWidth) / 2;
  offsetY = (height - gridHeight) / 2;

  generateTriangles();

  for (let i = 0; i < boidsCount; i++) {
    let x = random(width* 0.1, width* 0.9);
    let y = random(height * 0.1, height* 0.9);
    boids.push(new Boid(x, y, boidSize, boidSpeed, boidForce, boidSlowRadius));
  }
}


function draw() {
  background(215,195,186);
  
  for (let triangle of triangles) {
    triangle.show();
  }
  
  // Reset all triangle claims each frame
  for (let triangle of triangles) {
    triangle.claimed = false;
  }
  
  for (let boid of boids) {
    // Find nearest unclaimed triangle
    let nearest = null;
    let nearestDist = Infinity;
    for (let triangle of triangles) {
      if (!triangle.claimed) {
        let d = p5.Vector.dist(boid.pos, triangle.pos);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = triangle;
        }
      }
    }
    
    if (nearest) {
      // Claim this triangle immediately
      nearest.claimed = true;
      
      let arriveForce = boid.arrive(nearest.pos);
      boid.applyForce(arriveForce);
    } else {
      // No unclaimed triangle - add stronger random movement
      let wander = createVector(random(-1, 1), random(-1, 1));
      wander.setMag(0.5);
      boid.applyForce(wander);
    }
    
    boid.update();
    boid.edges();
    boid.show();
  }
  
  
}

function keyPressed() {
  if (key === ' ') {
    generateTriangles();
  }
}

function mousePressed() {
  generateTriangles();
  return false; // Prevent default behavior
}

function touchStarted() {
  generateTriangles();
  return false; // Prevent default behavior
}

function generateTriangles() {
  triangles = []; // Clear existing triangles
  
  let allPositions = [];
  
  // First pass: randomly create triangles
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let x = i * gridSize + offsetX + gridSize / 2;
      let y = j * gridSize + offsetY + gridSize / 2;
      let size = gridSize * 0.98;
      
      if (random() > 0.6) {
        triangles.push(new Triangle(x, y, size));
      } else {
        // Store unused positions
        allPositions.push({x: x, y: y, size: size});
      }
    }
  }
  
  // If we don't have enough triangles, add more from unused positions
  if (triangles.length < boidsCount) {
    allPositions = shuffle(allPositions);
    let needed = boidsCount - triangles.length;
    for (let i = 0; i < needed && i < allPositions.length; i++) {
      let pos = allPositions[i];
      triangles.push(new Triangle(pos.x, pos.y, pos.size));
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  // Clear existing arrays
  triangles = [];
  boids = [];
  
  // Recalculate all dynamic values
  gridSize = floor(min(width, height) / 4);
  boidSize = gridSize * 0.5;
  boidSpeed = min(width, height) / 100;
  boidForce = boidSpeed / 4;
  boidSlowRadius = min(width, height) / 5;

  cols = floor(width * 0.8 / gridSize);
  rows = floor(height * 0.8 / gridSize);

  boidsCount = floor((cols * rows) / 5);

  // Calculate actual grid dimensions
  let gridWidth = cols * gridSize;
  let gridHeight = rows * gridSize;

  // Center the grid
  offsetX = (width - gridWidth) / 2;
  offsetY = (height - gridHeight) / 2;

  // Regenerate triangles and boids
  generateTriangles();

  for (let i = 0; i < boidsCount; i++) {
    let x = random(width* 0.1, width* 0.9);
    let y = random(height * 0.1, height* 0.9);
    boids.push(new Boid(x, y, boidSize, boidSpeed, boidForce, boidSlowRadius));
  }
}