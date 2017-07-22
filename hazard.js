function newHazard(dimension) {
  var hazard = {
    sprite: new PIXI.Sprite(PIXI.loader.resources["img/hazard-a.png"].texture),
    enabled: true,
    startingDimension: dimension,
    dimension: dimension,
    velocity: { x: 0, y: 0 },
    speed: .33,
    size: 1,
    x: 0,
    y: 0,
    collapseTime: 0,
  };

  hazard.reset = function() {
    hazard.enabled = true;
    hazard.dimension = hazard.startingDimension;
    hazard.size = 1;
    hazard.collapseTime = 0;
    hazard.speed = Math.random() * .15 + .18;
    hazard.y = hero.y + Math.random() * HEIGHT - HEIGHT / 2;
    if (Math.random() < .5) {
      hazard.x = hero.x - WIDTH;
      hazard.velocity = { x: 1 + Math.random(), y: Math.random() * 4 - 1 };
    } else {
      hazard.x = hero.x + WIDTH;
      hazard.velocity = { x: -1 - Math.random(), y: Math.random() * 4 - 1 };
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

  hazard.reset(true);
  hazard.enabled = false;

  return hazard;
}