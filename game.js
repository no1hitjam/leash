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

const SQRT2 = 1.414;
const HERO_MAX_SPEED = 3.5;
const HERO_MAX_GRAVITY = 8;
const HERO_FRICTION = .98;
const HERO_GRAVITY_FRICTION = .995;
const HERO_MOVE_AGAINST_GRAVITY = .35;
const HAZARD_FRICTION = .97;
const BLACK_HOLE_FORCE_HERO = 50;
const BLACK_HOLE_FORCE_HAZARD = .025;
const DIMENSION_A_BG = 0x0d0027;
const DIMENSION_B_BG = 0x001827;
const BG_SCROLL = 5;
const COLLAPSE_TIME = 30;
const COLLAPSE_SIZE = 7;


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
    "img/death-star.png",
    "img/black-hole-arrow.png"])
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
    "Made by Jackson Lango\n\nUse the Arrow Keys to move\nFurther instructions provided in game",
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

  for (var i = 0; i < 20; i++) {
    var hazard = newHazard(i < 10);
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
  for (var i = 0; i < hero.blackHoleArrows.length; i++) {
    hero.blackHoleArrows[i].visible = false;
  }
  for (var i = 0; i < hazards.length; i++) {
    hazards[i].reset();
    hazards[i].enabled = false;
  }
  for (var i = 0; i < blackHoles.length; i++) {
    blackHolesContainer.addChild(blackHoles[i].sprite);
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

  //
  // HERO UPDATE
  //

  hero.moveVelocity.x *= HERO_FRICTION;
  hero.moveVelocity.y *= HERO_FRICTION;
  hero.gravityVelocity.x *= HERO_GRAVITY_FRICTION;
  hero.gravityVelocity.y *= HERO_GRAVITY_FRICTION;

  if (hero.health > 0) {
    // hero checking black holes
    for (var i = 0; i < blackHoles.length; i++) {
      var blackHole = blackHoles[i];
      if (blackHole.dying || blackHole.dimension !== hero.dimension) {
        if (i < hero.blackHoleArrows.length) {
          hero.blackHoleArrows[i].visible = false;
        }
        continue;
      }
      // point arrow towards
      while (i >= hero.blackHoleArrows.length) {
        hero.newBlackHoleArrow();
      }
      hero.blackHoleArrows[i].visible = true;
      var blackHoleAngle = Math.atan((blackHole.y - hero.y) / (blackHole.x - hero.x));
      if (hero.x < blackHole.x) {
        hero.blackHoleArrows[i].rotation = blackHoleAngle;
      } else {
        hero.blackHoleArrows[i].rotation = blackHoleAngle + Math.PI;
      }

      // get pulled in
      const distanceToHeroSquared = (hero.x - blackHole.x) * (hero.x - blackHole.x) + (hero.y - blackHole.y) * (hero.y - blackHole.y);
      if (distanceToHeroSquared != 0) {
        const force = 1 / distanceToHeroSquared * BLACK_HOLE_FORCE_HERO;
        console.log(force);
      
        hero.gravityVelocity.x += (blackHole.x - hero.x) * force;
        hero.gravityVelocity.y += (blackHole.y - hero.y) * force;
      }
    }

    hero.gravityVelocity.x = limit(hero.gravityVelocity.x, -HERO_MAX_GRAVITY, HERO_MAX_GRAVITY);
    hero.gravityVelocity.y = limit(hero.gravityVelocity.y, -HERO_MAX_GRAVITY, HERO_MAX_GRAVITY);

    // key inputs
    let inputVelocity = { x: 0, y: 0 };
    if (keyRight.isDown) {
      if (hero.moveVelocity.x < HERO_MAX_SPEED) {
        inputVelocity.x = hero.speed;
      }
    }
    if (keyLeft.isDown) {
      if (hero.moveVelocity.x > -HERO_MAX_SPEED) {
        inputVelocity.x = -hero.speed;
      }
    }
    if (_keyDown.isDown) {
      if (hero.moveVelocity.y < HERO_MAX_SPEED) {
        inputVelocity.y = hero.speed;
        if (keyLeft.isDown || keyRight.isDown) {
          inputVelocity.x /= SQRT2;
          inputVelocity.y /= SQRT2;
        }
      }
    }
    if (keyUp.isDown) {
      if (hero.moveVelocity.y > -HERO_MAX_SPEED) {
        inputVelocity.y = -hero.speed;
        if (keyLeft.isDown || keyRight.isDown) {
          inputVelocity.x /= SQRT2;
          inputVelocity.y /= SQRT2;
        }
      }
    }
    hero.moveVelocity.x += inputVelocity.x;
    hero.moveVelocity.y += inputVelocity.y;

    // add up hero velocity
    if (hero.moveVelocity.x < 0 && hero.gravityVelocity.x > 0) {
      hero.gravityVelocity.x += hero.moveVelocity.x * HERO_MOVE_AGAINST_GRAVITY;
      if (hero.gravityVelocity.x < 0) {
        hero.gravityVelocity.x = 0;
      }
    }
    if (hero.moveVelocity.x > 0 && hero.gravityVelocity.x < 0) {
      hero.gravityVelocity.x += hero.moveVelocity.x * HERO_MOVE_AGAINST_GRAVITY;
      if (hero.gravityVelocity.x > 0) {
        hero.gravityVelocity.x = 0;
      }
    }
    if (hero.moveVelocity.y < 0 && hero.gravityVelocity.y > 0) {
      hero.gravityVelocity.y += hero.moveVelocity.y* HERO_MOVE_AGAINST_GRAVITY;
      if (hero.gravityVelocity.y < 0) {
        hero.gravityVelocity.y = 0;
      }
    }
    if (hero.moveVelocity.y > 0 && hero.gravityVelocity.y < 0) {
      hero.gravityVelocity.y += hero.moveVelocity.y * HERO_MOVE_AGAINST_GRAVITY;
      if (hero.gravityVelocity.y > 0) {
        hero.gravityVelocity.y = 0;
      }
    }

    hero.x += hero.gravityVelocity.x + hero.moveVelocity.x;
    hero.y += hero.gravityVelocity.y + hero.moveVelocity.y;

    // check hero to black hole collision
    for (var j = 0; j < blackHoles.length; j++) {
      var blackHole = blackHoles[j];
      if (blackHole.dimension !== hero.dimension || blackHole.dying) {
        continue;
      }
      if (vectorLength(blackHole.x - hero.x, blackHole.y - hero.y) < 50) {
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
        if (distance < 25) {
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
      if (hazard.dimension !== blackHole.dimension || blackHole.dying) {
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
      if (blackHole.dimension !== hazard.dimension || blackHole.dying) {
        continue;
      }
      if (vectorLength(blackHole.x - hazard.x, blackHole.y - hazard.y) < 35) {
        hazard.flipDimension();
        sounds["sound/enter-black-hole.wav"].volume = Math.random() * .4 + .5;
        sounds["sound/enter-black-hole.wav"].play();
      }
    }

    // collapse hazard if too big
    if (hazard.size >= COLLAPSE_SIZE && hazard.collapseTime < COLLAPSE_TIME) {
      if (hazard.collapseTime == 0) {
        sounds["sound/create-black-hole.wav"].play();
      }
      hazard.collapseTime++;
    }
    if (hazard.collapseTime >= COLLAPSE_TIME) {
      // create black hole
      for (var k = 0; k < blackHoles.length; k++) {
        if (Math.abs(blackHoles[k].x - hazard.x) < WIDTH && Math.abs(blackHoles[k].y - hazard.y) < HEIGHT) {
          blackHoles[k].aliveTime = COLLAPSE_TIME;
          blackHoles[k].dying = true;
        }
      }
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
          hazard.x = (hazard.x + hazards[j].x) / 2;
          hazard.y = (hazard.y + hazards[j].y) / 2;
          hazard.velocity.x = (hazard.velocity.x + hazards[j].velocity.x) / 2;
          hazard.velocity.y = (hazard.velocity.y + hazards[j].velocity.y) / 2;
          hazards[j].enabled = false;
          hazard.size = combinedSize;
          sounds["sound/star-collide.wav"].volume = Math.random() * .4 + .3;
          sounds["sound/star-collide.wav"].play();
        }
      }
    }

    // careful here, hazard may be unenabled now

    if (hazard.velocity.x === 0 && hazard.velocity.y === 0) {
      hazard.enabled = false;
    }
  }

  // black holes
  for (var i = 0; i < blackHoles.length; i++) {
    if (blackHoles[i].dying) {
      blackHoles[i].aliveTime--;
    } else {
      blackHoles[i].aliveTime++;
    }
    if (blackHoles[i].aliveTime > 5000) { //5000
      blackHoles[i].dying = true;
      blackHoles[i].aliveTime = COLLAPSE_TIME;
    }
    if (blackHoles[i].aliveTime <= 0 && blackHoles[i].dying) {
      blackHolesContainer.removeChild(blackHoles[i].sprite);
    }
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
