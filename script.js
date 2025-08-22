/* ---------- File Management ---------- */
let files = JSON.parse(localStorage.getItem("files")) || [];
let currentFile = null;

function newFile() {
  const name = prompt("Enter file name:");
  if (name) {
    files.push({ name, type: "word", content: "" });
    updateFileList();
    openFile(files.length - 1);
  }
}

function updateFileList() {
  const list = document.getElementById("file-list");
  list.innerHTML = "";
  files.forEach((file, idx) => {
    const li = document.createElement("li");
    li.textContent = file.name + " (" + file.type.toUpperCase() + ")";
    li.onclick = () => openFile(idx);
    list.appendChild(li);
  });
  localStorage.setItem("files", JSON.stringify(files));
}

function openFile(idx) {
  currentFile = idx;
  const file = files[idx];
  switchTab(file.type);
  if (file.type === "word") {
    document.getElementById("word-editor").innerHTML = file.content;
  } else if (file.type === "ppt") {
    renderSlides(file.content || []);
  }
}

document.getElementById("word-editor").addEventListener("input", () => {
  if (currentFile !== null && files[currentFile].type === "word") {
    files[currentFile].content = document.getElementById("word-editor").innerHTML;
    localStorage.setItem("files", JSON.stringify(files));
  }
});

/* ---------- Word Commands ---------- */
function execCmd(command) {
  document.execCommand(command, false, null);
}

/* ---------- Tabs ---------- */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});
function switchTab(tab) {
  document.querySelectorAll(".tab-btn").forEach(btn =>
    btn.classList.toggle("active", btn.dataset.tab === tab)
  );
  document.querySelectorAll(".tab-content").forEach(content =>
    content.classList.toggle("active", content.id === tab)
  );
  if (currentFile !== null) {
    files[currentFile].type = tab;
    localStorage.setItem("files", JSON.stringify(files));
  }
}

/* ---------- PPT Slides ---------- */
function addSlide() {
  if (currentFile === null) return;
  if (!Array.isArray(files[currentFile].content)) files[currentFile].content = [];
  files[currentFile].content.push("New Slide");
  renderSlides(files[currentFile].content);
  localStorage.setItem("files", JSON.stringify(files));
}
function renderSlides(slides) {
  const container = document.getElementById("ppt-slides");
  container.innerHTML = "";
  slides.forEach((slide, i) => {
    const div = document.createElement("div");
    div.className = "slide";
    div.contentEditable = true;
    div.textContent = slide;
    div.oninput = () => {
      files[currentFile].content[i] = div.textContent;
      localStorage.setItem("files", JSON.stringify(files));
    };
    container.appendChild(div);
  });
}

/* ---------- PDF Upload (Placeholder) ---------- */
function loadPDF(event) {
  const file = event.target.files[0];
  if (file) {
    document.getElementById("pdf-viewer").textContent =
      "Loaded: " + file.name + " (PDF content editing coming soon)";
  }
}

/* ---------- AI Assistant ---------- */
function addMessage(text, role) {
  const chatBox = document.getElementById("chat-box");
  const msg = document.createElement("div");
  msg.className = `message ${role}`;
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const inputEl = document.getElementById("input");
  const action = document.getElementById("action").value;
  const userText = inputEl.value.trim();
  if (!userText) return;

  addMessage(userText, "user");
  inputEl.value = "";

  addMessage("⏳ Thinking...", "assistant");
  const chatBox = document.getElementById("chat-box");
  const aiMsg = chatBox.lastChild;

  try {
    const res = await fetch("https://aiword-1.onrender.com/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: userText, mode: action }),
    });
    const data = await res.json();
    aiMsg.textContent = data.output || "⚠️ Unexpected response";
  } catch (err) {
    aiMsg.textContent = "❌ Error: " + err.message;
  }
}

/* ---------- Toggle AI Panel ---------- */
document.getElementById("ai-toggle").addEventListener("click", () => {
  document.getElementById("ai-panel").classList.toggle("hidden");
});

/* Init */
updateFileList();
