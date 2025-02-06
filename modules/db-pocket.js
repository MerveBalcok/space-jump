import { el, create } from './lib.js';
import { db } from './db.js';

const pocketWindow = el('#pocket-window');
let playing = null; // Variable, um das aktuell abgespielte Audio zu verfolgen
let currentIndex = 0; // Variable, um den aktuellen Index der abgespielten Items zu speichern

async function showPocketWindow() {
    // Toggle zwischen 'aktiv' und 'passiv'
    if (pocketWindow.className.includes('aktiv')) {
        pocketWindow.className = pocketWindow.className.replace('aktiv', 'passiv');
    } else {
        // Wenn das Pocket-Fenster aktiv ist, renderPocketItems aufrufen
        pocketWindow.className = pocketWindow.className.replace('passiv', 'aktiv');
        await renderPocketItems(); // Warte auf das Rendern der Items
    }
}

async function renderPocketItems() {
    // Lösche den alten Inhalt, aber behalte den Close-Button
    pocketWindow.innerHTML = '<button class="close-button">Close</button>';

    // Überprüfen, ob es gespeicherte Items gibt
    const items = await db.readDB();

    if (items && items.length > 0) {
        // Begrenzen auf auf 6 Items, beginnend beim currentIndex
        const limitedItems = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            limitedItems.push(item);
            if (limitedItems.length >= 6) {
                break;
            }
        }

        limitedItems.forEach((item, index) => {
            // div für jedes Item
            const itemDiv = create('div');
            itemDiv.className = 'item';

            const itemTitle = create('p');
            itemTitle.innerHTML = `Item ${index + 1}: ${item.name}`;

            // Play-Button für das Audio
            const playButton = create('button');
            playButton.innerHTML = 'Play';

            const audio = new Audio(item.soundSrc);
            audio.volume = 0.3; // Lautstärke auf 0.3 einstellen

            // Event Listener für den Play-Button
            playButton.addEventListener('click', () => {
                if (playing && playing !== audio) {
                    playing.pause();
                    playing.currentTime = 0;

                    // Suche den Button, der aktuell 'Stop' anzeigt und ändere ihn zurück zu 'Play'
                    const buttons = pocketWindow.querySelectorAll('button');
                    buttons.forEach(button => {
                        if (button.innerHTML === 'Stop') {
                            button.innerHTML = 'Play';
                        }
                    });
                }

                if (audio.paused) {
                    audio.play();
                    playButton.innerHTML = 'Stop';
                    playing = audio;
                } else {
                    audio.pause();
                    playButton.innerHTML = 'Play';
                    playing = null;
                }
            });

            // Elemente im Pocket-Fenster hinzufügen
            itemDiv.appendChild(itemTitle);
            itemDiv.appendChild(playButton);
            pocketWindow.appendChild(itemDiv);
        });

        // Aktualisiere currentIndex für das nächste Mal, wenn das Pocket-Fenster geöffnet wird
        currentIndex = 0; // Starte immer bei Index 0 für die begrenzten Items
    } else {
        // Wenn keine Items im Pocket sind
        const noItemsMessage = create('p');
        noItemsMessage.innerHTML = 'No items in your pocket.';
        pocketWindow.appendChild(noItemsMessage);
    }
}

// Event Listener für den Close-Button
pocketWindow.addEventListener('click', function (event) {
    if (event.target.className.includes('close-button')) {
        showPocketWindow();
    }
});

export { showPocketWindow };
