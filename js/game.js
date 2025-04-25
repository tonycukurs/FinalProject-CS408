// set up canvas
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const width = (canvas.width = window.innerWidth);
const height = (canvas.height = window.innerHeight);

// Update the ship image loading code at the top of your file
const shipImage = new Image();
shipImage.src = 'images/spaceship.jpg'; 

// Add a variable to offset the rotation
const shipImageRotationOffset = Math.PI/2; // 90 degrees clockwise

// Game state variables
const para = document.querySelector('p');
let score = 0;
let gameOver = false;

// function to generate random number
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// function to generate random RGB color value
function randomRGB() {
  return `rgb(${random(0, 255)},${random(0, 255)},${random(0, 255)})`;
}

// Base Shape class
class Shape {
  constructor(x, y, velX, velY) {
    this.x = x;
    this.y = y;
    this.velX = velX;
    this.velY = velY;
  }
}

// Asteroid class extending Shape
class Asteroid extends Shape {
  constructor(x, y, velX, velY, color, size) {
    super(x, y, velX, velY);
    this.color = color;
    this.size = size;
    this.exists = true;
    // Add some irregularity to make them look more like asteroids
    this.irregularity = [];
    for (let i = 0; i < 8; i++) {
      this.irregularity.push(random(size * 0.8, size * 1.2));
    }
  }

  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    // Draw irregular shape to look more like an asteroid
    ctx.moveTo(this.x + this.irregularity[0], this.y);
    for (let i = 1; i < 8; i++) {
      const angle = i * Math.PI / 4;
      const x = this.x + Math.cos(angle) * this.irregularity[i];
      const y = this.y + Math.sin(angle) * this.irregularity[i];
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  update() {
    // Asteroids fall from top to bottom
    this.y += this.velY;
    
    // If asteroid moves off bottom of screen, reset to top with new position
    if (this.y - this.size > height) {
      this.y = -this.size;
      this.x = random(this.size, width - this.size);
    }
  }

  collisionDetect(ship) {
    if (this.exists && ship.alive) {
      const dx = this.x - ship.x;
      const dy = this.y - ship.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.size + ship.size) {
        ship.alive = false;
        gameOver = true;
        para.textContent = 'Game Over! Score: ' + score;
        showRecordScoreButton(); // Show the record score button
      }
    }
  }
}

// Spaceship class extending Shape
class Spaceship extends Shape {
  constructor(x, y) {
    super(x, y, 0, 0);
    this.color = 'white';
    this.size = 15;
    this.alive = true;
    this.thrustPower = 0.5;
    this.rotationAngle = 0;
    this.friction = 0.98;
      this.cooldown = 0; // Shooting cooldown
    
    window.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowLeft":
          this.rotationAngle -= 0.2;
          break;
        case "ArrowRight":
          this.rotationAngle += 0.2;
          break;
        case "ArrowUp":
          // Apply thrust in direction of ship
          this.velX += Math.cos(this.rotationAngle) * this.thrustPower;
          this.velY += Math.sin(this.rotationAngle) * this.thrustPower;
          break;
        case "ArrowDown":
          // Apply thrust in opposite direction of ship
          this.velX -= Math.cos(this.rotationAngle) * this.thrustPower;
          this.velY -= Math.sin(this.rotationAngle) * this.thrustPower;
          break;
        case " ": // Space bar to shoot
          this.shoot();
          break;
      }
    });
  }

  draw() {
    if (!this.alive) return;
    
    ctx.save();
    ctx.translate(this.x, this.y);
    // Add the rotation offset to the ship's current rotation angle
    ctx.rotate(this.rotationAngle + shipImageRotationOffset);
    
    // Draw ship using the image with rotation applied
    ctx.drawImage(shipImage, -this.size, -this.size, this.size * 2, this.size * 2);
    
    ctx.restore();
  }

  update() {
    if (!this.alive) return;
    
    // Decrease cooldown counter
    if (this.cooldown > 0) {
      this.cooldown--;
    }
    
    // Apply friction to slow the ship
    this.velX *= this.friction;
    this.velY *= this.friction;
    
    // Update position
    this.x += this.velX;
    this.y += this.velY;
    
    // Wrap around screen edges
    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;
  }

  shoot() {
    if (this.cooldown <= 0 && this.alive) {
      // Calculate bullet starting position at the front of the ship
      const bulletX = this.x + Math.cos(this.rotationAngle) * this.size;
      const bulletY = this.y + Math.sin(this.rotationAngle) * this.size;
      
      // Create new bullet
      bullets.push(new Bullet(bulletX, bulletY, this.rotationAngle));
      
      // Set cooldown to prevent rapid firing
      this.cooldown = 10;
    }
  }
}

// Add a Bullet class after your other class definitions
class Bullet extends Shape {
  constructor(x, y, angle) {
    const bulletSpeed = 10;
    // Calculate velocity based on the ship's angle
    const velX = Math.cos(angle) * bulletSpeed;
    const velY = Math.sin(angle) * bulletSpeed;
    super(x, y, velX, velY);
    this.size = 3;
    this.color = 'white';
    this.exists = true;
    this.lifespan = 50; // Bullets disappear after traveling some distance
  }

  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  update() {
    // Move bullet
    this.x += this.velX;
    this.y += this.velY;
    
    // Decrease lifespan
    this.lifespan--;
    
    // Remove bullet if it goes off screen or lifespan ends
    if (this.x < 0 || this.x > width || this.y < 0 || this.y > height || this.lifespan <= 0) {
      this.exists = false;
    }
  }

  collisionDetect(asteroids) {
    for (const asteroid of asteroids) {
      if (asteroid.exists) {
        const dx = this.x - asteroid.x;
        const dy = this.y - asteroid.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.size + asteroid.size) {
          this.exists = false;
          asteroid.exists = false;
          score += 100; // Add points for destroying an asteroid
          return true;
        }
      }
    }
    return false;
  }
}

// Create asteroids
const asteroids = [];
const numAsteroids = 10;

for (let i = 0; i < numAsteroids; i++) {
  const size = random(20, 50);
  const asteroid = new Asteroid(
    random(size, width - size),    // x position
    random(-300, -size),           // y position (start above screen)
    random(-1, 1),                 // x velocity (slight sideways movement)
    random(1, 3),                  // y velocity (downward)
    `rgb(${random(100, 150)}, ${random(100, 150)}, ${random(150, 200)})`,  // grayish-blue color
    size
  );
  asteroids.push(asteroid);
}

// Create spaceship (player)
const spaceship = new Spaceship(
  width / 2,
  height - 100
);
spaceship.rotationAngle = -Math.PI/2; // Start pointing upward

// Create bullets array
const bullets = [];

// Update the score display
para.textContent = 'Score: ' + score;

 // Update the Animation loop function
function loop() {
  // Clear screen with slight trail effect
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.fillRect(0, 0, width, height);
  
  if (!gameOver) {
    // Update score (time-based)
    score += 1;
    para.textContent = 'Score: ' + score;
    
    // Periodically increase game difficulty by adding new asteroids
    if (score % 500 === 0) {
      addNewAsteroid();
    }
  }
  
  // Draw and update spaceship
  spaceship.draw();
  spaceship.update();
  
  // Draw and update bullets and remove destroyed ones
  for (let i = bullets.length - 1; i >= 0; i--) {
    if (bullets[i].exists) {
      bullets[i].draw();
      bullets[i].update();
      bullets[i].collisionDetect(asteroids);
    } else {
      bullets.splice(i, 1); // Remove destroyed bullets from array
    }
  }
  
  // Draw and update asteroids and replace destroyed ones
  for (let i = asteroids.length - 1; i >= 0; i--) {
    if (asteroids[i].exists) {
      asteroids[i].draw();
      asteroids[i].update();
      asteroids[i].collisionDetect(spaceship);
    } else {
      // Replace destroyed asteroid with a new one
      asteroids[i] = createNewAsteroid();
    }
  }
  
  if (!gameOver) {
    requestAnimationFrame(loop);
  }
}

// Helper function to create a new asteroid
function createNewAsteroid() {
  const size = random(20, 50);
  return new Asteroid(
    random(size, width - size),    // x position
    random(-300, -size),           // y position (start above screen)
    random(-1, 1),                 // x velocity (slight sideways movement)
    random(1, 3),                  // y velocity (downward)
    `rgb(${random(100, 150)}, ${random(100, 150)}, ${random(150, 200)})`,  // grayish-blue color
    size
  );
}

// Function to add a new asteroid to the game
function addNewAsteroid() {
  asteroids.push(createNewAsteroid());
}

// Add this function after your other declarations
function showRecordScoreButton() {
  // Check if button already exists
  if (document.querySelector('.record-score-button')) return;
  
  // Create button
  const recordButton = document.createElement('button');
  recordButton.textContent = 'Record score';
  recordButton.classList.add('record-score-button');
  
  // Style the button
  recordButton.style.position = 'absolute';
  recordButton.style.top = '60%';
  recordButton.style.left = '50%';
  recordButton.style.transform = 'translate(-50%, -50%)';
  recordButton.style.padding = '10px 20px';
  recordButton.style.fontSize = '18px';
  recordButton.style.cursor = 'pointer';
  recordButton.style.backgroundColor = '#4CAF50';
  recordButton.style.color = 'white';
  recordButton.style.border = 'none';
  recordButton.style.borderRadius = '5px';
  
  // Add click event to redirect to score.html with the score
  recordButton.addEventListener('click', () => {
    window.location.href = `score.html?score=${score}`;
  });
  
  // Add to the document
  document.body.appendChild(recordButton);
}

// Function to remove the button when restarting
function removeRecordScoreButton() {
  const button = document.querySelector('.record-score-button');
  if (button) {
    button.remove();
  }
}

// Update the restart event listener to remove the button
window.addEventListener('keydown', (e) => {
  if (gameOver && e.key === ' ') {
    gameOver = false;
    removeRecordScoreButton(); // Remove button when restarting
    spaceship.alive = true;
    spaceship.x = width / 2;
    spaceship.y = height - 100;
    spaceship.velX = 0;
    spaceship.velY = 0;
    spaceship.rotationAngle = 0;
    spaceship.rotationAngle = -Math.PI/2; // Reset to pointing upward
    score = 0;
    
    // Reset asteroids
    for (const asteroid of asteroids) {
      asteroid.y = random(-300, -asteroid.size);
      asteroid.x = random(asteroid.size, width - asteroid.size);
    }
    
    loop();
  }
});

// Start the game
loop();

// Add this code to your main game JavaScript file

/**
 * Call this function when the game ends to save the score and redirect to the score page
 * @param {number} finalScore - The player's final score
 */
function endGame(finalScore) {
  // Save the score in localStorage
  localStorage.setItem('lastGameScore', finalScore);
  
  // Redirect to the score page
  window.location.href = 'score.html';
}

// Example usage:
// When player loses all lives or game ends:
// endGame(playerScore);
