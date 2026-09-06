
// ----------  STATE ----------

const STORAGE_KEY = "movievault_items";

// Load saved items from localStorage, or start with an empty list.
let items = loadItems();

// Which nav tab is currently open. Starts on "home".
let currentView = "home";

function loadItems() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}


// ----------DOM ELEMENTS ----------

const navButtons= document.querySelectorAll(".nav-item");
const viewJumpButtons= document.querySelectorAll("[data-view-jump]");

const watchingSection= document.querySelector(".watching-content");
const watchingGrid= document.querySelector(".watching-cards");

const allSectionKicker= document.querySelector(".all-content .section-kicker");
const allSectionHeading= document.querySelector(".all-content h2");
const allGrid= document.querySelector(".watchlist-cards");
const addBtn= document.querySelector(".add-content-btn");
const addOverlay= document.getElementById("add-overlay");
const addCloseBtn = document.getElementById("addcloseBtn");
const cancelBtn = document.getElementById("cancelbtn");
const addMovieForm= document.getElementById("addMovieForm");

const titleInput=document.getElementById("titleInput");
const yearInput=document.getElementById("yearInput");
const genreInput=document.getElementById("genreInput");
const categoryInput=document.getElementById("categoryinput");
const statusInput=document.getElementById("statusinput");
const posterUrlInput= document.getElementById("poster-url-input");
const posterFileInput= document.getElementById("posterinput");
const posterPreview= document.getElementById("posterpreview");
const searchInput = document.querySelector(".search-content");
let searchQuery = "";

// Holds a base64 image if the user uploads a file instead of a URL.
let uploadedPosterData = "";


// ---------- SEARCH ----------

searchInput.addEventListener("input", function () {
  searchQuery = searchInput.value.trim().toLowerCase();
  render();
});

function matchesSearch(item) {
  if (!searchQuery) return true;
  const haystack = (item.title + " " + item.genre).toLowerCase();
  return haystack.includes(searchQuery);
}

// ---------- NAV: SWITCHING BETWEEN TABS ----------

navButtons.forEach(function (btn) {
  btn.addEventListener("click", function () {
    setView(btn.dataset.view);
  });
});

// "View all →" links on the home page jump straight to a tab.
viewJumpButtons.forEach(function (btn) {
  btn.addEventListener("click", function () {
    setView(btn.dataset.viewJump);
  });
});

function setView(view) {
  currentView = view;

  // Highlight the matching sidebar button.
  navButtons.forEach(function (btn) {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  render();
}


// ---------- RENDERING ----------

function render() {
  if (currentView === "home") {
    renderHome();
  } else if (currentView === "stats") {
    renderStats();
  } else {
    renderFilteredView(currentView);
  }
}

// Home page: "Continue Watching" row + "Recently Added" grid.
function renderHome() {
  watchingSection.style.display = "";

  const watching = items.filter(function (i) { return i.status === "Watching" && matchesSearch(i); });
  drawCards(watchingGrid, watching);

  allSectionKicker.textContent = "YOUR COLLECTION";
  allSectionHeading.textContent = "Recently Added";
      // Exclude items already shown in "Continue Watching" above, so nothing
  // shows up twice on the Home tab.
  const recent = items
    .filter(function (i) { return i.status !== "Watching" && matchesSearch(i); })
    .sort(function (a, b) { return b.id - a.id; });
  drawCards(allGrid, recent);
}

// Watchlist / Favorites / Watching / Completed tabs.
// They all reuse the "Recently Added" grid, just filtered differently.
function renderFilteredView(view) {
  watchingSection.style.display = "none";

  let list = [];
  let heading = "";

  if (view === "watchlist") {
    list = items.filter(function (i) { return i.status === "Watchlist"; });
    heading = "Watchlist";
  } else if (view === "watching") {
    list = items.filter(function (i) { return i.status === "Watching"; });
    heading = "Watching";
  } else if (view === "completed") {
    list = items.filter(function (i) { return i.status === "Completed"; });
    heading = "Completed";
  } else if (view === "favorites") {
    list = items.filter(function (i) { return i.favorite; });
    heading = "Favorites";
  }
  list = list.filter(matchesSearch);
  allSectionKicker.textContent = "YOUR COLLECTION";
  allSectionHeading.textContent = heading;
  drawCards(allGrid, list);
}

// A simple text summary for the Statistics tab.
function renderStats() {
  watchingSection.style.display = "none";

  const total     = items.length;
  const watching  = items.filter(function (i) { return i.status === "Watching"; }).length;
  const completed = items.filter(function (i) { return i.status === "Completed"; }).length;
  const watchlist = items.filter(function (i) { return i.status === "Watchlist"; }).length;
  const favorites = items.filter(function (i) { return i.favorite; }).length;

  allSectionKicker.textContent = "OVERVIEW";
  allSectionHeading.textContent = "Statistics";

  allGrid.innerHTML =
    "<p style='padding:10px;color:#ccc;grid-column:1/-1'>" +
    "Total items: " + total + "<br>" +
    "Watchlist: " + watchlist + "<br>" +
    "Watching: " + watching + "<br>" +
    "Completed: " + completed + "<br>" +
    "Favorites: " + favorites +
    "</p>";
}

// Builds the card HTML for a list of items and drops it into a grid element.
function drawCards(gridEl, list) {
  if (list.length === 0) {
    gridEl.innerHTML = "<p style='color:#777;padding:10px'>Nothing here yet.</p>";
    return;
  }

  gridEl.innerHTML = list.map(cardHTML).join("");
}

function cardHTML(item) {
  const poster = item.poster
    ? item.poster
    : "https://via.placeholder.com/180x260/1e1e1e/666666?text=No+Image";

  const favLabel = item.favorite ? "♥ Favorited" : "♡ Favorite";

  // Buttons shown depend on the item's current status.
  let actionButtons = "";

  if (item.status === "Watchlist") {
    actionButtons += button(item.id, "start-watching", "▶ Start Watching");
    actionButtons += button(item.id, "mark-completed", "✓ Completed");
  } else if (item.status === "Watching") {
    actionButtons += button(item.id, "mark-completed", "✓ Completed");
    actionButtons += button(item.id, "back-to-watchlist", "↺ Watchlist");
  } else if (item.status === "Completed") {
    actionButtons += button(item.id, "back-to-watchlist", "↺ Rewatch");
  }

  actionButtons += button(item.id, "toggle-favorite", favLabel);
  actionButtons += button(item.id, "delete", "🗑 Delete");

  return (
    "<div class='card'>" +
      "<img src='" + escapeHTML(poster) + "' alt='" + escapeHTML(item.title) + "'>" +
      "<div class='card-info'>" +
        "<h3>" + escapeHTML(item.title) + "</h3>" +
        "<p>" + (item.year || "—") + (item.genre ? " • " + escapeHTML(item.genre) : "") + "</p>" +
        "<span class='category'>" + escapeHTML(item.category) + "</span> " +
        "<span class='badge'>" + escapeHTML(item.status) + "</span>" +
        "<p style='margin-top:6px;color:#ccc;font-size:12px'>Status: <strong>" + escapeHTML(item.status) + "</strong></p>" +
        "<div class='card-actions' style='display:flex;flex-wrap:wrap;gap:6px;margin-top:10px'>" +
          actionButtons +
        "</div>" +
      "</div>" +
    "</div>"
  );
}

// Small helper so every card action button looks/behaves the same way.
function button(id, action, label) {
  return (
    "<button class='text-btn' data-action='" + action + "' data-id='" + id + "' " +
    "style='border:1px solid rgba(255,255,255,0.15);border-radius:6px;padding:4px 8px'>" +
    label + "</button>"
  );
}

// Prevents user-typed text from breaking the HTML we build.
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}


// ---------- CARD ACTION BUTTONS (favorite / move / delete) ----------

// One listener on the whole page handles clicks on any card button,
// even though cards are re-created every time we render.
document.addEventListener("click", function (e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const id = Number(btn.dataset.id);
  const item = items.find(function (i) { return i.id === id; });
  if (!item) return;

  const action = btn.dataset.action;

  if (action === "start-watching") {
    item.status = "Watching";
  } else if (action === "mark-completed") {
    item.status = "Completed";
  } else if (action === "back-to-watchlist") {
    item.status = "Watchlist";
  } else if (action === "toggle-favorite") {
    item.favorite = !item.favorite;
  } else if (action === "delete") {
    const sure = confirm("Remove \"" + item.title + "\" from your vault?");
    if (!sure) return;
    items = items.filter(function (i) { return i.id !== id; });
  }

  saveItems();
  render();
});


// ---------- ADD MOVIE FORM ----------

addBtn.addEventListener("click", openAddForm);
addCloseBtn.addEventListener("click", closeAddForm);
cancelBtn.addEventListener("click", closeAddForm);

// Clicking the dark background (but not the form box itself) also closes it.
addOverlay.addEventListener("click", function (e) {
  if (e.target === addOverlay) closeAddForm();
});

function openAddForm() {
  addOverlay.classList.add("open");
}

function closeAddForm() {
  addOverlay.classList.remove("open");
  addMovieForm.reset();
  uploadedPosterData = "";
  posterPreview.innerHTML = "<span>No image selected</span>";
}

// Live preview when a poster URL is typed in.
posterUrlInput.addEventListener("input", function () {
  if (posterUrlInput.value.trim()) {
    uploadedPosterData = ""; // a typed URL wins over any uploaded file
    posterPreview.innerHTML = "<img src='" + escapeHTML(posterUrlInput.value.trim()) + "'>";
  }
});

// Live preview when a file is uploaded from the device.
posterFileInput.addEventListener("change", function () {
  const file = posterFileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function () {
    uploadedPosterData = reader.result; // base64 data URL
    posterUrlInput.value = "";          // uploaded file wins over any typed URL
    posterPreview.innerHTML = "<img src='" + uploadedPosterData + "'>";
  };
  reader.readAsDataURL(file);
});

addMovieForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const newItem = {
    id: Date.now(),
    title: titleInput.value.trim(),
    year: yearInput.value ? Number(yearInput.value) : "",
    genre: genreInput.value.trim(),
    category: categoryInput.value,
    status: statusInput.value,
    favorite: false,
    poster: uploadedPosterData || posterUrlInput.value.trim()
  };

  if (!newItem.title) return; // title is required by the HTML too, this is just a safety net

  items.push(newItem);
  saveItems();
  closeAddForm();

  // Jump to whichever tab makes the new item visible right away.
  setView("home");
});


// --------- FIRST RENDER ----------

render();