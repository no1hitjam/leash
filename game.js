var type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
  type = "canvas"
}

//Create the renderer
var renderer = PIXI.autoDetectRenderer(
  256, 256,
  {antialias: false, transparent: false, resolution: 1}
);

renderer.view.style.position = "absolute";
renderer.view.style.display = "block";
renderer.autoResize = true;
renderer.resize(window.innerWidth, window.innerHeight);

//Add the canvas to the HTML document
document.body.appendChild(renderer.view);

//Create a container object called the `stage`
var stage = new PIXI.Container();



const LEFT = 37;
const UP = 38;
const RIGHT = 39;

const HERO_SPEED = 1;
const HERO_MAX_SPEED = 5;
const HERO_FRICTION = .95;
const GRAVITY = .2;
const JUMP = -5;
const HAZARD_FRICTION = .98;


var hero;
var heroVelocityX = 0;
var heroVelocityY = 0;

var hazards = [];
var hazardsVelocityX = [];
var hazardsVelocityY = [];
var hazardsSpeed = [];



PIXI.loader
  .add(["img/hero.png", "img/hazard.png"])
  .load(setup);

function setup() {
  hero = new PIXI.Sprite(
    PIXI.loader.resources["img/hero.png"].texture
  );
  hero.x = 200;

  for (var i = 0; i < 5; i++) {
    var hazard = new PIXI.Sprite(
      PIXI.loader.resources["img/hazard.png"].texture
    )
    stage.addChild(hazard);
    hazards.push(hazard);
    hazardsVelocityX.push(0);
    hazardsVelocityY.push(0);
    hazardsSpeed.push(2);
    hazard.x = Math.random() * 500;
    hazard.y = Math.random() * 500;
  }

  stage.addChild(hero);

  renderer.render(stage);
  gameLoop();
}

const keyLeft = keyboard(LEFT);
const keyRight = keyboard(RIGHT);
const keyUp = keyboard(UP);



function gameLoop() {
  requestAnimationFrame(gameLoop);

  heroVelocityX *= HERO_FRICTION;
  heroVelocityY += GRAVITY;

  if (keyRight.isDown) {
    heroVelocityX += HERO_SPEED;
  }
  if (keyLeft.isDown) {
    heroVelocityX -= HERO_SPEED;
  }
  if (keyUp.isDown) {
    heroVelocityY = JUMP;
  }
  
  heroVelocityX = limit(heroVelocityX, -HERO_MAX_SPEED, HERO_MAX_SPEED);

  hero.x += heroVelocityX;
  hero.y += heroVelocityY;

  for (var i = 0; i < hazards.length; i++) {
    if (!hazards[i].visible) {
      setupNewHazard(hazards[i]);
    }
    hazardsVelocityX[i] *= HAZARD_FRICTION;
    hazardsVelocityY[i] *= HAZARD_FRICTION;

    const lengthToHero = vectorLength(
      hero.x - hazards[i].x, 
      hero.y - hazards[i].y,
    );
    hazardsVelocityX[i] += (hero.x - hazards[i].x) / lengthToHero * .5;
    hazardsVelocityY[i] += (hero.y - hazards[i].y) / lengthToHero * .5;

    hazards[i].x += hazardsVelocityX[i];
    hazards[i].y += hazardsVelocityY[i];

    // check hazard collision
    for (var j = 0; j < hazards.length; j++) {
      if (i == j || !hazards[j].visible) {
        continue;
      }
      if (vectorLength(hazards[j].x - hazards[i].x, hazards[j].y - hazards[i].y) < 10) {
        hazards[j].visible = false;
        hazards[i].scale.x += hazards[j].scale.x;
        hazards[i].scale.y += hazards[j].scale.y;
      }
    }
  }
  renderer.render(stage);
}


function setupNewHazard(hazard) {
  hazard.visible = true;
  hazard.y = Math.random() * 500;
  if (Math.random() < .5) {
    hazard.x = -50;
  } else {
    hazard.x = 1000;
  }
}


// utils
function limit(val, min, max) {
  if (val > max) {
    return max;
  } else if (val < min) {
    return min;
  }
  return val;
}

function vectorLength(x, y) {
  return Math.sqrt(x * x + y * y);
}


// keyboard class
function keyboard(keyCode) {
  var key = {};
  key.code = keyCode;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
  //The `downHandler`
  key.downHandler = function(event) {
    if (event.keyCode === key.code) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
      key.isUp = false;
    }
    event.preventDefault();
  };

  //The `upHandler`
  key.upHandler = function(event) {
    if (event.keyCode === key.code) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
    }
    event.preventDefault();
  };

  //Attach event listeners
  window.addEventListener(
    "keydown", key.downHandler.bind(key), false
  );
  window.addEventListener(
    "keyup", key.upHandler.bind(key), false
  );
  return key;
}