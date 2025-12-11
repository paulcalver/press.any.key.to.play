let video;
let activeTimer = null; // Current active timer
let fadingTimers = []; // Array of timers that are fading away

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.hide();

  // Initialize face detection from faceDetection.js
  initFaceDetection(video);
}

function draw() {
  background(0);

  // Get current looking state from face detection module
  const isLooking = getIsLooking();

  // Start new timer when looking and no active timer exists
  if (isLooking && !activeTimer) {
    activeTimer = {
      score: 0,
      x: random(width * 0.2, width * 0.8),
      y: random(height * 0.2, height * 0.8),
      alpha: 255
    };
  }

  // Update active timer
  if (activeTimer) {
    if (isLooking) {
      // Increase score while looking
      activeTimer.score += 50;
      activeTimer.alpha = 255;
    } else {
      // Not looking - move to fading array and clear active
      fadingTimers.push(activeTimer);
      activeTimer = null;
    }
  }

  // Update all fading timers
  for (let i = fadingTimers.length - 1; i >= 0; i--) {
    fadingTimers[i].alpha -= 0.5; // Fade speed
    
    // Remove timer if fully faded
    if (fadingTimers[i].alpha <= 0) {
      fadingTimers.splice(i, 1);
    }
  }

  // Display active timer
  if (activeTimer) {
    textAlign(CENTER, CENTER);
    textSize(72);
    fill(255, activeTimer.alpha);
    noStroke();
    text(activeTimer.score, activeTimer.x, activeTimer.y);
  }

  // Display all fading timers
  for (let timer of fadingTimers) {
    textAlign(CENTER, CENTER);
    textSize(72);
    fill(255, timer.alpha);
    noStroke();
    text(timer.score, timer.x, timer.y);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}