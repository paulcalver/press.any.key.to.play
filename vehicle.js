

class Word {
  constructor(x, y, text) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxSpeed = random(2, 12);  // Random speed between 2 and 8
    this.maxForce = 0.4;
    this.r = 20;
    this.textSize = 32;
    this.text = text;  // Store the word to display

  }


  flee(target) {
    return this.seek(target).mult(-1);
  }

  seek(target, attractionRadius = 200) {
    let force = p5.Vector.sub(target, this.pos);
    let distance = force.mag();
    
    // If too far away, return zero force (no attraction)
    if (distance > attractionRadius) {
      return createVector(0, 0);
    }
    
    let desiredSpeed = this.maxSpeed;
    force.setMag(desiredSpeed);
    force.sub(this.vel);
    force.limit(this.maxForce);
    return force;
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.set(0, 0);
  }

    edges() {
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.y > height) this.pos.y = 0;
    if (this.pos.y < 0) this.pos.y = height;
  }

  show() {
    textAlign(CENTER, CENTER);
    textSize(this.textSize);
    //fill(255);
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());
    text(this.text, 0, 0);  // Display the stored text
    pop();
  }

}