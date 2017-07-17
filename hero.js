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