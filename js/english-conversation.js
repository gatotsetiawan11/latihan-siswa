document.addEventListener("DOMContentLoaded", init);

const $ = id => document.getElementById(id);
const loadingScreen = $("loadingScreen");
const startScreen = $("startScreen");
const conversationScreen = $("conversationScreen");
const resultScreen = $("resultScreen");
const startButton = $("startButton");
const cameraVideo = $("cameraVideo");
const detectCanvas = $("detectCanvas");
const cameraOverlay = $("cameraOverlay");
const avatar = $("avatar");
const assistantText = $("assistantText");
const heardBox = $("heardBox");
const heardText = $("heardText");
const feedbackBox = $("feedbackBox");
const speechStatus = $("speechStatus");
const turnText = $("turnText");
const levelText = $("levelText");
const lessonTitle = $("lessonTitle");
const startLessonTitle = $("startLessonTitle");
const lessonDescription = $("lessonDescription");
const assistantNameText = $("assistantNameText");
const assistantLabel = $("assistantLabel");
const turnLimitText = $("turnLimitText");
const answerInput = $("answerInput");
const sendButton = $("sendButton");
const exitButton = $("exitButton");
const retryButton = $("retryButton");
const backButton = $("backButton");

const params = new URLSearchParams(location.search);
const subjectCode = params.get("subject") || "english";
const topicCode = params.get("topic") || "english_conversation";
const stageNumber = Number(params.get("stage") || 1);
let levelNumber = Number(params.get("level") || 1);
let levelId = params.get("id");

const loginMode = sessionStorage.getItem("login_mode");
const sessionToken = sessionStorage.getItem("student_session_token");
const adminToken = sessionStorage.getItem("admin_session_token");

const isStudentMode = loginMode === "student" && Boolean(sessionToken);
const isAdminDemoMode = !isStudentMode && Boolean(adminToken);

const DEFAULT_MAX_TURNS = 4; // Greeting A: salam -> nama -> umur -> selesai
const DEFAULT_PASSING_SCORE = 70;
const PERSON_CONFIDENCE = 0.58;
const PERSON_STABLE_MS = 1400;
const PERSON_LOST_RESET_MS = 7000;

let stream = null;
let detector = null;
let detectTimer = null;
let personFirstSeen = 0;
let lastPersonSeen = 0;
let greetingStarted = false;
let recognition = null;
let recognitionActive = false;
let busy = false;
let submitInFlight = false;
let turn = 0;
let relevantCount = 0;
let lastAssistantText = "";
let history = [];
let startedAt = 0;
let currentAudio = null;
let levelData = null;
let conversationConfig = {};
let maxTurns = DEFAULT_MAX_TURNS;
let passingScore = DEFAULT_PASSING_SCORE;
let assistantName = "Alex";
let speechLanguage = "en-US";
let speechRate = 0.9;
let speechPitch = 1.08;

let listeningRetryTimer = null;
let listenArmTimer = null;
let lastFinalTranscript = "";

/* Salam adaptif waktu */
function getTimeGreeting(date = new Date()) {
  const h = date.getHours();
  if (h >= 4 && h < 11) return "Good morning";
  if (h >= 11 && h < 15) return "Good afternoon";
  if (h >= 15 && h < 18) return "Good evening";
  return "Hello";
}

function pause(ms) { return new Promise(r => setTimeout(r, ms)); }
function clearListeningTimers() {
  clearTimeout(listeningRetryTimer); clearTimeout(listenArmTimer);
  listeningRetryTimer = null; listenArmTimer = null;
}

/* ===================== INIT ===================== */
async function init() {
  if (topicCode !== "english_conversation") return goBack();
  if (!isStudentMode && !isAdminDemoMode) {
    loadingScreen.textContent = "Conversation AI tersedia untuk siswa login atau admin dalam Demo Mode.";
    return;
  }
  if (!(await checkSession())) return;

  if (!levelId && isAdminDemoMode) {
    levelId = await resolveAdminDemoLevelId();
    if (!levelId) { loadingScreen.textContent = "Level belum ditemukan."; return; }
  }
  if (!levelId) { loadingScreen.textContent = "Level tidak valid."; return; }
  if (isStudentMode && !(await checkAccess())) { loadingScreen.textContent = "Level masih terkunci."; return; }
  if (!(await loadLevelConfiguration())) return;
  applyLevelConfiguration();
  ensureVoicesLoaded();
  setupRecognition();

  startButton.addEventListener("click", startClassroomMode);
  sendButton.addEventListener("click", () => submitUserAnswer(answerInput.value));
  answerInput.addEventListener("keydown", e => { if (e.key === "Enter") submitUserAnswer(answerInput.value); });
  exitButton.addEventListener("click", goBack);
  backButton.addEventListener("click", goBack);
  retryButton.addEventListener("click", () => location.reload());

  const badge = $("demoBadge");
  if (isAdminDemoMode && badge) badge.classList.remove("hidden");

  loadingScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
}

async function checkSession() {
  try {
    if (isStudentMode) {
      const { data, error } = await window.db.rpc("get_student_session", { p_token: sessionToken });
      if (error || !data || data.length === 0) throw error || new Error("session");
      return true;
    }
    if (isAdminDemoMode) {
      const { data, error } = await window.db.rpc("validate_english_admin_session", { p_token: adminToken });
      if (error || data !== true) throw error || new Error("admin");
      return true;
    }
    return false;
  } catch {
    if (isAdminDemoMode) { loadingScreen.textContent = "Sesi admin tidak valid. Login ulang."; return false; }
    sessionStorage.clear(); location.href = "./index.html"; return false;
  }
}

async function resolveAdminDemoLevelId() {
  try {
    const { data: topics } = await window.db.from("topics").select("id").eq("code", "english_conversation").eq("is_active", true).limit(1).maybeSingle();
    if (!topics) return null;
    const { data: stages } = await window.db.from("stages").select("id").eq("topic_id", topics.id).eq("stage_number", stageNumber).eq("is_active", true).limit(1).maybeSingle();
    if (!stages) return null;
    const { data: lvl } = await window.db.from("levels").select("id").eq("stage_id", stages.id).eq("level_number", levelNumber).eq("is_active", true).limit(1).maybeSingle();
    return lvl?.id || null;
  } catch { return null; }
}

async function loadLevelConfiguration() {
  try {
    const { data, error } = await window.db.from("levels")
      .select("id,level_number,name,question_count,passing_score,config")
      .eq("id", levelId).eq("is_active", true).single();
    if (error || !data) throw error || new Error("level");
    levelData = data;
    levelNumber = Number(data.level_number) || levelNumber;
    conversationConfig = data.config && typeof data.config === "object" ? data.config : {};
    maxTurns = clampInteger(conversationConfig.max_turns ?? data.question_count, DEFAULT_MAX_TURNS, 1, 20);
    passingScore = clampInteger(data.passing_score, DEFAULT_PASSING_SCORE, 0, 100);
    assistantName = cleanShort(conversationConfig.assistant_name || "Alex", 40) || "Alex";
    speechLanguage = cleanShort(conversationConfig.speech_language || "en-US", 20) || "en-US";
    speechRate = clampNumber(conversationConfig.speech_rate, 0.9, 0.55, 1.3);
    speechPitch = clampNumber(conversationConfig.speech_pitch, 1.08, 0.7, 1.45);
    return true;
  } catch { loadingScreen.textContent = "Konfigurasi level tidak dapat dimuat."; return false; }
}

function applyLevelConfiguration() {
  const title = cleanShort(levelData?.name || "English Conversation", 80);
  lessonTitle.textContent = title;
  startLessonTitle.textContent = title;
  levelText.textContent = `Tingkat ${stageNumber} • Level ${levelNumber}`;
  lessonDescription.textContent = cleanShort(conversationConfig.description || "Sapa, perkenalkan diri, dan sebut umur dalam Bahasa Inggris.", 280);
  const demo = $("demoBadge");
  if (isAdminDemoMode && demo) demo.classList.remove("hidden");
  assistantNameText.textContent = assistantName;
  assistantLabel.textContent = assistantName.toUpperCase();
  turnLimitText.textContent = String(maxTurns);
  const rtl = $("resultTurnLimit");
  if (rtl) rtl.textContent = String(maxTurns);
  document.title = `${title} • English Conversation AI`;
}

async function checkAccess() {
  try {
    const { data } = await window.db.rpc("student_can_access_english_conversation_level", { p_token: sessionToken, p_level_id: levelId });
    return data === true;
  } catch { return false; }
}

async function startClassroomMode() {
  startButton.disabled = true;
  startButton.textContent = "Menyiapkan...";
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 360 } },
      audio: true,
    });
    cameraVideo.srcObject = stream;
    await cameraVideo.play();
    startScreen.classList.add("hidden");
    conversationScreen.classList.remove("hidden");
    startedAt = Date.now();
    setState("waiting", "Waiting");
    assistantText.textContent = "Stand in front of the camera.";
    speechStatus.textContent = "Waiting for someone...";
    const span = cameraOverlay?.querySelector("span");
    if (span) span.textContent = "Waiting for someone...";
    await loadPersonDetector();
    beginPresenceLoop();
  } catch {
    startButton.disabled = false; startButton.textContent = "Coba Lagi";
    alert("Kamera/mikrofon belum dapat digunakan. Periksa izin browser TV.");
  }
}

async function loadPersonDetector() { detector = await window.cocoSsd.load({ base: "lite_mobilenet_v2" }); }
function beginPresenceLoop() { clearInterval(detectTimer); detectTimer = setInterval(runPresenceDetection, 850); }

async function runPresenceDetection() {
  if (!detector || cameraVideo.readyState < 2) return;
  try {
    const predictions = await detector.detect(cameraVideo, 6, 0.45);
    const person = predictions.filter(p => p.class === "person" && p.score >= PERSON_CONFIDENCE).sort((a,b)=>b.score-a.score)[0];
    drawPersonBox(person);
    const now = Date.now();
    const span = cameraOverlay?.querySelector("span");
    if (person) {
      lastPersonSeen = now;
      if (!personFirstSeen) personFirstSeen = now;
      if (span) span.textContent = greetingStarted ? "Person detected" : "Hello!";
      if (!greetingStarted && now - personFirstSeen >= PERSON_STABLE_MS) { greetingStarted = true; await beginGreeting(); }
    } else {
      personFirstSeen = 0;
      if (span) {
        span.textContent = greetingStarted ? "Conversation active" : "Waiting for someone...";
        if (greetingStarted && lastPersonSeen && now - lastPersonSeen > PERSON_LOST_RESET_MS) span.textContent = "Come back into the frame";
      }
    }
  } catch {}
}

function drawPersonBox(person) {
  const ctx = detectCanvas.getContext("2d");
  ctx.clearRect(0, 0, detectCanvas.width, detectCanvas.height);
  if (!person || !cameraVideo.videoWidth || !cameraVideo.videoHeight) return;
  const sx = detectCanvas.width / cameraVideo.videoWidth, sy = detectCanvas.height / cameraVideo.videoHeight;
  const [x,y,w,h] = person.bbox;
  const mx = detectCanvas.width - (x + w) * sx;
  ctx.strokeStyle = "rgba(255,255,255,.92)"; ctx.lineWidth = 3; ctx.setLineDash([8,5]);
  ctx.strokeRect(mx, y*sy, w*sx, h*sy); ctx.setLineDash([]);
}

/* ---- Greeting berlapis + jeda lalu tanya nama ---- */
async function beginGreeting() {
  greetingStarted = true; busy = true;
  setState("speaking", "Speaking");
  speechStatus.textContent = "Greeting...";

  const timeGreeting = getTimeGreeting();
  const firstLine = `${timeGreeting}!`;
  assistantText.textContent = firstLine;
  history.push({ role: "assistant", text: firstLine });
  await speakAI(firstLine, "happy");
  await pause(1100);

  const secondLine = `Hello ${timeGreeting.toLowerCase()}! And what is your name?`;
  assistantText.textContent = secondLine;
  history.push({ role: "assistant", text: secondLine });
  await speakAI(secondLine, "happy");

  busy = false; lastAssistantText = secondLine;
  beginAutoListening();
}

function setupRecognition() {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Rec) { recognition = null; return; }
  recognition = new Rec();
  recognition.lang = speechLanguage;
  recognition.interimResults = true; recognition.continuous = false; recognition.maxAlternatives = 1;
  recognition.onstart = () => { recognitionActive = true; setState("listening","Listening"); speechStatus.textContent = "Listening... Please answer in English."; };
  recognition.onresult = e => {
    let finalText = ""; let raw = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      raw += e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
    }
    const live = clean(raw);
    if (live) { heardText.textContent = live; heardBox.classList.remove("hidden"); }
    const final = clean(finalText);
    if (final) { lastFinalTranscript = final; answerInput.value = final; heardText.textContent = final; heardBox.classList.remove("hidden"); }
  };
  recognition.onerror = ev => {
    console.warn("Speech:", ev.error); recognitionActive = false;
    if (!busy && greetingStarted && turn < maxTurns) {
      speechStatus.textContent = "Saya tidak menangkap suara. Coba lagi...";
      clearListeningTimers(); listeningRetryTimer = setTimeout(beginAutoListening, 1100);
    }
  };
  recognition.onend = () => {
    recognitionActive = false;
    const t = clean(answerInput.value || lastFinalTranscript);
    if (t && !busy && !submitInFlight) submitUserAnswer(t);
    else if (!busy && greetingStarted && turn < maxTurns) { clearListeningTimers(); listeningRetryTimer = setTimeout(beginAutoListening, 550); }
  };
}

function beginAutoListening() {
  if (busy || submitInFlight || turn >= maxTurns || !greetingStarted) return;
  clearListeningTimers();
  if (!recognition) { setState("waiting","Type fallback"); speechStatus.textContent = "Speech Recognition tidak tersedia. Gunakan fallback ketik."; return; }
  setState("listening","Listening"); speechStatus.textContent = "Listening... Please answer in English.";
  listenArmTimer = setTimeout(() => { try { recognition.start(); } catch { clearListeningTimers(); listeningRetryTimer = setTimeout(beginAutoListening, 700); } }, 80);
}

async function submitUserAnswer(rawText) {
  const userText = clean(rawText);
  if (!userText || busy || submitInFlight || turn >= maxTurns) return;
  submitInFlight = true; busy = true; clearListeningTimers();
  answerInput.value = "";
  if (recognitionActive) { try { recognition.stop(); } catch {} }
  heardText.textContent = userText; heardBox.classList.remove("hidden");
  setState("thinking","Thinking"); speechStatus.textContent = "Thinking...";
  history.push({ role: "user", text: userText });
  try {
    const data = await callConversationAI({ action:"reply", level_id: levelId, stage_number: stageNumber, level_number: levelNumber, turn: turn+1, user_text: userText, history: history.slice(-10) });
    turn += 1; turnText.textContent = String(turn);
    if (data.relevant === true) relevantCount += 1;
    renderFeedback(data);
    lastAssistantText = clean(data.assistant_text);
    if (lastAssistantText) { assistantText.textContent = lastAssistantText; history.push({ role:"assistant", text: lastAssistantText }); }
    const shouldEnd = data.should_end === true || turn >= maxTurns;
    if (lastAssistantText) await speakAI(lastAssistantText, data.emotion || "happy");
    if (shouldEnd) { submitInFlight = false; await finishConversation(data); }
    else { submitInFlight = false; busy = false; heardText.textContent = ""; heardBox.classList.add("hidden"); setTimeout(beginAutoListening, 450); }
  } catch { submitInFlight = false; busy = false; heardText.textContent = userText; heardBox.classList.remove("hidden"); speechStatus.textContent = "AI belum merespons. Mendengarkan lagi..."; setTimeout(beginAutoListening, 1000); }
}

function renderFeedback(data) {
  const fb = clean(data.feedback), corr = clean(data.correction), idn = clean(data.indonesian_support);
  if (!fb && !corr && !idn) { feedbackBox.classList.add("hidden"); return; }
  const parts = [];
  if (fb) parts.push(`<strong>Feedback:</strong> ${escapeHtml(fb)}`);
  if (corr) parts.push(`<strong>Better sentence:</strong> ${escapeHtml(corr)}`);
  if (idn) parts.push(`<div style="margin-top:8px;color:#5d6a7d"><strong>🇮🇩 Bantuan:</strong> ${escapeHtml(idn)}</div>`);
  feedbackBox.innerHTML = parts.join("<br>"); feedbackBox.classList.remove("hidden");
}

async function callConversationAI(payload) {
  const auth = isAdminDemoMode ? { admin_token: adminToken, access_mode:"admin_demo" } : { student_token: sessionToken, access_mode:"student" };
  const { data, error } = await window.db.functions.invoke("english-conversation", { body: { ...payload, ...auth } });
  if (error) throw error;
  if (!data || data.ok !== true) throw new Error(data?.error || "AI error");
  return data;
}

/* ============ SUARA: JENNY (server) dulu -> fallback browser ============ */
async function speakAI(text, emotion = "neutral") {
  if (!text) return;
  setState("speaking","Speaking");
  speechStatus.textContent = "Speaking...";
  if (currentAudio) { try { currentAudio.pause(); } catch {} currentAudio = null; }
  const ok = await tryPlayJenny(text).catch(() => false);
  if (!ok) await speakBrowser(text, emotion);
}

async function tryPlayJenny(text) {
  const auth = isAdminDemoMode ? { admin_token: adminToken, access_mode:"admin_demo" } : { student_token: sessionToken, access_mode:"student" };
  const { data, error } = await window.db.functions.invoke("english-conversation", { body: { action:"tts", text, ...auth } });
  if (error || !data || data.ok !== true || !data.audio_base64) return false;
  const bin = atob(data.audio_base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], { type: data.mime || "audio/mpeg" });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  currentAudio = audio;
  return new Promise(resolve => {
    const t = setTimeout(() => { try { audio.pause(); } catch {}; resolve(false); }, 20000);
    audio.onended = () => { clearTimeout(t); URL.revokeObjectURL(url); resolve(true); };
    audio.onerror = () => { clearTimeout(t); URL.revokeObjectURL(url); resolve(false); };
    audio.play().catch(() => { clearTimeout(t); URL.revokeObjectURL(url); resolve(false); });
  });
}

function pickFemaleVoice() {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || !voices.length) return null;
  const name = v => v.name.toLowerCase(), lang = v => (v.lang||"").toLowerCase();
  const isEn = v => lang(v).startsWith("en") || /english/i.test(name(v));
  const f1 = voices.find(v => isEn(v) && /jenny|joanna|aria|salli|kendra|kimberly|google uk english female|zira|emma|olivia|sonia|libby|samantha|michelle|karen|victoria|allison|susan|female|woman|girl/i.test(name(v)));
  if (f1) return f1;
  const en = voices.filter(isEn);
  if (en.length) { const p = en.find(v => /google|natural|online|neural/i.test(name(v))); return p || en[0]; }
  return voices[0];
}

function ensureVoicesLoaded() {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.getVoices();
  if (typeof window.speechSynthesis.onvoiceschanged !== "function")
    window.speechSynthesis.onvoiceschanged = () => { try { pickFemaleVoice(); } catch {} };
}

function speakBrowser(text, emotion) {
  return new Promise(resolve => {
    if (!("speechSynthesis" in window) || !text) return resolve();
    try { speechSynthesis.cancel(); } catch {}
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickFemaleVoice();
    u.voice = voice || null; u.lang = voice ? voice.lang : speechLanguage;
    u.rate = Math.max(0.5, speechRate - 0.15);
    u.pitch = emotion === "celebrating" || emotion === "happy" ? Math.min(1.45,(speechPitch||1.08)+0.1) : (speechPitch||1.08)+0.02;
    u.volume = 1;
    let done = false;
    const finish = () => { if (done) return; done = true; u.onend=null; u.onerror=null; try { speechSynthesis.cancel(); } catch {} resolve(); };
    u.onend = finish; u.onerror = finish;
    speechSynthesis.speak(u); currentAudio = u;
    setTimeout(finish, Math.max(15000, text.length*140));
  });
}

function setState(name,label) {
  avatar.classList.remove("waiting","listening","thinking","speaking"); avatar.classList.add(name);
  const st = document.querySelector(".ec-state"); if (st) { st.classList.remove("waiting","listening","thinking","speaking"); st.classList.add(name); }
  const stx = $("stateText"); if (stx) stx.textContent = label;
}

async function finishConversation(lastData) {
  busy = true; setState("waiting","Finished"); speechStatus.textContent = "Conversation completed.";
  const score = Math.round((relevantCount / Math.max(1, maxTurns)) * 100);
  let saved = null;
  if (isStudentMode) {
    try {
      const { data } = await window.db.rpc("submit_english_conversation_session", { p_token: sessionToken, p_level_id: levelId, p_turn_count: turn, p_relevant_count: relevantCount, p_score: score, p_duration_seconds: Math.max(1, Math.round((Date.now()-startedAt)/1000)) });
      saved = Array.isArray(data) ? data[0] : data;
    } catch { saved = null; }
  } else { saved = { passed: score >= passingScore, demo_mode: true }; }
  stopMedia();
  setTimeout(() => showResult(score, saved, lastData), 500);
}

function showResult(score, saved, lastData) {
  conversationScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");
  const passed = typeof saved?.passed === "boolean" ? saved.passed : score >= passingScore;
  $("resultScore").textContent = `${score}%`;
  $("resultRelevant").textContent = `${relevantCount}/${maxTurns}`;
  $("resultTurns").textContent = String(turn);
  $("resultMessage").textContent = isAdminDemoMode ? "Demo admin selesai. Hasil tidak disimpan ke progres siswa." : passed ? "Percakapan selesai dengan baik." : `Skor belum mencapai target ${passingScore}%. Ulangi dan jawab lebih sesuai.`;
  $("resultFeedback").textContent = clean(lastData?.session_feedback) || "Gunakan salam, sebut nama, dan umur dengan benar.";
}

function stopMedia() {
  clearInterval(detectTimer); detectTimer = null;
  clearListeningTimers();
  if (recognitionActive) { try { recognition.stop(); } catch {} }
  if (currentAudio) { try { currentAudio.pause(); } catch {} }
  if ("speechSynthesis" in window) { try { speechSynthesis.cancel(); } catch {} }
  if (stream) stream.getTracks().forEach(t => t.stop());
}

/* helper */
function clampInteger(v,f,min,max){ const n=Number(v); if(!Number.isFinite(n)) return f; return Math.min(max,Math.max(min,Math.round(n))); }
function clampNumber(v,f,min,max){ const n=Number(v); if(!Number.isFinite(n)) return f; return Math.min(max,Math.max(min,n)); }
function cleanShort(v,m=120){ return String(v??"").replace(/\s+/g," ").trim().slice(0,m); }
function clean(v){ return String(v??"").replace(/\s+/g," ").trim().slice(0,240); }
function escapeHtml(v){ return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
function goBack(){ stopMedia(); location.href = `./levels.html?subject=${encodeURIComponent(subjectCode)}&topic=${encodeURIComponent(topicCode)}&stage=${encodeURIComponent(stageNumber)}`; }

window.addEventListener("beforeunload", stopMedia);
