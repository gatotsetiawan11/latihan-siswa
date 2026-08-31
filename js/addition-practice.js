(() => {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const subjectCode = params.get("subject");
  const topicCode = params.get("topic");
  const stageNumber = Number(params.get("stage"));
  const levelNumber = Number(params.get("level"));
  const levelId = params.get("id");

  const loginMode = sessionStorage.getItem("login_mode");
  const sessionToken = sessionStorage.getItem("student_session_token");

  const practiceLevel = document.getElementById("practiceLevel");
  const backButton = document.getElementById("backButton");
  const loadingScreen = document.getElementById("loadingScreen");
  const gameScreen = document.getElementById("gameScreen");
  const resultScreen = document.getElementById("resultScreen");
  const board = document.getElementById("additionBoard");
  const questionProgress = document.getElementById("questionProgress");
  const liveCorrect = document.getElementById("liveCorrect");
  const timerText = document.getElementById("timerText");
  const feedbackText = document.getElementById("feedbackText");
  const instructionText = document.getElementById("instructionText");

  const resultIcon = document.getElementById("resultIcon");
  const resultTitle = document.getElementById("resultTitle");
  const resultMessage = document.getElementById("resultMessage");
  const resultAccuracy = document.getElementById("resultAccuracy");
  const resultCorrect = document.getElementById("resultCorrect");
  const resultWrong = document.getElementById("resultWrong");
  const resultTimeout = document.getElementById("resultTimeout");
  const bestScoreBox = document.getElementById("bestScoreBox");
  const retryButton = document.getElementById("retryButton");
  const continueButton = document.getElementById("continueButton");

  let levelData = null;
  let questions = [];
  let answers = [];
  let questionIndex = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let timeoutCount = 0;

  let state = null;
  let hiddenInput = null;
  let finalEditor = null;
  let advanceTimer = null;
  let questionStartedAt = 0;
  let deadline = 0;
  let timerHandle = null;
  let questionLocked = false;

  backButton.addEventListener("click", goBack);
  continueButton.addEventListener("click", goBack);
  retryButton.addEventListener("click", () => window.location.reload());
  board.addEventListener("pointerdown", () => focusInput());

  initialize();

  async function initialize() {
    if (!subjectCode || topicCode !== "addition" || !Number.isInteger(stageNumber) || stageNumber < 1 || !Number.isInteger(levelNumber) || levelNumber < 1 || !levelId) {
      goBack();
      return;
    }

    const sessionOk = await checkSession();
    if (!sessionOk) return;

    if (loginMode === "student") {
      const accessOk = await checkAccess();
      if (!accessOk) {
        loadingScreen.textContent = "Level masih terkunci.";
        return;
      }
    }

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
      const { data, error } = await window.db.rpc("student_can_access_addition_level", {
        p_token: sessionToken,
        p_level_id: levelId
      });
      if (error) throw error;
      return data === true;
    } catch (error) {
      console.error("Access error:", error);
      return false;
    }
  }

  async function loadLevel() {
    try {
      const { data, error } = await window.db
        .from("levels")
        .select("id, level_number, name, time_limit_seconds, question_count, passing_score, config")
        .eq("id", levelId)
        .eq("level_number", levelNumber)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      if (!data?.config || data.config.exercise_type !== "column_addition") {
        throw new Error("Jenis latihan bukan penjumlahan bersusun.");
      }

      levelData = data;
      practiceLevel.textContent = `Tingkat ${stageNumber} • ${levelData.name}`;
      instructionText.textContent = "Mulai dari satuan. Digit benar bergerak otomatis ke kiri. Carry muncul otomatis di atas kolom berikutnya. Jika kolom terakhir menghasilkan dua digit, tulis dua digit lengkap.";

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
      console.error("Load addition practice error:", error);
      loadingScreen.textContent = "Tidak dapat menyiapkan latihan penjumlahan.";
    }
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function digits3(value) {
    return [Math.floor(value / 100) % 10, Math.floor(value / 10) % 10, value % 10];
  }

  function analyze(a, b) {
    const ad = digits3(a);
    const bd = digits3(b);
    let carry = 0;
    let carryCount = 0;
    const columns = [];

    for (let pos = 2; pos >= 0; pos--) {
      const raw = ad[pos] + bd[pos] + carry;
      const digit = raw % 10;
      const carryOut = Math.floor(raw / 10);
      if (carryOut) carryCount++;
      columns.push({ pos, raw, digit, carryIn: carry, carryOut });
      carry = carryOut;
    }

    return {
      columns,
      carryCount,
      finalCarry: carry,
      answer: a + b
    };
  }

  function validForStage(a, b) {
    const info = analyze(a, b);
    const bIs2Digits = b < 100;
    const finalCarry = info.answer >= 1000;

    if (stageNumber === 1) return bIs2Digits && info.carryCount === 0;
    if (stageNumber === 2) return !bIs2Digits && info.carryCount === 0;
    if (stageNumber === 3) return bIs2Digits && info.carryCount >= 1;
    if (stageNumber === 4) return !bIs2Digits && info.carryCount === 1;
    if (stageNumber === 5) return !bIs2Digits && info.carryCount >= 2 && !finalCarry;
    return !bIs2Digits && info.carryCount >= 1;
  }

  function makeQuestion() {
    for (let attempt = 0; attempt < 7000; attempt++) {
      const a = randomInt(100, 999);
      const b = (stageNumber === 1 || stageNumber === 3)
        ? randomInt(10, 99)
        : randomInt(100, 999);

      if (validForStage(a, b)) {
        return { a, b, ...analyze(a, b) };
      }
    }

    const fallback = stageNumber <= 3
      ? { a: 368, b: 47 }
      : { a: 786, b: 659 };
    return { ...fallback, ...analyze(fallback.a, fallback.b) };
  }

  function buildQuestionSet(total) {
    const result = [];
    const seen = new Set();
    let guard = 0;

    while (result.length < total && guard < total * 100) {
      guard++;
      const q = makeQuestion();
      const key = `${q.a}+${q.b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(q);
    }

    while (result.length < total) result.push(makeQuestion());
    return result;
  }

  function startQuestion() {
    clearQuestionTimers();
    questionLocked = false;
    finalEditor = null;
    hiddenInput = null;
    feedbackText.textContent = "";
    feedbackText.className = "addition-feedback";

    const question = questions[questionIndex];
    questionProgress.textContent = `${questionIndex + 1} / ${questions.length}`;
    liveCorrect.textContent = String(correctCount);

    state = {
      step: 0,
      answerChars: ["", "", "", ""],
      done: false,
      question
    };

    renderBoard(question);
    questionStartedAt = Date.now();
    deadline = questionStartedAt + Number(levelData.time_limit_seconds) * 1000;
    updateTimer();
    timerHandle = setInterval(updateTimer, 250);
    focusInput();
  }

  function clearQuestionTimers() {
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

  function cell(text, col, row, className = "math-cell") {
    const el = document.createElement("div");
    el.className = className;
    el.textContent = text ?? "";
    el.style.gridColumn = String(col);
    el.style.gridRow = String(row);
    return el;
  }

  function renderBoard(question) {
    board.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "addition-grid";

    const aText = String(question.a).padStart(3, "0");
    const bText = String(question.b).padStart(3, " ");

    for (let i = 0; i < 3; i++) {
      grid.appendChild(cell(aText[i], 3 + i, 2));
      grid.appendChild(cell(bText[i] === " " ? "" : bText[i], 3 + i, 3));
    }

    const operator = document.createElement("div");
    operator.className = "operator";
    operator.textContent = "+";
    grid.appendChild(operator);

    const line = document.createElement("div");
    line.className = "sum-line";
    grid.appendChild(line);

    for (let i = 0; i < 4; i++) {
      const carry = cell("", 2 + i, 1, "carry-cell");
      carry.dataset.carryIndex = String(i);
      grid.appendChild(carry);
    }

    const shell = document.createElement("div");
    shell.className = "result-shell";
    for (let i = 0; i < 4; i++) {
      const slot = document.createElement("div");
      slot.className = "result-slot";
      slot.dataset.slot = String(i);
      shell.appendChild(slot);
    }
    grid.appendChild(shell);

    hiddenInput = document.createElement("input");
    hiddenInput.className = "hidden-input";
    hiddenInput.type = "text";
    hiddenInput.inputMode = "numeric";
    hiddenInput.autocomplete = "off";
    hiddenInput.maxLength = 1;
    hiddenInput.setAttribute("aria-label", "Jawaban digit aktif");
    hiddenInput.addEventListener("input", handleDigitInput);
    grid.appendChild(hiddenInput);

    board.appendChild(grid);
    updateVisuals();
  }

  function resultSlotForStep(step) {
    return 3 - step;
  }

  function updateVisuals() {
    const slots = board.querySelectorAll(".result-slot");
    slots.forEach((slot, index) => {
      slot.textContent = state.answerChars[index] || "";
      slot.classList.remove("active", "bad");
    });

    if (!state.done && !finalEditor) {
      const active = board.querySelector(`[data-slot="${resultSlotForStep(state.step)}"]`);
      if (active) active.classList.add("active");
    }
  }

  function showCarry(targetResultIndex, value) {
    const target = board.querySelector(`[data-carry-index="${targetResultIndex}"]`);
    if (target) target.textContent = value ? String(value) : "";
  }

  function focusInput() {
    if (questionLocked || state?.done) return;
    const target = finalEditor || hiddenInput;
    if (!target) return;
    setTimeout(() => {
      try { target.focus({ preventScroll: true }); }
      catch (_) { target.focus(); }
    }, 25);
  }

  function markWrong(slotIndex, text) {
    const slot = board.querySelector(`[data-slot="${slotIndex}"]`);
    if (slot) {
      slot.classList.add("bad");
      setTimeout(() => slot.classList.remove("bad"), 350);
    }
    feedbackText.textContent = text;
    feedbackText.className = "addition-feedback wrong";
  }

  function handleDigitInput() {
    if (!state || state.done || questionLocked || finalEditor) return;
    const value = hiddenInput.value.replace(/\D/g, "").slice(-1);
    hiddenInput.value = "";
    if (!value) return;

    const stepInfo = state.question.columns[state.step];
    const slotIndex = resultSlotForStep(state.step);

    if (state.step === 2 && stepInfo.raw >= 10) {
      openFinalPairEditor(stepInfo.raw, value);
      return;
    }

    if (Number(value) !== stepInfo.digit) {
      markWrong(slotIndex, "Digit belum tepat.");
      return;
    }

    feedbackText.textContent = "";
    feedbackText.className = "addition-feedback";
    state.answerChars[slotIndex] = value;

    if (stepInfo.carryOut && state.step < 2) {
      showCarry(slotIndex - 1, stepInfo.carryOut);
    }

    updateVisuals();
    advanceTimer = setTimeout(() => {
      state.step++;
      if (state.step >= 3) finishCorrectQuestion();
      else {
        updateVisuals();
        focusInput();
      }
    }, 300);
  }

  function openFinalPairEditor(expected, firstDigit) {
    if (finalEditor) return;
    const grid = board.querySelector(".addition-grid");
    finalEditor = document.createElement("input");
    finalEditor.type = "text";
    finalEditor.inputMode = "numeric";
    finalEditor.autocomplete = "off";
    finalEditor.maxLength = 2;
    finalEditor.className = "final-pair-editor";
    finalEditor.style.gridColumn = "2 / 4";
    finalEditor.dataset.expected = String(expected);
    finalEditor.setAttribute("aria-label", "Tulis dua digit hasil kolom terakhir");
    finalEditor.addEventListener("input", validateFinalPair);
    grid.appendChild(finalEditor);
    finalEditor.value = firstDigit || "";
    updateVisuals();
    focusInput();
    validateFinalPair();
  }

  function validateFinalPair() {
    if (!finalEditor || questionLocked) return;
    finalEditor.value = finalEditor.value.replace(/\D/g, "").slice(0, 2);
    finalEditor.classList.remove("bad");
    const expected = finalEditor.dataset.expected;
    if (finalEditor.value.length < expected.length) return;

    if (finalEditor.value !== expected) {
      finalEditor.classList.add("bad");
      feedbackText.textContent = "Hasil kolom terakhir belum tepat.";
      feedbackText.className = "addition-feedback wrong";
      finalEditor.select();
      return;
    }

    feedbackText.textContent = "";
    feedbackText.className = "addition-feedback";
    const chars = expected.split("");
    state.answerChars[0] = chars[0];
    state.answerChars[1] = chars[1];
    finalEditor.remove();
    finalEditor = null;
    updateVisuals();
    advanceTimer = setTimeout(finishCorrectQuestion, 320);
  }

  function finishCorrectQuestion() {
    if (questionLocked) return;
    questionLocked = true;
    state.done = true;
    clearQuestionTimers();

    const q = state.question;
    const responseTime = Math.max(0, Date.now() - questionStartedAt);
    answers.push({ a: q.a, b: q.b, user_answer: q.answer, response_time_ms: responseTime });
    correctCount++;
    liveCorrect.textContent = String(correctCount);

    const answerText = String(q.answer).padStart(4, " ");
    state.answerChars = answerText.split("").map(ch => ch === " " ? "" : ch);
    updateVisuals();
    feedbackText.textContent = `✓ Benar, hasilnya ${q.answer}`;
    feedbackText.className = "addition-feedback correct";

    advanceTimer = setTimeout(nextQuestion, 800);
  }

  function submitTimeout() {
    if (questionLocked) return;
    questionLocked = true;
    clearQuestionTimers();

    const q = state.question;
    const responseTime = Math.max(0, Date.now() - questionStartedAt);
    answers.push({ a: q.a, b: q.b, user_answer: "", response_time_ms: responseTime });
    timeoutCount++;
    feedbackText.textContent = `Waktu habis • Jawaban ${q.answer}`;
    feedbackText.className = "addition-feedback timeout";

    advanceTimer = setTimeout(nextQuestion, 900);
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
    clearQuestionTimers();
    gameScreen.classList.add("hidden");
    loadingScreen.classList.remove("hidden");
    loadingScreen.textContent = "Menghitung hasil...";

    if (loginMode === "guest") {
      showResult(calculateGuestResult());
      return;
    }

    try {
      const { data, error } = await window.db.rpc("submit_addition_practice", {
        p_token: sessionToken,
        p_level_id: levelId,
        p_answers: answers
      });
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Hasil tidak diterima server.");
      showResult(data[0]);
    } catch (error) {
      console.error("Submit addition error:", error);
      loadingScreen.innerHTML = "<strong>Hasil belum dapat disimpan.</strong><br><br>Periksa apakah SQL Penjumlahan Bersusun V2 sudah dijalankan di Supabase.";
    }
  }

  function calculateGuestResult() {
    const total = questions.length;
    const accuracy = total ? (correctCount / total) * 100 : 0;
    return {
      correct_count: correctCount,
      wrong_count: wrongCount,
      timeout_count: timeoutCount,
      accuracy,
      passed: accuracy >= Number(levelData.passing_score),
      best_score: null,
      attempts: null
    };
  }

  function showResult(result) {
    loadingScreen.classList.add("hidden");
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

    if (loginMode === "student" && result.best_score !== null && result.best_score !== undefined) {
      bestScoreBox.classList.remove("hidden");
      bestScoreBox.textContent = `Skor terbaik: ${Number(result.best_score).toFixed(0)}% • Percobaan ${result.attempts}`;
    } else {
      bestScoreBox.classList.add("hidden");
    }
  }

  function goBack() {
    if (subjectCode && topicCode && stageNumber) {
      window.location.href = `./levels.html?subject=${encodeURIComponent(subjectCode)}&topic=${encodeURIComponent(topicCode)}&stage=${encodeURIComponent(stageNumber)}`;
      return;
    }
    window.location.href = "./dashboard.html";
  }
})();
