let input;
let asciiTotal = 0;
let wordAsciiTotals = [];
let words = [];
let shapes = [];
let bgColor;
let colorCache = {}; // Store colors we've already looked up

async function getColorFromWord(word) {
  // Check cache first
  if (colorCache[word]) {
    console.log('Color from cache:', word);
    return colorCache[word];
  }

  try {
    // Add minimum 3 character check
    if (word.length < 3) {
      return null;
    }
    
    const response = await fetch(`https://api.color.pizza/v1/names/?name=${encodeURIComponent(word)}`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    console.log('Full API response:', data);

    // Try different possible response structures
    let colors = data;
    if (data.colors) colors = data.colors;
    
    if (Array.isArray(colors) && colors.length > 0) {
      const colorData = colors[0];
      console.log('Color data:', colorData);

      // Check if the color name is an exact match (case insensitive)
      if (colorData.name && colorData.name.toLowerCase() !== word.toLowerCase()) {
        console.log('Not an exact match:', colorData.name, 'vs', word);
        return null;
      }

      // Try to get hex value and convert
      if (colorData.hex) {
        let hexValue = colorData.hex;
        if (hexValue.startsWith('#')) hexValue = hexValue.slice(1);

        const r = parseInt(hexValue.substr(0, 2), 16) / 255 * 360;
        const g = parseInt(hexValue.substr(2, 2), 16) / 255 * 100;
        const b = parseInt(hexValue.substr(4, 2), 16) / 255 * 100;

        // Just use the hex directly with p5
        const col = color('#' + hexValue);
        colorCache[word] = col;
        console.log('Created color:', colorData.name, hexValue);
        return col;
      }
    }
    
    return null;
    
  } catch (e) {
    console.error('API error:', e);
    return null;
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 255);
  bgColor = color(0, 0, 100); // FIXED: Initialize as color object

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

function parseNumberWord(word) {
  const numberWords = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20
  };

  // Check if it's a word number
  if (numberWords[word] !== undefined) {
    return numberWords[word];
  }

  // Check if it's a digit
  let num = parseInt(word);
  if (!isNaN(num) && num > 0 && num <= 100) {
    return num;
  }

  return null;
}

async function handleVisualEffects(text, spaceTyped) {
  let previousLength = shapes.length;

  // Handle word completion effects
  if (spaceTyped && words.length > 0) {
    let lastWord = words[words.length - 1].toLowerCase();
    // FIXED: Remove punctuation from word before checking
    lastWord = lastWord.replace(/[.,!?;:]/g, '');
    let lastWordTotal = wordAsciiTotals[wordAsciiTotals.length - 1];
    console.log('Word completed:', lastWord, 'ASCII:', lastWordTotal);

    // Check if the previous word is a number
    let count = 1;
    let actualCommand = lastWord;

    if (words.length >= 2) {
      let previousWord = words[words.length - 2].toLowerCase().replace(/[.,!?;:]/g, '');
      let parsedNumber = parseNumberWord(previousWord);

      if (parsedNumber !== null) {
        count = parsedNumber;
        actualCommand = lastWord;
        console.log(`Found number: ${count} ${actualCommand}`);
      }
    }

    lastWord = actualCommand;

    // Special word conditions
    if (lastWord === 'circle' || lastWord === 'c' || lastWord === 'circles'  || lastWord === 'round') {
      for (let n = 0; n < count; n++) {
        let x = random(width);
        let y = random(height);
        let circleColor = color(random(360), 100, 100);
        let startRadius = random(10, 20);
        let targetRadius = random(100, 140);
        let growthSpeed = 0.5;
        let circle = new Circle(x, y, startRadius, circleColor, targetRadius, growthSpeed);
        circle.setSpeed(random(2, 5));
        shapes.push(circle);
      }
      console.log(`${count} circle(s) created!`);
    }
    else if (lastWord === 'line' || lastWord === 'l' || lastWord === 'lines' || lastWord === 'waves') {
      for (let n = 0; n < count; n++) {
        let amplitude = random(15, 400);
        let frequency = random(0.3, 0.8);
        let newLine = new Line(amplitude, frequency, false);
        shapes.push(newLine);
      }
      console.log(`${count} line(s) created!`);
    }
    else if (lastWord === 'triangle' || lastWord === 't' || lastWord === 'triangles' || lastWord === 'tri') {
      for (let n = 0; n < count; n++) {
        let x = random(width);
        let y = random(height);
        let triangleColor = color(random(360), 100, 100);
        let size = random(40, 120);
        let triangle = new Triangle(x, y, size, triangleColor);
        triangle.setSpeed(random(2, 5));
        shapes.push(triangle);
      }
      console.log(`${count} triangle(s) created!`);
    }
    else if (lastWord === 'square' || lastWord === 's' || lastWord === 'squares' || lastWord === 'box') {
      for (let n = 0; n < count; n++) {
        let x = random(width);
        let y = random(height);
        let squareColor = color(random(360), 100, 100);
        let size = random(40, 100);
        let square = new Square(x, y, size, squareColor);
        square.setSpeed(random(2, 5));
        shapes.push(square);
      }
      console.log(`${count} square(s) created!`);
    }
    else if (lastWord === 'rectangle' || lastWord === 'rect' || lastWord === 'rectangles' || lastWord === 'bar') {
      for (let n = 0; n < count; n++) {
        let x = random(width);
        let y = random(height);
        let rectColor = color(random(360), 100, 100);
        let w = random(60, 150);
        let h = random(30, 80);
        let rectangle = new Rectangle(x, y, w, h, rectColor);
        rectangle.setSpeed(random(2, 5));
        shapes.push(rectangle);
      }
      console.log(`${count} rectangle(s) created!`);
    }
    else if (lastWord === 'fast' || lastWord === 'faster') {
      for (let shape of shapes) {
        shape.addSpeed(3);
      }
    }
    else if (lastWord === 'slow' || lastWord === 'go') {
      for (let shape of shapes) {
        shape.setSpeed(2);
      }
    }
    else if (lastWord === 'stop') {
      for (let shape of shapes) {
        shape.setSpeed(0);
      }
    }
    else if (lastWord === 'spin' || lastWord === 'rotate' || lastWord === 'twirl') {
      // Make all shapes spin faster
      for (let shape of shapes) {
        if (shape instanceof Square || shape instanceof Rectangle || shape instanceof Triangle) {
          shape.spinSpeed = (shape.spinSpeed || 0.01) * 3;
        }
      }
      console.log('Shapes are spinning!');
    }
    else if (lastWord === 'chaos' || lastWord === 'wild' || lastWord === 'crazy') {
      // Every shape gets a random burst of speed in a random direction
      for (let shape of shapes) {
        if (shape.setSpeed) {
          shape.setSpeed(random(5, 15));
        }
        // Lines get super oscillatory
        if (shape instanceof Line) {
          shape.oscillationSpeed = random(0.05, 0.15);
          shape.amplitude = random(50, 200);
        }
      }
      console.log('CHAOS!');
    }
    else if (lastWord === 'freeze' || lastWord === 'pause' || lastWord === 'still') {
      // Freeze everything in place
      for (let shape of shapes) {
        if (shape.velocity) {
          shape.velocity.mult(0);
        }
        if (shape instanceof Line) {
          shape.oscillationSpeed = 0;
          shape.driftSpeed = 0;
        }
      }
      console.log('Everything frozen!');
    }
    else if (lastWord === 'scatter' || lastWord === 'explode' || lastWord === 'burst') {
      // All shapes flee from center
      let center = createVector(width / 2, height / 2);
      for (let shape of shapes) {
        if (shape.position) {
          let away = p5.Vector.sub(shape.position, center);
          away.setMag(random(8, 15));
          shape.velocity = away;
          shape.speed = away.mag();
        }
      }
      console.log('SCATTER!');
    }
    else if (lastWord === 'shrink' || lastWord === 'small' || lastWord === 'tiny') {
      // Shrink all shapes
      for (let shape of shapes) {
        if (shape instanceof Circle) {
          shape.radius *= 0.6;
        } else if (shape instanceof Triangle || shape instanceof Square) {
          shape.size *= 0.6;
        } else if (shape instanceof Rectangle) {
          shape.width *= 0.6;
          shape.height *= 0.6;
        } else if (shape instanceof Line) {
          shape.strokeWeight *= 0.6;
        }
      }
      console.log('Shapes shrinking!');
    }
    else if (lastWord === 'grow' || lastWord === 'big' || lastWord === 'large') {
      // Grow all shapes
      for (let shape of shapes) {
        if (shape instanceof Circle) {
          shape.radius *= 1.4;
        } else if (shape instanceof Triangle || shape instanceof Square) {
          shape.size *= 1.4;
        } else if (shape instanceof Rectangle) {
          shape.width *= 1.4;
          shape.height *= 1.4;
        } else if (shape instanceof Line) {
          shape.strokeWeight *= 1.4;
        }
      }
      console.log('Shapes growing!');
    }
    else if (lastWord === 'love' || lastWord === 'attract' || lastWord === 'attraction' || lastWord === 'pull') {
      // Enable attraction for all shapes
      for (let shape of shapes) {
        shape.enableAttraction();
      }
      console.log('Shapes are now attracted to each other!');
    }
    else if (lastWord === 'clean') {
      // Don't clear shapes yet - let the clean circle cover them first
      // Mark all existing shapes for removal
      for (let shape of shapes) {
        shape.markedForClean = true;
      }

      // Create a large circle with current background color that grows to cover everything
      let x = width / 2;
      let y = height / 2;
      let cleanColor = color(hue(bgColor), saturation(bgColor), brightness(bgColor)); // Use current bg color
      let startRadius = 10;
      let targetRadius = max(width, height) * 2; // Large enough to cover entire canvas
      let growthSpeed = 20; // Fast growth
      let cleanCircle = new Circle(x, y, startRadius, cleanColor, targetRadius, growthSpeed, true);
      cleanCircle.isCleanCircle = true; // Mark this as the clean circle
      shapes.push(cleanCircle);

      // Clear the text area
      input.value('');
      words = [];
      wordAsciiTotals = [];
      asciiTotal = 0;
      lastTextLength = 0;

      console.log('Clean circle created with bg color!');
    }
    else {
      // Try to get color from API
      const apiColor = await getColorFromWord(lastWord);
      if (apiColor) {
        bgColor = apiColor;
        console.log('BG Color from API:', lastWord);
      }
      // If API returns null, don't change background color at all
    }
  }
}

function draw() {
  // Use the background color set when a word is completed
  background(bgColor);

  // Apply flocking behavior to all moving shapes
  for (let i = 0; i < shapes.length; i++) {
    if (shapes[i] instanceof Circle || shapes[i] instanceof Triangle || 
        shapes[i] instanceof Square || shapes[i] instanceof Rectangle) {
      
      // Don't apply flocking to growing circles or clean circles
      if (shapes[i] instanceof Circle && (shapes[i].isGrowing || shapes[i].isCleanCircle)) {
        continue;
      }
      
      // Apply flocking if shape has any speed or is attracting
      if (shapes[i].speed > 0 || shapes[i].isAttracting) {
        shapes[i].flock(shapes);
      }
    }
  }

  // Update and draw all shapes
  noStroke();
  // Draw shapes forward (oldest to newest) so newest are on top
  for (let i = 0; i < shapes.length; i++) {
    // If attraction is enabled, make shapes seek each other
    // Only process Circle instances (they have vector position and seeking capability)
    if (shapes[i].isAttracting && shapes[i] instanceof Circle) {
      // Find closest Circle
      let closest = null;
      let closestDist = Infinity;

      for (let j = 0; j < shapes.length; j++) {
        if (i !== j && shapes[j] instanceof Circle) {
          let d = p5.Vector.dist(shapes[i].position, shapes[j].position);
          if (d < closestDist) {
            closestDist = d;
            closest = shapes[j];
          }
        }
      }

      // Seek towards closest shape
      if (closest) {
        let force = shapes[i].seek(closest.position);
        shapes[i].acceleration.add(force);
      }
    }

    // Pass shapes array to update for lines to sense density
    if (shapes[i] instanceof Line) {
      shapes[i].update(shapes);
    } else {
      shapes[i].update();
    }
    
    shapes[i].displayWithWrap();
  }

  // Remove dead shapes in reverse to avoid index issues
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (!shapes[i].isAlive()) {
      shapes.splice(i, 1);
    }
  }
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
  let wordsTemp = text.split(/\s+/);
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
  input.size(width * 0.4, height - 40);

  for (let shape of shapes) {
    shape.position.x = (shape.position.x / oldWidth) * width;
    shape.position.y = (shape.position.y / oldHeight) * height;
  }
}