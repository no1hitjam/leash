var type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
  type = "canvas"
}

PIXI.utils.sayHello(type)

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
const GRAVITY = .2;
const JUMP = -5;
const FRICTION = .95;

var hero;
var heroVelocityX = 0;
var heroVelocityY = 0;





PIXI.loader
  .add("img/hero.png")
  .load(setup);

function setup() {
  hero = new PIXI.Sprite(
    PIXI.loader.resources["img/hero.png"].texture
  );

  stage.addChild(hero);

  renderer.render(stage);
  gameLoop();
}

var keyLeft = keyboard(LEFT);
var keyRight = keyboard(RIGHT);
var keyUp = keyboard(UP);



function gameLoop() {
  requestAnimationFrame(gameLoop);

  heroVelocityX *= FRICTION;
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
  
  // limit speed
  if (heroVelocityX > HERO_MAX_SPEED) {
    heroVelocityX = HERO_MAX_SPEED;
  } else if (heroVelocityX < -HERO_MAX_SPEED) {
    heroVelocityX = -HERO_MAX_SPEED;
  }


  hero.x += heroVelocityX;
  hero.y += heroVelocityY;


  renderer.render(stage);
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