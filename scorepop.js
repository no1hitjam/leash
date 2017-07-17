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