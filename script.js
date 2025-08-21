let conversations = JSON.parse(localStorage.getItem("conversations")) || [];
let currentTopic = null;

function addMessage(text, role) {
  const chatBox = document.getElementById("chat-box");
  const msg = document.createElement("div");
  msg.className = `message ${role}`;
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Save to current conversation
  if (currentTopic) {
    const topic = conversations.find(c => c.title === currentTopic);
    topic.messages.push({ role, text });
    localStorage.setItem("conversations", JSON.stringify(conversations));
  }
}

async function sendMessage() {
  const inputEl = document.getElementById("input");
  const action = document.getElementById("action").value;
  const userText = inputEl.value.trim();
  if (!userText) return;

  // Create topic if new
  if (!currentTopic) {
    currentTopic = userText.slice(0, 20) + "...";
    conversations.push({ title: currentTopic, messages: [] });
    updateTopicList();
  }

  addMessage(userText, "user");
  inputEl.value = "";

  // Temporary AI response
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

function updateTopicList() {
  const list = document.getElementById("topic-list");
  list.innerHTML = "";
  conversations.forEach(conv => {
    const li = document.createElement("li");
    li.textContent = conv.title;
    li.onclick = () => loadConversation(conv.title);
    list.appendChild(li);
  });
  localStorage.setItem("conversations", JSON.stringify(conversations));
}

function loadConversation(title) {
  currentTopic = title;
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML = "";
  const conv = conversations.find(c => c.title === title);
  conv.messages.forEach(msg => addMessage(msg.text, msg.role));
}

function toggleLogin() {
  const usernameEl = document.getElementById("username");
  const loginBtn = document.getElementById("login-btn");

  if (usernameEl.textContent === "Guest") {
    usernameEl.textContent = "Rosario";
    loginBtn.textContent = "Log out";
  } else {
    usernameEl.textContent = "Guest";
    loginBtn.textContent = "Log in";
  }
}

// Init
updateTopicList();
