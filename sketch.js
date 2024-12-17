//\////////\\\\\\\/\\\\\//\\\\\\\\\\\/////\//////\\\\\\\//\\\\\//\\\\\////\
//\////////\\\\\\\/\\\\\\ Into the Particleverse: //\\\\\\\\\\\\\\\\\//////
// A 3D Interactive Art Experience with Sound, AI, and Flocking Dynamics \\
//\////////\\\\\\\/\\\\\//\\\\\\\\\\\/////\//////\\\\\\\//\\\\\//\\\\\////\



// FA/DATT 2040 Final Project
// Leroy Musa (leroy7@my.yorku.ca) (219198761)
// Started 11/08/2024
// Concluded 11/29/2024



//\////////\\\\\\\/\\\\\//\\\\\\\\\\\/////\//////\\\\\\\//\\\\\//\\\\\
//\////////\\\\\\\/\\\\\//\\\\\ GLOBALS //\//////\\\\\\\//\\\\\//\\\\\
//\////////\\\\\\\/\\\\\//\\\\\\\\\\\/////\//////\\\\\\\//\\\\\//\\\\\
let particles=[];
let swirls=[];
let soundAmplitude, smoothedSoundLevel = 0;
let poseNet,poses=[]
let fft,mic;
let boundingSphere;
let orbitX=0;
let orbitY=0;
let panSpeed=0.005;
let handClosed=false;
let handOpen=false; 
let handDetected=false;
let predictions=[]; 

//UI Controls
let soundToggle,aiToggle,flockingSlider,speedSlider,colorSlider,particleCountSlider;

//booleans
let soundResponsive=false;
let aiResponsive=false;

//Colors and visuals
let colors=[];
let colorIndex=0;
let backgroundColor;

//Dynamic zoom and camera rotation
let zoomLevel;
let zoomSpeed=0.02;
let camAngle=0;
let handpose;
let lastToggleTime = 0;
const debounceTime = 300; //300ms debounce for toggling AI
let handposeActive = false; //Track if handpose is active or not
let aiProcessing = false; //Track if AI is actively processing
let defaultRotationSpeedX=0.05;
let defaultRotationSpeedY=0.03;
let rotationSpeedX=defaultRotationSpeedX;
let rotationSpeedY=defaultRotationSpeedY;
let squeezeDetected=false;
let aiFrameSkip=5; // Process AI every 5 frames
let aiFrameCounter=0; // Frame counter for AI processing
let video=null;
let isModelLoaded=false;
//\////////\\\\\\\/\\\\\//\\\\\\\\\\\/////\//////\\\\\\\//\\\\\//\\\\\
//\////////\\\\\\\/\\\\\//\\\\\ GLOBALS //\//////\\\\\\\//\\\\\//\\\\\
//\////////\\\\\\\/\\\\\//\\\\\\\\\\\/////\//////\\\\\\\//\\\\\//\\\\\


//------------------------------------------------------------------//


//\////////\\\\\\\/\\\\\//\\\\\\\\\\\/////\//////\\\\\\\//\\\\\//\\\\\
//\////////\\\\\\\/\\\\\//\\\\\ SETUP //\//////\\\\\\\//\\\\\//\\\\\\\
//\////////\\\\\\\/\\\\\//\\\\\\\\\\\/////\//////\\\\\\\//\\\\\//\\\\\
function setup() {
  
  createCanvas(windowWidth,windowHeight,WEBGL);
  noStroke();
 // frameRate(30);
  
  //for video presentation
  fullscreenButton=createButton('Go Fullscreen');
  fullscreenButton.position(width/2-75,height-50);
  fullscreenButton.mousePressed(toggleFullscreen);

  colors = [
    color(255, 50, 100),
    color(50, 150, 255),
    color(150, 255, 100),
    color(255, 200, 0),
    color(255, 100, 255)
  ];

  
  backgroundColor = color(10, 15, 35);

  //Initialize bounding sphere
  boundingSphere = calculateBoundingSphere(particles);

  //Initialize swirls
  for (let i=0;i<250;i++) {
    swirls.push(new Swirl());
  }

  //Start zoomed out
  zoomLevel = 1800;

  //////SOUND///////
  mic = new p5.AudioIn();
  mic.start();
  soundAmplitude = new p5.Amplitude();
  soundAmplitude.setInput(mic);
  fft = new p5.FFT();
  fft.setInput(mic);
  //////SOUND///////
  
  ///////AI/////////
  let video=createCapture(VIDEO);
  video.size(160,120);//i did this for optimisation
  video.hide();
  ///////AI/////////
  
  //UI Controls
  soundToggle=createButton("Enable Sound Responsiveness")
    .mousePressed(()=>{
      soundResponsive=!soundResponsive;
      soundToggle.html(soundResponsive?"Disable Sound Responsiveness":"Enable Sound Responsiveness");
    })
    .position(20,20);
  soundToggle.elt.id="soundToggle";
    
  aiToggle=createButton("Enable AI Interaction")
    .mousePressed(()=>{
      let now=millis();
      if (now-lastToggleTime>debounceTime) {
        aiResponsive=!aiResponsive;
        aiToggle.html(aiResponsive?"Disable AI Interaction":"Enable AI Interaction");
        lastToggleTime=now;
        if (aiResponsive) {
          startAI();
        } else {
          stopAI();
        }
      }
    })
    .position(20,60);
  aiToggle.elt.id="aiToggle";


function toggleFullscreen() {
  let fs = fullscreen();//check if fullscreen is already on
  fullscreen(!fs);//toggle fullscreen mode
  fullscreenButton.html(fs ?'Exit Fullscreen':'Go Fullscreen');
}
  
  
  //Sliders
  createP("Flocking Strength").position(20,100).id("flockingLabel");
  flockingSlider=createSlider(0,1,0.5,0.01).position(20,130);
  flockingSlider.elt.id="flockingSlider";

  createP("Particle Speed").position(20,160).id("speedLabel");
  speedSlider = createSlider(0.5,3,1,0.1).position(20,190);
  speedSlider.elt.id="speedSlider";

  createP("Color Intensity").position(20,220).id("colorLabel");
  colorSlider=createSlider(50,255,150,1).position(20,250);
  colorSlider.elt.id="colorSlider";

  
  //I decided to disable this feauture as it slows down the project, and fps
  //createP("Particle Count").position(20, 280);
  //particleCountSlider = createSlider(50, 300, 150, 1).position(20, 310);
  
}



//\////////\\\\\\\/\\\\\//\\\\\\\\\\\/////\//////\\\\\\\//\\\\\//\\\\\
//\////////\\\\\\\/\\\\\//\\\\\ SETUP //\//////\\\\\\\//\\\\\//\\\\\\\
//\////////\\\\\\\/\\\\\//\\\\\\\\\\\/////\//////\\\\\\\//\\\\\//\\\\\


//------------------------------------------------------------------//



//\////////\\\\\\\/\\\\\//\\\\\\\\\\\/////\//////\\\\\\\//\\\\\//\\\\\
//\////////\\\\\\\/\\\\\//\\\\\ DRAW //\//////\\\\\\\//\\\\\//\\\\\\\\
//\////////\\\\\\\/\\\\\//\\\\\\\\\\\/////\//////\\\\\\\//\\\\\//\\\\\
function draw() {
  zoomLevel=1500+500*sin(frameCount*zoomSpeed);
  //smooth intensity
  //smoothedSoundLevel+=(soundAmplitude.getLevel()-smoothedSoundLevel)*0.1;
  detectHandState();
  
    fullscreenButton.position(width/2-75,height-50);
  
  // Set the background to the calculated color
  background(backgroundColor);
  if (aiResponsive) {
    if (aiFrameCounter%aiFrameSkip===0) {
      detectHandState();
    }
    aiFrameCounter++;
  }

  boundingSphere.update();
  boundingSphere.render();

  //rotate the camera around the scene
  camAngle+=0.001;
  camera(zoomLevel*sin(camAngle),300,zoomLevel*cos(camAngle),0,0,0,0,1,0);
  rotateX(orbitX);
  rotateY(orbitY);
  

  

  
  

  //update particle count dynamically
  let targetParticleCount=aiResponsive?100:150; //adjust particle count dynamically based on AI interaction
  if (particles.length<targetParticleCount) {
    for (let i =particles.length; i< targetParticleCount; i++) {
      particles.push(new Particle());
  }
  } else if (particles.length>targetParticleCount) {
  particles.splice(targetParticleCount);
}


  //rotate the entire particleverse
  rotateY(frameCount*0.005);

  // Update and display particles
  for (let p of particles) {
  if (soundResponsive&&handClosed<=0.5) {
    // Apply sound force only if hand is not closed
    p.applySoundForce(smoothedSoundLevel);
  }


  let flockingInterval=5;
  if (frameCount%flockingInterval===0) {
    p.flock(particles,flockingSlider.value());
  }

  p.update(speedSlider.value());
  p.checkBounds();
  p.show(smoothedSoundLevel, colorSlider.value());
  p.showConnections(particles);
}


  // Render the bounding sphere
  boundingSphere.render();

  // Update and render swirls
 for (let s of swirls) {
  s.update();
  s.render();
}
  
    if (!aiResponsive) {
    poses=[];
  }

}
//\////////\\\\\\\/\\\\\//\\\\\\\\\\\/////\//////\\\\\\\//\\\\\//\\\\\
//\////////\\\\\\\/\\\\\//\\\\\ DRAW //\//////\\\\\\\//\\\\\//\\\\\\\\
//\////////\\\\\\\/\\\\\//\\\\\\\\\\\/////\//////\\\\\\\//\\\\\//\\\\\


//------------------------------------------------------------------//


//\////////\\\\\\\/\\\\\//\\\\\\\\\\\/////\//////\\\\\\\//\\\\\//\\\\\
//\////////\\\\\\\/\\\\ FUNCTIONS & CLASSES /////\\\\\\\\\\\//\\\\\\\\
//\////////\\\\\\\/\\\\\//\\\\\\\\\\\/////\//////\\\\\\\//\\\\\//\\\\\

// Particle class
class Particle {
 constructor() {
  this.position = createVector(
    random(-200,200), // Constrained to core region
    random(-200,200),
    random(-200,200)
  );
  this.velocity = p5.Vector.random3D().mult(0.5);
  this.acceleration = createVector(0, 0, 0);
  this.maxSpeed = 1.5;
  this.maxForce = 0.05;
  this.target = createVector(
    random(-200,200), //constrained target
    random(-200,200),
    random(-200,200)
  );
  this.oscillation=random(PI); // Phase offset for oscillation
  this.color=colors[colorIndex % colors.length];
  colorIndex++;
}


  applySoundForce(soundLevel) {
    let scatterForce=p5.Vector.random3D().mult(soundLevel*5);
    if (soundLevel>0.2) {
      this.applyForce(scatterForce);
    } else {
      let targetForce = p5.Vector.sub(this.target,this.position).mult(0.005);
      this.applyForce(targetForce);
    }
  }
  

 applyPoseForce(poses) {
  if (!aiResponsive||poses.length === 0) return;

  //Check if PoseNet predictions and the expected pose structure exist
  if (poses[0] && poses[0].pose && poses[0].pose.nose) {
    let nose = poses[0].pose.nose;
    if (nose.confidence>0.5) { //only proceed if confidence is above 50%
      let noseVector=createVector(nose.x-width/2,nose.y-height/2,0);
      let poseForce=p5.Vector.sub(noseVector,this.position).mult(0.0005);
      this.applyForce(poseForce);
    }
  }
}

  /////// FLOCKING /////////
  flock(particles,strength) {
    let alignment=createVector(0,0,0);
    let cohesion=createVector(0,0,0);
    let separation=createVector(0,0,0);
    let total=0;

    for (let other of particles) {
      let d=this.position.dist(other.position);
      if (other!==this&&d<150) {
        alignment.add(other.velocity);
        cohesion.add(other.position);
        let diff=p5.Vector.sub(this.position,other.position);
        diff.div(d);
        separation.add(diff);
        total++;
      }
    }
    
    if(total>0) {  alignment.div(total).setMag(this.maxSpeed).sub(this.velocity).limit(this.maxForce).mult(strength);  cohesion.div(total).sub(this.position).setMag(this.maxSpeed).sub(this.velocity).limit(this.maxForce).mult(strength);  separation.div(total).setMag(this.maxSpeed).sub(this.velocity).limit(this.maxForce).mult(strength);

      this.applyForce(alignment);
      this.applyForce(cohesion);
      this.applyForce(separation);
    }
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

update(speed) {
  // Adjust speed based on hand state (compact particles when hand is closed)
  if (handClosed) {
    this.maxSpeed = constrain(speed*0.5,0.1,1.0); // Slow down particles when compacting
    let centerForce = createVector(0,0,0).sub(this.position).mult(0.05); // Pull toward center
    this.applyForce(centerForce);
  } else {
    this.maxSpeed = constrain(speed, 0.5, 2.5); // Normal speed when hand is not closed
  }

  // Add an oscillation effect to the motion
  let oscillationForce = createVector(
    sin(this.oscillation+frameCount*0.02)*0.1,
    cos(this.oscillation+frameCount*0.02)*0.1,
    sin(this.oscillation+frameCount*0.02)*0.1
  );
  this.applyForce(oscillationForce);

  // Add a random "wandering" force to simulate natural motion
  let wander=p5.Vector.random3D().mult(0.05);
  this.applyForce(wander);

  // Add Perlin noise-based motion for organic feel
  let noiseForce=createVector(
    map(noise(this.position.x*0.01,frameCount*0.01),0,1,-0.1,0.1),
    map(noise(this.position.y*0.01,frameCount*0.01),0,1,-0.1,0.1),
    map(noise(this.position.z * 0.01,frameCount*0.01),0,1,-0.1,0.1)
  );
  this.applyForce(noiseForce);

  // Update velocity and position
  this.velocity.add(this.acceleration);
  this.velocity.limit(this.maxSpeed); // Apply the speed limit
  this.position.add(this.velocity);

  // Reset acceleration for the next frame
  this.acceleration.mult(0);
}




checkBounds() {
  let distance=this.position.mag(); // Distance from the center
  let boundary=350; // Define the boundary radius

  if (distance>boundary) {
    
    //Apply a restoring force proportional to the distance outside the boundary
    let direction = this.position.copy().normalize();
    let restoringForce = direction.mult(-0.5 * (distance - boundary));
    this.applyForce(restoringForce);

    // Add randomness to prevent sticking to the boundary
    let randomJitter = p5.Vector.random3D().mult(0.2);
    this.applyForce(randomJitter);
  }

  if (distance < boundary - 50) {
    // Gently push particles outward if they cluster too close to the center
    let outwardForce = this.position.copy().normalize().mult(0.05);
    this.applyForce(outwardForce);
  }
}





  show(soundLevel,colorIntensity) {
    let size = map(soundLevel,0,1,5,15);
    fill(this.color.levels[0],this.color.levels[1],this.color.levels[2], colorIntensity);
    push();
    translate(this.position.x, this.position.y, this.position.z);
    sphere(size);
    pop();
  }

showConnections(particles) {
  let maxConnections = 50; // Limit to 50 connections
  let count = 0;
  if (this.position.mag() < 350) return; // Skip connections for particles inside the sphere

  stroke(255,50); // White, semi-transparent lines
  for (let other of particles) {
    let d = this.position.dist(other.position);
    if (d < 150 && other.position.mag() > 350 && count < maxConnections) { // Draw connections only if both particles are outside
      line(
        this.position.x, this.position.y, this.position.z,
        other.position.x, other.position.y, other.position.z
      );
      count++;
    }
  }
}


}

// Sphere ring (i call them swirls) class

class Swirl {
  
  constructor() {
    this.angle=random(TWO_PI);
    this.radius=random(300,500);
    this.height=random(-20,20);
    this.size=random(2,6);
    this.speed=random(0.01,0.03);
    this.color=color(random(100,255),random(100,255),random(100,255),150);
  }

 update()  {
  this.angle+=this.speed; //update rotation angle
  this.tilt=smoothedSoundLevel*50; // Adjust tilt based on sound level
}

render() {
  
  let x=this.radius*cos(this.angle);
  let y=this.radius*sin(this.angle);
  fill(this.color);
  noStroke();
  push();
  translate(x,y,this.height);
  rotateX(this.tilt); // Apply tilt
  sphere(this.size);
  pop();
  
}

}

// Adjust orbit angles based on mouse drag
function mouseDragged() {
  orbitX+=(pmouseY-mouseY)*panSpeed; // Adjust orbitX
  orbitY+=(pmouseX-mouseX)*panSpeed; // Adjust orbitY
}

//adjust zoom level with scroll wheel
function mouseWheel(event) {
  zoomLevel+=event.delta*0.5; //adjust zoom level
}

function BoundingSphere() {
  this.rotationX=0; //rot angle around the X-axis
  this.rotationY=0; //rot angle around the Y-axis
  this.rotationSpeedX=0.05; //increased speed for x--axis rotation
  this.rotationSpeedY=0.03; //increased speed for y--axis rotation

  this.update = function () {
    let soundFactor = map(smoothedSoundLevel, 0, 1, 0.2, 0.05);
    
    if (handClosed) {
      //when the hand is closed (squeezed), slow down the sphere's rotation
      this.rotationSpeedX=max(this.rotationSpeedX-0.005,0.01); // Slow down
      this.rotationSpeedY=max(this.rotationSpeedY-0.003,0.01);
      squeezeDetected=true;
      
    } else if (squeezeDetected&&!handDetected) {
    
      //If no hand is detected AND squeeze was detected previously, speed up gradually
    
     this.rotationSpeedX=smoothedSoundLevel * 0.05 + 0.045;
     this.rotationSpeedY=smoothedSoundLevel * 0.02 + 0.003;
    
    } else if (handOpen&&!handDetected) {
    // When no hand is detected and no squeeze was detected
      this.rotationSpeedX=smoothedSoundLevel*0.05+0.045;
      this.rotationSpeedY=smoothedSoundLevel*0.02+0.003;
    }

    this.rotationX+=this.rotationSpeedX;
    this.rotationY+=this.rotationSpeedY;
    
};






  this.render = function () {
    push();
    noFill();
    stroke(255, 50);
    strokeWeight(1);
    rotateX(this.rotationX); // Apply rotation around X-axis
    rotateY(this.rotationY); // Apply rotation around Y-axis
    sphere(350); // Render sphere
    pop();
  };
}



// Calculate bounding sphere
function calculateBoundingSphere(particles) {
  return new BoundingSphere();
}

//Start AI
function startAI() {
  if (!handposeActive) {
    let video=createCapture(VIDEO);
    video.size(160,120);
    video.hide();

    handpose=ml5.handpose(video,modelReady);
    handpose.on("predict",(results)=>{
      if (aiFrameCounter%aiFrameSkip===0) {
        predictions=results;
      }
    });

    handposeActive=true;
  }
}

//stop AI handpose detection
function stopAI() {
  predictions = [];
  isModelLoaded=false;
  aiProcessing=false;
  handposeActive=false;
 if (typeof video!=='undefined'&&video!==null) {
    video.remove();
  }

  rotationSpeedX=defaultRotationSpeedX;
  rotationSpeedY=defaultRotationSpeedY;
  smoothedSoundLevel=0;
  
}

function modelReady() {
  console.log("PoseNet Model Loaded");
}

//function to detect hand state and adjust behavior accordingly
function detectHandState() {
  if (predictions.length>0) {
    handDetected = true;
    let landmarks = predictions[0].landmarks;

    let thumbTip=landmarks[4];
    let indexTip=landmarks[8];
    let distance=dist(thumbTip[0],thumbTip[1],indexTip[0],indexTip[1]);

    //when the hand is squeezed
    if (distance<50) {
      handClosed=true;
      console.log("State: Hand Detected - CLOSED (Slowing Sphere)");
    }
    
    //when the hand is open
    else if (distance>150) {
      handOpen=true;
      handClosed=false;
      console.log("State: Hand Detected - OPEN (Normal Sphere Speed)");
    } else {
      handClosed=false;
      handOpen=false;
      console.log("State: Hand Detected - NEUTRAL");
    }
  } else {
    handClosed=false;
    handOpen=false;
    handDetected=false;
    console.log("State: No Hand Detected.");
  }
}


function updateBoundingSphere() {
  //update the bounding sphere's rotation speed based on the hand state
  rotationSpeedX=lerp(rotationSpeedX,defaultRotationSpeedX,0.1);
  rotationSpeedY=lerp(rotationSpeedY,defaultRotationSpeedY,0.1);

  this.rotationX+=rotationSpeedX;
  this.rotationY+=rotationSpeedY;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}


//\////////\\\\\\\/\\\\\//\\\\\\\\\\\/////\//////\\\\\\\//\\\\\//\\\\\
//\////////\\\\\\\/\\\\ FUNCTIONS & CLASSES /////\\\\\\\\\\\//\\\\\\\\
//\////////\\\\\\\/\\\\\//\\\\\\\\\\\/////\//////\\\\\\\//\\\\\//\\\\\
