async function sendMessage() {
  const inputEl = document.getElementById("input");
  const action = document.getElementById("action").value;
  const chatBox = document.getElementById("chat-box");

  const userText = inputEl.value.trim();
  if (!userText) return;

  // Add user message
  const userMsg = document.createElement("div");
  userMsg.className = "message user";
  userMsg.textContent = userText;
  chatBox.appendChild(userMsg);

  inputEl.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;

  // Placeholder assistant message
  const aiMsg = document.createElement("div");
  aiMsg.className = "message assistant";
  aiMsg.textContent = "⏳ Thinking...";
  chatBox.appendChild(aiMsg);
  chatBox.scrollTop = chatBox.scrollHeight;

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

  chatBox.scrollTop = chatBox.scrollHeight;
}
