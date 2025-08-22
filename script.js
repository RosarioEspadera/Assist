/* ---- Document Editing ---- */
let documents = JSON.parse(localStorage.getItem("documents")) || [];
let currentDoc = null;

function execCmd(command) {
  document.execCommand(command, false, null);
}

function newDocument() {
  const name = prompt("Enter document name:");
  if (name) {
    documents.push({ name, content: "" });
    updateDocList();
    openDocument(documents.length - 1);
  }
}

function updateDocList() {
  const list = document.getElementById("doc-list");
  list.innerHTML = "";
  documents.forEach((doc, idx) => {
    const li = document.createElement("li");
    li.textContent = doc.name;
    li.onclick = () => openDocument(idx);
    list.appendChild(li);
  });
  localStorage.setItem("documents", JSON.stringify(documents));
}

function openDocument(idx) {
  currentDoc = idx;
  const editor = document.getElementById("editor");
  editor.innerHTML = documents[idx].content;
}

document.getElementById("editor").addEventListener("input", () => {
  if (currentDoc !== null) {
    documents[currentDoc].content = document.getElementById("editor").innerHTML;
    localStorage.setItem("documents", JSON.stringify(documents));
  }
});

/* ---- AI Assistant ---- */
let conversations = JSON.parse(localStorage.getItem("conversations")) || [];

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

/* ---- Toggle AI Panel ---- */
document.getElementById("ai-toggle").addEventListener("click", () => {
  document.getElementById("ai-panel").classList.toggle("hidden");
});

/* Init */
updateDocList();
