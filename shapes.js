// Shape Classes for Circles and Lines with warning and death animations

// Overall structure:
// - Shape (base class) Handles common properties and methods
//   - Circle (subclass) Handles circle-specific properties and methods
//   - Line (subclass) Handles line-specific properties and methods


// Shape constants
const SHAPE_MAX_SPEED = 8;
const SHAPE_SATURATION = 100;
const SHAPE_BRIGHTNESS = 100;

// Warning phase constants
const WARNING_ENERGY_DECAY = 0.985; // Slower decay during warning (more gradual)
const WARNING_OSCILLATION_DECAY = 0.99; // Slower decay for lines during warning
const WARNING_PULSE_SPEED = 0.9; // Speed of the warning pulse animation

// Death animation constants
const DEATH_ENERGY_LOSS_PHASE = 30; // Frames for energy loss phase
const DEATH_ENERGY_DECAY = 0.92;
const DEATH_OSCILLATION_DECAY = 0.95;
const DEATH_GRAVITY_START = 0.4;
const DEATH_GRAVITY_INCREASE = 0.05;

// Line constants
const LINE_POINTS = 200;
const LINE_EXTENSION = 100;

class Shape {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.velocity = createVector(0, 0);
    this.acceleration = createVector(0, 0);
    this.speed = 0;
    this.maxSpeed = SHAPE_MAX_SPEED;
    this.isWarning = false;
    this.isDying = false;
    this.warningPulse = 0; // Timer for warning pulse animation

    // Store original values for recovery
    this.originalSpeed = 0;
    this.originalAmplitude = 0;
    this.originalOscillationSpeed = 0;

    this.color = color(random(360), SHAPE_SATURATION, SHAPE_BRIGHTNESS);
  }

  setSpeed(speed) {
    this.speed = speed;
    if (speed > 0) {
      this.velocity = p5.Vector.random2D().mult(speed);
    } else {
      this.velocity.mult(0);
    }
  }

  addSpeed(speedIncrease) {
    if (this.speed === 0) {
      this.velocity = p5.Vector.random2D().mult(speedIncrease);
      this.speed = speedIncrease;
    } else {
      this.speed += speedIncrease;
      this.velocity.setMag(this.speed);
    }
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(max(this.speed, this.maxSpeed)); // Allow speed to exceed maxSpeed
    this.position.add(this.velocity);
    this.acceleration.mult(0);
    this.edges();
  }

  edges() {
    // Don't wrap if dying - allow to fall off screen
    if (this.isDying) return;

    if (this.position.x > width) this.position.x = 0;
    else if (this.position.x < 0) this.position.x = width;

    if (this.position.y > height) this.position.y = 0;
    else if (this.position.y < 0) this.position.y = height;
  }

  startWarning() {
    if (!this.isWarning && !this.isDying) {
      this.isWarning = true;
      // Store current values as "original" for potential recovery
      this.originalSpeed = this.speed;
    }
  }

  recoverFromWarning() {
    if (this.isWarning && !this.isDying) {
      this.isWarning = false;
      this.warningPulse = 0; // Reset pulse animation
      // Restore to original speed (or boost slightly for recovery)
      if (this.originalSpeed > 0) {
        this.setSpeed(this.originalSpeed);
      }
    }
  }

  updateWarning() {
    if (!this.isWarning) return;
    // Apply gradual energy loss during warning
    this.applyWarningDecay();
    // Update pulse animation
    this.warningPulse += WARNING_PULSE_SPEED;
  }

  getWarningAlpha() {
    // Create a pulsing alpha value using sine wave (0.3 to 1.0)
    return map(sin(this.warningPulse), -1, 1, 0.3, 1.0);
  }

  startDying() {
    if (!this.isDying) {
      this.isDying = true;
      this.isWarning = false; // Exit warning state
      this.deathTimer = 0;
      this.fallVelocity = 0;
    }
  }

  updateDeathAnimation() {
    if (!this.isDying) return false;

    this.deathTimer++;

    // Phase 1: Lose energy/amplitude
    if (this.deathTimer < DEATH_ENERGY_LOSS_PHASE) {
      this.applyEnergyLoss();
    }

    // Phase 2: Gravity - fall off screen
    if (this.deathTimer >= DEATH_ENERGY_LOSS_PHASE) {
      let gravityAccel = DEATH_GRAVITY_START + (this.deathTimer - DEATH_ENERGY_LOSS_PHASE) * DEATH_GRAVITY_INCREASE;
      this.fallVelocity += gravityAccel;
      this.applyGravity();
    }

    return this.deathTimer === DEATH_ENERGY_LOSS_PHASE; // Return true when gravity starts (for sound trigger)
  }

  applyWarningDecay() {
    // Default implementation for circles - gradual slowdown
    if (this.velocity) this.velocity.mult(WARNING_ENERGY_DECAY);
    this.speed *= WARNING_ENERGY_DECAY;
  }

  applyEnergyLoss() {
    // Default implementation for circles
    if (this.velocity) this.velocity.mult(DEATH_ENERGY_DECAY);
    this.speed *= DEATH_ENERGY_DECAY;
  }

  applyGravity() {
    // Default implementation for circles
    if (this.position) {
      this.position.y += this.fallVelocity;
    }
  }

  display(desaturation = 1, brightnessMultiplier = 1) {
    // To be implemented by subclasses
  }

  displayWithWrap(desaturation = 1, brightnessMultiplier = 1) {
    // Don't wrap display if dying
    if (this.isDying) {
      this.display(desaturation, brightnessMultiplier);
      return;
    }

    let size = this.getSize ? this.getSize() : 100;

    // Draw main shape
    this.display(desaturation, brightnessMultiplier);

    // Draw wrapped versions when near edges
    if (this.position.x - size < 0) {
      push();
      translate(width, 0);
      this.display(desaturation, brightnessMultiplier);
      pop();
    } else if (this.position.x + size > width) {
      push();
      translate(-width, 0);
      this.display(desaturation, brightnessMultiplier);
      pop();
    }

    if (this.position.y - size < 0) {
      push();
      translate(0, height);
      this.display(desaturation, brightnessMultiplier);
      pop();
    } else if (this.position.y + size > height) {
      push();
      translate(0, -height);
      this.display(desaturation, brightnessMultiplier);
      pop();
    }

    // Handle corners
    if ((this.position.x - size < 0 || this.position.x + size > width) &&
        (this.position.y - size < 0 || this.position.y + size > height)) {
      let xOffset = this.position.x - size < 0 ? width : -width;
      let yOffset = this.position.y - size < 0 ? height : -height;
      push();
      translate(xOffset, yOffset);
      this.display(desaturation, brightnessMultiplier);
      pop();
    }
  }
}

class Circle extends Shape {
  constructor(x, y, radius, customColor, targetRadius = null, growthSpeed = 0.5) {
    super(x, y);
    this.radius = radius;
    this.targetRadius = targetRadius;
    this.growthSpeed = growthSpeed;
    this.isGrowing = targetRadius !== null;
    if (customColor) {
      this.color = customColor;
    }
  }

  recoverFromWarning() {
    if (this.isWarning && !this.isDying) {
      this.isWarning = false;
      this.warningPulse = 0; // Reset pulse animation
      // Restore to original speed
      if (this.originalSpeed > 0) {
        this.speed = this.originalSpeed;
        this.velocity.setMag(this.originalSpeed);
      }
    }
  }

  getSize() {
    return this.radius;
  }

  update() {
    if (this.isGrowing && this.radius < this.targetRadius) {
      this.radius += this.growthSpeed;
      if (this.radius >= this.targetRadius) {
        this.radius = this.targetRadius;
        this.isGrowing = false;
      }
    }
    super.update();
  }

  display(desaturation = 1, brightnessMultiplier = 1) {
    push();
    blendMode(DIFFERENCE);
    // Apply desaturation and brightness reduction to color
    let desaturatedColor = color(
      hue(this.color),
      saturation(this.color) * desaturation,
      brightness(this.color) * brightnessMultiplier
    );

    // Apply warning pulse if in warning state
    if (this.isWarning) {
      let alpha = this.getWarningAlpha();
      desaturatedColor.setAlpha(alpha * 255);
    }

    fill(desaturatedColor);
    ellipse(this.position.x, this.position.y, this.radius * 2);
    pop();
  }
}

class Line extends Shape {
  constructor(amplitude = 20, frequency = 0.05, isHorizontal = true) {
    // Lines don't use the position vector the same way as circles
    // We pass 0,0 to satisfy the parent constructor but manage position differently
    super(0, 0);

    this.amplitude = amplitude;
    this.frequency = frequency;
    this.timeOffset = random(1000);
    this.isHorizontal = isHorizontal;
    // The position along the axis (y for horizontal lines, x for vertical lines)
    this.axisPosition = isHorizontal ? random(height) : random(width);
    this.verticalOffset = 0; // For falling animation
    this.strokeWeight = 80;
    this.oscillationSpeed = random(0.01, 0.02);

    // Autonomous movement
    this.driftSpeed = random(0.3, 0.8);
    this.driftDirection = random(1) > 0.5 ? 1 : -1;
    this.points = LINE_POINTS;
  }

  startWarning() {
    if (!this.isWarning && !this.isDying) {
      this.isWarning = true;
      // Store original values for lines
      this.originalAmplitude = this.amplitude;
      this.originalOscillationSpeed = this.oscillationSpeed;
    }
  }

  recoverFromWarning() {
    if (this.isWarning && !this.isDying) {
      this.isWarning = false;
      this.warningPulse = 0; // Reset pulse animation
      // Restore original values
      if (this.originalAmplitude > 0) {
        this.amplitude = this.originalAmplitude;
      }
      if (this.originalOscillationSpeed > 0) {
        this.oscillationSpeed = this.originalOscillationSpeed;
      }
    }
  }

  setSpeed(speed) {
    this.oscillationSpeed = speed * 0.01;
  }

  addSpeed(speedIncrease) {
    this.oscillationSpeed += speedIncrease * 0.01;
  }

  update() {
    this.timeOffset += this.oscillationSpeed;

    // Autonomous drift
    this.axisPosition += this.driftSpeed * this.driftDirection;

    // Wrap position only if not dying
    if (!this.isDying) {
      let maxPos = this.isHorizontal ? height : width;
      if (this.axisPosition > maxPos) {
        this.axisPosition = 0;
      } else if (this.axisPosition < 0) {
        this.axisPosition = maxPos;
      }
    }

    // Don't call super.update() - lines don't use velocity-based movement
  }

  applyWarningDecay() {
    // Lines gradually lose amplitude and oscillation speed during warning
    this.amplitude *= WARNING_ENERGY_DECAY;
    this.oscillationSpeed *= WARNING_OSCILLATION_DECAY;
  }

  applyEnergyLoss() {
    // Lines lose amplitude and oscillation speed
    this.amplitude *= DEATH_ENERGY_DECAY;
    this.oscillationSpeed *= DEATH_OSCILLATION_DECAY;
  }

  applyGravity() {
    // Lines fall by increasing vertical offset
    this.verticalOffset += this.fallVelocity;
  }

  display(desaturation = 1, brightnessMultiplier = 1) {
    push();
    blendMode(DIFFERENCE);
    // Apply desaturation and brightness reduction to color
    let desaturatedColor = color(
      hue(this.color),
      saturation(this.color) * desaturation,
      brightness(this.color) * brightnessMultiplier
    );

    // Apply warning pulse if in warning state
    if (this.isWarning) {
      let alpha = this.getWarningAlpha();
      desaturatedColor.setAlpha(alpha * 255);
    }

    stroke(desaturatedColor);
    strokeWeight(this.strokeWeight);
    noFill();

    beginShape();
    if (this.isHorizontal) {
      for (let i = 0; i < this.points; i++) {
        let x = map(i, 0, this.points - 1, -LINE_EXTENSION, width + LINE_EXTENSION);
        let phase = (x / width) * this.frequency * TWO_PI;
        let offset = sin(this.timeOffset + phase) * this.amplitude;
        let y = this.axisPosition + offset + this.verticalOffset;
        curveVertex(x, y);
      }
    } else {
      for (let i = 0; i < this.points; i++) {
        let y = map(i, 0, this.points - 1, -LINE_EXTENSION, height + LINE_EXTENSION);
        let phase = (y / height) * this.frequency * TWO_PI;
        let offset = sin(this.timeOffset + phase) * this.amplitude;
        let x = this.axisPosition + offset;
        curveVertex(x, y + this.verticalOffset);
      }
    }
    endShape();

    pop();
  }

  // Lines don't need wrapping - they extend beyond the canvas edges
  // So we override displayWithWrap to just call display
  displayWithWrap(desaturation = 1, brightnessMultiplier = 1) {
    this.display(desaturation, brightnessMultiplier);
  }
}