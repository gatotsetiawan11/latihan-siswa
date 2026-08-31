document.addEventListener("DOMContentLoaded", initializeSubtractionPractice);

const q = id => document.getElementById(id);

const loadingScreen = q("loadingScreen");
const gameScreen = q("gameScreen");
const resultScreen = q("resultScreen");
const practiceLevel = q("practiceLevel");
const questionProgress = q("questionProgress");
const liveCorrect = q("liveCorrect");
const timerText = q("timerText");
const progressBar = q("progressBar");
const instructionTitle = q("instructionTitle");
const instructionText = q("instructionText");
const stepLabel = q("stepLabel");
const message = q("message");
const board = q("board");
const helpText = q("helpText");
const feedbackText = q("feedbackText");
const quitButton = q("quitButton");
const retryButton = q("retryButton");
const continueButton = q("continueButton");

const resultIcon = q("resultIcon");
const resultTitle = q("resultTitle");
const resultMessage = q("resultMessage");
const resultAccuracy = q("resultAccuracy");
const resultCorrect = q("resultCorrect");
const resultWrong = q("resultWrong");
const resultTimeout = q("resultTimeout");
const resultAverage = q("resultAverage");
const bestScoreBox = q("bestScoreBox");

const params = new URLSearchParams(window.location.search);
const subjectCode = params.get("subject");
const topicCode = params.get("topic");
const stageNumber = Number(params.get("stage"));
const levelNumber = Number(params.get("level"));
const levelId = params.get("id");

const loginMode = sessionStorage.getItem("login_mode");
const sessionToken = sessionStorage.getItem("student_session_token");

let levelData = null;
let questions = [];
let answers = [];
let questionIndex = 0;
let correctCount = 0;
let wrongCount = 0;
let timeoutCount = 0;
let questionStartedAt = 0;
let deadline = 0;
let timerHandle = null;
let advanceTimer = null;
let questionLocked = false;
let state = null;
let activeInput = null;

async function initializeSubtractionPractice() {
  if (!subjectCode || topicCode !== "subtraction" || !levelId ||
      !Number.isInteger(stageNumber) || stageNumber < 1 ||
      !Number.isInteger(levelNumber) || levelNumber < 1) {
    goBack();
    return;
  }

  if (!(await checkSession())) return;

  if (loginMode === "student") {
    const allowed = await checkAccess();
    if (!allowed) {
      loadingScreen.textContent = "Level masih terkunci. Selesaikan level sebelumnya.";
      return;
    }
  }

  quitButton.addEventListener("click", goBack);
  continueButton.addEventListener("click", goBack);
  retryButton.addEventListener("click", () => window.location.reload());

  await loadLevel();
}

async function checkSession() {
  if (loginMode === "guest") return true;
  if (loginMode !== "student" || !sessionToken) {
    sessionStorage.clear();
    window.location.href = "./index.html";
    return false;
  }

  try {
    const { data, error } = await window.db.rpc("get_student_session", { p_token: sessionToken });
    if (error || !data || data.length === 0) {
      sessionStorage.clear();
      window.location.href = "./index.html";
      return false;
    }
    return true;
  } catch (error) {
    console.error("Session error:", error);
    sessionStorage.clear();
    window.location.href = "./index.html";
    return false;
  }
}

async function checkAccess() {
  try {
    const { data, error } = await window.db.rpc("student_can_access_subtraction_level", {
      p_token: sessionToken,
      p_level_id: levelId
    });
    if (error) throw error;
    return data === true;
  } catch (error) {
    console.error("Subtraction access error:", error);
    return false;
  }
}

async function loadLevel() {
  try {
    const { data, error } = await window.db
      .from("levels")
      .select("id,level_number,name,time_limit_seconds,question_count,passing_score,config")
      .eq("id", levelId)
      .eq("level_number", levelNumber)
      .eq("is_active", true)
      .single();

    if (error) throw error;
    if (!data?.config || data.config.exercise_type !== "column_subtraction") {
      throw new Error("Jenis latihan bukan pengurangan bersusun.");
    }

    levelData = data;
    practiceLevel.textContent = `Tingkat ${stageNumber} • ${levelData.name}`;
    instructionTitle.textContent = "Mulai dari satuan.";
    instructionText.textContent =
      "Jika digit atas tidak cukup, klik digit pada bilangan atas yang memberi pinjaman. Setelah benar, isi hasil satu digit dan posisi aktif bergerak otomatis ke kiri.";

    questions = buildQuestionSet(Number(levelData.question_count) || 10);
    answers = [];
    questionIndex = 0;
    correctCount = 0;
    wrongCount = 0;
    timeoutCount = 0;

    loadingScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    startQuestion();
  } catch (error) {
    console.error("Load subtraction:", error);
    loadingScreen.textContent = "Tidak dapat menyiapkan latihan pengurangan.";
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function padDigits(value) {
  return String(value).padStart(4, " ").split("").map(ch => ch === " " ? null : Number(ch));
}

function analyzeBorrow(a, b) {
  const top = padDigits(a);
  const bottom = padDigits(b);
  const working = [...top];
  let borrowCount = 0;
  let acrossZero = false;
  let maxDistance = 0;

  for (let col = 3; col >= 0; col--) {
    if (working[col] === null) continue;
    const sub = bottom[col] ?? 0;
    if (working[col] < sub) {
      let source = null;
      for (let i = col - 1; i >= 0; i--) {
        if (working[i] !== null && working[i] > 0) {
          source = i;
          break;
        }
      }
      if (source === null) return null;
      borrowCount++;
      const distance = col - source;
      maxDistance = Math.max(maxDistance, distance);
      if (distance > 1) acrossZero = true;

      working[source] -= 1;
      for (let i = source + 1; i <= col; i++) {
        const original = working[i] ?? 0;
        working[i] = i < col ? original + 9 : original + 10;
      }
    }
  }

  return { borrowCount, acrossZero, maxDistance };
}

function validForStage(a, b) {
  if (a <= b) return false;
  const info = analyzeBorrow(a, b);
  if (!info) return false;
  const b2 = b < 100;

  if (stageNumber === 1) return b2 && info.borrowCount === 0;
  if (stageNumber === 2) return !b2 && info.borrowCount === 0;
  if (stageNumber === 3) return info.borrowCount === 1 && !info.acrossZero;
  if (stageNumber === 4) return info.borrowCount >= 2 && !info.acrossZero;
  if (stageNumber === 5) return info.acrossZero;
  return info.borrowCount >= 1;
}

function makeQuestion() {
  for (let attempt = 0; attempt < 12000; attempt++) {
    const a = randomInt(100, 999);
    let b;
    if (stageNumber === 1) b = randomInt(10, 99);
    else b = randomInt(10, Math.min(999, a - 1));

    if (b >= a) continue;
    if (validForStage(a, b)) return { a, b, answer: a - b };
  }

  const fallback =
    stageNumber === 1 ? {a:386,b:42} :
    stageNumber === 2 ? {a:864,b:321} :
    stageNumber === 3 ? {a:432,b:178} :
    stageNumber === 4 ? {a:652,b:487} :
    stageNumber === 5 ? {a:403,b:178} :
    {a:700,b:286};

  return {...fallback, answer: fallback.a - fallback.b};
}

function buildQuestionSet(total) {
  const result = [];
  const seen = new Set();
  let guard = 0;
  while (result.length < total && guard < total * 250) {
    guard++;
    const item = makeQuestion();
    const key = `${item.a}-${item.b}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  while (result.length < total) result.push(makeQuestion());
  return result;
}

function startQuestion() {
  clearTimers();
  questionLocked = false;
  feedbackText.textContent = "";
  feedbackText.className = "sub-feedback";
  activeInput = null;

  const question = questions[questionIndex];
  questionProgress.textContent = `${questionIndex + 1} / ${questions.length}`;
  liveCorrect.textContent = String(correctCount);
  progressBar.style.width = `${(questionIndex / questions.length) * 100}%`;

  const top = padDigits(question.a);
  const bottom = padDigits(question.b);

  state = {
    question,
    originalTop: top,
    bottom,
    workingTop: [...top],
    result: [null,null,null,null],
    borrowMarks: {},
    currentCol: 3,
    waitingBorrow: false,
    sourceCol: null,
    done: false
  };

  renderBoard();
  questionStartedAt = Date.now();
  deadline = questionStartedAt + Number(levelData.time_limit_seconds) * 1000;
  updateTimer();
  timerHandle = setInterval(updateTimer, 250);
  advanceColumn();
}

function clearTimers() {
  clearTimeout(advanceTimer);
  clearInterval(timerHandle);
  advanceTimer = null;
  timerHandle = null;
}

function updateTimer() {
  if (questionLocked || !deadline) return;
  const remainingMs = Math.max(0, deadline - Date.now());
  timerText.textContent = `${Math.ceil(remainingMs / 1000)} dtk`;
  if (remainingMs <= 0) submitTimeout();
}

function renderBoard() {
  board.innerHTML = "";

  const overlay = document.createElement("div");
  overlay.className = "sub-borrow-overlay";
  overlay.id = "borrowOverlay";
  board.appendChild(overlay);

  const grid = document.createElement("div");
  grid.className = "sub-grid";

  for (let i=0;i<4;i++) {
    const top = document.createElement("div");
    top.className = "sub-cell sub-top";
    top.dataset.col = String(i);
    top.style.gridColumn = String(i+1);
    top.style.gridRow = "1";
    top.textContent = state.originalTop[i] === null ? "" : String(state.originalTop[i]);
    top.addEventListener("click", () => handleBorrowClick(i, top));
    grid.appendChild(top);

    const bottom = document.createElement("div");
    bottom.className = "sub-cell";
    bottom.style.gridColumn = String(i+1);
    bottom.style.gridRow = "2";
    bottom.textContent = state.bottom[i] === null ? "" : String(state.bottom[i]);
    grid.appendChild(bottom);
  }

  const operator = document.createElement("div");
  operator.className = "sub-operator";
  operator.textContent = "−";
  grid.appendChild(operator);

  const line = document.createElement("div");
  line.className = "sub-line";
  grid.appendChild(line);

  const resultShell = document.createElement("div");
  resultShell.className = "sub-result-shell";
  for (let i=0;i<4;i++) {
    const slot = document.createElement("div");
    slot.className = "sub-result-slot";
    slot.dataset.slot = String(i);
    resultShell.appendChild(slot);
  }
  grid.appendChild(resultShell);

  board.appendChild(grid);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("sub-arrow");
  svg.setAttribute("viewBox","0 0 100 100");
  svg.setAttribute("preserveAspectRatio","none");
  svg.innerHTML = `<path id="subArrowPath"></path><polyline id="subArrowHead"></polyline>`;
  board.appendChild(svg);

  renderBorrowMarks();
  renderResult();
}

function renderBorrowMarks() {
  const overlay = q("borrowOverlay");
  if (!overlay) return;
  overlay.innerHTML = "";

  for (let i=0;i<4;i++) {
    const mark = document.createElement("div");
    mark.className = "sub-borrow-mark";
    const info = state.borrowMarks[i];
    if (info) {
      const old = document.createElement("span");
      old.className = "sub-old";
      old.textContent = String(info.old);
      mark.appendChild(old);

      const nw = document.createElement("span");
      nw.className = "sub-new";
      nw.textContent = String(info.new);
      mark.appendChild(nw);
    }
    overlay.appendChild(mark);
  }
}

function renderResult() {
  board.querySelectorAll(".sub-result-slot").forEach((slot, i) => {
    slot.textContent = state.result[i] === null ? "" : String(state.result[i]);
    slot.classList.toggle("correct", state.result[i] !== null);
    slot.classList.remove("active");
  });

  if (!state.done && !state.waitingBorrow && state.currentCol >= 0) {
    const slot = board.querySelector(`[data-slot="${state.currentCol}"]`);
    if (slot) slot.classList.add("active");
  }
}

function findBorrowSource(col) {
  for (let i=col-1;i>=0;i--) {
    const value = state.workingTop[i];
    if (value !== null && value > 0) return i;
  }
  return null;
}

function advanceColumn() {
  if (questionLocked || state.done) return;

  while (state.currentCol >= 0 && state.workingTop[state.currentCol] === null) {
    state.currentCol--;
  }

  if (state.currentCol < 0) {
    finishCorrectQuestion();
    return;
  }

  stepLabel.textContent = `LANGKAH ${4 - state.currentCol}`;
  const top = state.workingTop[state.currentCol];
  const bottom = state.bottom[state.currentCol] ?? 0;

  if (top < bottom) {
    state.waitingBorrow = true;
    state.sourceCol = findBorrowSource(state.currentCol);
    renderResult();

    if (state.sourceCol === null) {
      message.textContent = "Tidak ada digit yang dapat memberi pinjaman.";
      return;
    }

    const sourceEl = board.querySelector(`.sub-top[data-col="${state.sourceCol}"]`);
    if (sourceEl) sourceEl.classList.add("clickable");

    message.textContent =
      `${top} tidak cukup untuk dikurangi ${bottom}. Klik digit pada bilangan atas yang harus memberi pinjaman.`;

    helpText.textContent =
      state.sourceCol < state.currentCol - 1
        ? "Ada nol di antara kolom. Cari digit bernilai lebih dari 0 di sebelah kiri; sistem akan memperlihatkan rantai pinjamannya."
        : "Klik digit sebelah kiri yang memberi satu nilai tempat.";

    if (levelNumber <= 5) drawBorrowArrow(state.sourceCol, state.currentCol);
    else clearBorrowArrow();
    return;
  }

  state.waitingBorrow = false;
  state.sourceCol = null;
  clearBorrowArrow();
  board.querySelectorAll(".sub-top").forEach(el => el.classList.remove("clickable"));

  message.textContent = `Hitung ${top} − ${bottom}. Ketik satu digit hasil.`;
  helpText.textContent = "Setelah benar, posisi jawaban bergerak otomatis satu kolom ke kiri.";
  renderResult();
  openDigitInput();
}

function handleBorrowClick(col, element) {
  if (!state || !state.waitingBorrow || questionLocked) return;

  if (col !== state.sourceCol) {
    element.classList.remove("wrong");
    void element.offsetWidth;
    element.classList.add("wrong");

    const value = state.workingTop[col];
    if (value === 0) {
      message.textContent = "0 tidak dapat memberi pinjaman. Cari digit bernilai lebih dari 0 di sebelah kiri.";
    } else {
      message.textContent = "Belum tepat. Pilih digit sumber pinjaman pada bilangan atas.";
    }
    return;
  }

  performBorrow(col, state.currentCol);
  state.waitingBorrow = false;
  state.sourceCol = null;
  board.querySelectorAll(".sub-top").forEach(el => el.classList.remove("clickable"));
  clearBorrowArrow();
  renderBorrowMarks();
  renderResult();

  const top = state.workingTop[state.currentCol];
  const bottom = state.bottom[state.currentCol] ?? 0;
  message.textContent = `Benar. Sekarang kolom aktif menjadi ${top} − ${bottom}.`;
  helpText.textContent = "Angka lama dicoret merah. Gunakan nilai baru yang tampil di atasnya.";
  openDigitInput();
}

function performBorrow(source, target) {
  const sourceOld = state.workingTop[source];
  state.workingTop[source] = sourceOld - 1;
  state.borrowMarks[source] = { old: sourceOld, new: state.workingTop[source] };

  for (let i=source+1;i<=target;i++) {
    const old = state.workingTop[i] ?? 0;
    const next = i < target ? old + 9 : old + 10;
    state.workingTop[i] = next;
    state.borrowMarks[i] = { old, new: next };
  }
}

function openDigitInput() {
  closeDigitInput();
  if (questionLocked || state.waitingBorrow || state.currentCol < 0) return;

  const slot = board.querySelector(`[data-slot="${state.currentCol}"]`);
  if (!slot) return;

  const input = document.createElement("input");
  input.className = "sub-edit";
  input.type = "text";
  input.inputMode = "numeric";
  input.autocomplete = "off";
  input.maxLength = 1;
  input.setAttribute("aria-label","Jawaban digit aktif");

  const slotRect = slot.getBoundingClientRect();
  const boardRect = board.getBoundingClientRect();
  input.style.left = `${slotRect.left - boardRect.left + slotRect.width/2 - 27}px`;
  input.style.top = `${slotRect.top - boardRect.top + slotRect.height/2 - 29}px`;

  input.addEventListener("input", handleDigitInput);
  board.appendChild(input);
  activeInput = input;

  setTimeout(() => {
    try { input.focus({preventScroll:true}); }
    catch (_) { input.focus(); }
  }, 30);
}

function closeDigitInput() {
  if (activeInput) {
    activeInput.remove();
    activeInput = null;
  }
}

function handleDigitInput() {
  if (!activeInput || questionLocked || state.waitingBorrow) return;
  const raw = activeInput.value.replace(/\D/g,"").slice(-1);
  activeInput.value = "";
  if (!raw) return;

  const top = state.workingTop[state.currentCol];
  const bottom = state.bottom[state.currentCol] ?? 0;
  const expected = top - bottom;

  if (Number(raw) !== expected) {
    const slot = board.querySelector(`[data-slot="${state.currentCol}"]`);
    if (slot) {
      slot.classList.remove("bad");
      void slot.offsetWidth;
      slot.classList.add("bad");
    }
    feedbackText.textContent = `${top} − ${bottom} belum benar. Coba lagi.`;
    feedbackText.className = "sub-feedback wrong";
    return;
  }

  feedbackText.textContent = "";
  feedbackText.className = "sub-feedback";
  state.result[state.currentCol] = Number(raw);
  closeDigitInput();
  renderResult();

  advanceTimer = setTimeout(() => {
    state.currentCol--;
    advanceColumn();
  }, 300);
}

function drawBorrowArrow(sourceCol, targetCol) {
  const source = board.querySelector(`.sub-top[data-col="${sourceCol}"]`);
  const target = board.querySelector(`.sub-top[data-col="${targetCol}"]`);
  const path = q("subArrowPath");
  const head = q("subArrowHead");
  if (!source || !target || !path || !head) return;

  const br = board.getBoundingClientRect();
  const sr = source.getBoundingClientRect();
  const tr = target.getBoundingClientRect();

  const sx = ((sr.left + sr.width/2 - br.left) / br.width) * 100;
  const sy = ((sr.top + sr.height*.33 - br.top) / br.height) * 100;
  const tx = ((tr.left + tr.width/2 - br.left) / br.width) * 100;
  const ty = ((tr.top + tr.height*.33 - br.top) / br.height) * 100;
  const mx = (sx + tx)/2;
  const cy = Math.min(sy,ty) - 10;

  path.setAttribute("d", `M ${sx} ${sy} Q ${mx} ${cy} ${tx} ${ty}`);
  const angle = Math.atan2(ty-cy, tx-mx);
  const size = 2.5;
  const a1 = angle + Math.PI*.82;
  const a2 = angle - Math.PI*.82;
  head.setAttribute("points",
    `${tx + Math.cos(a1)*size},${ty + Math.sin(a1)*size} ${tx},${ty} ${tx + Math.cos(a2)*size},${ty + Math.sin(a2)*size}`
  );
}

function clearBorrowArrow() {
  const path = q("subArrowPath");
  const head = q("subArrowHead");
  if (path) path.setAttribute("d","");
  if (head) head.setAttribute("points","");
}

function finishCorrectQuestion() {
  if (questionLocked) return;
  state.done = true;
  questionLocked = true;
  clearTimers();
  closeDigitInput();

  const responseMs = Math.max(0, Date.now() - questionStartedAt);
  const answer = state.question.answer;
  const typed = state.result.filter(v => v !== null).join("");
  answers.push({
    a: state.question.a,
    b: state.question.b,
    user_answer: String(Number(typed)),
    response_time_ms: responseMs
  });

  correctCount++;
  liveCorrect.textContent = String(correctCount);
  feedbackText.textContent = "Benar.";
  feedbackText.className = "sub-feedback ok";
  progressBar.style.width = `${((questionIndex + 1) / questions.length) * 100}%`;

  setTimeout(nextQuestion, 650);
}

function submitTimeout() {
  if (questionLocked) return;
  questionLocked = true;
  clearTimers();
  closeDigitInput();

  const responseMs = Math.max(0, Date.now() - questionStartedAt);
  answers.push({
    a: state.question.a,
    b: state.question.b,
    user_answer: "",
    response_time_ms: responseMs
  });
  timeoutCount++;
  feedbackText.textContent = `Waktu habis. Jawaban ${state.question.answer}.`;
  feedbackText.className = "sub-feedback wrong";
  setTimeout(nextQuestion, 850);
}

function nextQuestion() {
  questionIndex = answers.length;
  if (questionIndex >= questions.length) {
    finishPractice();
    return;
  }
  startQuestion();
}

async function finishPractice() {
  clearTimers();
  gameScreen.classList.add("hidden");
  loadingScreen.classList.remove("hidden");
  loadingScreen.textContent = "Menghitung hasil...";

  if (loginMode === "guest") {
    const result = calculateGuestResult();
    showResult(result);
    return;
  }

  try {
    const { data, error } = await window.db.rpc("submit_subtraction_practice", {
      p_token: sessionToken,
      p_level_id: levelId,
      p_answers: answers
    });
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Hasil tidak diterima server.");
    showResult(data[0]);
  } catch (error) {
    console.error("Submit subtraction:", error);
    loadingScreen.textContent = "Hasil belum dapat disimpan. Muat ulang dan coba lagi.";
  }
}

function calculateGuestResult() {
  const total = answers.length;
  const correct = answers.filter(x => String(x.user_answer) !== "" &&
    Number(x.user_answer) === Number(x.a) - Number(x.b)).length;
  const timeout = answers.filter(x => String(x.user_answer) === "").length;
  const wrong = Math.max(0, total - correct - timeout);
  const values = answers.map(x => Number(x.response_time_ms)).filter(Number.isFinite);
  const average = values.length ? Math.round(values.reduce((a,b)=>a+b,0)/values.length) : null;
  const accuracy = total ? correct / total * 100 : 0;
  return {
    correct_count: correct,
    wrong_count: wrong,
    timeout_count: timeout,
    accuracy,
    average_response_time_ms: average,
    passed: accuracy >= Number(levelData.passing_score),
    best_score: null,
    attempts: null
  };
}

function showResult(result) {
  loadingScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");

  const accuracy = Number(result.accuracy || 0);
  const passed = result.passed === true;

  resultIcon.textContent = passed ? "✓" : "↻";
  resultTitle.textContent = passed ? "Level Lulus!" : "Belum Lulus";
  resultMessage.textContent = passed
    ? (loginMode === "student" ? "Level berikutnya sekarang dapat dibuka." : "Hasil Guest tidak disimpan.")
    : `Diperlukan minimal ${levelData.passing_score}% untuk membuka level berikutnya.`;

  resultAccuracy.textContent = `${accuracy.toFixed(0)}%`;
  resultCorrect.textContent = String(result.correct_count || 0);
  resultWrong.textContent = String(result.wrong_count || 0);
  resultTimeout.textContent = String(result.timeout_count || 0);
  resultAverage.textContent = result.average_response_time_ms == null
    ? "-"
    : `${(Number(result.average_response_time_ms)/1000).toFixed(1)} dtk`;

  if (loginMode === "student" && result.best_score != null) {
    bestScoreBox.classList.remove("hidden");
    bestScoreBox.textContent = `Skor terbaik: ${Number(result.best_score).toFixed(0)}% • Percobaan ${result.attempts}`;
  } else {
    bestScoreBox.classList.add("hidden");
  }
}

function goBack() {
  window.location.href =
    `./levels.html?subject=${encodeURIComponent(subjectCode || "mathematics")}` +
    `&topic=${encodeURIComponent(topicCode || "subtraction")}` +
    `&stage=${encodeURIComponent(stageNumber || 1)}`;
}

window.addEventListener("resize", () => {
  if (state?.waitingBorrow && levelNumber <= 5 && state.sourceCol !== null) {
    drawBorrowArrow(state.sourceCol, state.currentCol);
  }
  if (activeInput && state && !state.waitingBorrow) openDigitInput();
});
