async function runAction() {
  const text = document.getElementById("input").value;
  const action = document.getElementById("action").value;
  const outputEl = document.getElementById("output");

  if (!text.trim()) {
    outputEl.textContent = "⚠️ Please enter some text.";
    return;
  }

  outputEl.textContent = "⏳ Processing...";

  try {
    const res = await fetch("https://aiword-1.onrender.com/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, mode: action }),
    });

    const data = await res.json();
    if (data.output) {
      outputEl.textContent = data.output;
    } else {
      outputEl.textContent = "❌ Unexpected response: " + JSON.stringify(data);
    }
  } catch (err) {
    outputEl.textContent = "🚨 Error: " + err.message;
  }
}
