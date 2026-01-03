class Shape {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.velocity = createVector(0, 0);
    this.acceleration = createVector(0, 0);
    this.speed = 0;
    this.maxSpeed = 8;
    this.maxForce = 0.5;
    this.isAttracting = false;
    colorMode(HSB, 360, 100, 100, 255);
    this.color = color(random(360), 100, 100);
    
    // Flocking parameters - to be overridden by subclasses for personality
    this.separationWeight = 1.5;
    this.alignmentWeight = 1.0;
    this.cohesionWeight = 1.0;
    this.perceptionRadius = 100;
    this.separationRadius = 50;
    
    // this.lifespan = 255; // Start fully opaque
    // this.fadeRate = 255 / (100 * 60); // Fade over 10 seconds (assuming 60fps)
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
      // If not moving, start with random direction
      this.velocity = p5.Vector.random2D().mult(speedIncrease);
      this.speed = speedIncrease;
    } else {
      // If already moving, increase speed in current direction
      this.speed += speedIncrease;
      this.velocity.setMag(this.speed);
    }
  }

  seek(target) {
    // Calculate desired velocity to move towards target
    let desired = p5.Vector.sub(target, this.position);
    let distance = desired.mag();

    // Only seek if there's a reasonable distance
    if (distance > 5) {
      desired.setMag(this.maxSpeed);

      // Steering = Desired - Velocity
      let steer = p5.Vector.sub(desired, this.velocity);
      steer.limit(this.maxForce);

      return steer;
    }
    return createVector(0, 0);
  }

  enableAttraction() {
    this.isAttracting = true;
    // When attraction is enabled, slow down existing velocity
    // so that seeking forces can take over
    this.velocity.mult(0.3);
  }

  // Flocking behaviors
  flock(shapes) {
    let separation = this.separate(shapes);
    let alignment = this.align(shapes);
    let cohesion = this.cohere(shapes);
    
    separation.mult(this.separationWeight);
    alignment.mult(this.alignmentWeight);
    cohesion.mult(this.cohesionWeight);
    
    this.acceleration.add(separation);
    this.acceleration.add(alignment);
    this.acceleration.add(cohesion);
  }

  separate(shapes) {
    let steer = createVector(0, 0);
    let count = 0;
    
    for (let other of shapes) {
      if (other === this) continue;
      if (!(other instanceof Circle || other instanceof Triangle || 
            other instanceof Square || other instanceof Rectangle)) continue;
      
      let d = p5.Vector.dist(this.position, other.position);
      
      if (d > 0 && d < this.separationRadius) {
        let diff = p5.Vector.sub(this.position, other.position);
        diff.normalize();
        diff.div(d); // Weight by distance
        steer.add(diff);
        count++;
      }
    }
    
    if (count > 0) {
      steer.div(count);
      steer.setMag(this.maxSpeed);
      steer.sub(this.velocity);
      steer.limit(this.maxForce);
    }
    
    return steer;
  }

  align(shapes) {
    let sum = createVector(0, 0);
    let count = 0;
    
    for (let other of shapes) {
      if (other === this) continue;
      if (!(other instanceof Circle || other instanceof Triangle || 
            other instanceof Square || other instanceof Rectangle)) continue;
      
      let d = p5.Vector.dist(this.position, other.position);
      
      if (d > 0 && d < this.perceptionRadius) {
        sum.add(other.velocity);
        count++;
      }
    }
    
    if (count > 0) {
      sum.div(count);
      sum.setMag(this.maxSpeed);
      let steer = p5.Vector.sub(sum, this.velocity);
      steer.limit(this.maxForce);
      return steer;
    }
    
    return createVector(0, 0);
  }

  cohere(shapes) {
    let sum = createVector(0, 0);
    let count = 0;
    
    for (let other of shapes) {
      if (other === this) continue;
      if (!(other instanceof Circle || other instanceof Triangle || 
            other instanceof Square || other instanceof Rectangle)) continue;
      
      let d = p5.Vector.dist(this.position, other.position);
      
      if (d > 0 && d < this.perceptionRadius) {
        sum.add(other.position);
        count++;
      }
    }
    
    if (count > 0) {
      sum.div(count);
      return this.seek(sum);
    }
    
    return createVector(0, 0);
  }

  update() {
    // Apply acceleration to velocity
    this.velocity.add(this.acceleration);

    // Use appropriate speed limit based on whether we're attracting
    let speedLimit = this.isAttracting ? this.maxSpeed : max(this.speed, this.maxSpeed);
    this.velocity.limit(speedLimit);

    this.position.add(this.velocity);
    // Reset acceleration each frame
    this.acceleration.mult(0);
    this.edges();
    // this.lifespan -= this.fadeRate;
    // To be implemented by subclasses
  }

  isAlive() {
    // return this.lifespan > 0;
    return true;
  }

  edges() {
    if (this.position.x > width) {
      this.position.x = 0;
    } else if (this.position.x < 0) {
      this.position.x = width;
    }

    if (this.position.y > height) {
      this.position.y = 0;
    } else if (this.position.y < 0) {
      this.position.y = height;
    }
  }

  display() {
    // To be implemented by subclasses
  }

  // Check if shape needs to wrap and draw at wrapped positions
  displayWithWrap() {
    let size = this.getSize ? this.getSize() : 100; // Get shape size for wrapping

    // Draw main shape
    this.display();

    // Draw wrapped versions when near edges
    if (this.position.x - size < 0) {
      // Near left edge, draw on right
      push();
      translate(width, 0);
      this.display();
      pop();
    } else if (this.position.x + size > width) {
      // Near right edge, draw on left
      push();
      translate(-width, 0);
      this.display();
      pop();
    }

    if (this.position.y - size < 0) {
      // Near top edge, draw on bottom
      push();
      translate(0, height);
      this.display();
      pop();
    } else if (this.position.y + size > height) {
      // Near bottom edge, draw on top
      push();
      translate(0, -height);
      this.display();
      pop();
    }

    // Handle corners (shape wrapping both horizontally and vertically)
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
  constructor(x, y, radius, customColor, targetRadius = null, growthSpeed = 20, autoRemove = false) {
    super(x, y);
    this.radius = radius;
    this.targetRadius = targetRadius;
    this.growthSpeed = growthSpeed;
    this.isGrowing = targetRadius !== null;
    this.autoRemove = autoRemove;
    if (customColor) {
      this.color = customColor;
    }
    
    // Circle personality: Social and cohesive - they love groups
    this.separationWeight = 0.8;  // Less personal space needed
    this.alignmentWeight = 1.5;   // Really want to move with the group
    this.cohesionWeight = 2.0;    // Strong pull toward center of group
    this.perceptionRadius = 120;
    this.separationRadius = 40;
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

        // If this is a clean circle, mark shapes as dead so they'll be removed
        // in the cleanup phase of draw() (safer than removing during iteration)
        if (this.isCleanCircle) {
          for (let i = 0; i < shapes.length; i++) {
            if (shapes[i].markedForClean && shapes[i] !== this) {
              shapes[i].isDead = true;
            }
          }
          console.log('Marked shapes for cleanup!');
          // Mark this circle to die on the next frame (after cleanup happens)
          this.cleanupDone = true;
        }
      }
    }
    // Call parent update for movement
    super.update();
  }

  isAlive() {
    // Check if manually marked as dead
    if (this.isDead) {
      return false;
    }
    // If this is a clean circle, only die after cleanup is done
    if (this.isCleanCircle && this.cleanupDone) {
      return false;
    }
    // If autoRemove is true, remove after growth is complete
    if (this.autoRemove && !this.isGrowing && !this.isCleanCircle) {
      return false;
    }
    return super.isAlive();
  }

  display() {
    // let c = color(hue(this.color), saturation(this.color), brightness(this.color), this.lifespan);
    // fill(c);
    fill(this.color);
    ellipse(this.position.x, this.position.y, this.radius * 2);
  }
}

class Line {
  constructor(amplitude = 20, frequency = 0.05, isHorizontal = true) {
    this.amplitude = amplitude;
    this.frequency = frequency;
    this.timeOffset = random(1000);
    this.isHorizontal = isHorizontal;
    this.position = random(isHorizontal ? height : width);
    this.points = 200;
    this.strokeWeight = 80;
    this.oscillationSpeed = random(0.01, 0.02);
    this.baseOscillationSpeed = this.oscillationSpeed;
    colorMode(HSB, 360, 100, 100, 255);
    this.color = color(random(360), 100, 100);
    
    // Autonomous movement
    this.driftSpeed = random(0.3, 0.8);
    this.driftDirection = random(1) > 0.5 ? 1 : -1;
    
    // Lines are curious - they move toward areas with more shapes
    this.curiosity = random(0.5, 1.5);
    
    // Lines breathe - amplitude changes over time
    this.breathSpeed = random(0.005, 0.015);
    this.baseAmplitude = amplitude;
    this.amplitudeTarget = amplitude;
    
    // this.lifespan = 255;
    // this.fadeRate = 255 / (100 * 60);
  }

  setSpeed(speed) {
    // For lines, speed affects oscillation
    this.oscillationSpeed = speed * 0.01;
  }

  addSpeed(speedIncrease) {
    // Increase oscillation speed
    this.oscillationSpeed += speedIncrease * 0.01;
  }

  enableAttraction() {
    // Lines don't have attraction behavior, but need this method
    // to avoid errors when "love" command is called
  }

  update(shapes) {
    this.timeOffset += this.oscillationSpeed;
    
    // Autonomous drift
    this.position += this.driftSpeed * this.driftDirection;
    
    // Wrap position
    let maxPos = this.isHorizontal ? height : width;
    if (this.position > maxPos) {
      this.position = 0;
    } else if (this.position < 0) {
      this.position = maxPos;
    }
    
    // Lines are curious - move toward areas with more shapes
    if (shapes && frameCount % 60 === 0) { // Check every second
      let densityAbove = 0;
      let densityBelow = 0;
      
      for (let shape of shapes) {
        if (shape === this || shape instanceof Line) continue;
        
        if (this.isHorizontal) {
          if (shape.position && shape.position.y < this.position) {
            densityAbove++;
          } else if (shape.position && shape.position.y > this.position) {
            densityBelow++;
          }
        } else {
          if (shape.position && shape.position.x < this.position) {
            densityAbove++;
          } else if (shape.position && shape.position.x > this.position) {
            densityBelow++;
          }
        }
      }
      
      // Drift toward higher density with some randomness
      if (densityAbove > densityBelow + 2) {
        this.driftDirection = -this.curiosity;
      } else if (densityBelow > densityAbove + 2) {
        this.driftDirection = this.curiosity;
      } else if (random(1) < 0.1) {
        // Sometimes randomly change direction
        this.driftDirection *= -1;
      }
    }
    
    // Breathe - amplitude changes over time
    let breathe = sin(frameCount * this.breathSpeed) * (this.baseAmplitude * 0.3);
    this.amplitude = this.baseAmplitude + breathe;
    
    // this.lifespan -= this.fadeRate;
  }

  isAlive() {
    // Check if manually marked as dead (for clean command)
    if (this.isDead) {
      return false;
    }
    // return this.lifespan > 0;
    return true;
  }

  display() {
    push();

    // let c = color(hue(this.color), saturation(this.color), brightness(this.color), this.lifespan);
    // stroke(c);
    stroke(this.color);
    strokeWeight(this.strokeWeight);
    noFill();

    let extension = 100; // Extend lines beyond canvas

    beginShape();
    if (this.isHorizontal) {
      // Horizontal line across the width (extended)
      for (let i = 0; i < this.points; i++) {
        let x = map(i, 0, this.points - 1, -extension, width + extension);
        let phase = (x / width) * this.frequency * TWO_PI;
        let offset = sin(this.timeOffset + phase) * this.amplitude;
        let y = this.position + offset;
        curveVertex(x, y);
      }
    } else {
      // Vertical line across the height (extended)
      for (let i = 0; i < this.points; i++) {
        let y = map(i, 0, this.points - 1, -extension, height + extension);
        let phase = (y / height) * this.frequency * TWO_PI;
        let offset = sin(this.timeOffset + phase) * this.amplitude;
        let x = this.position + offset;
        curveVertex(x, y);
      }
    }
    endShape();

    pop();
  }

  displayWithWrap() {
    this.display();
  }
}

class Triangle extends Shape {
  constructor(x, y, size, customColor) {
    super(x, y);
    this.size = size;
    if (customColor) {
      this.color = customColor;
    }
    
    // Triangle personality: Independent and spiky - they need space
    this.separationWeight = 2.5;  // Strong personal boundaries
    this.alignmentWeight = 0.5;   // Don't care much about matching others
    this.cohesionWeight = 0.3;    // Prefer to wander alone
    this.perceptionRadius = 80;
    this.separationRadius = 70;   // Large separation distance
    
    this.spinSpeed = 0.01;
    this.angle = 0;
  }

  getSize() {
    return this.size;
  }

  isAlive() {
    // Check if manually marked as dead (for clean command)
    if (this.isDead) {
      return false;
    }
    return true;
  }

  display() {
    fill(this.color);
    push();
    translate(this.position.x, this.position.y);
    this.angle += this.spinSpeed;
    rotate(this.angle);
    let h = this.size * sqrt(3) / 2;
    triangle(0, -h/2, -this.size/2, h/2, this.size/2, h/2);
    pop();
  }
}

class Square extends Shape {
  constructor(x, y, size, customColor) {
    super(x, y);
    this.size = size;
    if (customColor) {
      this.color = customColor;
    }
    
    // Square personality: Orderly and synchronized - they like to move in formation
    this.separationWeight = 1.2;  // Moderate personal space
    this.alignmentWeight = 2.5;   // Strongly want to match direction/speed
    this.cohesionWeight = 1.0;    // Moderate attraction to group
    this.perceptionRadius = 100;
    this.separationRadius = 50;
    
    this.spinSpeed = 0.01;
    this.angle = 0;
  }

  getSize() {
    return this.size;
  }

  isAlive() {
    // Check if manually marked as dead (for clean command)
    if (this.isDead) {
      return false;
    }
    return true;
  }

  display() {
    fill(this.color);
    push();
    translate(this.position.x, this.position.y);
    this.angle += this.spinSpeed;
    rotate(this.angle);
    rectMode(CENTER);
    rect(0, 0, this.size, this.size);
    pop();
  }
}

class Rectangle extends Shape {
  constructor(x, y, width, height, customColor) {
    super(x, y);
    this.width = width;
    this.height = height;
    if (customColor) {
      this.color = customColor;
    }
    
    // Rectangle personality: Balanced and moderate - the diplomats
    this.separationWeight = 1.3;  // Balanced personal space
    this.alignmentWeight = 1.3;   // Balanced alignment
    this.cohesionWeight = 1.3;    // Balanced cohesion
    this.perceptionRadius = 90;
    this.separationRadius = 55;
    
    this.spinSpeed = 0.005;
    this.angle = 0;
  }

  getSize() {
    return max(this.width, this.height);
  }

  isAlive() {
    // Check if manually marked as dead (for clean command)
    if (this.isDead) {
      return false;
    }
    return true;
  }

  display() {
    fill(this.color);
    push();
    translate(this.position.x, this.position.y);
    this.angle += this.spinSpeed;
    rotate(this.angle);
    rectMode(CENTER);
    rect(0, 0, this.width, this.height);
    pop();
  }
}