import { el } from './lib.js';
import { db, resetDatabase } from './db.js';

const canvas = el('#canvas');
const ctx = canvas.getContext('2d');

let tCode = null; // für Tastaturabfrage
let counter = 0;
let counterInterval = null;

const deathSound = new Audio('mp3/death.mp3'); // Sound bei Kollision mit Hindernis
deathSound.volume = 0.3;
const pocketSound = new Audio('mp3/spawn.mp3'); // Sound bei Kollision mit Item
pocketSound.volume = 0.3;

const bgMusic = new Audio('mp3/background.mp3'); // Hintergrundmusik
bgMusic.volume = 0.3; // Lautstärke einstellen (0.0 bis 1.0)
bgMusic.loop = true; // Hintergrundmusik endlos wiederholen
let soundSwitch = false; // Schalter für Ton aktiviert/deaktiviert

// Funktion zum Zeichnen des Titels in der Mitte des Canvas
function drawTitle() {
    ctx.fillStyle = "white";
    ctx.font = "bold 100px 'Tahoma";
    ctx.textAlign = "center";
    ctx.fillText("SPACE JUMP", canvas.width / 2, canvas.height / 2 + 20);
}

// Titel löschen
function clearTitle() {
    ctx.clearRect(canvas.width / 2 - 200, canvas.height / 2 - 50, 400, 100); // Bereich, in dem der Titel gezeichnet wurde, löschen
}

// Astronauten-Objektdefinition
const astronaut = {
    x: 60,
    y: 350,
    w: 60,
    h: 111,
    spX: 5, // speed
    spY: 15, // jump power
    gravity: 0.4,
    vy: 0,
    jumping: false,
    img: null, // Platzhalter für das Bild des Astronauten
    lifes: 3, // Anzahl der Leben
    pocket: 0, // gesammelten Items
    items: [],

    init: function () {
        this.img = new Image();
        this.img.addEventListener('load', () => { this.draw() }); // Zeichnet das Bild, wenn es geladen ist
        this.img.src = 'img/astronaut.png'; // Bildquelle für den Astronauten
    },

    move: function () {
        if (tCode === 'ArrowLeft' && this.x > 0) {
            this.x -= this.spX; // Bewegung nach links
        }
        if (tCode === 'ArrowRight' && this.x < canvas.width - this.w) {
            this.x += this.spX; // Bewegung nach rechts
        }
        if (tCode === ' ' && !this.jumping) {
            this.jumping = true;
            this.vy = -this.spY; // Sprung starten
        }
        this.applyGravity();
    },
    // Gravitation
    applyGravity: function () {
        if (this.jumping) {
            this.vy += this.gravity;
            this.y += this.vy;

            if (this.y >= 350) {
                this.y = 350;
                this.jumping = false;
                this.vy = 0;
            }
        }
    },

    flash: function (collisionWithItem = false, gameOver = false) {
        const originalColor = this.img.src;

        if (gameOver) {
            this.img.src = 'img/astronaut-dead.png'; // Bild ändern bei Game Over
        } else if (collisionWithItem) {
            this.img.src = 'img/astronaut-shine.png'; // Bild ändern bei Kollision mit Item
        } else {
            this.img.src = 'img/astronaut-hurt.png'; // Bild ändern bei Kollision mit Hindernis
        }

        this.draw();
        if (!gameOver) {
            setTimeout(() => {
                this.img.src = originalColor;
                this.draw();
            }, 500);
        }
    },

    draw: function () {
        ctx.drawImage(this.img, this.x, this.y, this.w, this.h); // Zeichnet das Bild des Astronauten
    }
};

const alien = {
    x: 900,
    y: 340,
    w: 51,
    h: 120,
    spX: 4,
    img: null, // Platzhalter für das Bild des Aliens
    lifeTracker: true,

    init: function () {
        this.img = new Image();
        this.img.addEventListener('load', () => { this.draw() });
        this.img.src = 'img/alien.png'; // Bildquelle für das Alien
    },

    move: function () {
        this.x -= this.spX; // Bewegung nach links
        if (this.x < -this.w) {
            this.x = canvas.width; // Alien zurücksetzen
            this.lifeTracker = true;
        }
        this.checkCollision();
        this.draw();
    },

    checkCollision: function () {
        if (checkCollision(astronaut, this) && this.lifeTracker) {
            this.lifeTracker = false;
            astronaut.flash();
            if (astronaut.lifes > 0) {
                astronaut.lifes--; // Ein Leben abziehen
                drawLifes();

                deathSound.play(); // Spielt den Todessound ab

                if (astronaut.lifes === 0) {
                    setTimeout(() => {
                        astronaut.flash(false, true); // Bild bei Game Over ändern
                        alert("Game Over");
                        cancelAnimationFrame(animate); // Animation stoppen
                        animate = false;
                        enableButtons(); // Buttons aktivieren
                        stopCounter(); // Stoppt den Counter bei Game Over
                    }, 500);
                }
            }
        }
    },

    draw: function () {
        ctx.drawImage(this.img, this.x, this.y, this.w, this.h); // Zeichnet das Bild des Aliens
    }
};

const item = {
    x: 1200,
    y: 350,
    w: 30,
    h: 27,
    spX: 4,
    img: null, // Platzhalter für das Bild des Items

    init: function () {
        this.img = new Image();
        this.img.addEventListener('load', () => { this.draw() });
        this.img.src = 'img/item.png'; // Bildquelle für das Item setzen
    },

    move: function () {
        this.x -= this.spX;
        if (this.x < -this.w) {
            this.x = canvas.width; // Item zurücksetzen
            this.lifeTracker = true;
        }
        this.checkCollision();
        this.draw();
    },

    checkCollision: function () {
        if (checkCollision(astronaut, this)) {
            astronaut.flash(true); // Flash bei Kollision mit Item
            astronaut.pocket++; // Erhöht den Pocket-Counter
            drawPocket();
            this.x = canvas.width; // Bewegt das Item außerhalb des Canvas

            pocketSound.play(); // Spielt den Pocket-Sound ab

            const newItem = {
                id: `item${astronaut.pocket}`, // Ein eindeutiger Schlüssel für jedes Item
                name: `Item ${astronaut.pocket}`, // Name des Items, hier ein Beispielname
                soundSrc: `mp3/item${astronaut.pocket}.mp3` // Verweis auf die korrekte Sounddatei
            };

            db.writeItem(newItem.id, newItem).then(() => {
                console.log(`Item ${newItem.id} gespeichert.`);
            }).catch((error) => {
                console.error('Fehler beim Speichern des Items:', error);
            });
        }
    },

    draw: function () {
        ctx.drawImage(this.img, this.x, this.y, this.w, this.h); // Zeichnet das Bild des Items
    }
};

const alien2 = {
    x: 1400,
    y: 320,
    w: 60,
    h: 142,
    spX: 4,
    img: null, // Platzhalter für das Bild des zweiten Aliens
    lifeTracker: true,

    init: function () {
        this.img = new Image();
        this.img.addEventListener('load', () => { this.draw() });
        this.img.src = 'img/alien2.png'; // Bildquelle für das zweite Alien
    },

    move: function () {
        this.x -= this.spX;
        if (this.x < -this.w) {
            this.x = canvas.width; // Alien zurücksetzen
            this.lifeTracker = true;
        }
        this.checkCollision();
        this.draw();
    },

    checkCollision: function () {
        if (checkCollision(astronaut, this) && this.lifeTracker) {
            this.lifeTracker = false;
            astronaut.flash();
            if (astronaut.lifes > 0) {
                astronaut.lifes--; // Ein Leben abziehen
                drawLifes();

                deathSound.play(); // Spielt den Todessound ab

                if (astronaut.lifes === 0) {
                    setTimeout(() => {
                        astronaut.flash(false, true); // Bild bei Game Over ändern
                        alert("Game Over");
                        cancelAnimationFrame(animate); // Animation stoppen
                        animate = false;
                        enableButtons(); // Buttons aktivieren
                        stopCounter(); // Stoppt den Counter bei Game Over
                    }, 500);
                }
            }
        }
    },

    draw: function () {
        ctx.drawImage(this.img, this.x, this.y, this.w, this.h); // Zeichnet das Bild des zweiten Aliens
    }
};

//Kollisison
function checkCollision(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.w &&
        obj1.x + obj1.w > obj2.x &&
        obj1.y < obj2.y + obj2.h &&
        obj1.y + obj2.h > obj2.y
    );
}

function drawCounter() {
    ctx.fillStyle = "white";
    ctx.font = "26px Segoe UI";
    ctx.clearRect(400, 20, 150, 30); // Bereich für Counter löschen
    ctx.fillText("Counter: " + (counter / 100).toFixed(2), 400, 50); // Anzeige in Sekunden mit zwei Dezimalstellen
}

function drawLifes() {
    ctx.fillStyle = "white";
    ctx.font = "26px Segoe UI";
    ctx.clearRect(50, 20, 200, 30); // Bereich für Leben löschen
    ctx.fillText("Lifes: " + astronaut.lifes, 750, 50);
}

function drawPocket() {
    ctx.fillStyle = "white";
    ctx.font = "26px Segoe UI";
    ctx.clearRect(600, 20, 200, 30); // Bereich für Pocket-Counter löschen
    ctx.fillText("Pocket: " + astronaut.pocket, 600, 50);
}

let animate = false;
let kollisionsStand = false;

function render() {
    animate = requestAnimationFrame(render);
    if (!kollisionsStand) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Hintergrund löschen

        drawCounter();
        drawPocket();
        drawLifes();

        astronaut.move();
        alien.move();
        alien2.move();
        item.move();

        astronaut.draw();
        alien.draw();
        alien2.draw();
        item.draw();
    } else {
        stopCounter(); // Stoppe den Counter, wenn kollisionsStand true ist
        cancelAnimationFrame(animate); // Animation stoppen
    }
}

function startCounter() {
    counterInterval = setInterval(() => {
        counter++;
        drawCounter();
    }, 10); // 10 Millisekunden = 1/100 Sekunden
}

function stopCounter() {
    clearInterval(counterInterval);
}

// Buttons deaktivieren
function enableButtons() {
    const newGameButton = document.querySelector('#new-game');
    newGameButton.disabled = false;
    newGameButton.style.backgroundColor = "";

    const startStopButton = document.querySelector('#start-stop');
    startStopButton.disabled = true;
    startStopButton.style.backgroundColor = "";
}

document.addEventListener('keydown', (e) => {
    e.preventDefault();
    tCode = e.key;
});

document.addEventListener('keyup', (e) => {
    tCode = null;
});

document.querySelector('#start-stop').addEventListener('click', function () {
    if (!animate) {
        clearTitle(); // Titel löschen, wenn das Spiel startet
        render();
        startCounter(); // Startet den Counter
        this.innerText = 'STOP';
    } else {
        cancelAnimationFrame(animate);
        stopCounter(); // Stoppt den Counter
        animate = false;
        this.innerText = 'START';
    }
});

document.querySelector('#new-game').addEventListener('click', function () {
    if (!animate) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Zurücksetzen des Astronauten
        astronaut.x = 60;
        astronaut.y = 350;
        astronaut.lifes = 3; // Setze Leben zurück
        astronaut.vy = 0;
        astronaut.jumping = false;
        astronaut.pocket = 0; // Setze Pocket zurück

        counter = 0; // Setze den Counter zurück
        drawCounter(); // Zeichne den zurückgesetzten Counter

        // Zurücksetzen der Alien- und Item-Positionen
        alien.x = 900;
        alien.lifeTracker = true;

        alien2.x = 1400;
        alien2.lifeTracker = true;

        item.x = 1200;
        item.y = 350;
        item.lifeTracker = true;

        // Zurücksetzen der Datenbank (Items löschen)
        resetDatabase().then(() => {
            console.log('Datenbank zurückgesetzt.');
        }).catch((error) => {
            console.error('Fehler beim Zurücksetzen der Datenbank:', error);
        });

        this.disabled = true;
        this.style.backgroundColor = "";

        const startStopButton = document.querySelector('#start-stop');
        startStopButton.disabled = false;
        startStopButton.style.backgroundColor = "";

        const audioButton = document.querySelector('#audio');
        audioButton.disabled = false;
        audioButton.style.backgroundColor = "";

        // Initialisiere das Astronaut-Objekt neu, um das ursprüngliche Bild zu laden
        astronaut.init();
        render();
        startCounter(); // Startet den Counter
    }
});

// Titel zeichnen
drawTitle();

export { astronaut, alien, alien2, item };

// Audio-Button zum Ein- und Ausschalten der Hintergrundmusik
document.querySelector('#audio').addEventListener('click', () => {
    soundSwitch = !soundSwitch;
    if (soundSwitch) {
        bgMusic.currentTime = 0; // Musik von Anfang an starten
        bgMusic.play(); // Hintergrundmusik starten
        document.querySelector('#audio').innerHTML = '&#x1F50A;'; // Symbol für Lautsprecher aktivieren
    } else {
        bgMusic.pause(); // Hintergrundmusik pausieren
        document.querySelector('#audio').innerHTML = '&#x1F507;'; // Symbol für Stummschaltung aktivieren
    }
});

export function serviceWorkerAktiv() {
    // Registrierung des SW im Browser
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('../service-worker.js', {
            scope: './'
        });
    }
}
