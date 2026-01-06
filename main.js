// Configuration constants
const KEY_TIMEOUT = 6000; // Milliseconds before shapes enter warning phase
const WARNING_DURATION = 4000; // Milliseconds of warning before death (grace period)
const DEATH_DROP_SOUND_FRAME = 60; // Frame when drop sound plays
const OFFSCREEN_THRESHOLD = 200; // Pixels beyond screen edge before removal

// Score calculation constants
const SCORE_SHAPE_MULTIPLIER = 10;
const SCORE_SPEED_MULTIPLIER = 5;
const LINE_SPEED_SCALE = 100; // Scale line oscillation speed for scoring

// Visual transition constants
const DESATURATION_START = 25000;
const DESATURATION_END = 50000;
const BRIGHTNESS_START = 40000;
const BRIGHTNESS_END = 100000;

// Message timing constants
const MESSAGE_FADE_START_PERCENT = 0.6; // When to start fading the message (60% of timeout)

// Audio constants
const SOUND_ATTACK_TIME = 0.01;
const SOUND_RELEASE_TIME = 0.1;
const SOUND_VOLUME = 0.3;

let shapes = [];
let bgColor;
let score = 0;
let scoreNeedsUpdate = true; // Flag to track when score needs recalculation

let lastKeyTime = {
  circle: 0,
  line: 0
};

let keyTimeout = KEY_TIMEOUT;
let hasStarted = false; // Track if user has pressed any key
let displayMakeShapeFirst = false; // Track if "make shape first" message should be displayed
let makeShapeMessageTime = 0; // Track when the "make shape first" message was triggered
let isFullscreen = false; // Track fullscreen state

// Sound manager
let soundManager;

// Keyboard mapping
const keyMap = {
  // Top row - Lines (alternating H/V)
  'q': 'line-random', 'w': 'circle', 'e': 'line-random', 'r': 'circle', 't': 'line-random',
  'y': 'circle', 'u': 'line-random', 'i': 'circle', 'o': 'line-random', 'p': 'circle',

  // Middle row - Mixed
  'a': 'line-random', 's': 'circle', 'd': 'line-random', 'f': 'circle', 'g': 'line-random',
  'h': 'circle', 'j': 'line-random', 'k': 'circle', 'l': 'line-random',

  // Bottom row - Circles
  'z': 'circle', 'x': 'line-random', 'c': 'circle', 'v': 'line-random',
  'b': 'circle', 'n': 'line-random', 'm': 'circle',

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
    '#4a294eff' // Purple
  ];
  bgColor = color(random(bgColors));

  let currentTime = millis();
  lastKeyTime.circle = currentTime;
  lastKeyTime.line = currentTime;

  // Initialize sound manager
  soundManager = new SoundManager();
  soundManager.initialize();
}

function draw() {
  // Calculate desaturation based on score
  let desaturation = map(score, DESATURATION_START, DESATURATION_END, 1, 0, true);

  // Calculate brightness reduction based on score
  let brightnessMultiplier = map(score, BRIGHTNESS_START, BRIGHTNESS_END, 1, 0, true);

  // Apply desaturation to background
  let desaturatedBg = color(
    hue(bgColor),
    saturation(bgColor) * desaturation,
    brightness(bgColor)
  );
  background(desaturatedBg);

  let currentTime = millis();

  // Apply warning and death animations based on shape type inactivity
  for (let shape of shapes) {
    // Once dying, always continue dying - can't be saved
    if (shape.isDying) {
      let shouldPlaySound = shape.updateDeathAnimation();
      if (shouldPlaySound) {
        // Play drop sound when gravity kicks in
        let xPos = shape.position ? shape.position.x : width / 2;
        soundManager.playDropSound(xPos);
      }
      continue;
    }

    let shapeType = shape instanceof Line ? 'line' : 'circle';
    let timeSinceKey = currentTime - lastKeyTime[shapeType];

    // Warning phase: shapes lose energy gradually (reversible)
    if (timeSinceKey > keyTimeout && timeSinceKey <= keyTimeout + WARNING_DURATION) {
      if (!shape.isWarning) {
        shape.startWarning();
        scoreNeedsUpdate = true; // Score changes when entering warning
      }
      shape.updateWarning();
      scoreNeedsUpdate = true; // Score continuously updates as speed decreases
    }
    // Death phase: warning period expired, now dying (irreversible)
    else if (timeSinceKey > keyTimeout + WARNING_DURATION) {
      shape.startDying();
    }
    // Active phase: reset warning if player pressed key in time
    else if (shape.isWarning) {
      shape.recoverFromWarning();
      scoreNeedsUpdate = true; // Score changes when recovering
    }
  }

  // Update and draw all shapes
  noStroke();
  for (let shape of shapes) {
    shape.update();
    shape.displayWithWrap(desaturation, brightnessMultiplier);
  }

  // Remove shapes that fell off screen
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (isOffScreen(shapes[i])) {
      shapes.splice(i, 1);
      scoreNeedsUpdate = true; // Mark score for update when shape is removed
    }
  }

  // Only recalculate score when needed
  if (scoreNeedsUpdate) {
    updateScore();
    scoreNeedsUpdate = false;
  }

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

function isOffScreen(shape) {
  if (shape instanceof Line) {
    return shape.verticalOffset > height + OFFSCREEN_THRESHOLD;
  }
  return shape.position && shape.position.y > height + OFFSCREEN_THRESHOLD;
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
      totalSpeed += shape.oscillationSpeed * LINE_SPEED_SCALE;
    } else if (shape.speed !== undefined) {
      // Circles use speed
      totalSpeed += shape.speed;
    }
  }

  score = Math.floor(shapes.length * SCORE_SHAPE_MULTIPLIER + totalSpeed * SCORE_SPEED_MULTIPLIER);
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
  textSize(width * 0.025); // 3% of width
  fill(255);
  text('Press any key A-Z to make shapes and spacebar for speed.\nScore points and go wild!'.toUpperCase(), width / 2, height * 0.28);
  textSize(width * 0.01);
  text('** STROBE CAUTION - THINGS CAN GET A BIT INTENSE! **'.toUpperCase(), width / 2, height * 0.65);
  pop();
}

function displayMakeShapeFirstMessage() {
  push();
  blendMode(DIFFERENCE);
  textAlign(CENTER, CENTER);
  textSize(width * 0.025); // 1.5% of width

  // Calculate fade based on time elapsed
  let elapsed = millis() - makeShapeMessageTime;
  let fadeStart = keyTimeout * MESSAGE_FADE_START_PERCENT;
  let alpha = 255;

  if (elapsed > fadeStart) {
    // Fade from 255 to 0 over the remaining time with easing
    let t = map(elapsed, fadeStart, keyTimeout, 0, 1); // Normalize to 0-1
    let easedT = t * t; // Quadratic ease-in (accelerating fade)
    alpha = map(easedT, 0, 1, 255, 0);
  }

  fill(255, alpha);
  text('Make a shape first with any key A-Z.'.toUpperCase(), width / 2, height * 0.75);
  pop();
}

function keyPressed() {
  let key_lower = key.toLowerCase();
  if (!keyMap[key_lower]) return;

  soundManager.ensureAudioContext();

  let action = keyMap[key_lower];

  if (action === 'circle') {
    lastKeyTime.circle = millis();
    createCircle();
    soundManager.playCircleSound();
    hasStarted = true;
    displayMakeShapeFirst = false;
  } else if (action === 'bgChange') {
    changeBGAndInvertShapes();
  } else if (action === 'line-random') {
    lastKeyTime.line = millis();
    randomLine()
  } else if (action === 'speed') {
    lastKeyTime.circle = millis();
    lastKeyTime.line = millis();

    if (shapes.length === 0) {
      soundManager.playErrorSound();
      displayMakeShapeFirst = true;
      makeShapeMessageTime = millis();
    } else {
      speedUp();

      // Calculate average speed to map to pitch
      let totalSpeed = 0;
      let speedCount = 0;
      for (let shape of shapes) {
        if (shape instanceof Line) {
          totalSpeed += shape.oscillationSpeed * LINE_SPEED_SCALE;
          speedCount++;
        } else if (shape.speed !== undefined) {
          totalSpeed += shape.speed;
          speedCount++;
        }
      }
      let avgSpeed = speedCount > 0 ? totalSpeed / speedCount : 0;
      soundManager.playSpeedSound(avgSpeed);
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
  scoreNeedsUpdate = true;
}

function createHorizontalLine() {
  shapes.push(new Line(random(50, 200), random(0.3, 0.8), true));
  scoreNeedsUpdate = true;
}

function createVerticalLine() {
  shapes.push(new Line(random(50, 200), random(0.3, 0.8), false));
  scoreNeedsUpdate = true;
}

function randomLine() {
  if (random() < 0.5) {
    createHorizontalLine();
    soundManager.playLineHSound();
    hasStarted = true;
    displayMakeShapeFirst = false;
  } else {
    createVerticalLine();
    soundManager.playLineVSound();
    hasStarted = true;
    displayMakeShapeFirst = false;
  }
}

function speedUp() {
  for (let shape of shapes) {
    // Skip dying shapes - don't add speed to them
    if (shape.isDying) {
      continue;
    }

    shape.addSpeed(2);
  }
  scoreNeedsUpdate = true; // Speed affects score
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
    '#4a294eff' // Purple
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