function newBlackHole(x, y, dimension) {
  var blackHole = {
    sprite: new PIXI.Sprite(PIXI.loader.resources["img/black-hole-a.png"].texture),
    dimension: dimension,
    x: x,
    y: y,
    aliveTime: 0,
    dying: false
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
    blackHole.sprite.rotation += .2
    blackHole.sprite.scale.x = limit(blackHole.aliveTime, 0, COLLAPSE_TIME) / COLLAPSE_TIME;
    blackHole.sprite.scale.y = limit(blackHole.aliveTime, 0, COLLAPSE_TIME) / COLLAPSE_TIME;
  }

  blackHole.sprite.anchor = { x: .5, y: .5 };
  blackHole.setSprite();

  return blackHole
}