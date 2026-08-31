document.addEventListener("DOMContentLoaded", initAdminStudentReport);

const adminToken = sessionStorage.getItem("admin_session_token");
const params = new URLSearchParams(window.location.search);
const studentId = params.get("student");

const el = id => document.getElementById(id);

async function initAdminStudentReport() {
    if (!adminToken || !studentId) {
        return fail("Sesi admin atau siswa tidak tersedia.");
    }

    try {
        const sessionCheck = await window.db.rpc("get_admin_session", { p_token: adminToken });
        if (sessionCheck.error || !sessionCheck.data || (Array.isArray(sessionCheck.data) && sessionCheck.data.length === 0)) {
            sessionStorage.removeItem("admin_session_token");
            window.location.href = "admin-login.html";
            return;
        }

        const [monitoringResult, additionResult, subtractionResult] = await Promise.all([
            window.db.rpc("get_admin_student_monitoring", {
                p_token: adminToken,
                p_class_name: "2"
            }),
            window.db.rpc("get_admin_student_addition_report", {
                p_token: adminToken,
                p_student_id: String(studentId)
            }),
            window.db.rpc("get_admin_student_subtraction_report", {
                p_token: adminToken,
                p_student_id: String(studentId)
            })
        ]);

        if (monitoringResult.error) throw monitoringResult.error;
        if (additionResult.error) throw additionResult.error;
        if (subtractionResult.error) throw subtractionResult.error;

        const monitoring = normalizeRows(monitoringResult.data);
        const student = monitoring.find(row => String(row.student_id) === String(studentId));

        if (!student) {
            throw new Error("Siswa tidak ditemukan pada monitoring admin.");
        }

        const addition = normalizeObject(additionResult.data) || {};
        const subtraction = normalizeObject(subtractionResult.data) || {};
        render(student, addition, subtraction);

        el("reportLoading").hidden = true;
        el("reportContent").hidden = false;
    } catch (error) {
        console.error("Admin student report:", error);
        fail(error?.message || "Laporan gagal dimuat.");
    }
}

function render(student, addition, subtraction) {
    el("studentName").textContent = student.full_name || "Siswa";
    el("studentStatus").textContent = student.activation_status || "-";
    el("lastPracticeAt").textContent = formatDateTime(student.last_practice_at);

    const multSessions = number(student.practice_sessions);
    const multMastered = number(student.mastered_levels);
    const multAccuracy = nullableNumber(student.overall_accuracy);
    const multResponse = nullableNumber(student.average_response_time_ms);

    const addSummary = addition.summary || {};
    const addSessions = number(addSummary.practice_sessions);
    const addMastered = number(addSummary.mastered_levels);
    const addAnswers = number(addSummary.total_answers);
    const addAccuracy = nullableNumber(addSummary.accuracy);
    const addResponse = nullableNumber(addSummary.average_response_time_ms);

    const subSummary = subtraction.summary || {};
    const subSessions = number(subSummary.practice_sessions);
    const subMastered = number(subSummary.mastered_levels);
    const subAnswers = number(subSummary.total_answers);
    const subAccuracy = nullableNumber(subSummary.accuracy);
    const subResponse = nullableNumber(subSummary.average_response_time_ms);

    const multAnswers = number(student.total_answers);
    const combinedAnswers = multAnswers + addAnswers + subAnswers;
    let combinedAccuracy = null;
    if (combinedAnswers > 0) {
        combinedAccuracy =
            ((multAccuracy || 0) * multAnswers +
             (addAccuracy || 0) * addAnswers +
             (subAccuracy || 0) * subAnswers) /
            combinedAnswers;
    }

    const totalSessions = multSessions + addSessions + subSessions;
    const totalMastered = multMastered + addMastered + subMastered;

    el("totalSessions").textContent = String(totalSessions);
    el("masteredLevels").textContent = String(totalMastered);
    el("overallAccuracy").textContent = combinedAccuracy === null ? "-" : `${Math.round(combinedAccuracy)}%`;

    let combinedResponse = null;
    if (multAnswers + addAnswers + subAnswers > 0) {
        const weighted =
            (multResponse || 0) * multAnswers +
            (addResponse || 0) * addAnswers +
            (subResponse || 0) * subAnswers;
        const weightedCount =
            (multResponse === null ? 0 : multAnswers) +
            (addResponse === null ? 0 : addAnswers) +
            (subResponse === null ? 0 : subAnswers);
        if (weightedCount > 0) combinedResponse = weighted / weightedCount;
    }
    el("averageResponse").textContent = formatResponse(combinedResponse);

    el("multiplicationSessions").textContent = String(multSessions);
    el("multiplicationMastered").textContent = String(multMastered);
    el("multiplicationAccuracy").textContent = multAccuracy === null ? "-" : `${Math.round(multAccuracy)}%`;
    el("multiplicationResponse").textContent = formatResponse(multResponse);

    el("additionTopicSummary").textContent = `${addMastered} level lulus`;
    renderTopicStages(
        "additionStages",
        Array.isArray(addition.stages) ? addition.stages : []
    );

    el("subtractionTopicSummary").textContent = `${subMastered} level lulus`;
    renderTopicStages(
        "subtractionStages",
        Array.isArray(subtraction.stages) ? subtraction.stages : []
    );
}

function renderTopicStages(rootId, stages) {
    const root = el(rootId);
    root.innerHTML = "";

    if (stages.length === 0) {
        root.innerHTML = `<p class="asr-never">Belum ada data level penjumlahan.</p>`;
        return;
    }

    stages.forEach(stage => {
        const article = document.createElement("article");
        article.className = "asr-stage";
        const levels = Array.isArray(stage.levels) ? stage.levels : [];
        const completed = levels.filter(level => level.is_completed === true).length;

        article.innerHTML = `
            <div class="asr-stage-head">
                <h3>Tingkat ${escapeHtml(stage.stage_number)}</h3>
                <span>${completed} / ${levels.length} level lulus</span>
            </div>
            <div class="asr-levels">
                <table class="asr-level-table">
                    <thead>
                        <tr>
                            <th>Level</th>
                            <th>Status</th>
                            <th>Skor terbaik</th>
                            <th>Percobaan</th>
                            <th>Sesi</th>
                            <th>Rata-rata respons</th>
                            <th>Terakhir</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${levels.map(level => {
                            const attempts = number(level.attempts);
                            const status = attempts === 0
                                ? `<span class="asr-never">Belum dicoba</span>`
                                : level.is_completed === true
                                    ? `<span class="asr-pass">Lulus</span>`
                                    : `<span class="asr-not-pass">Belum lulus</span>`;
                            return `
                                <tr>
                                    <td>L${escapeHtml(level.level_number)}</td>
                                    <td>${status}</td>
                                    <td>${attempts === 0 ? "-" : `${Math.round(number(level.best_score))}%`}</td>
                                    <td>${attempts}</td>
                                    <td>${number(level.practice_sessions)}</td>
                                    <td>${formatResponse(nullableNumber(level.average_response_time_ms))}</td>
                                    <td>${formatDateTime(level.last_practice_at)}</td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        `;
        root.appendChild(article);
    });
}

function normalizeRows(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === "string") {
        try { return normalizeRows(JSON.parse(data)); } catch { return []; }
    }
    return Array.isArray(data.rows) ? data.rows : [data];
}

function normalizeObject(data) {
    if (!data) return null;
    if (Array.isArray(data)) return data[0] || null;
    if (typeof data === "string") {
        try { return JSON.parse(data); } catch { return null; }
    }
    return data;
}

function number(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}
function nullableNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}
function formatResponse(ms) {
    const n = nullableNumber(ms);
    return n === null ? "-" : `${(n / 1000).toFixed(1)} dtk`;
}
function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date);
}
function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
function fail(message) {
    el("reportLoading").hidden = true;
    el("reportContent").hidden = true;
    el("reportErrorMessage").textContent = message;
    el("reportError").hidden = false;
}
