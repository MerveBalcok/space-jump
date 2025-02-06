import {
  astronaut,
  alien,
  alien2,
  item,
  serviceWorkerAktiv,
} from "../modules/game.js";
import { showPocketWindow } from "../modules/db-pocket.js";
import { addButton } from "../modules/install.js";

window.addEventListener("load", () => {
  astronaut.init();
  alien.init();
  alien2.init();
  item.init();
});

document.addEventListener("DOMContentLoaded", () => {
  const pocketButton = document.querySelector("#pocket-button");
  pocketButton.addEventListener("click", showPocketWindow);
});

// Aktivieren
// addButton();
// serviceWorkerAktiv();
