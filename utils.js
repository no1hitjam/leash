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

function randomSign() {
  if (Math.random() < .5) {
    return 1;
  } else {
    return -1;
  }
}

function lerp(start, end, percent) {
  return { 
    x: start.x + percent * (end.x - start.x),
    y: start.y + percent * (end.y - start.y),
  };
}

function normalize(v) {
  if (v.x == 0 && v.y == 0) {
    return v;
  }
  return { 
    x: v.x / vectorLength(v.x, v.y), 
    y: v.y / vectorLength(v.x, v.y) 
  };
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