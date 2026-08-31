(() => {
  "use strict";

  const board = document.getElementById("additionBoard");
  const stageSelect = document.getElementById("stageSelect");
  const newQuestionButton = document.getElementById("newQuestionButton");
  const resetButton = document.getElementById("resetButton");
  const progressText = document.getElementById("progressText");
  const message = document.getElementById("message");

  const TOTAL = 10;
  let questionIndex = 0;
  let current = null;
  let state = null;
  let hiddenInput = null;
  let finalEditor = null;
  let advanceTimer = null;

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function digits3(n) {
    return [Math.floor(n / 100) % 10, Math.floor(n / 10) % 10, n % 10];
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
      const nextCarry = Math.floor(raw / 10);
      if (nextCarry) carryCount++;
      columns.push({ pos, raw, digit, carryIn: carry, carryOut: nextCarry });
      carry = nextCarry;
    }
    return { columns, finalCarry: carry, carryCount, answer: a + b };
  }

  function validForStage(stage, a, b) {
    const info = analyze(a, b);
    const bIs2 = b < 100;
    const hasFinalCarry = info.answer >= 1000;
    if (stage === 1) return bIs2 && info.carryCount === 0;
    if (stage === 2) return !bIs2 && info.carryCount === 0;
    if (stage === 3) return bIs2 && info.carryCount >= 1;
    if (stage === 4) return !bIs2 && info.carryCount === 1;
    if (stage === 5) return !bIs2 && info.carryCount >= 2 && !hasFinalCarry;
    return !bIs2 && info.carryCount >= 1;
  }

  function makeQuestion(stage) {
    for (let i = 0; i < 5000; i++) {
      const a = randomInt(100, 999);
      const b = (stage === 1 || stage === 3) ? randomInt(10, 99) : randomInt(100, 999);
      if (validForStage(stage, a, b)) return { a, b, ...analyze(a, b) };
    }
    return { a: 786, b: 659, ...analyze(786, 659) };
  }

  function cell(text, col, row, className = "math-cell") {
    const el = document.createElement("div");
    el.className = className;
    el.textContent = text === null || text === undefined ? "" : String(text);
    el.style.gridColumn = String(col);
    el.style.gridRow = String(row);
    return el;
  }

  function createBoard(question) {
    clearTimeout(advanceTimer);
    finalEditor = null;
    board.innerHTML = "";
    message.textContent = "";
    message.className = "";

    const grid = document.createElement("div");
    grid.className = "addition-grid";

    const aText = String(question.a).padStart(3, "0");
    const bText = String(question.b).padStart(3, " ");
    for (let i = 0; i < 3; i++) {
      grid.appendChild(cell(aText[i], 3 + i, 2));
      grid.appendChild(cell(bText[i] === " " ? "" : bText[i], 3 + i, 3));
    }

    const op = document.createElement("div");
    op.className = "operator";
    op.textContent = "+";
    grid.appendChild(op);

    const line = document.createElement("div");
    line.className = "sum-line";
    grid.appendChild(line);

    for (let resultIndex = 0; resultIndex < 4; resultIndex++) {
      const carry = cell("", 2 + resultIndex, 1, "carry-cell");
      carry.dataset.carryIndex = String(resultIndex);
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

    state = {
      step: 0,
      answerChars: ["", "", "", ""],
      done: false,
      question
    };

    updateVisuals();
    focusInput();
  }

  function resultSlotForStep(step) {
    return 3 - step;
  }

  function updateVisuals() {
    const slots = board.querySelectorAll(".result-slot");
    slots.forEach((slot, i) => {
      slot.textContent = state.answerChars[i] || "";
      slot.classList.toggle("done", Boolean(state.answerChars[i]));
      slot.classList.remove("active", "bad");
    });

    if (!state.done && !finalEditor) {
      const active = resultSlotForStep(state.step);
      const slot = board.querySelector(`[data-slot="${active}"]`);
      if (slot) slot.classList.add("active");
    }
  }

  function showCarry(targetResultIndex, value) {
    const carry = board.querySelector(`[data-carry-index="${targetResultIndex}"]`);
    if (carry) carry.textContent = value ? String(value) : "";
  }

  function focusInput() {
    if (state?.done) return;
    const target = finalEditor || hiddenInput;
    if (!target) return;
    setTimeout(() => {
      try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
    }, 30);
  }

  function shakeWrong(slotIndex) {
    const slot = board.querySelector(`[data-slot="${slotIndex}"]`);
    if (slot) {
      slot.classList.add("bad");
      setTimeout(() => slot.classList.remove("bad"), 350);
    }
  }

  function handleDigitInput() {
    if (!state || state.done || finalEditor) return;
    const value = hiddenInput.value.replace(/\D/g, "").slice(-1);
    hiddenInput.value = "";
    if (!value) return;

    const stepInfo = state.question.columns[state.step];
    const slotIndex = resultSlotForStep(state.step);

    // Kolom terakhir dengan hasil 2 digit: siswa harus menulis lengkap.
    if (state.step === 2 && stepInfo.raw >= 10) {
      openFinalPairEditor(stepInfo.raw);
      if (finalEditor) {
        finalEditor.value = value;
        validateFinalPair(false);
      }
      return;
    }

    if (Number(value) !== stepInfo.digit) {
      shakeWrong(slotIndex);
      message.textContent = "Digit belum tepat.";
      message.className = "wrong";
      return;
    }

    message.textContent = "";
    message.className = "";
    state.answerChars[slotIndex] = value;

    if (stepInfo.carryOut && state.step < 2) {
      showCarry(slotIndex - 1, stepInfo.carryOut);
    }

    updateVisuals();
    advanceTimer = setTimeout(() => {
      state.step++;
      if (state.step >= 3) finishQuestion();
      else {
        updateVisuals();
        focusInput();
      }
    }, 280);
  }

  function openFinalPairEditor(expected) {
    if (finalEditor) return;
    const grid = board.querySelector(".addition-grid");
    finalEditor = document.createElement("input");
    finalEditor.type = "text";
    finalEditor.inputMode = "numeric";
    finalEditor.autocomplete = "off";
    finalEditor.maxLength = 2;
    finalEditor.className = "final-pair-editor";
    // Menutup dua slot paling kiri karena hasil terakhir 10..19.
    finalEditor.style.gridColumn = "2 / 4";
    finalEditor.setAttribute("aria-label", "Tulis dua digit hasil kolom terakhir");
    finalEditor.dataset.expected = String(expected);
    finalEditor.addEventListener("input", () => validateFinalPair(true));
    grid.appendChild(finalEditor);
    updateVisuals();
    focusInput();
  }

  function validateFinalPair(fromInput) {
    if (!finalEditor) return;
    finalEditor.value = finalEditor.value.replace(/\D/g, "").slice(0, 2);
    finalEditor.classList.remove("bad");
    const expected = finalEditor.dataset.expected;
    if (finalEditor.value.length < expected.length) return;

    if (finalEditor.value !== expected) {
      finalEditor.classList.add("bad");
      message.textContent = "Hasil kolom terakhir belum tepat.";
      message.className = "wrong";
      if (fromInput) finalEditor.select();
      return;
    }

    message.textContent = "";
    message.className = "";
    const chars = expected.split("");
    state.answerChars[0] = chars[0];
    state.answerChars[1] = chars[1];
    finalEditor.remove();
    finalEditor = null;
    updateVisuals();
    advanceTimer = setTimeout(finishQuestion, 320);
  }

  function finishQuestion() {
    if (!state || state.done) return;
    state.done = true;
    const answer = String(state.question.answer).padStart(4, " ");
    state.answerChars = answer.split("").map(ch => ch === " " ? "" : ch);
    updateVisuals();
    message.textContent = `✓ Benar, hasilnya ${state.question.answer}`;
    message.className = "correct";
    setTimeout(() => {
      questionIndex = (questionIndex + 1) % TOTAL;
      startNewQuestion();
    }, 850);
  }

  function startNewQuestion() {
    const stage = Number(stageSelect.value);
    current = makeQuestion(stage);
    progressText.textContent = `Soal ${questionIndex + 1} / ${TOTAL}`;
    createBoard(current);
  }

  stageSelect.addEventListener("change", () => {
    questionIndex = 0;
    startNewQuestion();
  });
  newQuestionButton.addEventListener("click", () => {
    questionIndex = (questionIndex + 1) % TOTAL;
    startNewQuestion();
  });
  resetButton.addEventListener("click", () => createBoard(current));
  board.addEventListener("pointerdown", () => focusInput());

  startNewQuestion();
})();
