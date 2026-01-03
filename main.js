let shapes = [];
let bgColor;
let score = 0;
let lastKeyTime = {
  circle: 0,
  line: 0
};
let keyTimeout = 1000; // 1 second before shapes start dying

// Keyboard mapping
const keyMap = {
  // Top row - Lines (alternating H/V)
  'q': 'line-h', 'w': 'line-v', 'e': 'line-h', 'r': 'line-v', 't': 'line-h',
  'y': 'line-v', 'u': 'line-h', 'i': 'line-v', 'o': 'line-h', 'p': 'line-v',
  
  // Middle row - Speed
  'a': 'speed', 's': 'speed', 'd': 'speed', 'f': 'speed', 'g': 'speed',
  'h': 'speed', 'j': 'speed', 'k': 'speed', 'l': 'speed',
  
  // Bottom row - Circles
  'z': 'circle', 'x': 'circle', 'c': 'circle', 'v': 'circle',
  'b': 'circle', 'n': 'circle', 'm': 'circle',
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 255);
  
  // Random background from specified colors
  const bgColors = [
    '#fffc79', // Yellow
    '#66386a', // Purple
    '#ef4026'  // Red-orange
  ];
  bgColor = color(random(bgColors));
  
  let currentTime = millis();
  lastKeyTime.circle = currentTime;
  lastKeyTime.line = currentTime;
}

function draw() {
  background(bgColor);
  
  let currentTime = millis();
  
  // Apply death animation based on shape type inactivity
  for (let shape of shapes) {
    let shapeType = shape instanceof Line ? 'line' : 'circle';
    let timeSinceKey = currentTime - lastKeyTime[shapeType];
    
    if (timeSinceKey > keyTimeout) {
      applyDeathAnimation(shape);
    }
  }

  // Update and draw all shapes
  noStroke();
  for (let shape of shapes) {
    if (shape instanceof Line) {
      shape.update(shapes);
    } else {
      shape.update();
    }
    shape.displayWithWrap();
  }

  // Remove shapes that fell off screen
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (isOffScreen(shapes[i])) {
      shapes.splice(i, 1);
    }
  }
  
  updateScore();
  displayScore();
}

function applyDeathAnimation(shape) {
  if (!shape.isDying) {
    shape.isDying = true;
    shape.deathTimer = 0;
    shape.fallVelocity = 0;
  }
  
  shape.deathTimer++;
  
  // Phase 1 (0-60 frames): Lose energy/amplitude
  if (shape.deathTimer < 60) {
    if (shape instanceof Line) {
      shape.amplitude *= 0.92;
      shape.oscillationSpeed *= 0.95;
    } else {
      if (shape.velocity) shape.velocity.mult(0.92);
      shape.speed *= 0.92;
    }
  }
  
  // Phase 2 (60+ frames): Gravity - fall off screen with increasing acceleration
  if (shape.deathTimer >= 60) {
    // Gravity increases over time - starts at 0.4, increases by 0.05 every frame
    let gravityAccel = 0.4 + (shape.deathTimer - 60) * 0.05;
    shape.fallVelocity += gravityAccel;
    
    if (shape instanceof Line) {
      shape.verticalOffset += shape.fallVelocity;
    } else {
      shape.position.y += shape.fallVelocity;
    }
  }
}

function isOffScreen(shape) {
  if (shape instanceof Line) {
    return shape.verticalOffset > height + 200;
  }
  return shape.position && shape.position.y > height + 200;
}

function updateScore() {
  // Console log shapes array length
  console.log('Shapes count:', shapes.length);
  
  // If no shapes, score is 0
  if (shapes.length === 0) {
    score = 0;
    return;
  }
  
  let totalSpeed = 0;
  
  for (let shape of shapes) {
    if (shape.speed !== undefined) {
      totalSpeed += shape.speed;
    } else if (shape instanceof Line) {
      totalSpeed += shape.oscillationSpeed * 100;
    }
  }
  
  score = Math.floor(shapes.length * 10 + totalSpeed * 5);
}

function displayScore() {
  push();
  blendMode(DIFFERENCE);
  textAlign(CENTER, CENTER);
  textSize(200);
  fill(255); // White with DIFFERENCE mode inverts everything
  text(score, width / 2, height / 2);
  pop();
}

function keyPressed() {
  let key_lower = key.toLowerCase();
  if (!keyMap[key_lower]) return;
  
  let action = keyMap[key_lower];
  
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
    lastKeyTime.circle = millis();
    lastKeyTime.line = millis();
    speedUp();
  }
  
  return false;
}

function createCircle() {
  let circle = new Circle(
    random(width),
    random(height),
    random(5, 15),
    color(random(360), 100, 100),
    random(80, 140),
    random(0.3, 0.8)
  );
  circle.setSpeed(random(2, 5));
  shapes.push(circle);
}

function createHorizontalLine() {
  shapes.push(new Line(random(50, 200), random(0.3, 0.8), true));
}

function createVerticalLine() {
  shapes.push(new Line(random(50, 200), random(0.3, 0.8), false));
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