// ==== CONFIG ====
const API_URL = "https://aiword-1.onrender.com/process"; // your FastAPI endpoint

// ==== RIBBON COMMANDS ====
const editor = document.getElementById("editor");
document.querySelectorAll("[data-cmd]").forEach(btn => {
  btn.addEventListener("click", () => document.execCommand(btn.dataset.cmd, false, null));
});

document.getElementById("heading").addEventListener("change", e => {
  const tag = e.target.value;
  if (tag === "p") document.execCommand("formatBlock", false, "P");
  else document.execCommand("formatBlock", false, tag.toUpperCase());
});

document.getElementById("undo").onclick = () => document.execCommand("undo");
document.getElementById("redo").onclick = () => document.execCommand("redo");

// ==== LAYOUT TOGGLE ====
const aiPanel = document.getElementById("aiPanel");
const layout = document.querySelector(".layout");
document.getElementById("toggleAI").onclick = () => {
  aiPanel.classList.toggle("hidden");
  layout.classList.toggle("with-ai");
};
document.getElementById("closeAI").onclick = () => {
  aiPanel.classList.add("hidden");
  layout.classList.remove("with-ai");
};

// ==== AI CHAT ====
const aiMode = document.getElementById("aiMode");
const aiPrompt = document.getElementById("aiPrompt");
const aiChat = document.getElementById("aiChat");
const insertLastBtn = document.getElementById("insertLast");
const clearChatBtn = document.getElementById("clearChat");

let chat = []; // {role: "user"|"ai", text: string}
let lastAI = "";

// Load/save chat & doc
(function restore() {
  const saved = localStorage.getItem("ads_state");
  if (!saved) return;
  const { content, chatSaved } = JSON.parse(saved);
  if (content) editor.innerHTML = content;
  if (Array.isArray(chatSaved)) {
    chat = chatSaved;
    renderChat();
  }
})();
function persist() {
  localStorage.setItem("ads_state", JSON.stringify({ content: editor.innerHTML, chatSaved: chat }));
}
editor.addEventListener("input", persist);

// Render chat
function renderChat() {
  aiChat.innerHTML = "";
  chat.forEach(m => {
    const div = document.createElement("div");
    div.className = `msg ${m.role}`;
    div.textContent = m.text;
    aiChat.appendChild(div);
  });
  aiChat.scrollTop = aiChat.scrollHeight;
}

async function runAI() {
  const mode = aiMode.value;
  const prompt = aiPrompt.value.trim();
  const docText = editor.innerText.trim();

  const userMsg = prompt ? `${prompt}\n\n[Document]\n${docText}` : docText || "(empty document)";
  chat.push({ role: "user", text: `(${mode})\n${userMsg}` });
  renderChat(); persist();

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: userMsg, mode })
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();

    const reply = data?.output || "No response.";
    lastAI = reply;
    chat.push({ role: "ai", text: reply });
    renderChat(); persist();
  } catch (e) {
    const err = `Error: ${e.message}`;
    lastAI = err;
    chat.push({ role: "ai", text: err });
    renderChat(); persist();
  }
}
document.getElementById("runAI").onclick = runAI;
insertLastBtn.onclick = () => {
  if (!lastAI) return;
  document.execCommand("insertText", false, lastAI);
};
clearChatBtn.onclick = () => { chat = []; renderChat(); persist(); };

// ==== EXPORTS ====
// DOCX
document.getElementById("exportDocx").onclick = async () => {
  const { Document, Packer, Paragraph, HeadingLevel, TextRun } = window.docx;
  const temp = document.createElement("div");
  temp.innerHTML = editor.innerHTML;

  const children = [];
  for (const node of temp.childNodes) {
    if (node.nodeType === 3) {
      children.push(new Paragraph({ children: [new TextRun(node.textContent || "")] }));
    } else if (node.tagName?.match(/^H[1-6]$/)) {
      const lvl = Number(node.tagName[1]);
      children.push(new Paragraph({ text: node.textContent || "", heading: HeadingLevel[`HEADING_${lvl}`] || HeadingLevel.HEADING_1 }));
    } else {
      children.push(new Paragraph({ text: node.textContent || "" }));
    }
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, "document.docx");
};

// PDF (quick HTML render)
document.getElementById("exportPdf").onclick = () => {
  const opt = { margin: 10, filename: "document.pdf", image: { type: "jpeg", quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: "mm", format: "a4", orientation: "portrait" } };
  window.html2pdf().set(opt).from(editor).save();
};

// PPTX (one slide with all text)
document.getElementById("exportPptx").onclick = () => {
  const pptx = new window.PptxGenJS();
  const slide = pptx.addSlide();
  const text = editor.innerText || "";
  slide.addText(text, { x: 0.5, y: 0.5, w: 9, h: 5, fontSize: 16 });
  pptx.writeFile({ fileName: "document.pptx" });
};

// Helper
function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
