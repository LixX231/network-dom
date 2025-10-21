import './style.css';

const postsContainer = document.getElementById("posts");
const authorsContainer = document.getElementById("authors");
const modal = document.getElementById("modal");
const closeModal = document.getElementById("closeModal");

const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");
const modalComments = document.getElementById("modal-comments");

let posts = [];
let users = [
  { id: 1, name: "Пользователь 1" },
  { id: 2, name: "Пользователь 2" },
  { id: 3, name: "Пользователь 3" },
  { id: 4, name: "Пользователь 4" },
  { id: 5, name: "Пользователь 5" },
  { id: 6, name: "Пользователь 6" },
  { id: 7, name: "Пользователь 7" },
  { id: 8, name: "Пользователь 8" },
  { id: 9, name: "Пользователь 9" },
  { id: 10, name: "Пользователь 10" },
];

async function loadData() {
  const postsResponse = await fetch("http://localhost:3000/posts");
  posts = await postsResponse.json();

  renderAuthors();
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

function filterByAuthor(userId) {
  const filtered = posts.filter(p => p.userId === userId);
  renderPosts(filtered);
}

function renderPosts(postList) {
  postsContainer.innerHTML = "";
  postList.forEach(post => {
    const div = document.createElement("div");
    div.className = "post";
    div.innerHTML = `
      <h3>${post.title}</h3>
      <p>${post.body.substring(0, 100)}...</p>
      <button class="details" data-id="${post.id}">Подробнее</button>
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

  const commentsResponse = await fetch(`http://localhost:3000/comments?postId=${postId}`);
  const comments = await commentsResponse.json();

  modalComments.innerHTML = "";
  comments.forEach(c => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${c.name}</strong> (${c.email})<br>${c.body}`;
    modalComments.appendChild(li);
  });

  modal.style.display = "block";
}

closeModal.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

loadData();
