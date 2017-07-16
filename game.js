var type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
  type = "canvas"
}

const WIDTH = 512;
const HEIGHT = 512;

const GAME_MENU = 0;
const GAME_PLAY = 1;

const LEFT = 37;
const UP = 38;
const RIGHT = 39;
const DOWN = 40;

const HERO_MAX_SPEED = 3.5;
const HERO_FRICTION = .95;
const GRAVITY = .2;
const JUMP = -1.5;
const JUMP_BOOST = -.8;
const JUMP_TIME = 10;
const HAZARD_FRICTION = .98;
const BLACK_HOLE_FORCE_HERO = .3;
const BLACK_HOLE_FORCE_HAZARD = .05;
const DIMENSION_A_BG = 0x0d0027;
const DIMENSION_B_BG = 0x001827;
const BG_SCROLL = 5;
const COLLAPSE_TIME = 30;
const COLLAPSE_SIZE = 4.7;


var gameState = GAME_MENU;

// menu 
var bestScore = 0;
var lastScore = 0;
var menuContainer;
var gameTitle;
var gameInstructions;
var gamePlayButtonContainer;
var gamePlayButton;
var menuScores;

// game
var playFrame = 0;
var gameContainer;
var camera;
var hero;
var hazards = [];
var blackHoles = [];
var blackHolesContainer;
var stars = [];
var healthContainer;
var healthBar;
var score = 0;
var scoreUI;
var scorePop;
var taskUI;
var tasks = [
  "Create a black hole",
  "Enter the black hole",
  "Eat a star gem",
  "Keep eating star gems!"
];
var taskIdx = 0;

var keyLeft = keyboard(LEFT);
var keyRight = keyboard(RIGHT);
var keyUp = keyboard(UP);
var _keyDown = keyboard(DOWN);


//Create the renderer
var renderer = PIXI.autoDetectRenderer(
  WIDTH, HEIGHT,
  {antialias: false, transparent: false, resolution: 1}
);

renderer.view.style.position = "absolute";

//Add the canvas to the HTML document
document.getElementById("game").appendChild(renderer.view);

//Create a container object called the `stage`
var stage = new PIXI.Container();
stage.interactive = true;

sounds.load([
  "sound/star-collide.wav",
  "sound/create-black-hole.wav",
  "sound/enter-black-hole.wav",
  "sound/hero-enter-black-hole.wav",
  "sound/eat.wav",
  "sound/hurt.wav",
  "sound/jump.wav",
  "sound/death.wav",
]);

sounds.whenLoaded = setupSounds;

function setupSounds() {
  sounds["sound/hurt.wav"].loop = true;
  sounds["sound/hurt.wav"].play();
  sounds["sound/hurt.wav"].volume = 0;
}

PIXI.loader
  .add([
    "img/hero.png", 
    "img/hero-face.png", 
    "img/hero-face-hurt.png", 
    "img/hazard-a.png", 
    "img/hazard-a-empty.png", 
    "img/hazard-b.png", 
    "img/hazard-b-empty.png", 
    "img/black-hole-a.png",
    "img/black-hole-b.png",
    "img/black-hole-a-empty.png",
    "img/black-hole-b-empty.png",
    "img/star-a.png",
    "img/star-b.png",
    "img/health-container.png",
    "img/health-bar.png",
    "img/death-star.png"])
  .load(setup);

function setup() {
  // menu assets
  menuContainer = new PIXI.Container();
  stage.addChild(menuContainer);

  var menuBG = new PIXI.Graphics();
  menuBG.beginFill(0x0d0027);
  menuBG.drawRect(0, 0, WIDTH, HEIGHT);
  menuContainer.addChild(menuBG);

  gameTitle = new PIXI.Text(
    "STAR GEMS",
    {fontFamily: "Arial", fontSize:44, fill: 0x3795ff}
  );
  gameTitle.position.set(30, 30);
  menuContainer.addChild(gameTitle);

  gameInstructions = new PIXI.Text(
    "Made by Jackson Lango\n\nInstructions:\n * Use the Arrow Keys to move\n * Further instructions provided in game",
    {fontFamily: "Arial", fontSize: 14, fill: 0x3795ff}
  );
  gameInstructions.position.set(30, 100);
  menuContainer.addChild(gameInstructions);

  menuScores = new PIXI.Text(
    "Best Score: " + bestScore + "\nLast Score: " + lastScore,
    {fontFamily: "Arial", fontSize: 14, fill: 0x3795ff}
  );
  menuScores.position.set(30, 400);
  if (localStorage.getItem('star-gems-best-score')) {
    bestScore = Number(localStorage.getItem('star-gems-best-score'));
    menuContainer.addChild(menuScores);
    menuScores.text = "Best Score: " + bestScore + "\nLast Score: " + lastScore;
  }

  gamePlayButtonContainer = new PIXI.Container();
  menuContainer.addChild(gamePlayButtonContainer);
  gamePlayButton = new PIXI.Text(
    "Click to start!",
    {fontFamily: "Arial", fontSize: 14, fill: 0x97f6ff}
  );
  gamePlayButton.position.set(30, 450);
  gamePlayButtonContainer.addChild(gamePlayButton);

  // game assets
  gameContainer = new PIXI.Container();
  camera = new PIXI.Container();
  bgCamera = new PIXI.Container();
  gameContainer.addChild(bgCamera);
  gameContainer.addChild(camera);

  blackHolesContainer = new PIXI.Container();
  camera.addChild(blackHolesContainer);

  hero = newHero();
  hero.x = 200;
  hero.y = 100;

  for (var i = 0; i < 10; i++) {
    var hazard = newHazard();
    camera.addChild(hazard.sprite);
    hazards.push(hazard);
  }

  for (var i = 0; i < 21; i++) {
    var star = new PIXI.Sprite(PIXI.loader.resources["img/star-a.png"].texture);
    star.x = Math.random() * WIDTH;
    star.y = Math.random() * HEIGHT;
    star.alpha = Math.random();
    star.width = 10;
    star.height = 10;
    bgCamera.addChild(star);
    stars.push(star);
  }

  camera.addChild(hero.container);

  healthContainer = new PIXI.Sprite(PIXI.loader.resources["img/health-container.png"].texture);
  healthContainer.x = 6;
  healthContainer.y = 490;
  healthBar = new PIXI.Sprite(PIXI.loader.resources["img/health-bar.png"].texture);
  healthBar.scale.x = 1;
  gameContainer.addChild(healthContainer);
  healthContainer.addChild(healthBar);

  scorePop = newScorePop();
  camera.addChild(scorePop.text);

  scoreUI = new PIXI.Text(
    "Score: 0",
    {fontFamily: "Arial", fontSize: 14, fill: 0x3795ff}
  );
  scoreUI.position.set(10, 30);
  gameContainer.addChild(scoreUI);

  taskUI = new PIXI.Text(
    "Score: 0",
    {fontFamily: "Arial", fontSize: 14, fill: 0x3795ff}
  );
  taskUI.position.set(10, 10);
  gameContainer.addChild(taskUI);

  renderer.backgroundColor = DIMENSION_A_BG;

  renderer.render(stage);
  gameLoop();
}

keyUp.press = function() {
  if (hero.velocity.y > -7) {
    hero.velocity.y = JUMP;
    hero.jumpingTime = JUMP_TIME;
    hero.size = 1.2;
    sounds["sound/jump.wav"].play();
  }
}

keyUp.release = function() {
  hero.jumpingTime = 0;
}

stage.click = function() {
  if (gameState === GAME_MENU) {
    gameState = GAME_PLAY;
    stage.removeChild(menuContainer);
    stage.addChild(gameContainer);
  }
}


function gameOver() {
  gameState = GAME_MENU;
  stage.removeChild(gameContainer);
  stage.addChild(menuContainer);

  // scores
  lastScore = score;
  if (lastScore > bestScore) {
    bestScore = lastScore;
  }
  localStorage.setItem('star-gems-best-score', bestScore);
  score = 0;
  menuScores.text = "Best Score: " + bestScore + "\nLast Score: " + lastScore;
  menuContainer.addChild(menuScores);

  // reset game stuff
  hero.health = 1;
  hero.deadTime = 0;
  if (!hero.dimension) {
    hero.flipDimension();
  }
  for (var i = 0; i < hero.deathStars.length; i++) {
    hero.deathStars[i].sprite.visible = false;
  }
  for (var i = 0; i < hazards.length; i++) {
    hazards[i].reset();
    hazards[i].enabled = false;
  }
  for (var i = 0; i < blackHoles.length; i++) {
    blackHolesContainer.removeChild(blackHoles[i].sprite);
  }
  blackHoles.splice(0, blackHoles.length);
  playFrame = 0;

  sounds["sound/hurt.wav"].volume = 0;
}

function gameLoop() {
  requestAnimationFrame(gameLoop);
  if (gameState === GAME_MENU) {
    gameMenuLoop();
  } else if (gameState === GAME_PLAY) {
    gamePlayLoop();
  }
  renderer.render(stage);
}

function gameMenuLoop() {
  
}

function gamePlayLoop() {
  playFrame++;

  hero.velocity.x *= HERO_FRICTION;
  hero.velocity.y += GRAVITY;

  // key inputs
  if (keyRight.isDown) {
    hero.velocity.x += hero.speed;
  }
  
  if (keyLeft.isDown) {
    hero.velocity.x -= hero.speed;
  }

  if (_keyDown.isDown) {
    hero.velocity.y += hero.speed;
  }

  if (keyUp.isDown) {
    if (hero.jumpingTime > 0) {
      hero.velocity.y += JUMP_BOOST;
      hero.jumpingTime--;
    }
  }

  // hero
  if (hero.health > 0) {
    // hero black holes
    for (var i = 0; i < blackHoles.length; i++) {
      var blackHole = blackHoles[i];
      if (blackHole.dimension !== hero.dimension) {
        continue;
      }
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
    hero.velocity.y = limit(hero.velocity.y, -HERO_MAX_SPEED, HERO_MAX_SPEED);

    hero.x += hero.velocity.x;
    hero.y += hero.velocity.y;

    // check hero to black hole collision
    for (var j = 0; j < blackHoles.length; j++) {
      var blackHole = blackHoles[j];
      if (blackHole.dimension !== hero.dimension) {
        continue;
      }
      if (vectorLength(blackHole.x - hero.x, blackHole.y - hero.y) < 20) {
        hero.flipDimension();
        sounds["sound/hero-enter-black-hole.wav"].play();
        if (taskIdx < 2) {
          taskIdx = 2;
        }
      }
    }

    // hero to hazard collision
    for (var j = 0; j < hazards.length; j++) {
      var hazard = hazards[j];
      if (!hazard.enabled) {
        continue;
      }
      var distance = vectorLength(hazard.x - hero.x, hazard.y - hero.y);
      if (hero.dimension === hazard.dimension) {
        // get hurt
        if (distance < hazard.size * 20) {
          hero.health -= .01;
          hero.size = .7;
          if (sounds["sound/hurt.wav"].volume < 1) {
            sounds["sound/hurt.wav"].volume += .2;
          }
        }
      } else {
        if (distance < 15) {
          // eat
          hero.size = 1.5;
          var newScore = Math.max(Math.round(hazard.size * hazard.size * 1.3), 1);
          hero.health += hazard.size / 100;
          scorePop.set(newScore, hero.x, hero.y);
          score += newScore;
          hazard.enabled = false;
          if (taskIdx == 2) {
            taskIdx = 3;
          }
          sounds["sound/eat.wav"].play();
        }
      }
    }
  }

  if (sounds["sound/hurt.wav"].volume >= 0) {
    sounds["sound/hurt.wav"].volume -= .1;
  }

  if (hero.health <= 0) {
    hero.health = 0;
    if (hero.deadTime === 0) {
      hero.explode();
      sounds["sound/death.wav"].play();
    }
    for (var i = 0; i < hero.deathStars.length; i++) {
      hero.deathStars[i].sprite.x += hero.deathStars[i].velocity.x;
      hero.deathStars[i].sprite.y += hero.deathStars[i].velocity.y;
    }
    hero.deadTime++;
  }
  if (hero.deadTime > 150) {
    gameOver();
  }
  if (hero.health > 1) {
    hero.health = 1;
  }
  

  // hero size
  if (Math.abs(hero.size - 1) < .06) {
    hero.size = 1;
  } else {
    if (hero.size > 1) {
      hero.size -= .01;
    }
    if (hero.size < 1) {
      hero.size += .05;
    }
  }


  // hazards
  for (var i = 0; i < hazards.length; i++) {
    var hazard = hazards[i];
    if (!hazard.enabled && i < 5 + playFrame / 400) {
      hazard.reset();
    }
    if (!hazard.enabled) {
      continue;
    }
    if (hero.health > 0) {
      hazard.velocity.x *= HAZARD_FRICTION;
      hazard.velocity.y *= HAZARD_FRICTION;
    }

    if (hazard.dimension === hero.dimension && hero.health > 0) {
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
      if (vectorLength(blackHole.x - hazard.x, blackHole.y - hazard.y) < 20) {
        hazard.flipDimension();
        sounds["sound/enter-black-hole.wav"].volume = Math.random() * .4 + .5;
        sounds["sound/enter-black-hole.wav"].play();
      }
    }

    // collapse hazard if too big
    var closeToExistingHole = false;
    for (var k = 0; k < blackHoles.length; k++) {
      if (Math.abs(blackHoles[k].x - hazard.x) < WIDTH && Math.abs(blackHoles[k].y - hazard.y) < HEIGHT) {
        closeToExistingHole = true;
      }
    }
    if (hazard.size >= COLLAPSE_SIZE && hazard.collapseTime < COLLAPSE_TIME && !closeToExistingHole) {
      if (hazard.collapseTime == 0) {
        sounds["sound/create-black-hole.wav"].play();
      }
      hazard.collapseTime++;
    }
    if (hazard.collapseTime >= COLLAPSE_TIME && !closeToExistingHole) {
      // create black hole
      hazard.enabled = false;
      var blackHole = newBlackHole(hazard.x, hazard.y, hazard.dimension);
      blackHolesContainer.addChild(blackHole.sprite);
      blackHoles.push(blackHole);
      if (taskIdx < 1) {
        taskIdx = 1;
      }
      
    }

    // check hazard to hazard collision
    if (hazard.size < COLLAPSE_SIZE) {
      for (var j = 0; j < hazards.length; j++) {
        if (i === j || !hazards[j].enabled || hazard.dimension !== hazards[j].dimension || hazards[j].size >= COLLAPSE_SIZE) {
          continue;
        }
        var combinedSize = Math.sqrt(hazard.size * hazard.size + hazards[j].size * hazards[j].size);
        if (vectorLength(hazards[j].x - hazard.x, hazards[j].y - hazard.y) < combinedSize * 10) {
          hazards[j].enabled = false;
          hazard.size = combinedSize;
          sounds["sound/star-collide.wav"].volume = Math.random() * .4 + .3;
          sounds["sound/star-collide.wav"].play();
        }
      }
    }

    // careful here, hazard may be unenabled now
  }

  //stars
  for (var i = 0; i < stars.length; i++) {
    var star = stars[i];
    if (bgCamera.x + star.x > WIDTH) {
      star.x -= WIDTH;
      star.alpha = Math.random();
    }
    if (bgCamera.x + star.x < 0) {
      star.x += WIDTH;
      star.alpha = Math.random();
    }
    if (bgCamera.y + star.y > HEIGHT) {
      star.y -= HEIGHT;
      star.alpha = Math.random();
    }
    if (bgCamera.y + star.y < 0) {
      star.y += HEIGHT;
      star.alpha = Math.random();
    }
    star.scale.x = star.alpha / 2;
    star.scale.y = star.alpha / 2;
  }

  camera.x = -hero.x + WIDTH / 2;
  camera.y = -hero.y + HEIGHT / 2;

  bgCamera.x = (-hero.x + WIDTH / 2) / BG_SCROLL;
  bgCamera.y = (-hero.y + HEIGHT / 2) / BG_SCROLL;

  // ui
  healthBar.scale.x = hero.health;
  scoreUI.text = "Score: " + score;
  taskUI.text = "Task: " + tasks[taskIdx];

  // rendering
  hero.render();
  for (var i = 0; i < hazards.length; i++) {
    hazards[i].render();
  }
  for (var i = 0; i < blackHoles.length; i++) {
    blackHoles[i].render();
  }
  scorePop.render();
}


// classes
function newHero() {
  var hero = {
    container: new PIXI.Container(),
    head: new PIXI.Sprite(PIXI.loader.resources["img/hero.png"].texture),
    face: new PIXI.Sprite(PIXI.loader.resources["img/hero-face.png"].texture),
    deathStars: [],
    dimension: true,
    velocity: { x: 0, y: 0 },
    jumpingTime: 0,
    speed: 1,
    size: 1,
    x: 0,
    y: 0,
    health: 1,
    deadTime: 0,
  }

  hero.render = function() {
    hero.container.x = hero.x;
    hero.container.y = hero.y;
    hero.container.scale.x = hero.size / 4;
    hero.container.scale.y = hero.size / 4;
    hero.head.rotation += .01;
    hero.face.x = hero.velocity.x * 1.5;
    hero.face.y = hero.velocity.y * 1.5;
    if (hero.size < .9) {
      hero.face.texture = PIXI.loader.resources["img/hero-face-hurt.png"].texture;
    } else {
      hero.face.texture = PIXI.loader.resources["img/hero-face.png"].texture;
    }
    if (hero.health <= 0) {
      hero.head.visible = false;
      hero.face.visible = false;
    } else {
      hero.head.visible = true;
      hero.face.visible = true;
    }
  }

  hero.flipDimension = function() {
    hero.dimension = !hero.dimension;
    for (var i = 0; i < hazards.length; i++) {
      hazards[i].setSprite();
    }
    for (var i = 0; i < blackHoles.length; i++) {
      blackHoles[i].setSprite();
    }
    for (var i = 0; i < stars.length; i++) {
      if (hero.dimension) {
        stars[i].texture = PIXI.loader.resources["img/star-a.png"].texture;
      } else {
        stars[i].texture = PIXI.loader.resources["img/star-b.png"].texture;
      }
    }
    if (hero.dimension) {
      renderer.backgroundColor = DIMENSION_A_BG;
    } else {
      renderer.backgroundColor = DIMENSION_B_BG;
    }
  }

  hero.explode = function() {
    for (var i = 0; i < hero.deathStars.length; i++) {
      var deathStar = hero.deathStars[i];
      deathStar.sprite.x = 0;
      deathStar.sprite.y = 0;
      deathStar.sprite.visible = true;
      var scale = Math.random() * 1 + 1;
      deathStar.sprite.scale.x = scale;
      deathStar.sprite.scale.y = scale;
      if (i > 4) {
        deathStar.velocity.x = Math.random() * 4 - 2;
        deathStar.velocity.y = Math.random() * 4 - 2;
      }
    }
  }

  hero.container.anchor = { x: .5, y: .5 };
  hero.head.anchor = { x: .5, y: .5 };
  hero.face.anchor = { x: .5, y: .5 };
  hero.container.addChild(hero.head);
  hero.container.addChild(hero.face);

  for (var i = 0; i < 10; i++) {
    var deathStar = { 
      velocity: { x: 0, y: 0 }, 
      sprite: new PIXI.Sprite(PIXI.loader.resources["img/death-star.png"].texture) 
    };
    deathStar.sprite.visible = false;
    hero.container.addChild(deathStar.sprite);
    hero.deathStars.push(deathStar);
  }
  hero.deathStars[0].velocity = { x: .5, y: .5 };
  hero.deathStars[1].velocity = { x: -.5, y: .5 };
  hero.deathStars[2].velocity = { x: .5, y: -.5 };
  hero.deathStars[3].velocity = { x: -.5, y: -.5 };

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
    collapseTime: 0,
  };

  hazard.reset = function() {
    hazard.enabled = true;
    hazard.dimension = true;
    hazard.size = 1;
    hazard.collapseTime = 0;
    hazard.y = hero.y + Math.random() * HEIGHT - HEIGHT / 2;
    if (Math.random() < .5) {
      hazard.x = hero.x - WIDTH;
    } else {
      hazard.x = hero.x + WIDTH;
    }
    hazard.setSprite();
  }

  hazard.flipDimension = function() {
    hazard.dimension = !hazard.dimension;
    hazard.setSprite();
  }

  hazard.setSprite = function() {
    if (hero.dimension === hazard.dimension) {
      if (hazard.dimension) {
        hazard.sprite.texture = PIXI.loader.resources["img/hazard-a.png"].texture;
      } else {
        hazard.sprite.texture = PIXI.loader.resources["img/hazard-b.png"].texture;
      }
    } else {
      if (hazard.dimension) {
        hazard.sprite.texture = PIXI.loader.resources["img/hazard-a-empty.png"].texture;
      } else {
        hazard.sprite.texture = PIXI.loader.resources["img/hazard-b-empty.png"].texture;
      }
    }
  }

  hazard.render = function() {
    hazard.sprite.x = hazard.x;
    hazard.sprite.y = hazard.y;
    hazard.sprite.scale.x = hazard.size / 10 * (1 - hazard.collapseTime / COLLAPSE_TIME);
    hazard.sprite.scale.y = hazard.size / 10 * (1 - hazard.collapseTime / COLLAPSE_TIME);
    hazard.sprite.visible = hazard.enabled;
    hazard.sprite.alpha = Math.random() * .1 + .9;
    hazard.sprite.rotation += .4;
  }

  hazard.sprite.anchor = { x: .5, y: .5 };

  hazard.reset();
  hazard.enabled = false;

  return hazard;
}

function newBlackHole(x, y, dimension) {
  var blackHole = {
    sprite: new PIXI.Sprite(PIXI.loader.resources["img/black-hole-a.png"].texture),
    dimension: dimension,
    x: x,
    y: y,
    aliveTime: 0
  }

  blackHole.setSprite = function() {
    if (hero.dimension === blackHole.dimension) {
      if (blackHole.dimension) {
        blackHole.sprite.texture = PIXI.loader.resources["img/black-hole-a.png"].texture;
      } else {
        blackHole.sprite.texture = PIXI.loader.resources["img/black-hole-b.png"].texture;
      }
    } else {
      if (blackHole.dimension) {
        blackHole.sprite.texture = PIXI.loader.resources["img/black-hole-a-empty.png"].texture;
      } else {
        blackHole.sprite.texture = PIXI.loader.resources["img/black-hole-b-empty.png"].texture;
      }
    }
  }

  blackHole.render = function() {
    blackHole.sprite.x = blackHole.x;
    blackHole.sprite.y = blackHole.y;
    blackHole.sprite.rotation += .2;
    if (blackHole.aliveTime < COLLAPSE_TIME) {
      blackHole.aliveTime++;
    }
    blackHole.sprite.scale.x = blackHole.aliveTime / COLLAPSE_TIME;
    blackHole.sprite.scale.y = blackHole.aliveTime / COLLAPSE_TIME;
  }

  blackHole.sprite.anchor = { x: .5, y: .5 };
  blackHole.setSprite();

  return blackHole
}

function newScorePop() {
  var scorePop = {
    text: new PIXI.Text(
      "+1",
      {fontFamily: "Arial", fontSize: 14, fill: 0x97f6ff}
    ),
    x: 0,
    y: 0,
    aliveTime: 100,
  }

  scorePop.set = function(score, x, y) {
    scorePop.text.text = "+" + score;
    scorePop.x = x;
    scorePop.y = y;
    scorePop.aliveTime = 0;
  }

  scorePop.render = function() {
    if (scorePop.aliveTime < 30) {
      scorePop.text.visible = true;
      scorePop.text.x = scorePop.x;
      scorePop.text.y = scorePop.y - scorePop.aliveTime;
      scorePop.aliveTime++;
    } else {
      scorePop.text.visible = false;
    }
  }

  return scorePop;
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