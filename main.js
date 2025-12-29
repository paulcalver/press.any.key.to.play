let input;
let asciiTotal = 0;
let wordAsciiTotals = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  flock = new Flock();

  // Add an initial set of boids into the system
  for (let i = 0; i < 100; i++) {
    let b = new Boid(width * 0.75, height * 0.5);
    flock.addBoid(b);
  }

  // Create text input area on the left with no border
  input = createElement('textarea');
  input.position(20, 20);
  input.size(width * 0.4, height - 40);
  input.style('border', 'none');
  input.style('background-color', 'transparent');
  input.style('color', '#000');
  input.style('font-size', '16px');
  input.style('resize', 'none');
  input.style('outline', 'none');
  input.attribute('placeholder', 'Type here...');
  input.input(calculateAsciiTotal);
}

function calculateAsciiTotal() {
  let text = input.value();

  // Calculate total ASCII for entire text
  asciiTotal = 0;
  for (let i = 0; i < text.length; i++) {
    asciiTotal += text.charCodeAt(i);
  }

  // Calculate ASCII total for each word
  wordAsciiTotals = [];
  let words = text.split(/\s+/); // Split by whitespace

  for (let word of words) {
    if (word.length > 0) {
      let wordTotal = 0;
      for (let i = 0; i < word.length; i++) {
        wordTotal += word.charCodeAt(i);
      }
      wordAsciiTotals.push(wordTotal);
    }
  }

  console.log('Total ASCII:', asciiTotal);
  //console.log('Word ASCII Totals:', wordAsciiTotals);
}

function draw() {
  background(0);
  flock.run();
  fill(230);
  rect(0, 0, width * 0.5, height);
  
}





class Flock {
  constructor() {
    // Initialize the array of boids
    this.boids = [];
  }

  run() {
    for (let boid of this.boids) {
      // Pass the entire list of boids to each boid individually
      boid.run(this.boids);
    }
  }

  addBoid(b) {
    this.boids.push(b);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
