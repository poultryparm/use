const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Player {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

class Enemy {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  update() {
    this.draw();
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
}

class Projectile {
  constructor(x, y, radius, color, velocity, isLaser = false) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.isLaser = isLaser;
  }

  draw() {
    ctx.beginPath();
    if (this.isLaser) {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + this.velocity.x * 1000, this.y + this.velocity.y * 1000);
      ctx.stroke();
    } else {
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  update() {
    this.draw();
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
}

class Boss {
  constructor(x, y, radius, color, health) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.health = health;
    this.velocity = {
      x: -1, // Moves towards the left side initially
      y: 0
    };
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  update() {
    this.draw();
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
}

const player = new Player(canvas.width / 2, canvas.height / 2, 30, 'white');
const projectiles = [];
const enemies = [];
let score = 0;
let lives = 3;
let boss = null;
let bossHealth = 100;
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');

function spawnEnemies() {
  setInterval(() => {
    if (score < 100) {
      const radius = Math.random() * (30 - 10) + 10;
      let x, y;
      if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
        y = Math.random() * canvas.height;
      } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
      }
      const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
      const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
      const velocity = {
        x: Math.cos(angle),
        y: Math.sin(angle)
      };
      enemies.push(new Enemy(x, y, radius, color, velocity));
    } else if (!boss) {
      boss = new Boss(canvas.width, canvas.height / 2, 50, 'red', 100);
    }
  }, 1000);
}

function animate() {
  const animationId = requestAnimationFrame(animate);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  player.draw();
  projectiles.forEach((projectile, index) => {
    projectile.update();

    if (!projectile.isLaser) {
      if (projectile.x - projectile.radius < 0 || projectile.x + projectile.radius > canvas.width || projectile.y - projectile.radius < 0 || projectile.y + projectile.radius > canvas.height) {
        setTimeout(() => {
          projectiles.splice(index, 1);
        }, 0);
      }
    } else {
      if (projectile.x < 0 || projectile.x > canvas.width || projectile.y < 0 || projectile.y > canvas.height) {
        setTimeout(() => {
          projectiles.splice(index, 1);
        }, 0);
      }
    }
  });

  enemies.forEach((enemy, index) => {
    enemy.update();

    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if (dist - enemy.radius - player.radius < 1) {
      setTimeout(() => {
        enemies.splice(index, 1);
        lives -= 1;
        livesEl.innerHTML = `Lives: ${lives}`;
        if (lives === 0) {
          cancelAnimationFrame(animationId);
          alert('Game Over');
          window.location.reload();
        }
      }, 0);
    }

    projectiles.forEach((projectile, projectileIndex) => {
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
      if (dist - enemy.radius - projectile.radius < 1) {
        setTimeout(() => {
          enemies.splice(index, 1);
          projectiles.splice(projectileIndex, 1);
          score += 10;
          scoreEl.innerHTML = `Score: ${score}`;
          if (score >= 100 && !boss) {
            boss = new Boss(canvas.width, canvas.height / 2, 50, 'red', 100);
          }
        }, 0);
      }
    });
  });

  if (boss) {
    boss.update();
    if (boss.x < player.x) {
      boss.velocity.x = 0;
      boss.velocity.y = (player.y - boss.y) / Math.abs(player.y - boss.y);
    }
    const dist = Math.hypot(player.x - boss.x, player.y - boss.y);
    if (dist - boss.radius - player.radius < 1) {
      setTimeout(() => {
        lives -= 1;
        livesEl.innerHTML = `Lives: ${lives}`;
        if (lives === 0) {
          cancelAnimationFrame(animationId);
          alert('Game Over');
          window.location.reload();
        }
      }, 0);
    }

    projectiles.forEach((projectile, projectileIndex) => {
      const dist = Math.hypot(projectile.x - boss.x, projectile.y - boss.y);
      if (dist - boss.radius - projectile.radius < 1) {
        setTimeout(() => {
          projectiles.splice(projectileIndex, 1);
          bossHealth -= 10;
          if (bossHealth <= 0) {
            boss = null;
            score += 50;
            scoreEl.innerHTML = `Score: ${score}`;
          }
        }, 0);
      }
    });
  }
}

window.addEventListener('click', (event) => {
  const angle = Math.atan2(event.clientY - canvas.height / 2, event.clientX - canvas.width / 2);
  const velocity = {
    x: Math.cos(angle) * 5,
    y: Math.sin(angle) * 5
  };
  projectiles.push(new Projectile(canvas.width / 2, canvas.height / 2, 5, 'white', velocity));
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'r' || event.key === 'R') {
    const angle = Math.atan2(canvas.height / 2 - player.y, canvas.width / 2 - player.x);
    const velocity = {
      x: Math.cos(angle) * 10,
      y: Math.sin(angle) * 10
    };
    projectiles.push(new Projectile(player.x, player.y, 5, 'cyan', velocity, true));
  }
});

animate();
spawnEnemies();
