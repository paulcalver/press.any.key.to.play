let video;
let activeTimer = null; // Current active timer
let fadingTimers = []; // Array of timers that are fading away

let groups = [];

let seekForce = 0.05;
let evadeForceClose = 5.0;
let evadeForceFar = 3.0;

// Define your words here - easy to add or remove!
const WORDS = [
  { text: 'Create', count: 20 },
  { text: 'Play', count: 20 },
  { text: 'Rest', count: 20 }
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.hide();
  textFont('Space Mono');

  // Initialize face detection from faceDetection.js
  initFaceDetection(video);

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
  background(0);

  // Get current looking state from face detection module
  const isLooking = getIsLooking();
  // 
  if (isLooking) {

    seekForce += 0.001;
    evadeForceClose = 5.0;
    evadeForceFar = 3.0;

  } else {

    seekForce = 0.05;
    evadeForceClose += 1.0;
    evadeForceFar += 1.0;

  }


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
              // When looking - attract to own kind
              let attractForce = agent.seek(other.pos);
              attractForce.mult(seekForce);
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

      agent.edges();
      agent.update();
      agent.show();
    }
  }

}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}