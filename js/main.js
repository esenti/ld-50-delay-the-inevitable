(function() {
  const canvas = document.getElementById('draw');
  canvas.width = 800;
  canvas.height = 600;

  const ctx = canvas.getContext('2d');

  let delta = 0;
  let now = 0;

  let before = Date.now();

  let elapsed = 0;
  let loading = 0;

// const DEBUG = false;
  const DEBUG = true;

  const keysDown = {};
  let keysPressed = {};

  const images = [];
  const audios = [];

  let framesThisSecond = 0;
  let fpsElapsed = 0;
  let fps = 0;

  let click = null
  let entropy = 0;
  let tempEntropy = 0;
  let size = 4;
  let tempSize = 4;

  let toEnemy = 1;
  let enemyPeriod = 2;
  let toEnemyPeriodUpdate = 5;
  const enemyPeriodUpdatePeriod = 5;

  const particles = []
  const enemies = []
  const bullets = []

  window.addEventListener("keydown", function(e) {
    keysDown[e.keyCode] = true;
    return keysPressed[e.keyCode] = true;
  }, false);

  window.addEventListener("keyup", function(e) {
    return delete keysDown[e.keyCode];
  }, false);

  canvas.addEventListener("click", function(e) {
    click = {
      'x': e.offsetX,
      'y': e.offsetY,
    }
  });

  const setDelta = function() {
    now = Date.now();
    delta = (now - before) / 1000;
    return before = now;
  };

  if (!DEBUG) {
    console.log = function() {
      return null;
    };
  }

  let ogre = false;

  let player;

  const init = function() {
    elapsed = 0;

    player = {
      x: 400,
      y: 300,
      r: 32,
    }

    ogre = false;
  }

  const collides = (bullet, enemy) => {
    return bullet.x + bullet.w > enemy.x && bullet.x < enemy.x + enemy.text.length * 10 &&
      bullet.y + bullet.h > enemy.y && bullet.y < enemy.y + 16;
  }

  const spawnEnemy = () => {
    const v = Math.floor(Math.random() * 20000 + 5);

    enemies.push({
      r: 300,
      dr: Math.random() * (-100) - 10,
      a: Math.random() * 2 * Math.PI,
      da: Math.random() * 2 - 1,
      text: `${v} J/K`,
      value: v,
    })
  }

  const explode = (enemy, dx, dy) => {
    const l = Math.sqrt(dx * dx + dy * dy);

    for(var k = 0; k < enemy.text.length; k++) {
      const letter = enemy.text[k];

      if(letter != ' ') {
        particles.push({
          x: enemy.x + k * 10,
          y: enemy.y,
          dx: 1.5 * dx / l + 0.2 * (Math.random() * 2 - 1),
          dy: 1.5 * dy / l + 0.2 * (Math.random() * 2 - 1),
          text: letter,
          ttl: Math.random() * 3 + 1,
          speed: 30,
          a: 0,
        })
      }
    }
  }

  const tick = function() {
    setDelta();
    elapsed += delta;
    update(delta);
    draw(delta);
    keysPressed = {};
    click = null;
    return window.requestAnimationFrame(tick);
  };

  let points = 0;

  const update = function(delta) {

     framesThisSecond += 1;
     fpsElapsed += delta;

     if(fpsElapsed >= 1) {
        fps = framesThisSecond / fpsElapsed;
        framesThisSecond = fpsElapsed = 0;
     }

     if (click) {
        const vx = click.x - player.x;
        const vy = click.y - player.y;

        const l = Math.sqrt(vx * vx + vy * vy);

        bullets.push({
          x: player.x,
          y: player.y,
          w: 4,
          h: 4,
          dx: 300 * vx / l,
          dy: 300 * vy / l,
        })
        click = null;
        
     }

     if(!ogre)
     {
     } else {
       if(keysDown[82]) {
         init();
       }
     }

      if(ogre && !fired) {
        fired = true;
      }

      toEnemy -= delta;
      if(toEnemy <= 0) {
        toEnemy = enemyPeriod;
        spawnEnemy();
      }

      toEnemyPeriodUpdate -= delta;
      if(toEnemyPeriodUpdate <= 0) {
        toEnemyPeriodUpdate = enemyPeriodUpdatePeriod;
        enemyPeriod = Math.max(enemyPeriod - 0.5, 1);
      }

      bullets.forEach(function(bullet) {
        bullet.x += bullet.dx * delta;
        bullet.y += bullet.dy * delta;
      });

      for(var i = enemies.length - 1; i >= 0; i--) {
        enemies[i].r += enemies[i].dr * delta;
        enemies[i].a += enemies[i].da * delta;

        const x = player.x - 20 + enemies[i].r * Math.cos(enemies[i].a);
        const y = player.y - 20 + enemies[i].r * Math.sin(enemies[i].a);

        const dx = x - enemies[i].x;
        const dy = y - enemies[i].y;

        enemies[i].x = x;
        enemies[i].y = y;

        if(enemies[i].r < 10) {
          explode(enemies[i], dx, dy);

          entropy += 0.5 * entropy + 0.0001 * enemies[i].value;
          tempEntropy = entropy * 2;

          if(entropy < 500) {
            tempSize = 16;
          }

          enemies.splice(i, 1);
          break;
        }

        for(var j = bullets.length - 1; j >= 0; j--) {
          if(collides(bullets[j], enemies[i])) {

            explode(enemies[i], dx, dy);

            enemies.splice(i, 1);
            bullets.splice(j, 1);
            tempEntropy += 0.2;
            break;
          }
        }
     }

     for(var i = particles.length - 1; i >= 0; i--) {
       particles[i].ttl -= delta;

       if(particles[i].ttl <= 0) {
         particles.splice(i, 1)
         continue;
       }

       particles[i].x += particles[i].dx * particles[i].speed * delta;
       particles[i].y += particles[i].dy * particles[i].speed * delta;
       particles[i].a += delta * Math.random() * (particles[i].text.charCodeAt(0) % 2 == 0 ? 1 : -1);
     }

      points += 10 * delta;

      if(tempEntropy > entropy) {
        tempEntropy = Math.max(entropy, tempEntropy - delta * 0.3);
      }

      if(tempSize > size) {
        tempSize = Math.max(size, tempSize - delta * 10);
      }
 };

  const draw = function(delta) {
     ctx.fillStyle = "#000000";
     ctx.fillRect(0, 0, canvas.width, canvas.height);

     ctx.fillStyle = "#fafafa";
     ctx.textAlign = "left";
     ctx.textBaseline = "top";

     particles.forEach(function(particle) {
        ctx.fillStyle = "#eeeeee";
        ctx.font = "16px Visitor";
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.a);
        ctx.fillText(particle.text, 0, 0);
        ctx.restore();
     })

     enemies.forEach(function(enemy) {
        // ctx.fillStyle = "#ff000099";
        // ctx.fillRect(enemy.x, enemy.y, enemy.text.length * 10, 16);
        ctx.fillStyle = "#eeeeee";
        ctx.font = "16px Visitor";
        ctx.fillText(enemy.text, enemy.x, enemy.y);
     });

     bullets.forEach(function(bullet) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(bullet.x, bullet.y, bullet.w, bullet.h);
     });

     ctx.fillStyle = "#444444";

     ctx.fillStyle = "#ffffff";

     ctx.strokeStyle = "#bababa";
     ctx.fillStyle = "#fafafa";


      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fill();

     ctx.fillStyle = "#fafafa";

     ctx.textAlign = "center";

        ctx.fillStyle = "#ffffff";
        ctx.font = "32px Visitor";
        ctx.fillText(Math.round(points), 400, 10);

     if(ogre) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "80px Visitor";
        ctx.fillText("oh no", 400, 350);

        ctx.fillStyle = "#ffffff";
        ctx.font = "20px Visitor";
        ctx.fillText("[r] to restart", 400, 400);
     }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const size = Math.floor(tempSize);

    for (var x = 0; x < canvas.width; x += size) {
      for (var y = 0; y < canvas.height; y += size) {
        if (Math.random() < 0.001 * tempEntropy) {
          const color = Math.random() * 255;

          for (var i = 0; i < size; i++) {
            for (var j = 0; j < size; j++) {
              const s = ((y + j) * canvas.width + (x + i));
              imageData.data[4 * s] = color;
              imageData.data[4 * s + 1] = color;
              imageData.data[4 * s + 2] = color;
            }
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
 };

 (function() {
  var targetTime, vendor, w, _i, _len, _ref;
  w = window;
  _ref = ['ms', 'moz', 'webkit', 'o'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
  vendor = _ref[_i];
  if (w.requestAnimationFrame) {
  break;
  }
  w.requestAnimationFrame = w["" + vendor + "RequestAnimationFrame"];
  }
  if (!w.requestAnimationFrame) {
  targetTime = 0;
  return w.requestAnimationFrame = function(callback) {
  var currentTime;
  targetTime = Math.max(targetTime + 16, currentTime = +(new Date));
  return w.setTimeout((function() {
          return callback(+(new Date));
          }), targetTime - currentTime);
  };
  }
 })();

  const loadImage = function(name, callback) {
    var img = new Image()
    console.log('loading')
    loading += 1
    img.onload = function() {
        console.log('loaded ' + name)
        images[name] = img
        loading -= 1
        if(callback) {
            callback(name);
        }
    }

    img.src = 'img/' + name + '.png'
 }

  const load = function() {
     if(loading) {
         window.requestAnimationFrame(load);
     } else {
         window.requestAnimationFrame(tick);
     }
 };

 init();
 load();

}).call(this);
