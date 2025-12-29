class Shape {
  constructor(x, y) {
    this.position = createVector(x, y);
  }

  display() {
    // To be implemented by subclasses
  }
}

class Circle extends Shape {
  constructor(x, y, radius, color) {
    super(x, y);
    this.radius = radius;
    this.color = color || null; // Optional color parameter
  }

  display() {
    if (this.color) {
      fill(this.color);
    }
    ellipse(this.position.x, this.position.y, this.radius * 2);
  }
}

class Rectangle extends Shape {
  constructor(x, y, width, height) {
    super(x, y);
    this.width = width;
    this.height = height;
  }

  display() {
    rect(this.position.x, this.position.y, this.width, this.height);
  }
}