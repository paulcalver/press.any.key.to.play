let video;
let activeTimer = null; // Current active timer
let fadingTimers = []; // Array of timers that are fading away

let groups = [];

let seekForce = 0.05;
let evadeForceClose = 5.0;
let evadeForceFar = 3.0;

let inversion = true;
let concentrationTime = 0;
let attractionRadius = 200;

// Clustering detection
let clusterDistance = 50; // Distance threshold for considering words "together"
let groupStates = {}; // Track state of each group

// User input words
let WORDS = [];
let inputStarted = false;
let stateMessage = null;
let restartButton = null;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(220);
  textAlign(CENTER, CENTER);
  
  // Single column layout on left
  let leftX = 100;
  let textStartY = 100;
  let textSpacing = 50;

  // Input elements stacked vertically
  let intro = createP('What\'s on your mind today?<br>Let\'s make a list and get things organised!');
  intro.class('input-intro');
  intro.position(leftX, textStartY);

  let instruction = createP('Enter 2-4 words (press Enter after each):');
  instruction.class('input-instruction');
  instruction.position(leftX, textStartY + textSpacing * 3);
  
  let wordInput = createInput('');
  wordInput.class('word-input');
  wordInput.position(leftX, textStartY + textSpacing * 4);

  let wordList = createP('Words entered: 0');
  wordList.class('word-list');
  wordList.position(leftX, textStartY + textSpacing * 6);
  
  // Start button and message appear below word list
  let startBtn = createButton('Start');
  startBtn.class('start-button');
  startBtn.position(leftX, textStartY + textSpacing * 10);
  startBtn.hide(); // Hide until minimum words entered

  let startMessage = createP('Ready to start when you are, make sure you concentrate on the screen, or things might start to work against you!<br><br>(The system needs to use your webcam for this - no video data is stored or transmitted)');
  startMessage.class('start-message');
  startMessage.position(leftX, textStartY + textSpacing * 11);
  startMessage.hide(); // Hide until minimum words entered
  
  
  let userWords = [];
  
  // Handle Enter key to add word
  wordInput.changed(() => {
    let val = wordInput.value().trim();
    if (val !== '' && userWords.length < 4) {
      userWords.push({ text: val, count: 20 });
      wordInput.value('');
      
      // Create vertical list with checkboxes
      let listHTML = `Items on your list: ${userWords.length}<br><br>`;
      listHTML += userWords.map(w => `☐ ${w.text}`).join('<br>');
      wordList.html(listHTML);
      
      if (userWords.length >= 2) {
        startBtn.show();
        startMessage.show();
      }
    }
  });
  
  // Handle start button
  startBtn.mousePressed(() => {
    if (userWords.length >= 2) {
      WORDS = userWords;
      intro.remove();
      instruction.remove();
      wordInput.remove();
      wordList.remove();
      startBtn.remove();
      startMessage.remove();
      inputStarted = true;
      initializeSketch();
    }
  });
}

function initializeSketch() {
  video = createCapture(VIDEO);
  video.hide();

  fill(255);
  textFont('Space Mono');

  // Initialize face detection from faceDetection.js
  initFaceDetection(video);
  
  // Create state message element
  stateMessage = createP('');
  stateMessage.class('state-message');
  stateMessage.center('horizontal');
  stateMessage.position(stateMessage.x, height/2 - 50);
  stateMessage.hide();
  
  // Create restart button
  restartButton = createButton('Click to play!');
  restartButton.class('start-button');
  restartButton.center('horizontal');
  restartButton.position(restartButton.x, height/2 + 180);
  restartButton.hide();
  
  restartButton.mousePressed(() => {
    // Increase each word count by 25%
    for (let word of WORDS) {
      word.count = Math.floor(word.count * 1.25);
    }
    
    // Clear existing groups
    groups = [];
    
    // Reset states
    concentrationTime = 0;
    attractionRadius = 200;
    inversion = true;
    groupStates = {};
    
    // Hide completion UI
    stateMessage.hide();
    restartButton.hide();
    
    // Reinitialize with new counts
    let intialGrouping = 0.0;
    for (let wordConfig of WORDS) {
      let group = {
        name: wordConfig.text.toLowerCase(),
        members: [],
        count: wordConfig.count
      };
      
      for (let i = 0; i < group.count; i++) {
        group.members.push(new Word(
          random(width * (0 + intialGrouping), width * (1 - intialGrouping)),
          random(height * (0 + intialGrouping), height * (1 - intialGrouping)),
          wordConfig.text
        ));
      }
      
      groups.push(group);
    }
  });

  let intialGrouping = 0.0;

  // Create groups from WORDS array
  for (let wordConfig of WORDS) {
    let group = {
      name: wordConfig.text.toLowerCase(),
      members: [],
      count: wordConfig.count
    };

    // Populate this group
    for (let i = 0; i < group.count; i++) {
      group.members.push(new Word(
        random(width * (0 + intialGrouping), width * (1 - intialGrouping)),
        random(height * (0 + intialGrouping), height * (1 - intialGrouping)),
        wordConfig.text  // Pass the text to the Word constructor
      ));
    }

    groups.push(group);
  }
}

function draw() {

  if (!inputStarted) {
    background(220);
    return;
  }

  if (inversion) {
    background(0);
    fill(255);
  } else {
    background(255);
    fill(0);
  }

  // Get current looking state from face detection module
  const isLooking = getIsLooking();
  
  if (isLooking) {
    concentrationTime += 0.1;
    attractionRadius += 0.5; // Slowly increase attraction radius
  } else {
    concentrationTime = 0;
    attractionRadius = 200; // Reset to default
    inversion = true;
  }


  // Calculate clustering for each group and store center of mass
  for (let group of groups) {
    let clusteredCount = 0;
    let totalMembers = group.members.length;
    
    // Calculate center of mass for the group
    let centerX = 0, centerY = 0;
    for (let member of group.members) {
      centerX += member.pos.x;
      centerY += member.pos.y;
    }
    centerX /= totalMembers;
    centerY /= totalMembers;
    
    // Store center of mass on the group
    group.centerOfMass = createVector(centerX, centerY);
    
    // Count how many members are within cluster distance of center
    for (let member of group.members) {
      let d = dist(member.pos.x, member.pos.y, centerX, centerY);
      if (d < clusterDistance) {
        clusteredCount++;
      }
    }
    
    // Calculate clustering percentage
    let clusterPercentage = clusteredCount / totalMembers;
    
    // Determine group state
    if (clusterPercentage >= 0.99) {
      groupStates[group.name] = 'fully_clustered';
    } else if (clusterPercentage >= 0.5) {
      groupStates[group.name] = 'half_clustered';
    } else {
      groupStates[group.name] = 'scattered';
    }
    
    // Store stats on the group object
    group.clusteredCount = clusteredCount;
    group.clusterPercentage = clusterPercentage;
  }
  
  // Check if ALL groups are fully clustered
  let allGroupsClustered = groups.every(g => groupStates[g.name] === 'fully_clustered');
  
  // Only flicker if not fully organized
  if (isLooking && !allGroupsClustered) {
    // Flicker faster as concentration increases
    let flickerSpeed = max(4, 240 - concentrationTime);
    if (frameCount % flickerSpeed < flickerSpeed / 3) {
      inversion = false;
    } else {
      inversion = true;
    }
  } else if (allGroupsClustered) {
    // Stop flickering when everything is organized
    inversion = false; // Keep background white/stable
  }
  
  // Update state message based on clustering
  if (allGroupsClustered) {
    stateMessage.html('Your concentration and organisational skills are 100%,<br>why not have another go and see if you can do it again!');
    stateMessage.show();
    stateMessage.style('color', 'black'); // Always black on white when complete
    restartButton.show();
  } else {
    restartButton.hide();
    // Check each group individually for half-clustered state
    let messageShown = false;
    for (let group of groups) {
      if (groupStates[group.name] === 'half_clustered' && !messageShown) {
        // Capitalize first letter of group name
        let groupName = group.name.charAt(0).toUpperCase() + group.name.slice(1);
        stateMessage.html(`${groupName} is almost organised, keep going!`);
        stateMessage.show();
        stateMessage.style('color', inversion ? 'white' : 'black');
        messageShown = true;
        break; // Show only one message at a time
      }
    }
    if (!messageShown) {
      stateMessage.hide();
    }
  }
  
  // You can now use these states to trigger effects
  // console.log(groupStates); // Debug: see current states
  // console.log('All clustered:', allGroupsClustered);


  // Update each group
  for (let currentGroup of groups) {
    for (let i = 0; i < currentGroup.members.length; i++) {
      let agent = currentGroup.members[i];

      // Apply forces from all groups
      for (let otherGroup of groups) {
        for (let j = 0; j < otherGroup.members.length; j++) {
          let other = otherGroup.members[j];

          // Skip self
          if (agent === other) continue;

          if (currentGroup === otherGroup) {
            // Same group
            if (isLooking) {
              // When looking - attract to own kind using arrive for better clustering
              let attractForce = agent.arrive(other.pos, attractionRadius);
              attractForce.mult(seekForce * 0.3); // Reduced individual attraction
              agent.applyForce(attractForce);
            } else {
              // When not looking - repel own kind
              let repelForce = agent.flee(other.pos);
              let d = p5.Vector.dist(agent.pos, other.pos);
              if (d < 150) {
                repelForce.mult(evadeForceClose);
              } else {
                repelForce.mult(evadeForceFar);
              }
              agent.applyForce(repelForce);
            }
          } else {
            // Different group - always flee
            let evadeForce = agent.flee(other.pos);
            let d = p5.Vector.dist(agent.pos, other.pos);
            if (d < 150) {
              evadeForce.mult(evadeForceClose);
            } else {
              evadeForce.mult(evadeForceFar);
            }
            agent.applyForce(evadeForce);
          }
        }
      }
      
      // Strong attraction to group's center of mass when looking
      // This prevents multiple sub-clusters from forming
      if (isLooking) {
        let centerForce = agent.arrive(currentGroup.centerOfMass, attractionRadius * 2);
        centerForce.mult(seekForce * 2); // Stronger than individual attraction
        agent.applyForce(centerForce);
      }

      agent.edges();
      agent.update();
      agent.show();
    }
  }

}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
	// FULLSCREEN!!!
	if (key === 'f' || key === 'F') {
		let fs = fullscreen();
		fullscreen(!fs);
	}
}
	
function windowResized() {
	if (fullscreen()) {
	resizeCanvas (windowWidth, windowHeight);
	}
}