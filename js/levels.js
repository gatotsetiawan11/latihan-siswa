// ======================================================
// ELEMENT
// ======================================================

const levelList =
    document.getElementById(
        "levelList"
    );

const topicName =
    document.getElementById(
        "topicName"
    );

const stageName =
    document.getElementById(
        "stageName"
    );

const headingTitle =
    document.getElementById(
        "headingTitle"
    );

const backButton =
    document.getElementById(
        "backButton"
    );


// ======================================================
// URL
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
// START
// ======================================================

initialize();


// ======================================================
// INITIALIZE
// ======================================================

async function initialize() {

    const valid =
        await checkSession();


    if (!valid) {

        return;

    }


    if (
        !subjectCode ||
        !topicCode ||
        !Number.isInteger(
            stageNumber
        ) ||
        stageNumber <= 0
    ) {

        window.location.href =
            "./dashboard.html";

        return;

    }


    backButton.addEventListener(
        "click",
        goBack
    );


    await loadLevels();

}


// ======================================================
// CHECK SESSION
// ======================================================

async function checkSession() {

    if (
        loginMode === "guest"
    ) {

        return true;

    }


    if (
        loginMode !== "student"
    ) {

        goLogin();

        return false;

    }


    if (!sessionToken) {

        sessionStorage.clear();

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
// LOAD LEVELS
// ======================================================

async function loadLevels() {

    try {

        // ==================================================
        // SUBJECT
        // ==================================================

        const {
            data: subject,
            error: subjectError
        } =
            await window.db
                .from("subjects")
                .select(`
                    id,
                    code,
                    name
                `)
                .eq(
                    "code",
                    subjectCode
                )
                .eq(
                    "is_active",
                    true
                )
                .single();


        if (subjectError) {

            throw subjectError;

        }


        // ==================================================
        // TOPIC
        // ==================================================

        const {
            data: topic,
            error: topicError
        } =
            await window.db
                .from("topics")
                .select(`
                    id,
                    code,
                    name
                `)
                .eq(
                    "subject_id",
                    subject.id
                )
                .eq(
                    "code",
                    topicCode
                )
                .eq(
                    "is_active",
                    true
                )
                .single();


        if (topicError) {

            throw topicError;

        }


        // ==================================================
        // STAGE
        // ==================================================

        const {
            data: stage,
            error: stageError
        } =
            await window.db
                .from("stages")
                .select(`
                    id,
                    stage_number,
                    name,
                    sort_order
                `)
                .eq(
                    "topic_id",
                    topic.id
                )
                .eq(
                    "stage_number",
                    stageNumber
                )
                .eq(
                    "is_active",
                    true
                )
                .single();


        if (stageError) {

            throw stageError;

        }


        topicName.textContent =
            topic.name.toUpperCase();


        stageName.textContent =
            stage.name;


        headingTitle.textContent =
            stage.name;


        // ==================================================
        // LEVELS
        // ==================================================

        const {
            data: levels,
            error: levelError
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
                    config,
                    sort_order
                `)
                .eq(
                    "stage_id",
                    stage.id
                )
                .eq(
                    "is_active",
                    true
                )
                .order(
                    "sort_order",
                    {
                        ascending: true
                    }
                );


        if (levelError) {

            throw levelError;

        }


        // ==================================================
        // STUDENT: CEK APAKAH TINGKAT INI TERBUKA
        // ==================================================

        if (
            loginMode === "student" &&
            levels.length > 0
        ) {

            const accessRpc =
                topicCode === "addition"
                    ? "student_can_access_addition_level"
                    : topicCode === "subtraction"
                        ? "student_can_access_subtraction_level"
                        : topicCode === "english_conversation"
                            ? "student_can_access_english_conversation_level"
                            : "student_can_access_level";


            const {
                data: canAccess,
                error: accessError
            } =
                await window.db.rpc(
                    accessRpc,
                    {

                        p_token:
                            sessionToken,

                        p_level_id:
                            levels[0].id

                    }
                );


            if (accessError) {

                throw accessError;

            }


            if (canAccess !== true) {

                renderLockedStage();

                return;

            }

        }


        // ==================================================
        // LEVEL PROGRESS
        // ==================================================

        let progress =
            [];


        if (
            loginMode === "student"
        ) {

            const progressRpc =
                topicCode === "addition"
                    ? "get_student_addition_level_progress"
                    : topicCode === "subtraction"
                        ? "get_student_subtraction_level_progress"
                        : topicCode === "english_conversation"
                            ? "get_student_english_conversation_level_progress"
                            : "get_student_level_progress";


            const {
                data,
                error
            } =
                await window.db.rpc(
                    progressRpc,
                    {

                        p_token:
                            sessionToken,

                        p_stage_id:
                            stage.id

                    }
                );


            if (error) {

                throw error;

            }


            progress =
                data || [];

        }


        renderLevels(
            levels,
            progress
        );

    }

    catch (error) {

        console.error(
            "Load levels error:",
            error
        );


        levelList.innerHTML = `
            <div class="error-card">
                Tidak dapat memuat level.
            </div>
        `;

    }

}


// ======================================================
// LOCKED STAGE
// ======================================================

function renderLockedStage() {

    levelList.innerHTML = `

        <div class="stage-locked-message">

            <div class="stage-lock-icon">
                🔒
            </div>

            <h3>
                Tingkat masih terkunci
            </h3>

            <p>
                Selesaikan seluruh level pada
                tingkat sebelumnya terlebih dahulu.
            </p>

            <button
                id="lockedBackButton"
                class="button button-primary"
                type="button"
            >
                Kembali ke Daftar Tingkat
            </button>

        </div>

    `;


    document
        .getElementById(
            "lockedBackButton"
        )
        .addEventListener(
            "click",
            goBack
        );

}


// ======================================================
// RENDER LEVELS
// ======================================================

function renderLevels(
    levels,
    progress
) {

    levelList.innerHTML =
        "";


    if (
        !levels ||
        levels.length === 0
    ) {

        levelList.innerHTML = `
            <div class="empty-card">
                Belum ada level tersedia.
            </div>
        `;

        return;

    }


    const progressMap =
        new Map();


    progress.forEach(
        item => {

            progressMap.set(
                item.level_id,
                item
            );

        }
    );


    levels.forEach(
        (
            level,
            index
        ) => {

            const currentProgress =
                progressMap.get(
                    level.id
                );


            const completed =
                currentProgress
                    ?.is_completed
                === true;


            let unlocked =
                false;


            // Guest.
            if (
                loginMode === "guest"
            ) {

                unlocked =
                    true;

            }


            // Level pertama.
            else if (
                index === 0
            ) {

                unlocked =
                    true;

            }


            // Level berikutnya.
            else {

                const previousLevel =
                    levels[
                        index - 1
                    ];


                const previousProgress =
                    progressMap.get(
                        previousLevel.id
                    );


                unlocked =
                    previousProgress
                        ?.is_completed
                    === true;

            }


            // Pernah lulus.
            if (completed) {

                unlocked =
                    true;

            }


            createLevelCard(
                level,
                currentProgress,
                unlocked,
                completed
            );

        }
    );

}


// ======================================================
// CREATE LEVEL CARD
// ======================================================

function createLevelCard(
    level,
    progress,
    unlocked,
    completed
) {

    const card =
        document.createElement(
            "button"
        );


    card.type =
        "button";


    card.className =
        "level-card";


    if (completed) {

        card.classList.add(
            "level-completed"
        );

    }


    if (!unlocked) {

        card.classList.add(
            "level-locked"
        );


        card.disabled =
            true;

    }


    // HEADER

    const header =
        document.createElement(
            "div"
        );


    header.className =
        "level-header";


    const number =
        document.createElement(
            "div"
        );


    number.className =
        "level-number";


    number.textContent =
        level.level_number;


    const time =
        document.createElement(
            "span"
        );


    time.className =
        "time-badge";


    time.textContent =
        topicCode === "english_conversation"
            ? `${getConversationTurnCount(level)} giliran`
            : `${level.time_limit_seconds} detik`;


    header.appendChild(
        number
    );


    header.appendChild(
        time
    );


    // TITLE

    const title =
        document.createElement(
            "h3"
        );


    title.textContent =
        level.name;


    // INFO

    const info =
        document.createElement(
            "div"
        );


    info.className =
        "level-info";


    const questions =
        document.createElement(
            "span"
        );


    questions.textContent =
        topicCode === "english_conversation"
            ? "Percakapan AI"
            : `${level.question_count} soal`;


    const passing =
        document.createElement(
            "span"
        );


    passing.textContent =
        `Lulus ${level.passing_score}%`;


    info.appendChild(
        questions
    );


    info.appendChild(
        passing
    );


    // PROGRESS

    const progressInfo =
        document.createElement(
            "div"
        );


    progressInfo.className =
        "level-progress-info";


    if (
        loginMode === "guest"
    ) {

        progressInfo.textContent =
            topicCode === "english_conversation"
                ? "Login siswa diperlukan untuk Conversation AI"
                : "Mode Guest";

    }

    else if (completed) {

        progressInfo.textContent =
            `✓ Lulus • Skor terbaik ${
                Number(
                    progress.best_score
                ).toFixed(0)
            }%`;

    }

    else if (
        progress &&
        progress.attempts > 0
    ) {

        progressInfo.textContent =
            `${
                progress.attempts
            } percobaan • belum lulus`;

    }

    else if (!unlocked) {

        progressInfo.textContent =
            "🔒 Selesaikan level sebelumnya";

    }

    else {

        progressInfo.textContent =
            "Siap dimainkan";

    }


    // START

    const start =
        document.createElement(
            "div"
        );


    start.className =
        "start-label";


    if (!unlocked) {

        start.textContent =
            "Terkunci";

    }

    else if (completed) {

        start.textContent =
            "Main Lagi →";

    }

    else {

        start.textContent =
            loginMode === "guest" && topicCode === "english_conversation"
                ? "Login untuk mulai →"
                : "Mulai →";

    }


    // APPEND

    card.appendChild(
        header
    );


    card.appendChild(
        title
    );


    card.appendChild(
        info
    );


    card.appendChild(
        progressInfo
    );


    card.appendChild(
        start
    );


    // CLICK

    if (unlocked) {

        card.addEventListener(
            "click",
            () => {

                if (loginMode === "guest" && topicCode === "english_conversation") {
                    goLogin();
                    return;
                }

                const practicePage =
                    topicCode === "addition"
                        ? "./addition-practice.html"
                        : topicCode === "subtraction"
                            ? "./subtraction-practice.html"
                            : topicCode === "english_conversation"
                                ? "./english-conversation.html"
                                : "./practice.html";


                const url =
                    practicePage +

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
                    ) +

                    "&level=" +
                    encodeURIComponent(
                        level.level_number
                    ) +

                    "&id=" +
                    encodeURIComponent(
                        level.id
                    );


                window.location.href =
                    url;

            }
        );

    }


    levelList.appendChild(
        card
    );

}



function getConversationTurnCount(level) {

    const config =
        level?.config && typeof level.config === "object"
            ? level.config
            : {};

    const value =
        Number(
            config.max_turns ??
            config.turn_count ??
            level?.question_count
        );

    if (!Number.isFinite(value) || value <= 0) {
        return 6;
    }

    return Math.min(20, Math.max(1, Math.round(value)));

}

// ======================================================
// NAVIGATION
// ======================================================

function goBack() {

    window.location.href =
        "./stages.html" +

        "?subject=" +
        encodeURIComponent(
            subjectCode
        ) +

        "&topic=" +
        encodeURIComponent(
            topicCode
        );

}


function goLogin() {

    window.location.href =
        "./index.html";

}
