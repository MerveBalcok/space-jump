import { set, del, values, keys, get } from "./idb-src.js";

// Funktion zum Löschen aller Daten in der IndexedDB und der MP3-Dateien
export async function resetDatabase() {
    try {
        // 1. Alle Keys in der IndexedDB lesen
        const dbKeys = await keys();

        // 2. Alle Items in der IndexedDB löschen
        for (const key of dbKeys) {
            await del(key);
        }

        // 3. MP3-Dateien im mp3-Ordner löschen (Beispiel für MP3-Dateien)
        const mp3Files = ['mp3/item1.mp3','mp3/item2.mp3','mp3/item3.mp3','mp3/item4.mp3','mp3/item5.mp3', 'mp3/item6.mp3']; // Liste aller relevanten MP3-Dateien
        mp3Files.forEach(file => {
            // Hier implementierst du den Löschvorgang für die MP3-Dateien, falls notwendig
            // Beachte, dass MP3-Dateien nicht direkt in IndexedDB gespeichert werden können
            // Stattdessen könntest du sie lokal auf dem Server speichern und hier entfernen.
            // Das Löschen von Dateien im Dateisystem erfordert in JavaScript normalerweise
            // eine serverseitige Implementierung.
        });

        console.log('Datenbank und MP3-Dateien erfolgreich zurückgesetzt.');
    } catch (error) {
        console.error('Fehler beim Zurücksetzen der Datenbank und MP3-Dateien:', error);
        throw error;
    }
}

export const db = {
    readKeys: function () {
        return keys();
    },

    readDB: function () {
        return values();
    },

    writeItem: function (key, data) {
        return set(key, data);
    },

    readItem: function (key) {
        return get(key);
    },

    deleteItem: function (key) {
        return del(key);
    },

    updateItem: function (newItem) {
        const key = newItem.id;
        this.writeItem(key, newItem);
    }
};
