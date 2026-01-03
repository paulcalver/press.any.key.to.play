let shapes = [];
let bgColor;
let score = 0;
let lastKeyTime = {
  'circle': 0,
  'line': 0  // Track both line types together
};
let keyTimeout = 1000; // 1 second of no keys before that shape type starts dying

// Keyboard mapping configuration
const keyMap = {
  // Top row - Lines (alternating horizontal and vertical)
  'q': 'line-h',
  'w': 'line-v',
  'e': 'line-h',
  'r': 'line-v',
  't': 'line-h',
  'y': 'line-v',
  'u': 'line-h',
  'i': 'line-v',
  'o': 'line-h',
  'p': 'line-v',
  
  // Middle row - All speed
  'a': 'speed',
  's': 'speed',
  'd': 'speed',
  'f': 'speed',
  'g': 'speed',
  'h': 'speed',
  'j': 'speed',
  'k': 'speed',
  'l': 'speed',
  
  // Bottom row - All circles
  'z': 'circle',
  'x': 'circle',
  'c': 'circle',
  'v': 'circle',
  'b': 'circle',
  'n': 'circle',
  'm': 'circle',
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 255);
  bgColor = color(220, 60, 20); // Dark blue background
  
  // Initialize last key times
  let currentTime = millis();
  lastKeyTime.circle = currentTime;
  lastKeyTime.line = currentTime;
}

function draw() {
  background(bgColor);
  
  let currentTime = millis();
  
  // Apply death animation per shape type based on inactivity
  for (let shape of shapes) {
    let shapeType = shape instanceof Line ? 'line' : 'circle';
    let timeSinceKey = currentTime - lastKeyTime[shapeType];
    
    if (timeSinceKey > keyTimeout) {
      applyDeathAnimation(shape);
    }
  }

  // Apply flocking behavior to circles only
  // for (let i = 0; i < shapes.length; i++) {
  //   if (shapes[i] instanceof Circle) {
  //     shapes[i].flock(shapes);
  //   }
  // }

  // Update and draw all shapes
  noStroke();
  for (let i = 0; i < shapes.length; i++) {
    if (shapes[i] instanceof Line) {
      shapes[i].update(shapes);
    } else {
      shapes[i].update();
    }
    
    shapes[i].displayWithWrap();
  }

  // Remove dead shapes (off-screen)
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (!shapes[i].isAlive() || isOffScreen(shapes[i])) {
      shapes.splice(i, 1);
    }
  }
  
  // Update score based on chaos
  updateScore();
  
  // Display score
  displayScore();
}

function applyDeathAnimation(shape) {
  // Mark shape as dying and initialize death timer
  if (!shape.isDying) {
    shape.isDying = true;
    shape.deathTimer = 0;
    shape.fallVelocity = 0; // Start with no falling velocity
  }
  
  shape.deathTimer++;
  
  // Phase 1 (frames 0-60): Lose energy/amplitude
  if (shape.deathTimer < 60) {
    if (shape instanceof Line) {
      // Lines lose amplitude (become straight)
      shape.amplitude *= 0.92;
      shape.oscillationSpeed *= 0.95;
    } else if (shape.position) {
      // Circles lose energy (slow down)
      if (shape.velocity) {
        shape.velocity.mult(0.92);
      }
      shape.speed *= 0.92;
    }
  }
  
  // Phase 2 (frame 60+): Gravity kicks in, everything falls with acceleration
  if (shape.deathTimer >= 60) {
    // Apply gravity acceleration
    shape.fallVelocity += 0.4; // Gravity acceleration constant
    
    if (shape instanceof Line) {
      // Lines fall down by increasing vertical offset
      shape.verticalOffset += shape.fallVelocity;
    } else if (shape.position) {
      // Circles fall down with accelerating gravity
      shape.position.y += shape.fallVelocity;
    }
  }
}

function isOffScreen(shape) {
  if (shape instanceof Line) {
    // Lines are off screen when they fall below the bottom
    return shape.verticalOffset > height + 200;
  }
  
  if (!shape.position) return false;
  
  // Shapes are off screen when they fall below the bottom
  return shape.position.y > height + 200;
}

function updateScore() {
  // Calculate chaos factor - score is directly based on current state
  let shapeCount = shapes.length;
  let totalSpeed = 0;
  let speedCount = 0;
  
  for (let shape of shapes) {
    if (shape.speed !== undefined) {
      totalSpeed += shape.speed;
      speedCount++;
    } else if (shape instanceof Line) {
      // Lines contribute oscillation speed to chaos
      totalSpeed += shape.oscillationSpeed * 100; // Scale up for visibility
      speedCount++;
    }
  }
  
  // Score is directly the current chaos level
  // More shapes + higher speeds = higher score
  score = shapeCount * 10 + totalSpeed * 5;
  
  // Round to integer
  score = Math.floor(score);
}

function displayScore() {
  push();
  textAlign(CENTER, CENTER);
  textSize(200);
  fill(255, 255, 255, 40); // Semi-transparent white
  text(Math.floor(score), width / 2, height / 2);
  pop();
}

function keyPressed() {
  let key_lower = key.toLowerCase();
  
  // Check if key is mapped
  if (!keyMap[key_lower]) {
    return;
  }
  
  let action = keyMap[key_lower];
  
  // Update last key time for the relevant shape type
  if (action === 'circle') {
    lastKeyTime.circle = millis();
    createCircle();
  } else if (action === 'line-h' || action === 'line-v') {
    lastKeyTime.line = millis();
    if (action === 'line-h') {
      createHorizontalLine();
    } else {
      createVerticalLine();
    }
  } else if (action === 'speed') {
    // Speed affects all shapes, update both timers
    lastKeyTime.circle = millis();
    lastKeyTime.line = millis();
    speedUp();
  }
  
  return false;
}

function createCircle() {
  let x = random(width);
  let y = random(height);
  let shapeColor = color(random(360), 100, 100);
  
  // Use expanding circles
  let startRadius = random(5, 15);
  let targetRadius = random(80, 140);
  let growthSpeed = random(0.3, 0.8);
  
  let circle = new Circle(x, y, startRadius, shapeColor, targetRadius, growthSpeed);
  circle.setSpeed(random(2, 5));
  shapes.push(circle);
}

function createHorizontalLine() {
  let amplitude = random(50, 200);
  let frequency = random(0.3, 0.8);
  let hLine = new Line(amplitude, frequency, true);
  shapes.push(hLine);
}

function createVerticalLine() {
  let amplitude = random(50, 200);
  let frequency = random(0.3, 0.8);
  let vLine = new Line(amplitude, frequency, false);
  shapes.push(vLine);
}

function speedUp() {
  for (let shape of shapes) {
    shape.addSpeed(2);
  }
}

function windowResized() {
  let oldWidth = width;
  let oldHeight = height;

  resizeCanvas(windowWidth, windowHeight);

  for (let shape of shapes) {
    if (shape.position) {
      shape.position.x = (shape.position.x / oldWidth) * width;
      shape.position.y = (shape.position.y / oldHeight) * height;
    }
  }
}