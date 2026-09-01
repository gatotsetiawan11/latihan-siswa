// ======================================================
// ELEMENT
// ======================================================

const stageList =
    document.getElementById(
        "stageList"
    );

const subjectName =
    document.getElementById(
        "subjectName"
    );

const topicName =
    document.getElementById(
        "topicName"
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

    const validSession =
        await checkSession();

    if (!validSession) {
        return;
    }

    if (
        !subjectCode ||
        !topicCode
    ) {
        window.location.href =
            "./dashboard.html";
        return;
    }

    backButton.addEventListener(
        "click",
        () => {
            window.location.href =
                "./topics.html?subject=" +
                encodeURIComponent(
                    subjectCode
                );
        }
    );

    await loadStages();
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
// LOAD STAGES
// ======================================================

async function loadStages() {

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
        // HEADER
        // ==================================================

        subjectName.textContent =
            subject.name.toUpperCase();

        topicName.textContent =
            topic.name;

        headingTitle.textContent =
            topic.name;

        // ==================================================
        // STAGES
        // ==================================================

        const stages =
            await loadStageRows(
                topic.id
            );

        // ==================================================
        // STUDENT PROGRESS
        // ==================================================

        let progress =
            [];

        if (
            loginMode === "student"
        ) {
            progress =
                await loadStudentProgress(
                    topic.id
                );
        }

        renderStages(
            stages,
            progress
        );
    }
    catch (error) {

        console.error(
            "Load stages error:",
            error
        );

        stageList.innerHTML = `
            <div class="error-card">
                Tidak dapat memuat tingkat.
            </div>
        `;
    }
}


// ======================================================
// LOAD STAGE ROWS
// ======================================================

async function loadStageRows(
    topicId
) {

    // Query utama memakai schema yang sekarang dipakai proyek.
    const primary =
        await window.db
            .from("stages")
            .select(`
                id,
                stage_number,
                name,
                description,
                sort_order
            `)
            .eq(
                "topic_id",
                topicId
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

    if (!primary.error) {
        return primary.data || [];
    }

    console.warn(
        "Primary stages query failed. Retrying with compatibility query:",
        primary.error
    );

    // Fallback untuk deployment/database lama yang belum memiliki
    // description atau sort_order. Dengan ini halaman Tingkat tidak
    // langsung rusak hanya karena schema berbeda sedikit.
    const fallback =
        await window.db
            .from("stages")
            .select(`
                id,
                stage_number,
                name
            `)
            .eq(
                "topic_id",
                topicId
            )
            .eq(
                "is_active",
                true
            )
            .order(
                "stage_number",
                {
                    ascending: true
                }
            );

    if (fallback.error) {
        throw fallback.error;
    }

    return (fallback.data || []).map(
        stage => ({
            ...stage,
            description: "",
            sort_order:
                Number(stage.stage_number) || 0
        })
    );
}


// ======================================================
// LOAD STUDENT PROGRESS
// ======================================================

async function loadStudentProgress(
    topicId
) {

    const preferredRpc =
        topicCode === "addition"
            ? "get_student_addition_topic_progress"
            : topicCode === "subtraction"
                ? "get_student_subtraction_topic_progress"
                : topicCode === "english_conversation"
                    ? "get_student_english_conversation_topic_progress"
                    : "get_student_topic_progress";

    const rpcCandidates =
        preferredRpc === "get_student_topic_progress"
            ? [
                "get_student_topic_progress"
            ]
            : [
                preferredRpc,
                "get_student_topic_progress"
            ];

    for (
        const rpcName
        of rpcCandidates
    ) {

        try {

            const {
                data,
                error
            } =
                await window.db.rpc(
                    rpcName,
                    {
                        p_token:
                            sessionToken,
                        p_topic_id:
                            topicId
                    }
                );

            if (!error) {
                return data || [];
            }

            console.warn(
                `Progress RPC ${rpcName} failed:`,
                error
            );
        }
        catch (error) {
            console.warn(
                `Progress RPC ${rpcName} threw an exception:`,
                error
            );
        }
    }

    // Progress bukan syarat untuk menampilkan daftar tingkat.
    // Jika semua RPC progress gagal, halaman tetap ditampilkan.
    // Tingkat pertama tetap terbuka dan tingkat berikutnya mengikuti
    // aturan normal sampai RPC/database diperbaiki.
    console.warn(
        "Progress unavailable. Rendering stages without saved progress."
    );

    return [];
}


// ======================================================
// RENDER STAGES
// ======================================================

function renderStages(
    stages,
    progress
) {

    stageList.innerHTML =
        "";

    if (
        !stages ||
        stages.length === 0
    ) {
        stageList.innerHTML = `
            <div class="empty-card">
                Belum ada tingkat tersedia.
            </div>
        `;
        return;
    }

    // ==================================================
    // PROGRESS MAP
    // ==================================================

    const progressMap =
        new Map();

    progress.forEach(
        item => {
            progressMap.set(
                item.stage_id,
                item
            );
        }
    );

    // ==================================================
    // STAGE LOOP
    // ==================================================

    stages.forEach(
        (
            stage,
            index
        ) => {

            const currentProgress =
                progressMap.get(
                    stage.id
                );

            const completed =
                currentProgress
                    ?.is_completed
                === true;

            let unlocked =
                false;

            // ==========================================
            // GUEST
            // ==========================================

            if (
                loginMode === "guest"
            ) {
                unlocked =
                    true;
            }

            // ==========================================
            // TINGKAT PERTAMA
            // ==========================================

            else if (
                index === 0
            ) {
                unlocked =
                    true;
            }

            // ==========================================
            // TINGKAT BERIKUTNYA
            // ==========================================

            else {

                const previousStage =
                    stages[
                        index - 1
                    ];

                const previousProgress =
                    progressMap.get(
                        previousStage.id
                    );

                unlocked =
                    previousProgress
                        ?.is_completed
                    === true;
            }

            // Tingkat yang sudah selesai
            // tetap dapat dibuka.
            if (completed) {
                unlocked =
                    true;
            }

            createStageCard(
                stage,
                currentProgress,
                unlocked,
                completed
            );
        }
    );
}


// ======================================================
// CREATE STAGE CARD
// ======================================================

function createStageCard(
    stage,
    progress,
    unlocked,
    completed
) {

    const button =
        document.createElement(
            "button"
        );

    button.type =
        "button";

    button.className =
        "learning-card stage-card";

    if (completed) {
        button.classList.add(
            "stage-completed"
        );
    }

    if (!unlocked) {

        button.classList.add(
            "stage-locked"
        );

        button.disabled =
            true;
    }

    // ==================================================
    // NUMBER
    // ==================================================

    const number =
        document.createElement(
            "div"
        );

    number.className =
        "stage-number";

    number.textContent =
        stage.stage_number;

    // ==================================================
    // CONTENT
    // ==================================================

    const content =
        document.createElement(
            "div"
        );

    const title =
        document.createElement(
            "h3"
        );

    title.textContent =
        stage.name;

    const description =
        document.createElement(
            "p"
        );

    description.textContent =
        stage.description ||
        "Mulai tingkat ini.";

    const progressText =
        document.createElement(
            "div"
        );

    progressText.className =
        "stage-progress";

    // ==================================================
    // PROGRESS TEXT
    // ==================================================

    if (
        loginMode === "guest"
    ) {
        progressText.textContent =
            "Mode Guest • semua level terbuka";
    }
    else if (completed) {
        progressText.textContent =
            "✓ Semua level telah lulus";
    }
    else if (!unlocked) {
        progressText.textContent =
            "🔒 Selesaikan tingkat sebelumnya";
    }
    else if (
        progress &&
        Number(
            progress.total_levels
        ) > 0
    ) {
        progressText.textContent =
            `${
                progress.completed_levels
            } dari ${
                progress.total_levels
            } level selesai`;
    }
    else {
        progressText.textContent =
            "Belum dimulai";
    }

    content.appendChild(
        title
    );

    content.appendChild(
        description
    );

    content.appendChild(
        progressText
    );

    // ==================================================
    // ARROW
    // ==================================================

    const arrow =
        document.createElement(
            "div"
        );

    arrow.className =
        "card-arrow";

    arrow.textContent =
        unlocked
            ? "›"
            : "🔒";

    // ==================================================
    // APPEND
    // ==================================================

    button.appendChild(
        number
    );

    button.appendChild(
        content
    );

    button.appendChild(
        arrow
    );

    // ==================================================
    // CLICK
    // ==================================================

    if (unlocked) {

        button.addEventListener(
            "click",
            () => {

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
                        stage.stage_number
                    );

                window.location.href =
                    url;
            }
        );
    }

    stageList.appendChild(
        button
    );
}


// ======================================================
// LOGIN
// ======================================================

function goLogin() {
    window.location.href =
        "./index.html";
}
