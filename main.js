let input;
let asciiTotal = 0;
let wordAsciiTotals = [];
let words = [];
let shapes = [];
let bgColor = 200;

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Create text input area on the left with no border
  input = createElement('textarea');
  input.position(20, 20);
  input.size(width * 0.4, height - 40);
  input.style('border', 'none');
  input.style('background-color', 'transparent');
  input.style('color', '#000');
  input.style('font-size', '26px');
  input.style('resize', 'none');
  input.style('outline', 'none');
  input.attribute('placeholder', 'Type here...');
  input.input(calculateAsciiTotal);
}

let lastTextLength = 0;


function handleVisualEffects(text, spaceTyped) {
  let previousLength = shapes.length;


  // Handle word completion effects
  if (spaceTyped && words.length > 0) {
    let lastWord = words[words.length - 1].toLowerCase();
    let lastWordTotal = wordAsciiTotals[wordAsciiTotals.length - 1];
    console.log('Word completed:', lastWord, 'ASCII:', lastWordTotal);

    // Special word conditions
    if (lastWord === 'sun' || lastWord === 'sunshine') {
      let x = random(width * 0.5, width);
      let y = random(0, height);
      let sunColor = color(49, 79, 100); // Yellow
      shapes.push(new Circle(x, y, 100, sunColor));
      console.log('Sun created!');
    }
    // Add more special words here as else if statements
    // else if (lastWord === 'moon') {
    //   // Another special word
    // }
    else {
      // Default: change background color
      bgColor = color((lastWordTotal % 320), 100, 100);
      console.log('BG Color:', bgColor);
    }
  }

  // Create shapes for each new character typed
  if (text.length > previousLength) {
    for (let i = previousLength; i < text.length; i++) {
      let charCode = text.charCodeAt(i);

      // Skip space (32) and newline (10) characters
      if (charCode === 32 || charCode === 10) {
        continue;
      }

      // Random position on right half of screen
      let x = random(width, width);
      let y = random(0, height);

      if (charCode % 2 === 1) {
        // Odd: create circle
        let radius = charCode % 50 + 10;
        shapes.push(new Circle(x, y, radius));
      } else {
        // Even: create rectangle
        let w = charCode % 60 + 20;
        let h = w;
        shapes.push(new Rectangle(x, y, w, h));
      }
    }
  } else if (text.length < previousLength) {
    shapes = shapes.slice(0, text.length);
  }
}

function draw() {
  // Use the background color set when a word is completed
  background(bgColor);

  // Update and draw all shapes
  noStroke();
  for (let shape of shapes) {
    shape.flock(shapes);
    shape.update();
    shape.borders();
    shape.display();
  }

  //fill(230);
  //rect(0, 0, width * 0.5, height);

}


function calculateAsciiTotal() {
  let text = input.value();

  // Calculate total ASCII for entire text
  asciiTotal = 0;
  for (let i = 0; i < text.length; i++) {
    asciiTotal += text.charCodeAt(i);
  }

  // Check if space or return was just typed
  let spaceTyped = false;
  if (text.length > lastTextLength) {
    let lastChar = text.charAt(text.length - 1);
    if (lastChar === ' ' || lastChar === '\n') {
      spaceTyped = true;
    }
  }

  // Calculate ASCII total for each word
  wordAsciiTotals = [];
  let wordsTemp = text.split(/\s+/); // Split by whitespace
  words = [];

  for (let word of wordsTemp) {
    if (word.length > 0) {
      words.push(word);
      let wordTotal = 0;
      for (let i = 0; i < word.length; i++) {
        wordTotal += word.charCodeAt(i);
      }
      wordAsciiTotals.push(wordTotal);
    }
  }

  lastTextLength = text.length;

  console.log('Total ASCII:', asciiTotal);

  // Trigger visual effects
  handleVisualEffects(text, spaceTyped);
}

function windowResized() {
  let oldWidth = width;
  let oldHeight = height;

  resizeCanvas(windowWidth, windowHeight);

  // Resize and reposition textarea
  input.size(width * 0.4, height - 40);

  // Scale all shape positions proportionally
  for (let shape of shapes) {
    shape.position.x = (shape.position.x / oldWidth) * width;
    shape.position.y = (shape.position.y / oldHeight) * height;
  }
}
