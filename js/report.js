// ======================================================
// LATIHAN SISWA
// STUDENT LEARNING REPORT V2
// ======================================================


document.addEventListener(
    "DOMContentLoaded",
    initLearningReport
);


// ======================================================
// DOM
// ======================================================

const reportLoading =
    document.getElementById(
        "reportLoading"
    );

const reportError =
    document.getElementById(
        "reportError"
    );

const reportErrorMessage =
    document.getElementById(
        "reportErrorMessage"
    );

const reportContent =
    document.getElementById(
        "reportContent"
    );


const studentName =
    document.getElementById(
        "studentName"
    );

const generatedAt =
    document.getElementById(
        "generatedAt"
    );


const masteredLevels =
    document.getElementById(
        "masteredLevels"
    );

const masteredProgressBar =
    document.getElementById(
        "masteredProgressBar"
    );

const overallAccuracy =
    document.getElementById(
        "overallAccuracy"
    );

const practiceSessions =
    document.getElementById(
        "practiceSessions"
    );

const averageResponse =
    document.getElementById(
        "averageResponse"
    );

const overallAnalysis =
    document.getElementById(
        "overallAnalysis"
    );


const stagesContainer =
    document.getElementById(
        "stagesContainer"
    );


const weakFactsContainer =
    document.getElementById(
        "weakFactsContainer"
    );

const strongFactsContainer =
    document.getElementById(
        "strongFactsContainer"
    );


const columnAnalysisSection =
    document.getElementById(
        "columnAnalysisSection"
    );

const partial1Accuracy =
    document.getElementById(
        "partial1Accuracy"
    );

const partial1Attempts =
    document.getElementById(
        "partial1Attempts"
    );

const partial2Accuracy =
    document.getElementById(
        "partial2Accuracy"
    );

const partial2Attempts =
    document.getElementById(
        "partial2Attempts"
    );

const finalAccuracy =
    document.getElementById(
        "finalAccuracy"
    );

const finalAttempts =
    document.getElementById(
        "finalAttempts"
    );

const columnAnalysisText =
    document.getElementById(
        "columnAnalysisText"
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
// FOCUS FROM PRACTICE
// ======================================================

const reportParams =
    new URLSearchParams(
        window.location.search
    );

const focusStage =
    Number(
        reportParams.get(
            "stage"
        )
    ) || null;

const focusLevel =
    Number(
        reportParams.get(
            "level"
        )
    ) || null;


// ======================================================
// INIT
// ======================================================

async function initLearningReport() {

    if (
        loginMode !== "student" ||
        !sessionToken
    ) {

        showReportError(
            "Laporan perkembangan hanya tersedia untuk siswa yang masuk menggunakan akun."
        );

        return;

    }


    try {

        const {
            data,
            error
        } = await window.db.rpc(
            "get_student_progress_report_v2",
            {
                p_token:
                    sessionToken
            }
        );


        if (error) {

            throw error;

        }


        const report =
            normalizeReportData(
                data
            );


        if (!report) {

            throw new Error(
                "Data laporan tidak tersedia."
            );

        }


        renderLearningReport(
            report
        );


        reportLoading.hidden =
            true;

        reportContent.hidden =
            false;


        scrollToFocusedStage();


    } catch (error) {

        console.error(
            "Learning report error:",
            error
        );


        const message =
            String(
                error?.message || ""
            );


        if (
            message
                .toLowerCase()
                .includes(
                    "sesi"
                )
        ) {

            sessionStorage.clear();

            window.location.href =
                "index.html";

            return;

        }


        showReportError(
            "Tidak dapat memuat laporan belajar. Silakan coba kembali."
        );

    }

}


// ======================================================
// NORMALIZE RPC RESULT
// ======================================================

function normalizeReportData(data) {

    if (!data) {

        return null;

    }


    if (
        Array.isArray(
            data
        )
    ) {

        return data[0] || null;

    }


    if (
        typeof data === "string"
    ) {

        try {

            return JSON.parse(
                data
            );

        } catch {

            return null;

        }

    }


    if (
        typeof data === "object"
    ) {

        return data;

    }


    return null;

}


// ======================================================
// RENDER
// ======================================================

function renderLearningReport(
    report
) {

    renderStudent(
        report
    );

    renderOverall(
        report
    );

    renderStages(
        report
    );

    renderFacts(
        report
    );

    renderColumnAnalysis(
        report
    );

}


// ======================================================
// STUDENT
// ======================================================

function renderStudent(
    report
) {

    const student =
        report.student || {};


    studentName.textContent =
        student.full_name ||
        "Siswa";


    generatedAt.textContent =
        formatDateTime(
            report.generated_at
        );

}


// ======================================================
// OVERALL
// ======================================================

function renderOverall(
    report
) {

    const overall =
        report.overall || {};


    const mastered =
        numberValue(
            overall.mastered_levels
        );


    const active =
        numberValue(
            overall.active_levels
        );


    const accuracy =
        numberValue(
            overall.accuracy
        );


    const sessions =
        numberValue(
            overall.practice_sessions
        );


    const avgResponse =
        nullableNumber(
            overall.average_response_time_ms
        );


    masteredLevels.textContent =
        `${mastered} / ${active}`;


    const progressPercent =
        active > 0

            ? Math.min(
                100,
                Math.max(
                    0,
                    (
                        mastered /
                        active
                    )
                    * 100
                )
            )

            : 0;


    masteredProgressBar.style.width =
        `${progressPercent}%`;


    overallAccuracy.textContent =
        `${roundDisplay(
            accuracy
        )}%`;


    practiceSessions.textContent =
        sessions;


    averageResponse.textContent =
        avgResponse !== null

            ? formatSeconds(
                avgResponse
            )

            : "-";


    overallAnalysis.textContent =
        buildOverallAnalysis(
            report
        );

}


// ======================================================
// OVERALL ANALYSIS
// ======================================================

function buildOverallAnalysis(
    report
) {

    const overall =
        report.overall || {};


    const totalAnswers =
        numberValue(
            overall.total_answers
        );


    const accuracy =
        numberValue(
            overall.accuracy
        );


    if (
        totalAnswers === 0
    ) {

        return "Belum ada cukup data latihan untuk membuat analisis. Selesaikan beberapa level terlebih dahulu.";

    }


    let analysis = "";


    if (
        accuracy >= 90
    ) {

        analysis =
            "Ketepatan jawaban secara keseluruhan sangat kuat.";

    } else if (
        accuracy >= 80
    ) {

        analysis =
            "Ketepatan jawaban secara keseluruhan sudah baik dan berada pada target kelulusan umum.";

    } else if (
        accuracy >= 70
    ) {

        analysis =
            "Kemampuan sudah mulai terbentuk, tetapi beberapa bagian masih perlu diperkuat sebelum melanjutkan terlalu cepat.";

    } else {

        analysis =
            "Ketepatan jawaban masih perlu diperkuat. Mengulang level yang belum dikuasai akan lebih bermanfaat sebelum meningkatkan kesulitan.";

    }


    const weak =
        getMeaningfulWeakFacts(
            report.weak_facts
        );


    if (
        weak.length > 0
    ) {

        const labels =
            weak
                .slice(
                    0,
                    3
                )
                .map(
                    fact =>
                        fact.label
                )
                .join(
                    ", "
                );


        analysis +=
            ` Fokus latihan yang paling terlihat saat ini: ${labels}.`;

    }


    return analysis;

}


// ======================================================
// STAGES
// ======================================================

function renderStages(
    report
) {

    const stages =
        Array.isArray(
            report.stages
        )
            ? report.stages
            : [];


    stagesContainer.innerHTML =
        "";


    if (
        stages.length === 0
    ) {

        stagesContainer.innerHTML =
            `
                <div class="fact-empty">
                    Belum ada data Tingkat yang tersedia.
                </div>
            `;

        return;

    }


    stages.forEach(
        stage => {

            stagesContainer.appendChild(
                createStageCard(
                    stage
                )
            );

        }
    );

}


// ======================================================
// CREATE STAGE
// ======================================================

function createStageCard(
    stage
) {

    const total =
        numberValue(
            stage.total_levels
        );


    const completed =
        numberValue(
            stage.completed_levels
        );


    const attempts =
        numberValue(
            stage.total_attempts
        );


    const averageAccuracy =
        nullableNumber(
            stage.average_best_accuracy
        );


    const averageTime =
        nullableNumber(
            stage.average_best_response_time_ms
        );


    const progress =
        total > 0

            ? (
                completed /
                total
            ) * 100

            : 0;


    const card =
        document.createElement(
            "article"
        );


    card.className =
        "stage-report-card";


    card.id =
        `stage-report-${stage.stage_number}`;


    if (
        focusStage ===
        Number(
            stage.stage_number
        )
    ) {

        card.classList.add(
            "stage-focus"
        );

    }


    const status =
        getStageStatus(
            stage,
            attempts
        );


    card.innerHTML = `

        <div class="stage-report-header">

            <div class="stage-report-title">

                <h3>
                    Tingkat ${escapeHtml(
                        stage.stage_number
                    )}
                    ${
                        stage.stage_name

                            ? ` · ${escapeHtml(
                                stage.stage_name
                            )}`

                            : ""
                    }
                </h3>

                <p>
                    ${escapeHtml(
                        stage.topic_name ||
                        "Perkalian"
                    )}
                </p>

            </div>

            <span
                class="stage-status ${status.className}"
            >
                ${status.label}
            </span>

        </div>


        <div class="stage-progress-row">

            <div class="stage-progress-track">

                <div
                    class="stage-progress-fill"
                    style="
                        width:
                        ${Math.min(
                            100,
                            Math.max(
                                0,
                                progress
                            )
                        )}%;
                    "
                ></div>

            </div>

            <span class="stage-progress-text">
                ${completed} / ${total} Level
            </span>

        </div>


        <div class="stage-stats">

            <span>
                Percobaan:
                <strong>
                    ${attempts}
                </strong>
            </span>

            <span>
                Rata-rata akurasi terbaik:
                <strong>
                    ${
                        averageAccuracy !== null

                            ? `${roundDisplay(
                                averageAccuracy
                            )}%`

                            : "-"
                    }
                </strong>
            </span>

            <span>
                Rata-rata respons terbaik:
                <strong>
                    ${
                        averageTime !== null

                            ? formatSeconds(
                                averageTime
                            )

                            : "-"
                    }
                </strong>
            </span>

        </div>


        <div class="stage-analysis">
            ${escapeHtml(
                buildStageAnalysis(
                    stage
                )
            )}
        </div>


        <div
            class="level-report-grid"
            data-level-container
        ></div>

    `;


    const levelContainer =
        card.querySelector(
            "[data-level-container]"
        );


    const levels =
        Array.isArray(
            stage.levels
        )
            ? stage.levels
            : [];


    levels.forEach(
        level => {

            levelContainer.appendChild(
                createLevelItem(
                    stage,
                    level
                )
            );

        }
    );


    return card;

}


// ======================================================
// STAGE STATUS
// ======================================================

function getStageStatus(
    stage,
    attempts
) {

    if (
        stage.is_completed === true
    ) {

        return {
            label:
                "Tingkat Selesai",

            className:
                "completed"
        };

    }


    if (
        attempts > 0
    ) {

        return {
            label:
                "Sedang Dipelajari",

            className:
                "progress"
        };

    }


    return {
        label:
            "Belum Dimulai",

        className:
            "not-started"
    };

}


// ======================================================
// STAGE ANALYSIS
// ======================================================

function buildStageAnalysis(
    stage
) {

    const levels =
        Array.isArray(
            stage.levels
        )
            ? stage.levels
            : [];


    const attempted =
        levels.filter(
            level =>
                numberValue(
                    level.attempts
                ) > 0
        );


    if (
        attempted.length === 0
    ) {

        return "Belum ada hasil latihan pada Tingkat ini.";

    }


    if (
        stage.is_completed === true
    ) {

        return "Semua Level pada Tingkat ini sudah pernah mencapai nilai kelulusan. Tingkat tetap dianggap dikuasai walaupun siswa mengulang dan mendapatkan skor lebih rendah.";

    }


    const needsAttention =
        attempted
            .filter(
                level =>
                    level.is_completed
                    !== true
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    numberValue(
                        a.best_accuracy
                    )
                    -
                    numberValue(
                        b.best_accuracy
                    )
            );


    if (
        needsAttention.length > 0
    ) {

        const names =
            needsAttention
                .slice(
                    0,
                    2
                )
                .map(
                    level =>
                        `Level ${level.level_number}`
                )
                .join(
                    " dan "
                );


        return `${names} masih perlu diulang karena belum mencapai target kelulusan.`;

    }


    return "Sebagian Level pada Tingkat ini sudah dikuasai. Lanjutkan Level berikutnya untuk menyelesaikan Tingkat.";

}


// ======================================================
// LEVEL
// ======================================================

function createLevelItem(
    stage,
    level
) {

    const item =
        document.createElement(
            "div"
        );


    const attempts =
        numberValue(
            level.attempts
        );


    const accuracy =
        numberValue(
            level.best_accuracy
        );


    const isCompleted =
        level.is_completed === true;


    item.className =
        "level-report-item";


    if (
        isCompleted
    ) {

        item.classList.add(
            "completed"
        );

    } else if (
        attempts > 0
    ) {

        item.classList.add(
            "attention"
        );

    }


    if (
        focusStage ===
            Number(
                stage.stage_number
            )

        &&

        focusLevel ===
            Number(
                level.level_number
            )
    ) {

        item.style.outline =
            "2px solid #2563eb";

    }


    let status =
        "Belum dikerjakan";


    if (
        isCompleted
    ) {

        status =
            "✓ Dikuasai";

    } else if (
        attempts > 0
    ) {

        status =
            "Perlu diulang";

    }


    item.innerHTML = `

        <span class="level-report-number">
            LEVEL
            ${escapeHtml(
                level.level_number
            )}
        </span>

        <span class="level-report-name">
            ${escapeHtml(
                level.level_name ||
                `Level ${level.level_number}`
            )}
        </span>

        <span class="level-report-status">
            ${status}
        </span>

        <span class="level-report-detail">

            ${
                attempts > 0

                    ? `
                        Percobaan ${attempts}
                        · Terbaik
                        ${roundDisplay(
                            accuracy
                        )}%
                    `

                    : "Belum ada hasil"
            }

        </span>

    `;


    return item;

}


// ======================================================
// FACTS
// ======================================================

function renderFacts(
    report
) {

    const weak =
        getMeaningfulWeakFacts(
            report.weak_facts
        );


    const strong =
        getMeaningfulStrongFacts(
            report.strong_facts
        );


    renderFactList(
        weakFactsContainer,
        weak,
        "weak"
    );


    renderFactList(
        strongFactsContainer,
        strong,
        "strong"
    );

}


// ======================================================
// FILTER FACTS
// ======================================================

function getMeaningfulWeakFacts(
    facts
) {

    if (
        !Array.isArray(
            facts
        )
    ) {

        return [];

    }


    return facts.filter(
        fact =>
            numberValue(
                fact.attempts
            ) >= 2

            &&

            numberValue(
                fact.accuracy
            ) < 80
    );

}


function getMeaningfulStrongFacts(
    facts
) {

    if (
        !Array.isArray(
            facts
        )
    ) {

        return [];

    }


    return facts.filter(
        fact =>
            numberValue(
                fact.attempts
            ) >= 2

            &&

            numberValue(
                fact.accuracy
            ) >= 90
    );

}


// ======================================================
// FACT LIST
// ======================================================

function renderFactList(
    container,
    facts,
    type
) {

    container.innerHTML =
        "";


    if (
        facts.length === 0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "fact-empty";


        empty.textContent =
            type === "weak"

                ? "Belum ada pola kelemahan yang cukup kuat untuk disimpulkan."

                : "Belum ada fakta yang memiliki cukup data untuk dikategorikan sangat kuat.";


        container.appendChild(
            empty
        );


        return;

    }


    facts
        .slice(
            0,
            8
        )
        .forEach(
            fact => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "fact-item";


                const responseTime =
                    nullableNumber(
                        fact.average_correct_response_time_ms
                    );


                item.innerHTML = `

                    <span class="fact-equation">
                        ${escapeHtml(
                            fact.label
                        )}
                    </span>

                    <span class="fact-meta">

                        <span class="fact-accuracy">
                            ${roundDisplay(
                                numberValue(
                                    fact.accuracy
                                )
                            )}%
                        </span>

                        <span class="fact-detail">

                            ${numberValue(
                                fact.attempts
                            )}
                            percobaan

                            ${
                                responseTime !== null

                                    ? ` · ${formatSeconds(
                                        responseTime
                                    )}`

                                    : ""
                            }

                        </span>

                    </span>

                `;


                container.appendChild(
                    item
                );

            }
        );

}


// ======================================================
// COLUMN ANALYSIS
// ======================================================

function renderColumnAnalysis(
    report
) {

    const analysis =
        report.column_analysis || {};


    if (
        analysis.available !== true
    ) {

        columnAnalysisSection.hidden =
            true;

        return;

    }


    columnAnalysisSection.hidden =
        false;


    const p1Accuracy =
        nullableNumber(
            analysis.partial_1_accuracy
        );


    const p2Accuracy =
        nullableNumber(
            analysis.partial_2_accuracy
        );


    const fAccuracy =
        nullableNumber(
            analysis.final_accuracy
        );


    const p1Attempts =
        numberValue(
            analysis.partial_1_attempts
        );


    const p2Attempts =
        numberValue(
            analysis.partial_2_attempts
        );


    const fAttempts =
        numberValue(
            analysis.final_attempts
        );


    partial1Accuracy.textContent =
        p1Accuracy !== null

            ? `${roundDisplay(
                p1Accuracy
            )}%`

            : "-";


    partial2Accuracy.textContent =
        p2Accuracy !== null

            ? `${roundDisplay(
                p2Accuracy
            )}%`

            : "-";


    finalAccuracy.textContent =
        fAccuracy !== null

            ? `${roundDisplay(
                fAccuracy
            )}%`

            : "-";


    partial1Attempts.textContent =
        `${p1Attempts} langkah dinilai`;


    partial2Attempts.textContent =
        `${p2Attempts} langkah dinilai`;


    finalAttempts.textContent =
        `${fAttempts} hasil dinilai`;


    columnAnalysisText.textContent =
        buildColumnAnalysisText(
            analysis
        );

}


// ======================================================
// COLUMN TEXT
// ======================================================

function buildColumnAnalysisText(
    analysis
) {

    const candidates = [];


    const p1 =
        nullableNumber(
            analysis.partial_1_accuracy
        );


    const p2 =
        nullableNumber(
            analysis.partial_2_accuracy
        );


    const final =
        nullableNumber(
            analysis.final_accuracy
        );


    if (p1 !== null) {

        candidates.push({
            name:
                "langkah perkalian satuan",

            accuracy:
                p1
        });

    }


    if (p2 !== null) {

        candidates.push({
            name:
                "langkah perkalian nilai puluhan",

            accuracy:
                p2
        });

    }


    if (final !== null) {

        candidates.push({
            name:
                "perhitungan hasil akhir",

            accuracy:
                final
        });

    }


    if (
        candidates.length === 0
    ) {

        return "Belum ada cukup data perkalian bersusun untuk dianalisis.";

    }


    candidates.sort(
        (
            a,
            b
        ) =>
            a.accuracy -
            b.accuracy
    );


    const weakest =
        candidates[0];


    if (
        weakest.accuracy >= 90
    ) {

        return "Ketiga bagian perkalian bersusun sudah menunjukkan ketepatan yang kuat. Pertahankan ketelitian saat kecepatan latihan meningkat.";

    }


    if (
        weakest.accuracy >= 80
    ) {

        return `Secara umum pengerjaan sudah baik. Bagian yang relatif paling perlu diperhatikan adalah ${weakest.name}.`;

    }


    return `Fokus latihan berikutnya sebaiknya pada ${weakest.name}, karena bagian tersebut memiliki ketepatan paling rendah dibanding langkah lainnya.`;

}


// ======================================================
// FOCUS SCROLL
// ======================================================

function scrollToFocusedStage() {

    if (!focusStage) {

        return;

    }


    window.setTimeout(
        () => {

            const element =
                document.getElementById(
                    `stage-report-${focusStage}`
                );


            if (!element) {

                return;

            }


            element.scrollIntoView({
                behavior:
                    "smooth",

                block:
                    "center"
            });

        },
        250
    );

}


// ======================================================
// ERROR
// ======================================================

function showReportError(
    message
) {

    reportLoading.hidden =
        true;

    reportContent.hidden =
        true;

    reportError.hidden =
        false;

    reportErrorMessage.textContent =
        message;

}


// ======================================================
// NUMBER HELPERS
// ======================================================

function numberValue(value) {

    const number =
        Number(
            value
        );


    return Number.isFinite(
        number
    )
        ? number
        : 0;

}


function nullableNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;

    }


    const number =
        Number(
            value
        );


    return Number.isFinite(
        number
    )
        ? number
        : null;

}


function roundDisplay(value) {

    return Math.round(
        numberValue(
            value
        )
    );

}


// ======================================================
// FORMAT
// ======================================================

function formatSeconds(
    milliseconds
) {

    const ms =
        Number(
            milliseconds
        );


    if (
        !Number.isFinite(
            ms
        )
    ) {

        return "-";

    }


    const seconds =
        ms / 1000;


    return `${
        seconds.toLocaleString(
            "id-ID",
            {
                minimumFractionDigits:
                    1,

                maximumFractionDigits:
                    1
            }
        )
    } detik`;

}


function formatDateTime(value) {

    if (!value) {

        return "-";

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return date.toLocaleString(
        "id-ID",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    );

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}
