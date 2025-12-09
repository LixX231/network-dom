const postsContainer = document.getElementById("posts");
const authorsContainer = document.getElementById("authors");
const modal = document.getElementById("modal");
const closeModal = document.getElementById("closeModal");

const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");
const modalComments = document.getElementById("modal-comments");

let count;
const STORAGE_KEY = 'pageReloadCount';
let storedValue = localStorage.getItem(STORAGE_KEY) || '0';

storedValue = parseInt(storedValue);
count = storedValue + 1;
localStorage.setItem(STORAGE_KEY, String(count));

const counterElement = document.getElementById('reload-counter');
if (counterElement) {
  counterElement.textContent = `Количество загрузок: ${count}`;
}

let posts = [];
let users = [];

const FAV_STORAGE_KEY = 'favoritePosts';

function getFavoritePosts() {
  const stored = localStorage.getItem(FAV_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function addFavoritePost(postId) {
  const favs = getFavoritePosts();
  const parsedId = parseInt(postId);
  if (!favs.includes(parsedId)) {
    favs.push(parsedId);
    localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favs));
  }
}

function isFavorite(postId) {
  const favs = getFavoritePosts();
  return favs.includes(parseInt(postId));
}

async function loadData() {
  const [postsResponse, usersResponse] = await Promise.all([
    fetch("http://localhost:3000/posts"),
    fetch("http://localhost:3000/users")
  ]);

  posts = await postsResponse.json();
  users = await usersResponse.json();

  renderAuthors();
  renderUsersToSelect();
  renderPosts(posts);
}

function renderAuthors() {
  authorsContainer.innerHTML = "";

  const allButton = document.createElement("button");
  allButton.textContent = "Все";
  allButton.onclick = () => renderPosts(posts);
  authorsContainer.appendChild(allButton);

  for (let user of users) {
    const btn = document.createElement("button");
    btn.textContent = user.name;
    btn.onclick = () => filterByAuthor(user.id);
    authorsContainer.appendChild(btn);
  }
}

async function filterByAuthor(userId) {
  const res = await fetch("http://localhost:3000/posts?userId=" + userId);
  const filtered = await res.json();
  renderPosts(filtered);
}

function renderUsersToSelect() {
  const select = document.getElementById("userSelect");
  if (!select) return;

  select.innerHTML = "";

  const def = document.createElement("option");
  def.disabled = true;
  def.selected = true;
  def.textContent = "Выберите автора";
  select.appendChild(def);

  users.forEach(u => {
    const op = document.createElement("option");
    op.value = u.id;
    op.textContent = u.name;
    select.appendChild(op);
  });
}

function renderPosts(postList) {
  postsContainer.innerHTML = "";
  applyViewMode();

  postList.forEach(post => {
    const div = document.createElement("div");
    div.className = "post" + (isFavorite(post.id) ? " favorite" : "");

    div.innerHTML = `
      <div class="post-content">
        <h3>${post.title}</h3>
        <p>${post.body.substring(0, 150)}...</p>
      </div>

      <div class="like">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
         class="btn-like" viewBox="0 0 16 16">
          <path data-idpost="${post.id}" class="like-path"
           d="M4 1c2.21 0 4 1.755 4 3.92C8 2.755 9.79 1 12 1s4 1.755 4 3.92c0 3.263-3.234 4.414-7.608 9.608a.513.513 0 0 1-.784 0C3.234 9.334 0 8.183 0 4.92 0 2.755 1.79 1 4 1"/>
        </svg>
        <span>${post.numberOfLike || 0}</span>
      </div>

      <button class="favorite-btn" data-id="${post.id}">
        ${isFavorite(post.id) ? '⭐ В избранном' : '☆ В избранное'}
      </button>

      <div class="post-buttons">
        <button class="details" data-id="${post.id}">Подробнее</button>
        <button class="delete-post" data-id="${post.id}">Удалить</button>
      </div>
    `;

    postsContainer.appendChild(div);
  });

  document.querySelectorAll(".details").forEach(btn => {
    btn.addEventListener("click", () => showModal(btn.dataset.id));
  });
}

async function showModal(postId) {
  const post = posts.find(p => p.id == postId);

  modalTitle.textContent = post.title;
  modalBody.textContent = post.body;

  const res = await fetch("http://localhost:3000/comments?postId=" + postId);
  const comments = await res.json();

  modalComments.innerHTML = "";
  comments.forEach(c => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${c.name}</strong> (${c.email})<br>${c.body}`;
    modalComments.appendChild(li);
  });

  modal.style.display = "block";
}

closeModal.onclick = () => modal.style.display = "none";
window.onclick = e => {
  if (e.target === modal) modal.style.display = "none";
};

const postForm = document.getElementById("postForm");

if (postForm) {
  postForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(postForm);

    const newPost = {
      title: formData.get("title"),
      body: formData.get("body"),
      userId: +formData.get("userId"),
      numberOfLike: 0
    };

    await fetch("http://localhost:3000/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPost)
    });

    await loadData();
    postForm.reset();
  });
}

document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("delete-post")) {
    const id = e.target.dataset.id;

    await fetch("http://localhost:3000/posts/" + id, {
      method: "DELETE"
    });

    posts = posts.filter(p => p.id != id);
    renderPosts(posts);
  }

  if (e.target.classList.contains("like-path")) {
    const idPost = e.target.dataset.idpost;

    const likeBox = e.target.closest(".like");
    const span = likeBox.querySelector("span");

    const number = +span.textContent + 1;
    span.textContent = number;

    await fetch("http://localhost:3000/posts/" + idPost, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numberOfLike: number })
    });

    const idx = posts.findIndex(p => p.id == idPost);
    posts[idx].numberOfLike = number;
  }

  if (e.target.classList.contains("favorite-btn")) {
    const postId = e.target.dataset.id;
    if (isFavorite(postId)) {
      return;
    }
    addFavoritePost(postId);
    e.target.textContent = "⭐ В избранном";
    e.target.closest(".post").classList.add("favorite");
  }
});

const btnLight = document.getElementById("light-theme");
const btnDark = document.getElementById("dark-theme");

let browserTheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
browserTheme = browserTheme ? "dark" : "light";

let theme = localStorage.getItem('theme') || browserTheme;
if (theme === 'light') {
  btnLight.checked = true;
} else {
  btnDark.checked = true;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "src/dark.css";
  link.id = "dark-style";
  document.querySelector("head").append(link);
}

btnLight.addEventListener("change", () => {
  localStorage.setItem("theme", "light");
  const darkLink = document.getElementById("dark-style");
  if (darkLink) darkLink.remove();
});

btnDark.addEventListener("change", () => {
  localStorage.setItem("theme", "dark");
  if (!document.getElementById("dark-style")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "src/dark.css";
    link.id = "dark-style";
    document.querySelector("head").append(link);
  }
});

const tileBtn = document.getElementById("tile-view");
const listBtn = document.getElementById("list-view");

let viewMode = localStorage.getItem("viewMode") || "tile";

function applyViewMode() {
  if (viewMode === "list") {
    postsContainer.classList.add("list-mode");
    listBtn.classList.add("active");
    tileBtn.classList.remove("active");
  } else {
    postsContainer.classList.remove("list-mode");
    tileBtn.classList.add("active");
    listBtn.classList.remove("active");
  }
}

tileBtn.onclick = () => {
  viewMode = "tile";
  localStorage.setItem("viewMode", "tile");
  applyViewMode();
  renderPosts(posts);
};

listBtn.onclick = () => {
  viewMode = "list";
  localStorage.setItem("viewMode", "list");
  applyViewMode();
  renderPosts(posts);
};

applyViewMode();

loadData();