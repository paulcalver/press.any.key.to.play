let shapes = [];
let bgColor;
let score = 0;
let lastKeyTime = {
  circle: 0,
  line: 0
};
let keyTimeout = 10000; // 10 seconds before shapes start dying
let hasStarted = false; // Track if user has pressed any key
let isFullscreen = false; // Track fullscreen state

// Global configuration
let maxLines = 1; // Maximum number of lines allowed
let maxLineSpeed = 0.35; // Maximum oscillation speed for lines

// Chaos system - orbit forces accumulate energy over time
let chaosFactor = 1.0; // Multiplier for orbit force strength
let chaosGrowthRate = 0.002; // How fast chaos builds per frame
let maxChaos = 2.5; // Maximum chaos multiplier

// Sound synths
let synthCircle;
let synthLineH;
let synthLineV;
let synthSpeed;
let synthDrop;


// Keyboard mapping
const keyMap = {
  // Top row - Circles
  'q': 'circle', 'w': 'circle', 'e': 'circle', 'r': 'circle', 't': 'circle',
  'y': 'circle', 'u': 'circle', 'i': 'circle', 'o': 'circle', 'p': 'circle',

  // Middle row - Circles (except L = random line)
  'a': 'circle', 's': 'circle', 'd': 'circle', 'f': 'circle', 'g': 'circle',
  'h': 'circle', 'j': 'circle', 'k': 'circle', 'l': 'line-random',

  // Bottom row - Circles
  'z': 'circle', 'x': 'circle', 'c': 'circle', 'v': 'circle',
  'b': 'circle', 'n': 'circle', 'm': 'circle',

  // Spacebar - Speed boost
  ' ': 'speed',
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 255);
  textFont('Rubik One');

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

  // Initialize synthesizers
  synthCircle = new p5.Oscillator('sine');
  synthCircle.amp(0);
  synthCircle.start();

  synthLineH = new p5.Oscillator('triangle');
  synthLineH.amp(0);
  synthLineH.start();

  synthLineV = new p5.Oscillator('triangle');
  synthLineV.amp(0);
  synthLineV.start();

  synthSpeed = new p5.Oscillator('square');
  synthSpeed.amp(0);
  synthSpeed.start();

  synthDrop = new p5.Oscillator('sine');
  synthDrop.amp(0);
  synthDrop.start();

}

function draw() {
  background(bgColor);

  let currentTime = millis();

  // Apply death animation based on shape type inactivity
  for (let shape of shapes) {
    // Once dying, always continue dying - can't be saved
    if (shape.isDying) {
      applyDeathAnimation(shape);
      continue;
    }

    let shapeType = shape instanceof Line ? 'line' : 'circle';
    let timeSinceKey = currentTime - lastKeyTime[shapeType];

    if (timeSinceKey > keyTimeout) {
      applyDeathAnimation(shape);
    }
  }

  // Update and draw all shapes
  noStroke();
  for (let shape of shapes) {
    shape.update();
    shape.displayWithWrap();
  }

  // Apply speed decay - shapes slow down over time unless speed keys are pressed
  for (let shape of shapes) {
    if (!shape.isDying) {
      if (shape instanceof Circle) {
        // Circles: reduce speed gradually
        if (shape.speed > 0.5) { // Don't decay below minimum movement
          shape.speed *= 0.995; // 0.5% decay per frame
          shape.velocity.setMag(shape.speed);
        }
      } else if (shape instanceof Line) {
        // Lines: reduce oscillation speed gradually
        if (shape.oscillationSpeed > 0.01) { // Don't decay below minimum
          shape.oscillationSpeed *= 0.998; // 0.2% decay per frame
        }
      }
    }
  }

  // Grow chaos factor over time when circles are active
  let liveCircles = shapes.filter(s => s instanceof Circle && !s.isDying);
  if (liveCircles.length > 1) {
    chaosFactor = min(chaosFactor + chaosGrowthRate, maxChaos);
  } else {
    // Reset chaos when few/no circles
    chaosFactor = 1.0;
  }

  // Apply constant behaviors
  applyConstantBehaviors();

  // Remove shapes that fell off screen
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (isOffScreen(shapes[i])) {
      shapes.splice(i, 1);
    }
  }

  updateScore();
  displayScore();

  // Show start message if user hasn't started yet
  if (!hasStarted) {
    displayStartMessage();
  }

  // Draw fullscreen button
  drawFullscreenButton();
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
  if (shape.deathTimer === 60) {
    // Play drop sound once when gravity kicks in
    let dropFreq = map(shape.position ? shape.position.x : width / 2, 0, width, 100, 300);
    playSound(synthDrop, dropFreq, 0.3);
  }

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

function applyConstantBehaviors() {
  let liveCircles = shapes.filter(s => s instanceof Circle && !s.isDying);
  let liveLines = shapes.filter(s => s instanceof Line && !s.isDying);

  // CONSTANT BEHAVIOR 1: Circles orbit around center of mass
  // Chaos factor increases orbit strength over time, causing disruption
  if (liveCircles.length > 0) {
    let centerOfMass = Shape.getCenterOfMass(liveCircles);
    let orbitStrength = 0.4 * chaosFactor; // Scales with chaos
    let pullStrength = 0.1 * chaosFactor;  // Scales with chaos

    for (let circle of liveCircles) {
      circle.orbitTarget(centerOfMass, orbitStrength, pullStrength);
    }
  }

  // CONSTANT BEHAVIOR 2: Lines repel all circles
  if (liveLines.length > 0 && liveCircles.length > 0) {
    for (let line of liveLines) {
      for (let circle of liveCircles) {
        // Get the line's position as a point for distance calculation
        let linePos = line.isHorizontal
          ? createVector(circle.position.x, line.axisPosition)
          : createVector(line.axisPosition, circle.position.y);

        let distance = p5.Vector.dist(circle.position, linePos);

        // Stronger force that scales with distance (closer = stronger push)
        if (distance < 300) {
          let forceMagnitude = map(distance, 0, 300, 1.8, 0.3);
          circle.fleeTarget(linePos, forceMagnitude);
        }
      }
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
  // If no shapes, score is 0
  if (shapes.length === 0) {
    score = 0;
    return;
  }

  let liveShapes = shapes.filter(s => !s.isDying);

  if (liveShapes.length === 0) {
    score = 0;
    return;
  }

  // Chaos Level Scoring: Just total speed of all shapes
  let totalSpeed = 0;

  for (let shape of liveShapes) {
    if (shape instanceof Circle) {
      // Use actual velocity magnitude instead of stored speed property
      // This captures speed changes from orbit/flee behaviors
      totalSpeed += shape.velocity.mag();
    } else if (shape instanceof Line) {
      // Scale oscillation speed to be comparable to circle speed
      totalSpeed += shape.oscillationSpeed * 10; // Lines move slower, so scale up
    }
  }

  // Score = total speed across all shapes
  score = Math.floor(totalSpeed);
}

function displayScore() {
  push();
  blendMode(DIFFERENCE);
  textAlign(CENTER, CENTER);
  textSize(width * 0.15); // Fixed at 15% of width
  fill(255);
  text(score, width / 2, height / 2);
  pop();
}

function displayStartMessage() {
  push();
  blendMode(DIFFERENCE);
  textAlign(CENTER, CENTER);
  textSize(width * 0.02); // 2% of width
  fill(255);
  text('Press any key A-Z for Shapes\nSpacebar for Power!', width / 2, height / 4);
  pop();
}

// Play synthesized sounds
function playSound(synth, freq, duration = 0.1) {
  synth.freq(freq);
  synth.amp(0.3, 0.01); // Quick attack
  setTimeout(() => {
    synth.amp(0, 0.1); // Fade out
  }, duration * 1000);
}

function keyPressed() {
  // Resume audio context on first interaction (fixes browser audio policy)
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }

  let key_lower = key.toLowerCase();
  if (!keyMap[key_lower]) return;

  let action = keyMap[key_lower];

  if (action === 'circle') {
    lastKeyTime.circle = millis();
    createCircle();
    playSound(synthCircle, random(400, 800), 0.15);
    hasStarted = true;

  } else if (action === 'line-h') {
    lastKeyTime.line = millis();
    createHorizontalLine();
    playSound(synthLineH, random(100, 200), 0.2);
    hasStarted = true;

  } else if (action === 'line-v') {
    lastKeyTime.line = millis();
    createVerticalLine();
    playSound(synthLineV, random(200, 400), 0.2);
    hasStarted = true;

  } else if (action === 'line-random') {
    lastKeyTime.line = millis();
    // Randomly choose horizontal or vertical
    if (random() < 0.5) {
      createHorizontalLine();
      playSound(synthLineH, random(100, 200), 0.2);
    } else {
      createVerticalLine();
      playSound(synthLineV, random(200, 400), 0.2);
    }
    hasStarted = true;

  } else if (action === 'speed') {
    lastKeyTime.circle = millis();
    lastKeyTime.line = millis();

    // Check if there are any live (non-dying) shapes to speed up
    let liveShapes = shapes.filter(shape => !shape.isDying);

    if (shapes.length === 0 || liveShapes.length === 0) {

      createCircle();
      playSound(synthCircle, random(400, 800), 0.15);
      hasStarted = true;

    } else {
      speedUp();
      hasStarted = true;

      // Calculate average speed to map to pitch
      let totalSpeed = 0;
      let speedCount = 0;
      for (let shape of shapes) {
        if (shape instanceof Line) {
          totalSpeed += shape.oscillationSpeed * 100;
          speedCount++;
        } else if (shape.speed !== undefined) {
          totalSpeed += shape.speed;
          speedCount++;
        }
      }
      let avgSpeed = speedCount > 0 ? totalSpeed / speedCount : 0;

      // Map average speed to frequency
      let speedFreq = map(avgSpeed, 0, 50, 100, 2000, true);
      playSound(synthSpeed, speedFreq, 0.05);
    }
  }

  return false;
}

function createCircle() {
  let circle = new Circle(
    random(width),
    random(height),
    random(5, 15),
    color(random(360), 100, 100),
    random(40, 80),
    random(0.3, 0.8)
  );
  circle.setSpeed(random(2, 5));
  shapes.push(circle);

  // Adding a new circle slightly reduces chaos
  chaosFactor = max(chaosFactor - 0.3, 1.0);
}

function createHorizontalLine() {
  // Check if we've reached max lines
  let lineCount = shapes.filter(s => s instanceof Line).length;
  if (lineCount >= maxLines) {
    // Remove oldest line (first line in array)
    for (let i = 0; i < shapes.length; i++) {
      if (shapes[i] instanceof Line) {
        shapes.splice(i, 1);
        break;
      }
    }
  }
  shapes.push(new Line(random(50, 200), random(0.3, 0.8), true));
}

function createVerticalLine() {
  // Check if we've reached max lines
  let lineCount = shapes.filter(s => s instanceof Line).length;
  if (lineCount >= maxLines) {
    // Remove oldest line (first line in array)
    for (let i = 0; i < shapes.length; i++) {
      if (shapes[i] instanceof Line) {
        shapes.splice(i, 1);
        break;
      }
    }
  }
  shapes.push(new Line(random(50, 200), random(0.3, 0.8), false));
}

function speedUp() {
  for (let shape of shapes) {
    // Skip dying shapes - don't add speed to them
    if (shape.isDying) {
      continue;
    }

    if (shape instanceof Line) {
      // Lines have a max speed cap
      if (shape.oscillationSpeed < maxLineSpeed) {
        shape.addSpeed(2);
        // Ensure we don't exceed max
        if (shape.oscillationSpeed > maxLineSpeed) {
          shape.oscillationSpeed = maxLineSpeed;
        }
      }
    } else {
      // Circles have no speed cap
      shape.addSpeed(2);
    }
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

function drawFullscreenButton() {
  push();
  blendMode(DIFFERENCE);
  textAlign(LEFT, BOTTOM);
  textSize(width * 0.01); // 1% of width
  fill(255);

  let padding = 20;
  let buttonText = isFullscreen ? 'X' : 'FS';
  text(buttonText, padding, height - padding);

  // Change cursor to pointer when hovering over button
  let buttonWidth = width * 0.01 * 2; // Rough width estimate
  let buttonHeight = width * 0.01;

  if (mouseX < padding + buttonWidth && mouseY > height - padding - buttonHeight) {
    cursor(HAND);
  } else {
    cursor(ARROW);
  }

  pop();
}

function changeBGAndInvertShapes() {
  const bgColors = [
    '#fffc79', // Yellow
    '#66386a', // Purple
    '#ef4026'  // Red-orange
  ];

  // Find current background and switch to next
  let currentBg = bgColor.toString('#rrggbb');
  let currentIndex = bgColors.indexOf(currentBg);
  let nextIndex = (currentIndex + 1) % bgColors.length;
  bgColor = color(bgColors[nextIndex]);

  // Invert all shape colors
  for (let shape of shapes) {
    if (shape.color) {
      let h = hue(shape.color);
      let s = saturation(shape.color);
      let b = brightness(shape.color);

      // Invert hue (opposite side of color wheel)
      let newHue = (h + 180) % 360;
      shape.color = color(newHue, s, b);
    }
  }

}

function mousePressed() {
  // Resume audio context on first interaction (fixes browser audio policy)
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }

  // Check if clicked on fullscreen button
  let padding = 20;
  let buttonWidth = width * 0.01 * 2; // Rough width estimate
  let buttonHeight = width * 0.01;

  if (mouseX < padding + buttonWidth && mouseY > height - padding - buttonHeight) {
    // Toggle fullscreen
    let fs = fullscreen();
    fullscreen(!fs);
    isFullscreen = !fs;

    // Resize canvas after fullscreen toggle
    setTimeout(() => {
      resizeCanvas(windowWidth, windowHeight);
    }, 100);

    return false;
  }



  // Otherwise, cycle background color and invert shapes
  changeBGAndInvertShapes();
  return false;

}