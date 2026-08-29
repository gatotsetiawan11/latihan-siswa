// ======================================================
// DOM ELEMENTS
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


// ======================================================
// RESULT ELEMENTS
// ======================================================

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
// URL PARAMETERS
// ======================================================

const params =
    new URLSearchParams(
        window.location.search
    );


const subjectCode =
    params.get(
        "subject"
    );

const topicCode =
    params.get(
        "topic"
    );

const stageNumber =
    Number(
        params.get(
            "stage"
        )
    );

const levelNumber =
    Number(
        params.get(
            "level"
        )
    );

const levelId =
    params.get(
        "id"
    );


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

    // ==================================================
    // VALIDASI SESSION
    // ==================================================

    const validSession =
        await checkSession();


    if (!validSession) {

        return;

    }


    // ==================================================
    // VALIDASI PARAMETER URL
    // ==================================================

    if (
        !subjectCode ||
        !topicCode ||
        !levelId ||
        !Number.isInteger(
            stageNumber
        ) ||
        stageNumber <= 0 ||
        !Number.isInteger(
            levelNumber
        ) ||
        levelNumber <= 0
    ) {

        goBackToLevels();

        return;

    }


    // ==================================================
    // STUDENT:
    // PASTIKAN LEVEL BENAR-BENAR TERBUKA
    // ==================================================

    if (
        loginMode === "student"
    ) {

        try {

            const {
                data: canAccess,
                error: accessError
            } =
                await window.db.rpc(
                    "student_can_access_level",
                    {
                        p_token:
                            sessionToken,

                        p_level_id:
                            levelId
                    }
                );


            if (accessError) {

                console.error(
                    "Level access error:",
                    accessError
                );


                showLockedLevelMessage();

                return;

            }


            if (
                canAccess !== true
            ) {

                showLockedLevelMessage();

                return;

            }

        }

        catch (error) {

            console.error(
                "Level access error:",
                error
            );


            practiceLoading.textContent =
                "Tidak dapat memverifikasi akses level.";

            return;

        }

    }


    // ==================================================
    // EVENT
    // ==================================================

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


    // ==================================================
    // LOAD LEVEL
    // ==================================================

    await loadLevel();

}


// ======================================================
// LEVEL LOCKED MESSAGE
// ======================================================

function showLockedLevelMessage() {

    practiceLoading.innerHTML = `
        <div
            style="
                font-size: 34px;
                margin-bottom: 14px;
            "
        >
            🔒
        </div>

        <strong
            style="
                display: block;
                margin-bottom: 8px;
                font-size: 20px;
                color: #172033;
            "
        >
            Level masih terkunci
        </strong>

        <p
            style="
                margin: 0 0 22px;
                line-height: 1.6;
            "
        >
            Selesaikan level sebelumnya terlebih dahulu.
        </p>

        <button
            id="lockedLevelBackButton"
            class="button button-primary"
            type="button"
        >
            Kembali ke Daftar Level
        </button>
    `;


    const lockedLevelBackButton =
        document.getElementById(
            "lockedLevelBackButton"
        );


    lockedLevelBackButton.addEventListener(
        "click",
        goBackToLevels
    );

}


// ======================================================
// CHECK SESSION
// ======================================================

async function checkSession() {

    // ==================================================
    // GUEST
    // ==================================================

    if (
        loginMode === "guest"
    ) {

        return true;

    }


    // ==================================================
    // HARUS STUDENT
    // ==================================================

    if (
        loginMode !== "student"
    ) {

        goLogin();

        return false;

    }


    // ==================================================
    // TOKEN HARUS ADA
    // ==================================================

    if (!sessionToken) {

        sessionStorage.clear();

        goLogin();

        return false;

    }


    // ==================================================
    // VALIDASI TOKEN KE SUPABASE
    // ==================================================

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

        console.error(
            "Session error:",
            error
        );


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
                .from(
                    "levels"
                )
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


        // ==================================================
        // VALIDASI JENIS LATIHAN
        // ==================================================

        if (
            !levelData.config ||
            levelData.config.exercise_type
            !== "multiplication"
        ) {

            throw new Error(
                "Jenis latihan belum didukung."
            );

        }


        // ==================================================
        // HEADER
        // ==================================================

        practiceTopic.textContent =
            "PERKALIAN";


        practiceLevel.textContent =
            `Tingkat ${stageNumber} • ${levelData.name}`;


        // ==================================================
        // GENERATE SOAL
        // ==================================================

        questions =
            generateBalancedQuestions(
                levelData
            );


        if (
            questions.length !==
            Number(
                levelData.question_count
            )
        ) {

            throw new Error(
                "Jumlah soal gagal dibuat."
            );

        }


        // ==================================================
        // TAMPILKAN GAME
        // ==================================================

        practiceLoading.classList.add(
            "hidden"
        );


        practiceGame.classList.remove(
            "hidden"
        );


        // ==================================================
        // MULAI SOAL
        // ==================================================

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
            ? [
                ...config.multipliers
            ]
            : [
                1,
                2,
                5
            ];


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
    // VALIDASI
    // ==================================================

    if (
        multipliers.length === 0 ||
        !Number.isInteger(min) ||
        !Number.isInteger(max) ||
        min > max ||
        questionCount <= 0
    ) {

        return [];

    }


    // ==================================================
    // BUAT POOL SOAL PER MULTIPLIER
    // ==================================================

    const pools =
        new Map();


    multipliers.forEach(
        rawMultiplier => {

            const multiplier =
                Number(
                    rawMultiplier
                );


            const pool =
                [];


            for (
                let b = min;
                b <= max;
                b++
            ) {

                pool.push({
                    a:
                        multiplier,

                    b:
                        b,

                    answer:
                        multiplier * b
                });

            }


            shuffleArray(
                pool
            );


            pools.set(
                multiplier,
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


        // ==================================================
        // SAFETY LOOP
        // ==================================================

        if (
            index > 1000
        ) {

            break;

        }

    }


    // ==================================================
    // ACAK URUTAN AKHIR
    // ==================================================

    shuffleArray(
        result
    );


    return result;

}


// ======================================================
// SHUFFLE ARRAY
// ======================================================

function shuffleArray(
    array
) {

    for (
        let i =
            array.length - 1;

        i > 0;

        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (
                    i + 1
                )
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

    // ==================================================
    // BERSIHKAN TIMER LAMA
    // ==================================================

    clearTimer();


    clearTimeout(
        delayedSubmit
    );


    // ==================================================
    // RESET STATE
    // ==================================================

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


    // ==================================================
    // SOAL SAAT INI
    // ==================================================

    const question =
        questions[
            currentQuestionIndex
        ];


    if (!question) {

        finishPractice();

        return;

    }


    // ==================================================
    // TAMPILKAN SOAL
    // ==================================================

    questionText.textContent =
        `${question.a} × ${question.b}`;


    // ==================================================
    // PROGRESS
    // ==================================================

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
            *
            100
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
        String(
            duration
        );


    timerCircle.classList.remove(
        "timer-warning"
    );


    timerInterval =
        setInterval(
            updateTimer,
            50
        );


    // ==================================================
    // AUTOFOCUS
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


    // ==================================================
    // TAMPILAN DETIK
    // ==================================================

    timerValue.textContent =
        remainingSeconds
            .toFixed(1)
            .replace(
                ".0",
                ""
            );


    // ==================================================
    // WARNING
    // ==================================================

    const warningLimit =
        Number(
            levelData.time_limit_seconds
        )
        *
        0.30;


    if (
        remainingSeconds <=
        warningLimit
    ) {

        timerCircle.classList.add(
            "timer-warning"
        );

    }


    // ==================================================
    // WAKTU HABIS
    // ==================================================

    if (
        remainingMs <= 0
    ) {

        handleTimerEnd();

    }

}


// ======================================================
// SETUP ANSWER EVENTS
// ======================================================

function setupAnswerEvents() {

    // ==================================================
    // INPUT
    // ==================================================

    answerInput.addEventListener(
        "input",
        () => {

            if (
                answerLocked
            ) {

                return;

            }


            // Hanya angka.
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


            if (
                value === ""
            ) {

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


            // ==================================================
            // JAWABAN SUDAH BENAR
            //
            // Tidak perlu menunggu tombol submit.
            // ==================================================

            if (
                value ===
                correctText
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


            // ==================================================
            // JAWABAN SALAH
            //
            // Jangan langsung salah saat baru mengetik
            // digit pertama.
            //
            // Contoh jawaban 14:
            // mengetik "1" → tunggu
            // mengetik "13" → proses salah
            // ==================================================

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


    // ==================================================
    // ENTER OPSIONAL
    // ==================================================

    answerInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();


                const value =
                    answerInput.value.trim();


                if (
                    value !== "" &&
                    !answerLocked
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

    if (
        answerLocked
    ) {

        return;

    }


    const value =
        answerInput.value.trim();


    // ==================================================
    // SUDAH ADA JAWABAN
    //
    // Walaupun timer 0,
    // jawaban tetap diperiksa.
    // ==================================================

    if (
        value !== ""
    ) {

        submitAnswer();

    }

    // ==================================================
    // KOSONG = TIMEOUT
    // ==================================================

    else {

        submitTimeout();

    }

}


// ======================================================
// SUBMIT ANSWER
// ======================================================

function submitAnswer() {

    if (
        answerLocked
    ) {

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


    // ==================================================
    // SOAL
    // ==================================================

    const question =
        questions[
            currentQuestionIndex
        ];


    if (!question) {

        return;

    }


    // ==================================================
    // JAWABAN USER
    // ==================================================

    const userValue =
        answerInput.value.trim();


    const userNumber =
        Number(
            userValue
        );


    // ==================================================
    // RESPONSE TIME
    // ==================================================

    const responseTime =
        Math.round(
            performance.now()
            -
            questionStartedAt
        );


    // ==================================================
    // CHECK
    // ==================================================

    const isCorrect =
        userNumber ===
        question.answer;


    // ==================================================
    // BENAR
    // ==================================================

    if (
        isCorrect
    ) {

        correctCount++;


        answerFeedback.textContent =
            "✓ Benar";


        answerFeedback.className =
            "answer-feedback feedback-correct";

    }

    // ==================================================
    // SALAH
    // ==================================================

    else {

        wrongCount++;


        answerFeedback.textContent =
            `✕ Jawaban yang benar ${question.answer}`;


        answerFeedback.className =
            "answer-feedback feedback-wrong";

    }


    // ==================================================
    // SIMPAN KE STATE
    // ==================================================

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


    // ==================================================
    // LIVE SCORE
    // ==================================================

    liveCorrect.textContent =
        String(
            correctCount
        );


    // ==================================================
    // NEXT
    // ==================================================

    setTimeout(
        nextQuestion,
        550
    );

}


// ======================================================
// SUBMIT TIMEOUT
// ======================================================

function submitTimeout() {

    if (
        answerLocked
    ) {

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


    if (!question) {

        return;

    }


    // ==================================================
    // COUNT
    // ==================================================

    timeoutCount++;


    // ==================================================
    // RESPONSE TIME
    // ==================================================

    const responseTime =
        Math.round(
            performance.now()
            -
            questionStartedAt
        );


    // ==================================================
    // SIMPAN
    // ==================================================

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


    // ==================================================
    // FEEDBACK
    // ==================================================

    answerFeedback.textContent =
        `Waktu habis • Jawaban ${question.answer}`;


    answerFeedback.className =
        "answer-feedback feedback-timeout";


    // ==================================================
    // NEXT
    // ==================================================

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
// FINISH PRACTICE
// ======================================================

async function finishPractice() {

    clearTimer();


    clearTimeout(
        delayedSubmit
    );


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


        // ==================================================
        // RESULT
        // ==================================================

        showResult(
            data[0]
        );

    }

    catch (error) {

        console.error(
            "Submit result error:",
            error
        );


        practiceLoading.innerHTML = `

            <strong
                style="
                    display: block;
                    margin-bottom: 9px;
                    color: #172033;
                "
            >
                Hasil tidak dapat disimpan
            </strong>

            <p
                style="
                    margin: 0 0 20px;
                "
            >
                Silakan kembali ke daftar level
                lalu coba kembali.
            </p>

            <button
                id="submitErrorBackButton"
                class="button button-primary"
                type="button"
            >
                Kembali ke Level
            </button>

        `;


        const button =
            document.getElementById(
                "submitErrorBackButton"
            );


        button.addEventListener(
            "click",
            goBackToLevels
        );

    }

}


// ======================================================
// CALCULATE GUEST RESULT
// ======================================================

function calculateGuestResult() {

    const total =
        questions.length;


    const accuracy =
        total > 0
            ? (
                correctCount /
                total
            )
            * 100
            : 0;


    // ==================================================
    // RESPONSE TIMES
    // ==================================================

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


    // ==================================================
    // AVERAGE
    // ==================================================

    let average =
        null;


    if (
        responseTimes.length > 0
    ) {

        const totalResponseTime =
            responseTimes.reduce(
                (
                    total,
                    value
                ) =>
                    total + value,
                0
            );


        average =
            Math.round(
                totalResponseTime
                /
                responseTimes.length
            );

    }


    // ==================================================
    // RETURN
    // ==================================================

    return {

        correct_count:
            correctCount,

        wrong_count:
            wrongCount,

        timeout_count:
            timeoutCount,

        accuracy:
            Number(
                accuracy.toFixed(
                    2
                )
            ),

        average_response_time_ms:
            average,

        passed:
            accuracy >=
            Number(
                levelData.passing_score
            )

    };

}


// ======================================================
// SHOW RESULT
// ======================================================

function showResult(
    result
) {

    // ==================================================
    // SCREEN
    // ==================================================

    practiceLoading.classList.add(
        "hidden"
    );


    practiceGame.classList.add(
        "hidden"
    );


    resultScreen.classList.remove(
        "hidden"
    );


    // ==================================================
    // STATUS
    // ==================================================

    const passed =
        result.passed === true;


    const accuracy =
        Number(
            result.accuracy
        );


    // ==================================================
    // LULUS
    // ==================================================

    if (
        passed
    ) {

        resultIcon.textContent =
            "✓";


        resultIcon.className =
            "result-icon result-pass";


        resultTitle.textContent =
            "Level Lulus!";


        if (
            loginMode === "student"
        ) {

            resultMessage.textContent =
                "Level berikutnya sekarang dapat dibuka.";

        }

        else {

            resultMessage.textContent =
                "Hasil Guest tidak disimpan.";

        }

    }

    // ==================================================
    // BELUM LULUS
    // ==================================================

    else {

        resultIcon.textContent =
            "↻";


        resultIcon.className =
            "result-icon result-fail";


        resultTitle.textContent =
            "Belum Lulus";


        resultMessage.textContent =
            `Diperlukan minimal ${levelData.passing_score}% untuk membuka level berikutnya.`;

    }


    // ==================================================
    // ACCURACY
    // ==================================================

    resultAccuracy.textContent =
        `${accuracy.toFixed(0)}%`;


    // ==================================================
    // COUNTS
    // ==================================================

    resultCorrect.textContent =
        String(
            result.correct_count
        );


    resultWrong.textContent =
        String(
            result.wrong_count
        );


    resultTimeout.textContent =
        String(
            result.timeout_count
        );


    // ==================================================
    // AVERAGE RESPONSE
    // ==================================================

    if (
        result.average_response_time_ms
        !== null
        &&
        result.average_response_time_ms
        !== undefined
    ) {

        const averageSeconds =
            Number(
                result.average_response_time_ms
            )
            /
            1000;


        resultAverage.textContent =
            `${averageSeconds.toFixed(1)} dtk`;

    }

    else {

        resultAverage.textContent =
            "-";

    }


    // ==================================================
    // BEST SCORE
    // ==================================================

    if (
        loginMode === "student" &&
        result.best_score !== null &&
        result.best_score !== undefined
    ) {

        bestScoreBox.classList.remove(
            "hidden"
        );


        bestScoreBox.textContent =
            `Skor terbaik: ${
                Number(
                    result.best_score
                )
                .toFixed(0)
            }% • Percobaan ${
                result.attempts
            }`;

    }

    else {

        bestScoreBox.classList.add(
            "hidden"
        );

    }

}


// ======================================================
// CLEAR TIMER
// ======================================================

function clearTimer() {

    if (
        timerInterval
    ) {

        clearInterval(
            timerInterval
        );


        timerInterval =
            null;

    }

}


// ======================================================
// GO BACK TO LEVELS
// ======================================================

function goBackToLevels() {

    clearTimer();


    clearTimeout(
        delayedSubmit
    );


    // ==================================================
    // FALLBACK
    // ==================================================

    if (
        !subjectCode ||
        !topicCode ||
        !stageNumber
    ) {

        window.location.href =
            "./dashboard.html";

        return;

    }


    // ==================================================
    // URL
    // ==================================================

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


// ======================================================
// LOGIN
// ======================================================

function goLogin() {

    window.location.href =
        "./index.html";

}


// ======================================================
// CLEANUP
// ======================================================

window.addEventListener(
    "beforeunload",
    () => {

        clearTimer();


        clearTimeout(
            delayedSubmit
        );

    }
);
