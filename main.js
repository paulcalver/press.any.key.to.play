let shapes = [];
let bgColor;
let score = 0;

let lastKeyTime = {
  circle: 0,
  line: 0
};

let keyTimeout = 3000; // 3 seconds before shapes start dying
let hasStarted = false; // Track if user has pressed any key
let displayMakeShapeFirst = false; // Track if "make shape first" message should be displayed
let makeShapeMessageTime = 0; // Track when the "make shape first" message was triggered
let isFullscreen = false; // Track fullscreen state

// Sound synths
let synthCircle;
let synthLineH;
let synthLineV;
let synthSpeed;
let synthDrop;
let synthAngry;

// Keyboard mapping
const keyMap = {
  // Top row - Lines (alternating H/V)
  'q': 'line-h', 'w': 'line-v', 'e': 'line-h', 'r': 'line-v', 't': 'line-h',
  'y': 'line-v', 'u': 'line-h', 'i': 'line-v', 'o': 'line-h', 'p': 'line-v',

  // Middle row - Mixed
  'a': 'line-h', 's': 'line-v', 'd': 'circle', 'f': 'line-h', 'g': 'line-v',
  'h': 'circle', 'j': 'line-h', 'k': 'line-v', 'l': 'circle',

  // Bottom row - Circles
  'z': 'circle', 'x': 'circle', 'c': 'circle', 'v': 'circle',
  'b': 'circle', 'n': 'circle', 'm': 'circle',

  // Spacebar - Speed up all shapes
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

  synthAngry = new p5.Oscillator('sawtooth');
  synthAngry.amp(0);
  synthAngry.start();

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

  if (displayMakeShapeFirst) {
    // Check if message should fade away after 3 seconds
    if (currentTime - makeShapeMessageTime > keyTimeout) {
      displayMakeShapeFirst = false;
    } else {
      displayMakeShapeFirstMessage();
    }
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

  let totalSpeed = 0;

  for (let shape of shapes) {
    if (shape instanceof Line) {
      // Lines use oscillationSpeed
      totalSpeed += shape.oscillationSpeed * 100;
    } else if (shape.speed !== undefined) {
      // Circles use speed
      totalSpeed += shape.speed;
    }
  }

  score = Math.floor(shapes.length * 10 + totalSpeed * 5);
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
  textSize(width * 0.015); // 1.5% of width
  fill(255);
  text('Press any key A-Z for shapes and spacebar for speed.\n\nScore points and go wild!', width / 2, height * 0.2);
  //text('Score points and go wild!', width / 2, height * 0.75);
  pop();
}

function displayMakeShapeFirstMessage() {
  push();
  blendMode(DIFFERENCE);
  textAlign(CENTER, CENTER);
  textSize(width * 0.015); // 1.5% of width

  // Calculate fade based on time elapsed
  let elapsed = millis() - makeShapeMessageTime;
  let fadeStart = keyTimeout * 0.6; // Start fading at 60% of timeout (1.8s)
  let alpha = 255;

  if (elapsed > fadeStart) {
    // Fade from 255 to 0 over the remaining time with easing
    let t = map(elapsed, fadeStart, keyTimeout, 0, 1); // Normalize to 0-1
    let easedT = t * t; // Quadratic ease-in (accelerating fade)
    alpha = map(easedT, 0, 1, 255, 0);
  }

  fill(255, alpha);
  text('Make a shape first with any key A-Z, spacebar is for speed.', width / 2, height * 0.75);
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

// Play neutral notification sound (soft pulse)
function PlayErrorSound() {
  let baseFreq = 300; // Mid-range, neutral tone

  // Create a gentle two-note pulse
  synthAngry.freq(baseFreq);
  synthAngry.amp(0.25, 0.02); // Softer attack

  // Second pulse slightly lower
  setTimeout(() => {
    synthAngry.freq(baseFreq * 0.9); // Slightly lower second note
  }, 100);

  // Fade out
  setTimeout(() => {
    synthAngry.amp(0, 0.1);
  }, 200);
}

function keyPressed() {
  let key_lower = key.toLowerCase();
  if (!keyMap[key_lower]) return;

  // Resume audio context on first interaction (fixes browser audio policy)
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }

  // Mark as started on first key press
  //hasStarted = true;

  let action = keyMap[key_lower];

  if (action === 'circle') {
    lastKeyTime.circle = millis();
    createCircle();
    playSound(synthCircle, random(400, 800), 0.15); // Bubble-like
    hasStarted = true;
    displayMakeShapeFirst = false;
  } else if (action === 'bgChange') {
    changeBGAndInvertShapes();
  } else if (action === 'line-h' || action === 'line-v') {
    lastKeyTime.line = millis();
    if (action === 'line-h') {
      createHorizontalLine();
      playSound(synthLineH, random(100, 200), 0.2); // Lower swoosh
      hasStarted = true;
      displayMakeShapeFirst = false;
    } else {
      createVerticalLine();
      playSound(synthLineV, random(200, 400), 0.2); // Higher swoosh
      hasStarted = true;
      displayMakeShapeFirst = false;
    }
  } else if (action === 'speed') {
    lastKeyTime.circle = millis();
    lastKeyTime.line = millis();

    if (shapes.length === 0) {

      PlayErrorSound();
      displayMakeShapeFirst = true;
      makeShapeMessageTime = millis(); // Record when message was triggered

    } else {
      speedUp();

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

      // Map average speed to frequency (600-2000 Hz, gets higher as speed increases)
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
    // Skip dying shapes - don't add speed to them
    if (shape.isDying) {
      continue;
    }

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

  //return false;
}

function mousePressed() {
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