class Shape {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.velocity = createVector(0, 0);
    this.acceleration = createVector(0, 0);
    this.speed = 0;
    this.maxSpeed = 8;
    this.isDying = false;
    
    colorMode(HSB, 360, 100, 100, 255);
    this.color = color(random(360), 100, 100);
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

  display() {
    // To be implemented by subclasses
  }

  displayWithWrap() {
    // Don't wrap display if dying
    if (this.isDying) {
      this.display();
      return;
    }
    
    let size = this.getSize ? this.getSize() : 100;

    // Draw main shape
    this.display();

    // Draw wrapped versions when near edges
    if (this.position.x - size < 0) {
      push();
      translate(width, 0);
      this.display();
      pop();
    } else if (this.position.x + size > width) {
      push();
      translate(-width, 0);
      this.display();
      pop();
    }

    if (this.position.y - size < 0) {
      push();
      translate(0, height);
      this.display();
      pop();
    } else if (this.position.y + size > height) {
      push();
      translate(0, -height);
      this.display();
      pop();
    }

    // Handle corners
    if ((this.position.x - size < 0 || this.position.x + size > width) &&
        (this.position.y - size < 0 || this.position.y + size > height)) {
      let xOffset = this.position.x - size < 0 ? width : -width;
      let yOffset = this.position.y - size < 0 ? height : -height;
      push();
      translate(xOffset, yOffset);
      this.display();
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

  display() {
    fill(this.color);
    ellipse(this.position.x, this.position.y, this.radius * 2);
  }
}

class Line extends Shape {
  constructor(amplitude = 20, frequency = 0.05, isHorizontal = true) {
    // Use position as the axis position (y for horizontal, x for vertical)
    let pos = isHorizontal ? random(height) : random(width);
    super(pos, pos); // Create position vector, but we'll override how it's used
    
    this.amplitude = amplitude;
    this.frequency = frequency;
    this.timeOffset = random(1000);
    this.isHorizontal = isHorizontal;
    this.axisPosition = pos; // The position along the axis (y for H, x for V)
    this.verticalOffset = 0; // For falling animation
    this.points = 200;
    this.strokeWeight = 80;
    this.oscillationSpeed = random(0.01, 0.02);
    
    // Autonomous movement
    this.driftSpeed = random(0.3, 0.8);
    this.driftDirection = random(1) > 0.5 ? 1 : -1;
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

  display() {
    push();
    stroke(this.color);
    strokeWeight(this.strokeWeight);
    noFill();

    let extension = 100;

    beginShape();
    if (this.isHorizontal) {
      for (let i = 0; i < this.points; i++) {
        let x = map(i, 0, this.points - 1, -extension, width + extension);
        let phase = (x / width) * this.frequency * TWO_PI;
        let offset = sin(this.timeOffset + phase) * this.amplitude;
        let y = this.axisPosition + offset + this.verticalOffset;
        curveVertex(x, y);
      }
    } else {
      for (let i = 0; i < this.points; i++) {
        let y = map(i, 0, this.points - 1, -extension, height + extension);
        let phase = (y / height) * this.frequency * TWO_PI;
        let offset = sin(this.timeOffset + phase) * this.amplitude;
        let x = this.axisPosition + offset;
        curveVertex(x, y + this.verticalOffset);
      }
    }
    endShape();

    pop();
  }

  displayWithWrap() {
    this.display();
  }
}