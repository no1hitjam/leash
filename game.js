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


const HERO_MAX_SPEED = 5;
const HERO_FRICTION = .95;
const GRAVITY = .2;
const JUMP = -1.5;
const JUMP_BOOST = -.8;
const JUMP_TIME = 10;
const HAZARD_FRICTION = .98;

var hero;
var hazards = [];
var blackHoles = [];

PIXI.loader
  .add(["img/hero.png", "img/hazard.png", "img/black-hole.png"])
  .load(setup);

function setup() {
  hero = newHero();
  hero.x = 200;
  hero.y = 100;

  for (var i = 0; i < 5; i++) {
    var hazard = newHazard();
    stage.addChild(hazard.sprite);
    hazards.push(hazard);
  }

  stage.addChild(hero.sprite);

  renderer.render(stage);
  gameLoop();
}

var keyLeft = keyboard(LEFT);
var keyRight = keyboard(RIGHT);
var keyUp = keyboard(UP);

keyUp.press = function() {
  if (hero.velocity.y > -7) {
    hero.velocity.y = JUMP;
    hero.jumpingTime = JUMP_TIME;
  }
}

keyUp.release = function() {
  hero.jumpingTime = 0;
}

function gameLoop() {
  requestAnimationFrame(gameLoop);

  hero.velocity.x *= HERO_FRICTION;
  hero.velocity.y += GRAVITY;

  if (keyRight.isDown) {
    hero.velocity.x += hero.speed;
  }
  
  if (keyLeft.isDown) {
    hero.velocity.x -= hero.speed;
  }

  if (keyUp.isDown) {
    if (hero.jumpingTime > 0) {
      hero.velocity.y += JUMP_BOOST;
      hero.jumpingTime--;
    }
  }
  
  hero.velocity.x = limit(hero.velocity.x, -HERO_MAX_SPEED, HERO_MAX_SPEED);

  hero.x += hero.velocity.x;
  hero.y += hero.velocity.y;

  for (var i = 0; i < hazards.length; i++) {
    if (!hazards[i].enabled) {
      hazards[i].reset();
    }
    hazards[i].velocity.x *= HAZARD_FRICTION;
    hazards[i].velocity.y *= HAZARD_FRICTION;

    const lengthToHero = vectorLength(
      hero.x - hazards[i].x, 
      hero.y - hazards[i].y,
    );
    hazards[i].velocity.x += (hero.x - hazards[i].x) / lengthToHero * hazards[i].speed;
    hazards[i].velocity.y += (hero.y - hazards[i].y) / lengthToHero * hazards[i].speed;

    hazards[i].x += hazards[i].velocity.x;
    hazards[i].y += hazards[i].velocity.y;

    // check hazard collision
    for (var j = 0; j < hazards.length; j++) {
      if (i == j || !hazards[j].enabled) {
        continue;
      }
      if (vectorLength(hazards[j].x - hazards[i].x, hazards[j].y - hazards[i].y) < 10) {
        hazards[j].enabled = false;
        hazards[i].size += hazards[j].size;
        if (hazards[i].size >= 10) {
          hazards[i].enabled = false;
          var blackHole = newBlackHole(hazards[i].x, hazards[i].y);
          stage.addChild(blackHole.sprite);
          blackHoles.push(blackHole);
        }
      }
    }
  }


  // rendering
  hero.render();
  for (var i = 0; i < hazards.length; i++) {
    hazards[i].render();
  }
  for (var i = 0; i < blackHoles.length; i++) {
    blackHoles[i].render();
  }
  renderer.render(stage);
}


// classes
function newHero() {
  var hero = {
    sprite: new PIXI.Sprite(PIXI.loader.resources["img/hero.png"].texture),
    dimension: 0,
    velocity: { x: 0, y: 0 },
    jumpingTime: 0,
    speed: 1,
    size: 1,
    x: 0,
    y: 0,
  }

  hero.render = function() {
    hero.sprite.x = hero.x;
    hero.sprite.y = hero.y;
    hero.sprite.scale.x = hero.size;
    hero.sprite.scale.y = hero.size;
  }

  return hero;
}

function newHazard() {
  var hazard = {
    sprite: new PIXI.Sprite(PIXI.loader.resources["img/hazard.png"].texture),
    enabled: true,
    dimension: 0,
    velocity: { x: 0, y: 0 },
    speed: .1,
    size: 1,
    x: 0,
    y: 0,
  };

  hazard.reset = function() {
    hazard.enabled = true;
    hazard.dimension = 0;
    hazard.size = 1;
    hazard.y = Math.random() * 500;
    if (Math.random() < .5) {
      hazard.x = -50;
    } else {
      hazard.x = 1000;
    }
  }

  hazard.render = function() {
    hazard.sprite.x = hazard.x;
    hazard.sprite.y = hazard.y;
    hazard.sprite.scale.x = hazard.size;
    hazard.sprite.scale.y = hazard.size;
    hazard.sprite.visible = hazard.enabled;
  }

  hazard.reset();

  return hazard;
}

function newBlackHole(x, y) {
  var blackHole = {
    sprite: new PIXI.Sprite(PIXI.loader.resources["img/black-hole.png"].texture),
    dimension: 0,
    x: x,
    y: y
  }

  blackHole.render = function() {
    blackHole.sprite.x = blackHole.x;
    blackHole.sprite.y = blackHole.y;
  }

  return blackHole
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