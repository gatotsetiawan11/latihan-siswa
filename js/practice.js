// ======================================================
// DOM
// ======================================================

const practiceLoading =
    document.getElementById(
        "practiceLoading"
    );

const practiceGame =
    document.getElementById(
        "practiceGame"
    );

const resultScreen =
    document.getElementById(
        "resultScreen"
    );

const practiceTopic =
    document.getElementById(
        "practiceTopic"
    );

const practiceLevel =
    document.getElementById(
        "practiceLevel"
    );

const questionProgress =
    document.getElementById(
        "questionProgress"
    );

const questionProgressBar =
    document.getElementById(
        "questionProgressBar"
    );

const liveCorrect =
    document.getElementById(
        "liveCorrect"
    );

const timerCircle =
    document.getElementById(
        "timerCircle"
    );

const timerValue =
    document.getElementById(
        "timerValue"
    );

const questionText =
    document.getElementById(
        "questionText"
    );

const answerInput =
    document.getElementById(
        "answerInput"
    );

const answerFeedback =
    document.getElementById(
        "answerFeedback"
    );

const quitButton =
    document.getElementById(
        "quitButton"
    );


// RESULT

const resultIcon =
    document.getElementById(
        "resultIcon"
    );

const resultTitle =
    document.getElementById(
        "resultTitle"
    );

const resultMessage =
    document.getElementById(
        "resultMessage"
    );

const resultAccuracy =
    document.getElementById(
        "resultAccuracy"
    );

const resultCorrect =
    document.getElementById(
        "resultCorrect"
    );

const resultWrong =
    document.getElementById(
        "resultWrong"
    );

const resultTimeout =
    document.getElementById(
        "resultTimeout"
    );

const resultAverage =
    document.getElementById(
        "resultAverage"
    );

const bestScoreBox =
    document.getElementById(
        "bestScoreBox"
    );

const retryButton =
    document.getElementById(
        "retryButton"
    );

const continueButton =
    document.getElementById(
        "continueButton"
    );


// ======================================================
// URL
// ======================================================

const params =
    new URLSearchParams(
        window.location.search
    );


const subjectCode =
    params.get("subject");

const topicCode =
    params.get("topic");

const stageNumber =
    Number(
        params.get("stage")
    );

const levelNumber =
    Number(
        params.get("level")
    );

const levelId =
    params.get("id");


// ======================================================
// SESSION
// ======================================================

const loginMode =
    sessionStorage.getItem(
        "login_mode"
    );

const sessionToken =
    sessionStorage.getItem(
        "student_session_token"
    );


// ======================================================
// STATE
// ======================================================

let levelData =
    null;


let questions =
    [];


let answers =
    [];


let currentQuestionIndex =
    0;


let correctCount =
    0;


let wrongCount =
    0;


let timeoutCount =
    0;


let timerInterval =
    null;


let questionStartedAt =
    0;


let questionDeadline =
    0;


let answerLocked =
    false;


let delayedSubmit =
    null;


// ======================================================
// START
// ======================================================

initialize();


// ======================================================
// INITIALIZE
// ======================================================

async function initialize() {

    const validSession =
        await checkSession();


    if (!validSession) {

        return;

    }


    if (
        !subjectCode ||
        !topicCode ||
        !levelId ||
        !Number.isInteger(stageNumber) ||
        !Number.isInteger(levelNumber)
    ) {

        goBackToLevels();

        return;

    }


    quitButton.addEventListener(
        "click",
        goBackToLevels
    );


    retryButton.addEventListener(
        "click",
        () => {

            window.location.reload();

        }
    );


    continueButton.addEventListener(
        "click",
        goBackToLevels
    );


    setupAnswerEvents();


    await loadLevel();

}


// ======================================================
// CHECK SESSION
// ======================================================

async function checkSession() {

    if (loginMode === "guest") {

        return true;

    }


    if (
        loginMode !== "student" ||
        !sessionToken
    ) {

        goLogin();

        return false;

    }


    try {

        const {
            data,
            error
        } =
            await window.db.rpc(
                "get_student_session",
                {
                    p_token:
                        sessionToken
                }
            );


        if (
            error ||
            !data ||
            data.length === 0
        ) {

            sessionStorage.clear();

            goLogin();

            return false;

        }


        return true;

    }

    catch (error) {

        console.error(error);

        sessionStorage.clear();

        goLogin();

        return false;

    }

}


// ======================================================
// LOAD LEVEL
// ======================================================

async function loadLevel() {

    try {

        const {
            data,
            error
        } =
            await window.db
                .from("levels")
                .select(`
                    id,
                    level_number,
                    name,
                    time_limit_seconds,
                    question_count,
                    passing_score,
                    config
                `)
                .eq(
                    "id",
                    levelId
                )
                .eq(
                    "level_number",
                    levelNumber
                )
                .eq(
                    "is_active",
                    true
                )
                .single();


        if (error) {

            throw error;

        }


        levelData =
            data;


        if (
            !levelData.config ||
            levelData.config.exercise_type
            !== "multiplication"
        ) {

            throw new Error(
                "Jenis latihan belum didukung."
            );

        }


        practiceTopic.textContent =
            "PERKALIAN";


        practiceLevel.textContent =
            `Tingkat ${stageNumber} • ${levelData.name}`;


        questions =
            generateBalancedQuestions(
                levelData
            );


        practiceLoading.classList.add(
            "hidden"
        );


        practiceGame.classList.remove(
            "hidden"
        );


        startQuestion();

    }

    catch (error) {

        console.error(
            "Load practice error:",
            error
        );


        practiceLoading.textContent =
            "Tidak dapat menyiapkan latihan.";

    }

}


// ======================================================
// GENERATE BALANCED RANDOM QUESTIONS
// ======================================================

function generateBalancedQuestions(
    level
) {

    const config =
        level.config;


    const multipliers =
        Array.isArray(
            config.multipliers
        )
            ? [...config.multipliers]
            : [1, 2, 5];


    const min =
        Number(
            config.min_operand ?? 1
        );


    const max =
        Number(
            config.max_operand ?? 10
        );


    const questionCount =
        Number(
            level.question_count
        );


    // ==================================================
    // BUAT POOL PER MULTIPLIER
    // ==================================================

    const pools =
        new Map();


    multipliers.forEach(
        multiplier => {

            const pool =
                [];


            for (
                let b = min;
                b <= max;
                b++
            ) {

                pool.push({
                    a: Number(
                        multiplier
                    ),
                    b,
                    answer:
                        Number(
                            multiplier
                        ) * b
                });

            }


            shuffleArray(
                pool
            );


            pools.set(
                Number(multiplier),
                pool
            );

        }
    );


    // ==================================================
    // DISTRIBUSI SEIMBANG
    // ==================================================

    const result =
        [];


    let index =
        0;


    while (
        result.length <
        questionCount
    ) {

        const multiplier =
            Number(
                multipliers[
                    index %
                    multipliers.length
                ]
            );


        const pool =
            pools.get(
                multiplier
            );


        if (
            pool &&
            pool.length > 0
        ) {

            result.push(
                pool.shift()
            );

        }


        index++;


        // Safety.
        if (index > 1000) {

            break;

        }

    }


    // Acak urutan akhir.
    shuffleArray(
        result
    );


    return result;

}


// ======================================================
// SHUFFLE
// ======================================================

function shuffleArray(array) {

    for (
        let i =
            array.length - 1;

        i > 0;

        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            array[i],
            array[j]
        ] =
        [
            array[j],
            array[i]
        ];

    }


    return array;

}


// ======================================================
// START QUESTION
// ======================================================

function startQuestion() {

    clearTimer();

    clearTimeout(
        delayedSubmit
    );


    answerLocked =
        false;


    answerInput.disabled =
        false;


    answerInput.value =
        "";


    answerFeedback.textContent =
        "";


    answerFeedback.className =
        "answer-feedback";


    const question =
        questions[
            currentQuestionIndex
        ];


    questionText.textContent =
        `${question.a} × ${question.b}`;


    questionProgress.textContent =
        `${
            currentQuestionIndex + 1
        } / ${
            questions.length
        }`;


    questionProgressBar.style.width =
        `${
            (
                currentQuestionIndex
                /
                questions.length
            )
            * 100
        }%`;


    liveCorrect.textContent =
        String(
            correctCount
        );


    // ==================================================
    // TIMER
    // ==================================================

    const duration =
        Number(
            levelData.time_limit_seconds
        );


    questionStartedAt =
        performance.now();


    questionDeadline =
        questionStartedAt +
        (
            duration *
            1000
        );


    timerValue.textContent =
        String(duration);


    timerCircle.classList.remove(
        "timer-warning"
    );


    timerInterval =
        setInterval(
            updateTimer,
            50
        );


    // ==================================================
    // FOCUS
    // ==================================================

    setTimeout(
        () => {

            answerInput.focus({
                preventScroll: true
            });

        },
        30
    );

}


// ======================================================
// TIMER UPDATE
// ======================================================

function updateTimer() {

    if (answerLocked) {

        return;

    }


    const now =
        performance.now();


    const remainingMs =
        Math.max(
            0,
            questionDeadline - now
        );


    const remainingSeconds =
        remainingMs /
        1000;


    timerValue.textContent =
        remainingSeconds
            .toFixed(1)
            .replace(
                ".0",
                ""
            );


    // Warning pada 30% waktu terakhir.
    if (
        remainingSeconds <=
        levelData.time_limit_seconds
        * 0.30
    ) {

        timerCircle.classList.add(
            "timer-warning"
        );

    }


    if (remainingMs <= 0) {

        handleTimerEnd();

    }

}


// ======================================================
// INPUT EVENTS
// ======================================================

function setupAnswerEvents() {

    answerInput.addEventListener(
        "input",
        () => {

            if (answerLocked) {

                return;

            }


            answerInput.value =
                answerInput.value.replace(
                    /\D/g,
                    ""
                );


            clearTimeout(
                delayedSubmit
            );


            const value =
                answerInput.value.trim();


            if (value === "") {

                return;

            }


            const question =
                questions[
                    currentQuestionIndex
                ];


            if (!question) {

                return;

            }


            const correctText =
                String(
                    question.answer
                );


            // ==========================================
            // JIKA SUDAH BENAR → LANGSUNG SUBMIT
            // ==========================================

            if (
                value === correctText
            ) {

                delayedSubmit =
                    setTimeout(
                        () => {

                            submitAnswer();

                        },
                        80
                    );

                return;

            }


            // ==========================================
            // SALAH DAN JUMLAH DIGIT SUDAH CUKUP
            //
            // Misal jawaban benar 14:
            // mengetik "1" belum dianggap salah.
            // Setelah menjadi 13 / 15 baru diproses.
            // ==========================================

            if (
                value.length >=
                correctText.length
            ) {

                delayedSubmit =
                    setTimeout(
                        () => {

                            submitAnswer();

                        },
                        180
                    );

            }

        }
    );


    // ENTER tetap boleh digunakan.
    answerInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();


                if (
                    answerInput.value
                        .trim()
                    !== ""
                ) {

                    submitAnswer();

                }

            }

        }
    );

}


// ======================================================
// TIMER END
// ======================================================

function handleTimerEnd() {

    if (answerLocked) {

        return;

    }


    const value =
        answerInput.value.trim();


    // Ada jawaban ketika waktu habis:
    // tetap diperiksa.
    if (value !== "") {

        submitAnswer();

    }

    else {

        submitTimeout();

    }

}


// ======================================================
// SUBMIT ANSWER
// ======================================================

function submitAnswer() {

    if (answerLocked) {

        return;

    }


    answerLocked =
        true;


    clearTimer();


    clearTimeout(
        delayedSubmit
    );


    answerInput.disabled =
        true;


    const question =
        questions[
            currentQuestionIndex
        ];


    const userValue =
        answerInput.value.trim();


    const userNumber =
        Number(
            userValue
        );


    const responseTime =
        Math.round(
            performance.now()
            -
            questionStartedAt
        );


    const isCorrect =
        userNumber ===
        question.answer;


    if (isCorrect) {

        correctCount++;


        answerFeedback.textContent =
            "✓ Benar";


        answerFeedback.className =
            "answer-feedback feedback-correct";

    }

    else {

        wrongCount++;


        answerFeedback.textContent =
            `✕ Jawaban yang benar ${
                question.answer
            }`;


        answerFeedback.className =
            "answer-feedback feedback-wrong";

    }


    answers.push({

        a:
            question.a,

        b:
            question.b,

        user_answer:
            userValue,

        response_time_ms:
            responseTime

    });


    liveCorrect.textContent =
        String(
            correctCount
        );


    setTimeout(
        nextQuestion,
        550
    );

}


// ======================================================
// TIMEOUT
// ======================================================

function submitTimeout() {

    if (answerLocked) {

        return;

    }


    answerLocked =
        true;


    clearTimer();


    clearTimeout(
        delayedSubmit
    );


    answerInput.disabled =
        true;


    const question =
        questions[
            currentQuestionIndex
        ];


    timeoutCount++;


    const responseTime =
        Math.round(
            performance.now()
            -
            questionStartedAt
        );


    answers.push({

        a:
            question.a,

        b:
            question.b,

        user_answer:
            "",

        response_time_ms:
            responseTime

    });


    answerFeedback.textContent =
        `Waktu habis • Jawaban ${
            question.answer
        }`;


    answerFeedback.className =
        "answer-feedback feedback-timeout";


    setTimeout(
        nextQuestion,
        650
    );

}


// ======================================================
// NEXT QUESTION
// ======================================================

function nextQuestion() {

    currentQuestionIndex++;


    if (
        currentQuestionIndex >=
        questions.length
    ) {

        finishPractice();

        return;

    }


    startQuestion();

}


// ======================================================
// FINISH
// ======================================================

async function finishPractice() {

    clearTimer();


    questionProgressBar.style.width =
        "100%";


    practiceGame.classList.add(
        "hidden"
    );


    practiceLoading.classList.remove(
        "hidden"
    );


    practiceLoading.textContent =
        "Menghitung hasil...";


    // ==================================================
    // GUEST
    // ==================================================

    if (
        loginMode === "guest"
    ) {

        const result =
            calculateGuestResult();


        showResult({
            ...result,

            best_score:
                null,

            attempts:
                null

        });


        return;

    }


    // ==================================================
    // STUDENT
    // ==================================================

    try {

        const {
            data,
            error
        } =
            await window.db.rpc(
                "submit_multiplication_practice",
                {
                    p_token:
                        sessionToken,

                    p_level_id:
                        levelId,

                    p_answers:
                        answers
                }
            );


        if (error) {

            throw error;

        }


        if (
            !data ||
            data.length === 0
        ) {

            throw new Error(
                "Hasil tidak diterima server."
            );

        }


        showResult(
            data[0]
        );

    }

    catch (error) {

        console.error(
            "Submit result error:",
            error
        );


        practiceLoading.textContent =
            "Hasil latihan tidak dapat disimpan. Silakan kembali dan coba lagi.";

    }

}


// ======================================================
// GUEST RESULT
// ======================================================

function calculateGuestResult() {

    const total =
        questions.length;


    const accuracy =
        (
            correctCount /
            total
        )
        * 100;


    const responseTimes =
        answers
            .map(
                answer =>
                    Number(
                        answer.response_time_ms
                    )
            )
            .filter(
                value =>
                    Number.isFinite(
                        value
                    )
                    &&
                    value > 0
            );


    let average =
        null;


    if (
        responseTimes.length > 0
    ) {

        average =
            Math.round(

                responseTimes.reduce(
                    (
                        total,
                        value
                    ) =>
                        total + value,
                    0
                )

                /

                responseTimes.length

            );

    }


    return {

        correct_count:
            correctCount,

        wrong_count:
            wrongCount,

        timeout_count:
            timeoutCount,

        accuracy:
            Number(
                accuracy.toFixed(2)
            ),

        average_response_time_ms:
            average,

        passed:
            accuracy >=
            levelData.passing_score

    };

}


// ======================================================
// RESULT SCREEN
// ======================================================

function showResult(result) {

    practiceLoading.classList.add(
        "hidden"
    );


    resultScreen.classList.remove(
        "hidden"
    );


    const passed =
        result.passed === true;


    const accuracy =
        Number(
            result.accuracy
        );


    // ==================================================
    // STATUS
    // ==================================================

    if (passed) {

        resultIcon.textContent =
            "✓";


        resultIcon.className =
            "result-icon result-pass";


        resultTitle.textContent =
            "Level Lulus!";


        resultMessage.textContent =
            loginMode === "student"
                ? "Level berikutnya sekarang dapat dibuka."
                : "Hasil Guest tidak disimpan.";

    }

    else {

        resultIcon.textContent =
            "↻";


        resultIcon.className =
            "result-icon result-fail";


        resultTitle.textContent =
            "Belum Lulus";


        resultMessage.textContent =
            `Diperlukan minimal ${
                levelData.passing_score
            }% untuk membuka level berikutnya.`;

    }


    // ==================================================
    // VALUE
    // ==================================================

    resultAccuracy.textContent =
        `${accuracy.toFixed(0)}%`;


    resultCorrect.textContent =
        result.correct_count;


    resultWrong.textContent =
        result.wrong_count;


    resultTimeout.textContent =
        result.timeout_count;


    if (
        result.average_response_time_ms
        !== null
        &&
        result.average_response_time_ms
        !== undefined
    ) {

        resultAverage.textContent =
            `${
                (
                    Number(
                        result.average_response_time_ms
                    )
                    /
                    1000
                )
                .toFixed(1)
            } dtk`;

    }

    else {

        resultAverage.textContent =
            "-";

    }


    // ==================================================
    // BEST SCORE SISWA
    // ==================================================

    if (
        loginMode === "student" &&
        result.best_score !== null
        &&
        result.best_score !== undefined
    ) {

        bestScoreBox.classList.remove(
            "hidden"
        );


        bestScoreBox.textContent =
            `Skor terbaik: ${
                Number(
                    result.best_score
                ).toFixed(0)
            }% • Percobaan ${
                result.attempts
            }`;

    }

}


// ======================================================
// CLEAR TIMER
// ======================================================

function clearTimer() {

    if (timerInterval) {

        clearInterval(
            timerInterval
        );


        timerInterval =
            null;

    }

}


// ======================================================
// NAVIGATION
// ======================================================

function goBackToLevels() {

    clearTimer();


    const url =
        "./levels.html" +

        "?subject=" +
        encodeURIComponent(
            subjectCode
        ) +

        "&topic=" +
        encodeURIComponent(
            topicCode
        ) +

        "&stage=" +
        encodeURIComponent(
            stageNumber
        );


    window.location.href =
        url;

}


function goLogin() {

    window.location.href =
        "./index.html";

}
