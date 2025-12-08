// ------ GLOBAL STATE ------
let players = [];
let assignments = [];
let currentRevealIndex = 0;

// ------ ELEMENTS ------
const screenHome = document.getElementById("screen-home");
const screenLobby = document.getElementById("screen-lobby");
const screenReveal = document.getElementById("screen-reveal");

// Home
const homeNameInput = document.getElementById("home-name");
const btnCreateGame = document.getElementById("btn-create-game");

// Lobby
const joinCodeDisplay = document.getElementById("join-code-display");
const btnCopyCode = document.getElementById("btn-copy-code");
const playersCountLabel = document.getElementById("players-count");
const totalPlayersLabel = document.getElementById("total-players");
const playersList = document.getElementById("players-list");
const playerNameInput = document.getElementById("player-name-input");
const btnAddPlayer = document.getElementById("btn-add-player");

const villagersInput = document.getElementById("villagers-input");
const doctorsInput = document.getElementById("doctors-input");
const mafiaInput = document.getElementById("mafia-input");
const totalRolesLabel = document.getElementById("total-roles");

const btnStartGame = document.getElementById("btn-start-game");

// Reveal
const revealPlayerName = document.getElementById("reveal-player-name");
const revealRoleText = document.getElementById("reveal-role-text");
const btnRevealRole = document.getElementById("btn-reveal-role");
const btnNextPlayer = document.getElementById("btn-next-player");
const btnBackHome = document.getElementById("btn-back-home");

// ------ HELPERS ------
function showScreen(screen) {
  [screenHome, screenLobby, screenReveal].forEach((el) =>
    el.classList.remove("active")
  );
  screen.classList.add("active");
}

function generateJoinCode(length = 5) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function updatePlayersUI() {
  playersList.innerHTML = "";
  players.forEach((name, index) => {
    const li = document.createElement("li");
    li.textContent = name;

    const btnRemove = document.createElement("button");
    btnRemove.textContent = "Remove";
    btnRemove.className = "remove-btn";
    btnRemove.onclick = () => {
      players.splice(index, 1);
      updatePlayersUI();
    };

    li.appendChild(btnRemove);
    playersList.appendChild(li);
  });

  playersCountLabel.textContent = players.length;
  totalPlayersLabel.textContent = players.length;
}

function updateTotalRoles() {
  const v = parseInt(villagersInput.value || "0", 10);
  const d = parseInt(doctorsInput.value || "0", 10);
  const m = parseInt(mafiaInput.value || "0", 10);
  totalRolesLabel.textContent = v + d + m;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ------ EVENT HANDLERS ------

// Create game from home
btnCreateGame.addEventListener("click", () => {
  const hostName = homeNameInput.value.trim();
  if (!hostName) {
    alert("Please enter your name.");
    return;
  }

  players = [hostName];
  updatePlayersUI();

  joinCodeDisplay.textContent = generateJoinCode();
  showScreen(screenLobby);
});

// Add player in lobby
btnAddPlayer.addEventListener("click", () => {
  const name = playerNameInput.value.trim();
  if (!name) return;
  players.push(name);
  playerNameInput.value = "";
  updatePlayersUI();
});

// allow pressing Enter to add
playerNameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    btnAddPlayer.click();
  }
});

// copy join code
btnCopyCode.addEventListener("click", () => {
  const code = joinCodeDisplay.textContent;
  navigator.clipboard
    .writeText(code)
    .then(() => alert("Join code copied: " + code))
    .catch(() => alert("Could not copy code, but the code is: " + code));
});

// update role totals when numbers change
[villagersInput, doctorsInput, mafiaInput].forEach((input) => {
  input.addEventListener("input", updateTotalRoles);
});
updateTotalRoles();

// Start game -> create assignments
btnStartGame.addEventListener("click", () => {
  if (players.length === 0) {
    alert("Add at least one player.");
    return;
  }

  const v = parseInt(villagersInput.value || "0", 10);
  const d = parseInt(doctorsInput.value || "0", 10);
  const m = parseInt(mafiaInput.value || "0", 10);

  const totalRoles = v + d + m;

  if (totalRoles !== players.length) {
    alert(
      `Total roles (${totalRoles}) must equal total players (${players.length}).`
    );
    return;
  }

  const roles = [];
  for (let i = 0; i < v; i++) roles.push("Villager");
  for (let i = 0; i < d; i++) roles.push("Doctor");
  for (let i = 0; i < m; i++) roles.push("Mafia");

  shuffle(roles);

  assignments = players.map((name, i) => ({
    name,
    role: roles[i],
  }));

  currentRevealIndex = 0;
  setupRevealForCurrentPlayer();
  showScreen(screenReveal);
});

// Reveal screen helpers
function setupRevealForCurrentPlayer() {
  const current = assignments[currentRevealIndex];
  revealPlayerName.textContent = current.name;
  revealRoleText.textContent = "???";

  btnRevealRole.classList.remove("hidden");
  btnNextPlayer.classList.add("hidden");
  btnBackHome.classList.add("hidden");
}

// reveal role button
btnRevealRole.addEventListener("click", () => {
  const current = assignments[currentRevealIndex];
  revealRoleText.textContent = current.role;
  btnRevealRole.classList.add("hidden");

  if (currentRevealIndex < assignments.length - 1) {
    btnNextPlayer.textContent = "Next Player";
    btnNextPlayer.classList.remove("hidden");
  } else {
    btnBackHome.classList.remove("hidden");
  }
});

// next player
btnNextPlayer.addEventListener("click", () => {
  if (currentRevealIndex < assignments.length - 1) {
    currentRevealIndex++;
    setupRevealForCurrentPlayer();
  }
});

// back home
btnBackHome.addEventListener("click", () => {
  showScreen(screenHome);
  // reset game state if you like
});
