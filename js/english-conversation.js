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

const DEFAULT_MAX_TURNS = 4; // Mode A: salam -> nama -> umur -> selesai
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
let useServerTTS = false; // langsung pakai suara browser

let listeningRetryTimer = null;
let listenArmTimer = null;
let lastFinalTranscript = "";

/* ===== SALAM ADAPTIF WAKTU ===== */
function getTimeGreeting(date = new Date()) {
  const h = date.getHours();
  if (h >= 4 && h < 11) return "Good morning";
  if (h >= 11 && h < 15) return "Good afternoon";
  if (h >= 15 && h < 18) return "Good evening";
  return "Hello";
}

function clearListeningTimers() {
  clearTimeout(listeningRetryTimer);
  clearTimeout(listenArmTimer);
  listeningRetryTimer = null;
  listenArmTimer = null;
}

/* Jeda sederhana */
function pause(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function init() {
  if (topicCode !== "english_conversation") return goBack();

  if (!isStudentMode && !isAdminDemoMode) {
    loadingScreen.textContent =
      "Conversation AI tersedia untuk siswa login atau admin dalam Demo Mode.";
    return;
  }

  if (!(await checkSession())) return;

  if (!levelId && isAdminDemoMode) {
    levelId = await resolveAdminDemoLevelId();
    if (!levelId) {
      loadingScreen.textContent = "Level English Conversation belum ditemukan.";
      return;
    }
  }

  if (!levelId) {
    loadingScreen.textContent = "Level Conversation tidak valid.";
    return;
  }

  if (isStudentMode && !(await checkAccess())) {
    loadingScreen.textContent = "Level masih terkunci.";
    return;
  }

  if (!(await loadLevelConfiguration())) return;
  applyLevelConfiguration();

  ensureVoicesLoaded();

  setupRecognition();

  startButton.addEventListener("click", startClassroomMode);
  sendButton.addEventListener("click", () => submitUserAnswer(answerInput.value));
  answerInput.addEventListener("keydown", e => {
    if (e.key === "Enter") submitUserAnswer(answerInput.value);
  });
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
      const { data, error } = await window.db.rpc("get_student_session", {
        p_token: sessionToken,
      });
      if (error || !data || data.length === 0) throw error || new Error("student session");
      return true;
    }
    if (isAdminDemoMode) {
      const { data, error } = await window.db.rpc("validate_english_admin_session", {
        p_token: adminToken,
      });
      if (error || data !== true) throw error || new Error("admin session");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Conversation session:", error);
    if (isAdminDemoMode) {
      loadingScreen.textContent = "Sesi admin tidak valid. Login ulang sebagai admin.";
      return false;
    }
    sessionStorage.clear();
    location.href = "./index.html";
    return false;
  }
}

async function resolveAdminDemoLevelId() {
  try {
    const { data: topics, error: tErr } = await window.db
      .from("topics").select("id").eq("code", "english_conversation")
      .eq("is_active", true).limit(1);
    if (tErr || !topics || topics.length === 0) throw tErr || new Error("topic");

    const { data: stages, error: sErr } = await window.db
      .from("stages").select("id").eq("topic_id", topics[0].id)
      .eq("stage_number", stageNumber).eq("is_active", true).limit(1);
    if (sErr || !stages || stages.length === 0) throw sErr || new Error("stage");

    const { data: levels, error: lErr } = await window.db
      .from("levels").select("id").eq("stage_id", stages[0].id)
      .eq("level_number", levelNumber).eq("is_active", true).limit(1);
    if (lErr || !levels || levels.length === 0) throw lErr || new Error("level");

    return levels[0].id;
  } catch (error) {
    console.error("Resolve admin demo level:", error);
    return null;
  }
}

async function loadLevelConfiguration() {
  try {
    const { data, error } = await window.db
      .from("levels")
      .select("id,level_number,name,time_limit_seconds,question_count,passing_score,config")
      .eq("id", levelId)
      .eq("is_active", true)
      .single();
    if (error || !data) throw error || new Error("level");

    levelData = data;
    levelNumber = Number(data.level_number) || levelNumber;
    conversationConfig = data.config && typeof data.config === "object" ? data.config : {};

    maxTurns = clampInteger(
      conversationConfig.max_turns ?? conversationConfig.turn_count ?? data.question_count,
      DEFAULT_MAX_TURNS, 1, 20
    );
    passingScore = clampInteger(data.passing_score, DEFAULT_PASSING_SCORE, 0, 100);
    assistantName = cleanShort(conversationConfig.assistant_name || "Alex", 40) || "Alex";
    speechLanguage = cleanShort(conversationConfig.speech_language || "en-US", 20) || "en-US";
    speechRate = clampNumber(conversationConfig.speech_rate, 0.9, 0.6, 1.3);
    speechPitch = clampNumber(conversationConfig.speech_pitch, 1.08, 0.7, 1.4);
    useServerTTS = false; // selalu pakai suara browser
    return true;
  } catch (error) {
    console.error("Load conversation level:", error);
    loadingScreen.textContent = "Konfigurasi level Bahasa Inggris tidak dapat dimuat.";
    return false;
  }
}

function applyLevelConfiguration() {
  const title = cleanShort(levelData?.name || "English Conversation", 80);
  const description = cleanShort(
    conversationConfig.description || conversationConfig.instructions ||
    "Sapa dengan ramah, perkenalkan diri, dan sebut umur dalam Bahasa Inggris.",
    280
  );

  levelText.textContent = `Tingkat ${stageNumber} • Level ${levelNumber}`;
  lessonTitle.textContent = title;
  startLessonTitle.textContent = title;
  lessonDescription.textContent = description;
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
    const { data, error } = await window.db.rpc(
      "student_can_access_english_conversation_level",
      { p_token: sessionToken, p_level_id: levelId }
    );
    if (error) throw error;
    return data === true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function startClassroomMode() {
  startButton.disabled = true;
  startButton.textContent = "Menyiapkan kamera...";

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
  } catch (error) {
    console.error(error);
    startButton.disabled = false;
    startButton.textContent = "Coba Lagi";
    alert("Kamera atau mikrofon belum dapat digunakan. Periksa izin browser TV.");
  }
}

async function loadPersonDetector() {
  if (!window.cocoSsd) throw new Error("Person detector gagal dimuat.");
  detector = await window.cocoSsd.load({ base: "lite_mobilenet_v2" });
}

function beginPresenceLoop() {
  clearInterval(detectTimer);
  detectTimer = setInterval(runPresenceDetection, 850);
}

async function runPresenceDetection() {
  if (!detector || cameraVideo.readyState < 2) return;
  try {
    const predictions = await detector.detect(cameraVideo, 6, 0.45);
    const person = predictions
      .filter(p => p.class === "person" && p.score >= PERSON_CONFIDENCE)
      .sort((a, b) => b.score - a.score)[0];
    drawPersonBox(person);

    const now = Date.now();
    const span = cameraOverlay?.querySelector("span");
    if (person) {
      lastPersonSeen = now;
      if (!personFirstSeen) personFirstSeen = now;
      if (span) span.textContent = greetingStarted ? "Person detected" : "Hello!";
      if (!greetingStarted && now - personFirstSeen >= PERSON_STABLE_MS) {
        greetingStarted = true;
        await beginGreeting();
      }
    } else {
      personFirstSeen = 0;
      if (span) {
        span.textContent = greetingStarted ? "Conversation active" : "Waiting for someone...";
        if (greetingStarted && lastPersonSeen && now - lastPersonSeen > PERSON_LOST_RESET_MS) {
          span.textContent = "Come back into the frame";
        }
      }
    }
  } catch (error) {
    console.warn("Presence detection:", error);
  }
}

function drawPersonBox(person) {
  const ctx = detectCanvas.getContext("2d");
  const w = detectCanvas.width;
  const h = detectCanvas.height;
  ctx.clearRect(0, 0, w, h);
  if (!person || !cameraVideo.videoWidth || !cameraVideo.videoHeight) return;
  const sx = w / cameraVideo.videoWidth;
  const sy = h / cameraVideo.videoHeight;
  const [x, y, bw, bh] = person.bbox;
  const mx = w - (x + bw) * sx;
  ctx.strokeStyle = "rgba(255,255,255,.92)";
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 5]);
  ctx.strokeRect(mx, y * sy, bw * sx, bh * sy);
  ctx.setLineDash([]);
}

// Salam berlapis dengan jeda, lalu langsung tanya nama
async function beginGreeting() {
  greetingStarted = true;
  busy = true;
  setState("speaking", "Speaking");
  speechStatus.textContent = "Greeting...";

  const timeGreeting = getTimeGreeting(); // Good morning / Good afternoon / dll

  // 1) Salam waktu
  const firstLine = `${timeGreeting}!`;
  assistantText.textContent = firstLine;
  history.push({ role: "assistant", text: firstLine });
  await speakAI(firstLine, "happy");

  // jeda singkat seperti guru menunggu (tanpa menunggu jawaban sungguhan)
  await pause(1100);

  // 2) Ulang salam hangat + langsung tanya nama
  const secondLine = `Hello ${timeGreeting.toLowerCase()}! And what is your name?`;
  assistantText.textContent = secondLine;
  history.push({ role: "assistant", text: secondLine });
  await speakAI(secondLine, "happy");

  busy = false;
  lastAssistantText = secondLine;
  beginAutoListening();
}

function setupRecognition() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    recognition = null;
    return;
  }
  recognition = new Recognition();
  recognition.lang = speechLanguage;
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    recognitionActive = true;
    setState("listening", "Listening");
    speechStatus.textContent = "Listening... Please answer in English.";
  };

  recognition.onresult = event => {
    let transcript = "";
    let finalTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = event.results[i][0].transcript;
      transcript += text;
      if (event.results[i].isFinal) finalTranscript += text;
    }
    const liveTranscript = clean(transcript);
    if (liveTranscript) {
      heardText.textContent = liveTranscript;
      heardBox.classList.remove("hidden");
    }
    const finalText = clean(finalTranscript);
    if (finalText) {
      lastFinalTranscript = finalText;
      answerInput.value = finalText;
      heardText.textContent = finalText;
      heardBox.classList.remove("hidden");
    }
  };

  recognition.onerror = event => {
    console.warn("Speech recognition:", event.error);
    recognitionActive = false;
    if (event.error === "not-allowed") {
      setState("waiting", "Try again");
      speechStatus.textContent = "Izin Speech Recognition ditolak. Gunakan fallback ketik.";
    } else if (!busy && greetingStarted && turn < maxTurns) {
      speechStatus.textContent = "Saya tidak menangkap suara. Coba lagi...";
      clearListeningTimers();
      listeningRetryTimer = setTimeout(beginAutoListening, 1100);
    }
  };

  recognition.onend = () => {
    recognitionActive = false;
    const text = clean(answerInput.value || lastFinalTranscript);
    if (text && !busy && !submitInFlight) {
      submitUserAnswer(text);
    } else if (!busy && greetingStarted && turn < maxTurns) {
      clearListeningTimers();
      listeningRetryTimer = setTimeout(beginAutoListening, 550);
    }
  };
}

function beginAutoListening() {
  if (busy || submitInFlight || turn >= maxTurns || !greetingStarted) return;
  clearListeningTimers();
  if (!recognition) {
    setState("waiting", "Type fallback");
    speechStatus.textContent = "Speech Recognition tidak tersedia. Gunakan fallback ketik.";
    return;
  }
  setState("listening", "Listening");
  speechStatus.textContent = "Listening... Please answer in English.";
  listenArmTimer = setTimeout(() => {
    try {
      recognition.start();
    } catch {
      clearListeningTimers();
      listeningRetryTimer = setTimeout(beginAutoListening, 700);
    }
  }, 80);
}

async function submitUserAnswer(rawText) {
  const userText = clean(rawText);
  if (!userText || busy || submitInFlight || turn >= maxTurns) return;

  submitInFlight = true;
  busy = true;
  clearListeningTimers();
  answerInput.value = "";
  if (recognitionActive) {
    try { recognition.stop(); } catch {}
  }

  heardText.textContent = userText;
  heardBox.classList.remove("hidden");
  setState("thinking", "Thinking");
  speechStatus.textContent = "Thinking...";

  history.push({ role: "user", text: userText });

  try {
    const data = await callConversationAI({
      action: "reply",
      level_id: levelId,
      stage_number: stageNumber,
      level_number: levelNumber,
      turn: turn + 1,
      user_text: userText,
      history: history.slice(-10),
    });

    turn += 1;
    turnText.textContent = String(turn);
    if (data.relevant === true) relevantCount += 1;
    renderFeedback(data);

    lastAssistantText = clean(data.assistant_text);
    if (lastAssistantText) {
      assistantText.textContent = lastAssistantText;
      history.push({ role: "assistant", text: lastAssistantText });
    }

    const shouldEnd = data.should_end === true || turn >= maxTurns;

    if (lastAssistantText) {
      await speakAI(lastAssistantText, data.emotion || "happy");
    }

    if (shouldEnd) {
      submitInFlight = false;
      await finishConversation(data);
    } else {
      submitInFlight = false;
      busy = false;
      heardText.textContent = "";
      heardBox.classList.add("hidden");
      setTimeout(beginAutoListening, 450);
    }
  } catch (error) {
    console.error(error);
    submitInFlight = false;
    busy = false;
    heardText.textContent = userText;
    heardBox.classList.remove("hidden");
    speechStatus.textContent = "AI belum merespons. Saya akan mendengarkan lagi...";
    setTimeout(beginAutoListening, 1000);
  }
}

function renderFeedback(data) {
  const feedback = clean(data.feedback);
  const correction = clean(data.correction);
  if (!feedback && !correction && !clean(data.indonesian_support)) {
    feedbackBox.classList.add("hidden");
    return;
  }
  const parts = [];
  if (feedback) parts.push(`<strong>Feedback:</strong> ${escapeHtml(feedback)}`);
  if (correction) parts.push(`<strong>Better sentence:</strong> ${escapeHtml(correction)}`);
  if (clean(data.indonesian_support)) {
    parts.push(`<div style="margin-top:8px;color:#5d6a7d"><strong>🇮🇩 Bantuan:</strong> ${escapeHtml(data.indonesian_support)}</div>`);
  }
  feedbackBox.innerHTML = parts.join("<br>");
  feedbackBox.classList.remove("hidden");
}

async function callConversationAI(payload) {
  const authPayload = isAdminDemoMode
    ? { admin_token: adminToken, access_mode: "admin_demo" }
    : { student_token: sessionToken, access_mode: "student" };
  const { data, error } = await window.db.functions.invoke("english-conversation", {
    body: { ...payload, ...authPayload },
  });
  if (error) throw error;
  if (!data || data.ok !== true) throw new Error(data?.error || "AI error");
  return data;
}

/* ==================== SUARA BROWSER ==================== */
async function speakAI(text, emotion = "neutral") {
  if (!text) return;
  setState("speaking", "Speaking");
  speechStatus.textContent = "Speaking...";

  if (currentAudio) {
    try { currentAudio.pause(); } catch {}
    currentAudio = null;
  }

  await speakBrowser(text, emotion);
}

function pickFemaleVoice() {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const name = v => v.name.toLowerCase();
  const lang = v => (v.lang || "").toLowerCase();
  const isEn = v => lang(v).startsWith("en") || /english/i.test(name(v));

  const femaleYoung = voices.find(v =>
    isEn(v) && /junior|joanna|kendra|kimberly|salli|aria|jenny|libby|sonia|google uk english female|zira|ava|emma|olivia|sophia|microsoft aria|microsoft jenny/i.test(name(v))
  );
  if (femaleYoung) return femaleYoung;

  const femaleEnglish = voices.find(v =>
    isEn(v) && /female|woman|girl|samantha|victoria|karen|allison|susan|hazel/i.test(name(v))
  );
  if (femaleEnglish) return femaleEnglish;

  const enVoices = voices.filter(isEn);
  if (enVoices.length > 0) {
    const preferred = enVoices.find(v =>
      /google uk english|google us english|natural|online/i.test(name(v))
    );
    return preferred || enVoices[0];
  }

  return voices[0] || null;
}

function ensureVoicesLoaded() {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.getVoices();
  if (typeof window.speechSynthesis.onvoiceschanged !== "function") {
    window.speechSynthesis.onvoiceschanged = () => {
      try { pickFemaleVoice(); } catch {}
    };
  }
}

function speakBrowser(text, emotion) {
  return new Promise(resolve => {
    if (!("speechSynthesis" in window) || !text) return resolve();
    try { speechSynthesis.cancel(); } catch {}

    const u = new SpeechSynthesisUtterance(text);
    const voice = pickFemaleVoice();
    u.voice = voice || null;
    u.lang = voice ? voice.lang : speechLanguage;

    u.rate = Math.max(0.55, speechRate - 0.12);
    u.pitch = emotion === "celebrating" || emotion === "happy"
      ? Math.min(1.45, (speechPitch || 1.08) + 0.1)
      : (speechPitch || 1.08) + 0.03;
    u.volume = 1;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      u.onend = null;
      u.onerror = null;
      try { speechSynthesis.cancel(); } catch {}
      resolve();
    };
    u.onend = finish;
    u.onerror = finish;
    speechSynthesis.speak(u);
    currentAudio = u;
    setTimeout(finish, Math.max(15000, text.length * 140));
  });
}

function setState(name, label) {
  avatar.classList.remove("waiting", "listening", "thinking", "speaking");
  avatar.classList.add(name);
  const state = document.querySelector(".ec-state");
  if (state) {
    state.classList.remove("waiting", "listening", "thinking", "speaking");
    state.classList.add(name);
  }
  const stateText = $("stateText");
  if (stateText) stateText.textContent = label;
}

async function finishConversation(lastData) {
  busy = true;
  setState("waiting", "Finished");
  speechStatus.textContent = "Conversation completed.";

  const score = Math.round((relevantCount / Math.max(1, maxTurns)) * 100);
  let saved = null;

  if (isStudentMode) {
    try {
      const { data, error } = await window.db.rpc("submit_english_conversation_session", {
        p_token: sessionToken,
        p_level_id: levelId,
        p_turn_count: turn,
        p_relevant_count: relevantCount,
        p_score: score,
        p_duration_seconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
      });
      if (error) throw error;
      saved = Array.isArray(data) ? data[0] : data;
    } catch (error) {
      console.error("Save:", error);
    }
  } else {
    saved = { passed: score >= passingScore, demo_mode: true };
  }

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
  $("resultMessage").textContent = isAdminDemoMode
    ? "Demo admin selesai. Hasil ini tidak disimpan ke progres siswa."
    : passed
      ? "Percakapan selesai dengan baik."
      : `Skor belum mencapai target ${passingScore}%. Ulangi dan jawab lebih sesuai dengan pertanyaan.`;
  $("resultFeedback").textContent =
    clean(lastData?.session_feedback) || "Gunakan salam, sebut nama, dan umur dengan benar.";
}

function stopMedia() {
  clearInterval(detectTimer);
  detectTimer = null;
  clearListeningTimers();
  if (recognitionActive) {
    try { recognition.stop(); } catch {}
  }
  if (currentAudio) {
    try { currentAudio.pause(); } catch {}
  }
  if ("speechSynthesis" in window) {
    try { speechSynthesis.cancel(); } catch {}
  }
  if (stream) stream.getTracks().forEach(track => track.stop());
}

function clampInteger(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function cleanShort(value, maxLength = 120) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, 240);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function goBack() {
  stopMedia();
  location.href =
    `./levels.html?subject=${encodeURIComponent(subjectCode)}` +
    `&topic=${encodeURIComponent(topicCode)}` +
    `&stage=${encodeURIComponent(stageNumber)}`;
}

window.addEventListener("beforeunload", stopMedia);
