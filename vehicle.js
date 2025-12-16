class Boid {
  constructor(x, y, size, maxSpeed, maxForce, slowRadius) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxSpeed = maxSpeed || 8;
    this.maxForce = maxForce || 2;
    this.slowRadius = slowRadius || 100;
    this.r = 20;
    this.size = size;
    this.rotation = random([0, 90, 180, 270]);
    this.alpha = 200;

  }


  flee(target) {
    return this.seek(target).mult(-1);
  }

  arrive(target, attractionRadius = 800) {
    let force = p5.Vector.sub(target, this.pos);
    let distance = force.mag();
    
    // If too far away, return zero force (no attraction)
    if (distance > attractionRadius) {
      return createVector(0, 0);
    }
    
    let desiredSpeed = this.maxSpeed;
    
    // Slow down when arriving
    if (distance < this.slowRadius) {
      desiredSpeed = map(distance, 0, this.slowRadius, 0, this.maxSpeed);
    }
    
    force.setMag(desiredSpeed);
    force.sub(this.vel);
    force.limit(this.maxForce);
    return force;
  }

  seek(target) {
    let force = p5.Vector.sub(target, this.pos);
    let distance = force.mag();
    let attractionRadius = 800;  // Only attract when within this distance
    
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
    push();
    translate(this.pos.x, this.pos.y);
    rotate(radians(this.rotation));
    
    noStroke();
    fill(197,79,79);
    circle(0, 0, this.size);
    pop();

  }

}

class Triangle extends Boid {

  show() {

    push();
    translate(this.pos.x, this.pos.y);
    rotate(radians(this.rotation));
    translate(-this.size / 2, -this.size / 2);
    
    // Black triangle (bottom-left)
    noStroke();
    fill(0, this.alpha);
    triangle(0, 0, 0, this.size, this.size, this.size);
    pop();

  }

}

