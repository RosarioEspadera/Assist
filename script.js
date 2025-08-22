// ==== CONFIG ====
const BACKEND_URL = "https://aiword-1.onrender.com/process"; // <- your FastAPI /process

// ==== DOM ====
const sheet = document.getElementById("sheet");
const wordCountEl = document.getElementById("wordCount");
const fileNameEl = document.getElementById("fileName");
const aiPane = document.getElementById("aiPane");
const aiToggle = document.getElementById("aiToggle");
const aiClose = document.getElementById("aiClose");
const aiMode = document.getElementById("aiMode");
const aiInput = document.getElementById("aiInput");
const aiOutput = document.getElementById("aiOutput");
const aiRun = document.getElementById("aiRun");
const insertAtCursorBtn = document.getElementById("insertAtCursor");
const replaceSelectionBtn = document.getElementById("replaceSelection");
const replaceAllBtn = document.getElementById("replaceAll");
const saveTopicBtn = document.getElementById("saveTopic");
const topicsEl = document.getElementById("topics");
const clearHistoryBtn = document.getElementById("clearHistory");
const toggleTheme = document.getElementById("toggleTheme");
const fontFamily = document.getElementById("fontFamily");
const fontSize = document.getElementById("fontSize");
const imageInput = document.getElementById("imageInput");
const insertTableBtn = document.getElementById("insertTable");
const insertRectBtn = document.getElementById("insertRect");
const insertCircleBtn = document.getElementById("insertCircle");
const drawToggle = document.getElementById("drawToggle");
const clearDraw = document.getElementById("clearDraw");
const insertDrawing = document.getElementById("insertDrawing");
const findBtn = document.getElementById("findBtn");
const replaceBtn = document.getElementById("replaceBtn");
const exportPDF = document.getElementById("exportPDF");
const exportDOCX = document.getElementById("exportDOCX");
const exportTXT = document.getElementById("exportTXT");
const canvas = document.getElementById("drawLayer");
const ctx = canvas.getContext("2d");

// ==== THEME ====
toggleTheme.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// ==== WORD COUNT ====
function updateWordCount() {
  const text = sheet.innerText
    .replace(/\s+/g, " ")
    .trim();
  const words = text.length ? text.split(" ").length : 0;
  wordCountEl.textContent = `${words} word${words===1?"":"s"}`;
}
sheet.addEventListener("input", updateWordCount);
updateWordCount();

// ==== EXEC COMMANDS ====
document.querySelectorAll('[data-cmd]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.execCommand(btn.dataset.cmd, false, null);
    sheet.focus();
  });
});

// Font family / size
fontFamily.addEventListener("change", ()=> document.execCommand("fontName", false, fontFamily.value));
fontSize.addEventListener("change", ()=>{
  sheet.style.fontSize = fontSize.value; // visual
  document.execCommand("fontSize", false, "3"); // ensures span wrapper exists
});

// ==== INSERT IMAGE ====
imageInput.addEventListener("change", (e)=>{
  const file = e.target.files?.[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    document.execCommand("insertImage", false, reader.result);
  };
  reader.readAsDataURL(file);
  imageInput.value = "";
});

// ==== TABLE / SHAPES ====
insertTableBtn.addEventListener("click", ()=>{
  const r = +prompt("Rows?", "2") || 2;
  const c = +prompt("Columns?", "2") || 2;
  let html = `<table style="border-collapse:collapse;width:100%;margin:8px 0">`;
  for(let i=0;i<r;i++){
    html += "<tr>";
    for(let j=0;j<c;j++){
      html += `<td style="border:1px solid #ccc;padding:6px">Cell</td>`;
    }
    html += "</tr>";
  }
  html += "</table>";
  insertHTML(html);
});
insertRectBtn.addEventListener("click", ()=> insertHTML(`<div style="width:160px;height:90px;border:2px solid #666;border-radius:6px;margin:8px auto;"></div>`));
insertCircleBtn.addEventListener("click", ()=> insertHTML(`<div style="width:100px;height:100px;border:2px solid #666;border-radius:50%;margin:8px auto;"></div>`));

function insertHTML(html){
  const sel = window.getSelection();
  if(!sel || !sel.rangeCount) { sheet.focus(); return; }
  const range = sel.getRangeAt(0);
  const el = document.createElement("div");
  el.innerHTML = html;
  const frag = document.createDocumentFragment();
  let node;
  while((node = el.firstChild)) frag.appendChild(node);
  range.deleteContents();
  range.insertNode(frag);
  range.collapse(false);
}

// ==== DRAWING OVERLAY ====
let drawing = false, drawEnabled = false, last={x:0,y:0};
function fitCanvas(){
  const rect = sheet.getBoundingClientRect();
  const wrap = document.querySelector(".sheet-wrap").getBoundingClientRect();
  const left = (wrap.width - rect.width)/2;
  canvas.style.left = `calc(50% - ${rect.width/2}px)`;
  canvas.style.top = `${rect.top - wrap.top}px`;
  canvas.width = rect.width; canvas.height = rect.height;
}
window.addEventListener("resize", fitCanvas);
fitCanvas();

drawToggle.addEventListener("click", ()=>{
  drawEnabled = !drawEnabled;
  canvas.classList.toggle("active", drawEnabled);
});
canvas.addEventListener("mousedown", e => { drawing=true; last=getPos(e); });
canvas.addEventListener("mousemove", e => {
  if(!drawing) return;
  const p=getPos(e);
  ctx.lineWidth=2; ctx.lineCap="round"; ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--fg');
  ctx.beginPath(); ctx.moveTo(last.x,last.y); ctx.lineTo(p.x,p.y); ctx.stroke();
  last=p;
});
["mouseup","mouseleave"].forEach(ev=>canvas.addEventListener(ev, ()=> drawing=false));
clearDraw.addEventListener("click", ()=> ctx.clearRect(0,0,canvas.width,canvas.height));
insertDrawing.addEventListener("click", ()=>{
  const url = canvas.toDataURL("image/png");
  if(url) document.execCommand("insertImage", false, url);
});

function getPos(e){
  const b = canvas.getBoundingClientRect();
  return { x: e.clientX - b.left, y: e.clientY - b.top };
}

// ==== FIND / REPLACE ====
findBtn.addEventListener("click", ()=>{
  const q = prompt("Find:");
  if(!q) return;
  const sel = window.getSelection();
  const range = document.createRange();
  const treeWalker = document.createTreeWalker(sheet, NodeFilter.SHOW_TEXT);
  let found = false, node;
  while(node = treeWalker.nextNode()){
    const idx = node.nodeValue.toLowerCase().indexOf(q.toLowerCase());
    if(idx>-1){
      range.setStart(node, idx);
      range.setEnd(node, idx+q.length);
      sel.removeAllRanges(); sel.addRange(range);
      found = true; break;
    }
  }
  if(!found) alert("Not found");
});
replaceBtn.addEventListener("click", ()=>{
  const q = prompt("Find:");
  if(!q) return;
  const r = prompt("Replace with:", "");
  if(r===null) return;
  sheet.innerHTML = sheet.innerHTML.replaceAll(
    new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), "gi"), r
  );
});

// ==== EXPORT ====
exportPDF.addEventListener("click", ()=>{
  const opt = { margin: 10, filename: `${fileNameEl.value||"Document"}.pdf`, html2canvas: {scale:2}, jsPDF: {unit:'mm', format:'a4', orientation:'portrait'} };
  html2pdf().set(opt).from(sheet).save();
});
exportDOCX.addEventListener("click", ()=>{
  const page = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileNameEl.value}</title></head><body>${sheet.innerHTML}</body></html>`;
  const blob = window.htmlDocx.asBlob(page);
  downloadBlob(blob, `${fileNameEl.value||"Document"}.docx`);
});
exportTXT.addEventListener("click", ()=>{
  const blob = new Blob([sheet.innerText], {type:"text/plain;charset=utf-8"});
  downloadBlob(blob, `${fileNameEl.value||"Document"}.txt`);
});
function downloadBlob(blob, filename){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  URL.revokeObjectURL(a.href);
}

// ==== AI PANEL TOGGLE ====
aiToggle.addEventListener("click", ()=> aiPane.classList.toggle("closed"));
aiClose.addEventListener("click", ()=> aiPane.classList.add("closed"));

// ==== AI: RUN ====
aiRun.addEventListener("click", async ()=>{
  const mode = aiMode.value;
  const text = aiInput.value.trim() || sheet.innerText.trim();
  if(!text){ aiOutput.textContent = "No text to process."; return; }

  aiOutput.textContent = "Working…";
  try{
    const res = await fetch(BACKEND_URL, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ text, mode })
    });
    const data = await res.json();
    if(res.ok && data.output){
      aiOutput.textContent = data.output;
      pushTopic({ title:`${mode}: ${short(text)}`, body:data.output, mode, ts:Date.now() });
    }else{
      aiOutput.textContent = "Error: " + (data.detail ? JSON.stringify(data.detail) : res.statusText);
    }
  }catch(err){
    aiOutput.textContent = "Network error.";
  }
});

// ==== AI → INSERT / REPLACE ====
insertAtCursorBtn.addEventListener("click", ()=> insertHTML(escapeHtml(aiOutput.textContent)));
replaceSelectionBtn.addEventListener("click", ()=>{
  const sel = window.getSelection();
  if(!sel || !sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  range.insertNode(document.createTextNode(aiOutput.textContent));
});
replaceAllBtn.addEventListener("click", ()=> sheet.innerText = aiOutput.textContent);

// ==== TOPICS (LOCAL STORAGE) ====
function loadTopics(){
  const items = JSON.parse(localStorage.getItem("ai_topics")||"[]");
  topicsEl.innerHTML = "";
  items.slice().reverse().forEach((t,i)=>{
    const li = document.createElement("li");
    li.textContent = t.title;
    li.title = new Date(t.ts).toLocaleString();
    li.addEventListener("click", ()=> { aiPane.classList.remove("closed"); aiOutput.textContent = t.body; aiMode.value=t.mode; });
    topicsEl.appendChild(li);
  });
}
function pushTopic(t){
  const items = JSON.parse(localStorage.getItem("ai_topics")||"[]");
  items.push(t);
  localStorage.setItem("ai_topics", JSON.stringify(items));
  loadTopics();
}
clearHistoryBtn.addEventListener("click", ()=>{
  if(confirm("Clear all topics?")){
    localStorage.removeItem("ai_topics");
    loadTopics();
  }
});
document.getElementById("saveTopic").addEventListener("click", ()=>{
  if(!aiOutput.textContent) return;
  pushTopic({ title: `${aiMode.value}: ${short(aiOutput.textContent)}`, body: aiOutput.textContent, mode: aiMode.value, ts: Date.now() });
});
loadTopics();

// ==== HELPERS ====
function short(s){ return s.length>48 ? s.slice(0,48)+"…" : s; }
function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str; 
  return div.innerHTML.replace(/\n/g,"<br>");
}

// Initial focus
sheet.focus();
