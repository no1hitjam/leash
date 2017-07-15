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
const BLACK_HOLE_FORCE_HERO = .3;
const BLACK_HOLE_FORCE_HAZARD = .05;

var hero;
var hazards = [];
var blackHoles = [];

PIXI.loader
  .add([
    "img/hero.png", 
    "img/hazard-a.png", 
    "img/hazard-a-empty.png", 
    "img/hazard-b.png", 
    "img/hazard-b-empty.png", 
    "img/black-hole.png"])
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

  // key inputs
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

  // hero black holes
  for (var i = 0; i < blackHoles.length; i++) {
    var blackHole = blackHoles[i];
    const distanceToHero = vectorLength(
      hero.x - blackHole.x, 
      hero.y - blackHole.y,
    );
    let force = 0;
    if (distanceToHero != 0) {
      force = 1 / distanceToHero * BLACK_HOLE_FORCE_HERO;
    }

    var attraction = {
      x: (blackHole.x - hero.x) / distanceToHero,
      y: (blackHole.y - hero.y) / distanceToHero
    }
    if (attraction.x !== 0) {
      hero.velocity.x += (blackHole.x - hero.x) * force;
    }
    if (attraction.y !== 0) {
      hero.velocity.y += (blackHole.y - hero.y) * force;
    }
  }

  // add up hero velocity
  
  hero.velocity.x = limit(hero.velocity.x, -HERO_MAX_SPEED, HERO_MAX_SPEED);

  hero.x += hero.velocity.x;
  hero.y += hero.velocity.y;

  for (var i = 0; i < hazards.length; i++) {
    var hazard = hazards[i];
    if (!hazard.enabled) {
      hazard.reset();
    }
    hazard.velocity.x *= HAZARD_FRICTION;
    hazard.velocity.y *= HAZARD_FRICTION;

    if (hazard.dimension === hero.dimension) {
      const lengthToHero = vectorLength(
        hero.x - hazard.x, 
        hero.y - hazard.y,
      );
      hazard.velocity.x += (hero.x - hazard.x) / lengthToHero * hazard.speed;
      hazard.velocity.y += (hero.y - hazard.y) / lengthToHero * hazard.speed;
    }

    // hazard black holes
    for (var j = 0; j < blackHoles.length; j++) {
      var blackHole = blackHoles[j];
      if (hazard.dimension !== blackHole.dimension) {
        continue;
      }
      const distanceToHazard = vectorLength(
        hazard.x - blackHole.x, 
        hazard.y - blackHole.y,
      );
      let force = 0;
      if (distanceToHazard != 0) {
        force = 1 / distanceToHazard * BLACK_HOLE_FORCE_HAZARD;
      }

      var attraction = {
        x: (blackHole.x - hazard.x) / distanceToHazard,
        y: (blackHole.y - hazard.y) / distanceToHazard
      }
      if (attraction.x !== 0) {
        hazard.velocity.x += (blackHole.x - hazard.x) * force;
      }
      if (attraction.y !== 0) {
        hazard.velocity.y += (blackHole.y - hazard.y) * force;
      }
    }

    hazard.x += hazard.velocity.x;
    hazard.y += hazard.velocity.y;

    // check hazard to black hole collision
    for (var j = 0; j < blackHoles.length; j++) {
      var blackHole = blackHoles[j];
      if (blackHole.dimension !== hazard.dimension) {
        continue;
      }
      if (vectorLength(blackHole.x - hazard.x, blackHole.y - hazard.y) < 10) {
        hazard.flipDimension();
      }
    }

    // check hazard to hazard collision
    for (var j = 0; j < hazards.length; j++) {
      if (i === j || !hazards[j].enabled || hazard.dimension !== hazards[j].dimension) {
        continue;
      }
      if (vectorLength(hazards[j].x - hazard.x, hazards[j].y - hazard.y) < 10) {
        hazards[j].enabled = false;
        hazard.size += hazards[j].size;
        if (hazard.size >= 4) {
          hazard.enabled = false;
          var blackHole = newBlackHole(hazard.x, hazard.y, hazard.dimension);
          stage.addChild(blackHole.sprite);
          blackHoles.push(blackHole);
        }
      }
    }

    // careful here, hazard may be unenabled now
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
    dimension: true,
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
    sprite: new PIXI.Sprite(PIXI.loader.resources["img/hazard-a.png"].texture),
    enabled: true,
    dimension: true,
    velocity: { x: 0, y: 0 },
    speed: .1,
    size: 1,
    x: 0,
    y: 0,
  };

  hazard.reset = function() {
    hazard.enabled = true;
    hazard.dimension = true;
    hazard.size = 1;
    hazard.y = Math.random() * 500;
    if (Math.random() < .5) {
      hazard.x = -50;
    } else {
      hazard.x = 1000;
    }
  }

  hazard.flipDimension = function() {
    hazard.dimension = !hazard.dimension;
    if (hazard.dimension) {
      hazard.sprite.texture = PIXI.loader.resources["img/hazard-a.png"].texture;
    } else {
      hazard.sprite.texture = PIXI.loader.resources["img/hazard-b-empty.png"].texture;
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

function newBlackHole(x, y, dimension) {
  var blackHole = {
    sprite: new PIXI.Sprite(PIXI.loader.resources["img/black-hole.png"].texture),
    dimension: dimension,
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