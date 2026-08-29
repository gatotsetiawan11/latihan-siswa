// ======================================================
// LATIHAN SISWA
// ADMIN MONITORING V1
//
// Fungsi:
// - Memeriksa session administrator
// - Memuat monitoring siswa
// - Menampilkan ringkasan kelas
// - Pencarian siswa
// - Filter status aktivasi
// - Reset PIN siswa
// - Logout administrator
//
// Pilot saat ini:
// - Monitoring difokuskan pada class_name = "2"
// ======================================================


document.addEventListener(
    "DOMContentLoaded",
    initializeAdminDashboard
);


// ======================================================
// CONFIG
// ======================================================

const MONITORED_CLASS =
    "2";


// ======================================================
// DOM
// ======================================================

const adminDisplayName =
    document.getElementById(
        "adminDisplayName"
    );


const adminLogoutButton =
    document.getElementById(
        "adminLogoutButton"
    );


const refreshButton =
    document.getElementById(
        "refreshButton"
    );


const adminLoading =
    document.getElementById(
        "adminLoading"
    );


const adminError =
    document.getElementById(
        "adminError"
    );


const adminErrorMessage =
    document.getElementById(
        "adminErrorMessage"
    );


const adminContent =
    document.getElementById(
        "adminContent"
    );


const summaryTotalStudents =
    document.getElementById(
        "summaryTotalStudents"
    );


const summaryActivated =
    document.getElementById(
        "summaryActivated"
    );


const summaryNotActivated =
    document.getElementById(
        "summaryNotActivated"
    );


const summaryPracticed =
    document.getElementById(
        "summaryPracticed"
    );


const summaryAccuracy =
    document.getElementById(
        "summaryAccuracy"
    );


const studentSearchInput =
    document.getElementById(
        "studentSearchInput"
    );


const activationFilter =
    document.getElementById(
        "activationFilter"
    );


const visibleStudentCount =
    document.getElementById(
        "visibleStudentCount"
    );


const studentTableBody =
    document.getElementById(
        "studentTableBody"
    );


const emptyStudents =
    document.getElementById(
        "emptyStudents"
    );


const resetPinModal =
    document.getElementById(
        "resetPinModal"
    );


const resetStudentName =
    document.getElementById(
        "resetStudentName"
    );


const cancelResetButton =
    document.getElementById(
        "cancelResetButton"
    );


const confirmResetButton =
    document.getElementById(
        "confirmResetButton"
    );


const adminToast =
    document.getElementById(
        "adminToast"
    );


// ======================================================
// STATE
// ======================================================

let adminToken =
    null;


let students =
    [];


let selectedStudent =
    null;


let toastTimer =
    null;


// ======================================================
// INITIALIZE
// ======================================================

async function initializeAdminDashboard() {

    // --------------------------------------------------
    // Pastikan elemen halaman tersedia
    // --------------------------------------------------

    if (
        !adminDisplayName ||
        !adminLogoutButton ||
        !refreshButton ||
        !adminLoading ||
        !adminError ||
        !adminErrorMessage ||
        !adminContent ||
        !summaryTotalStudents ||
        !summaryActivated ||
        !summaryNotActivated ||
        !summaryPracticed ||
        !summaryAccuracy ||
        !studentSearchInput ||
        !activationFilter ||
        !visibleStudentCount ||
        !studentTableBody ||
        !emptyStudents ||
        !resetPinModal ||
        !resetStudentName ||
        !cancelResetButton ||
        !confirmResetButton ||
        !adminToast
    ) {

        console.error(
            "Elemen dashboard admin tidak lengkap."
        );

        return;

    }


    // --------------------------------------------------
    // Ambil token admin
    // --------------------------------------------------

    adminToken =
        sessionStorage.getItem(
            "admin_session_token"
        );


    if (
        !adminToken
    ) {

        redirectToAdminLogin();

        return;

    }


    // --------------------------------------------------
    // Event
    // --------------------------------------------------

    bindAdminEvents();


    // --------------------------------------------------
    // Validasi session
    // --------------------------------------------------

    setLoading(
        true
    );


    const sessionValid =
        await validateAdminSession();


    if (
        !sessionValid
    ) {

        clearAdminSession();

        redirectToAdminLogin();

        return;

    }


    // --------------------------------------------------
    // Load siswa
    // --------------------------------------------------

    await loadStudents();

}


// ======================================================
// BIND EVENTS
// ======================================================

function bindAdminEvents() {

    // --------------------------------------------------
    // Logout
    // --------------------------------------------------

    adminLogoutButton.addEventListener(
        "click",
        logoutAdmin
    );


    // --------------------------------------------------
    // Refresh
    // --------------------------------------------------

    refreshButton.addEventListener(
        "click",
        loadStudents
    );


    // --------------------------------------------------
    // Search
    // --------------------------------------------------

    studentSearchInput.addEventListener(
        "input",
        renderFilteredStudents
    );


    // --------------------------------------------------
    // Filter
    // --------------------------------------------------

    activationFilter.addEventListener(
        "change",
        renderFilteredStudents
    );


    // --------------------------------------------------
    // Cancel reset
    // --------------------------------------------------

    cancelResetButton.addEventListener(
        "click",
        closeResetModal
    );


    // --------------------------------------------------
    // Confirm reset
    // --------------------------------------------------

    confirmResetButton.addEventListener(
        "click",
        confirmResetPin
    );


    // --------------------------------------------------
    // Klik area luar modal
    // --------------------------------------------------

    resetPinModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                resetPinModal
            ) {

                closeResetModal();

            }

        }
    );


    // --------------------------------------------------
    // Escape
    // --------------------------------------------------

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                !resetPinModal.hidden
            ) {

                closeResetModal();

            }

        }
    );

}


// ======================================================
// VALIDATE ADMIN SESSION
// ======================================================

async function validateAdminSession() {

    try {

        if (
            !window.db
        ) {

            console.error(
                "Supabase client tidak tersedia."
            );

            return false;

        }


        const {
            data,
            error
        } =
            await window.db.rpc(
                "get_admin_session",
                {
                    p_token:
                        adminToken
                }
            );


        if (
            error
        ) {

            console.error(
                "Admin session error:",
                error
            );

            return false;

        }


        const result =
            normalizeRpcSingleResult(
                data
            );


        if (
            !result ||
            result.valid !== true
        ) {

            return false;

        }


        // --------------------------------------------------
        // Nama administrator
        // --------------------------------------------------

        const displayName =
            result.display_name ||
            sessionStorage.getItem(
                "admin_display_name"
            ) ||
            "Administrator";


        adminDisplayName.textContent =
            displayName;


        sessionStorage.setItem(
            "admin_display_name",
            displayName
        );


        return true;


    } catch (error) {

        console.error(
            "Admin session validation failed:",
            error
        );


        return false;

    }

}


// ======================================================
// LOAD STUDENTS
// ======================================================

async function loadStudents() {

    hideError();


    setLoading(
        true
    );


    refreshButton.disabled =
        true;


    try {

        if (
            !window.db
        ) {

            throw new Error(
                "Supabase client tidak tersedia."
            );

        }


        const {
            data,
            error
        } =
            await window.db.rpc(
                "get_admin_student_monitoring",
                {
                    p_token:
                        adminToken,

                    p_class_name:
                        MONITORED_CLASS
                }
            );


        if (
            error
        ) {

            throw error;

        }


        students =
            normalizeStudentArray(
                data
            );


        // --------------------------------------------------
        // Reset pencarian/filter tidak dilakukan.
        // Jadi saat refresh guru tetap berada pada
        // pencarian yang sama.
        // --------------------------------------------------

        renderSummary();


        renderFilteredStudents();


        adminContent.hidden =
            false;


    } catch (error) {

        console.error(
            "Admin monitoring error:",
            error
        );


        if (
            isInvalidAdminSessionError(
                error
            )
        ) {

            clearAdminSession();

            redirectToAdminLogin();

            return;

        }


        showError(
            getFriendlyMonitoringError(
                error
            )
        );


    } finally {

        setLoading(
            false
        );


        refreshButton.disabled =
            false;

    }

}


// ======================================================
// NORMALIZE STUDENT ARRAY
// ======================================================

function normalizeStudentArray(
    data
) {

    if (
        data === null ||
        data === undefined
    ) {

        return [];

    }


    // --------------------------------------------------
    // JSONB Supabase biasanya langsung menjadi Array
    // --------------------------------------------------

    if (
        Array.isArray(
            data
        )
    ) {

        return data;

    }


    // --------------------------------------------------
    // Jika response berupa string JSON
    // --------------------------------------------------

    if (
        typeof data ===
        "string"
    ) {

        try {

            const parsed =
                JSON.parse(
                    data
                );


            return Array.isArray(
                parsed
            )
                ? parsed
                : [];


        } catch (error) {

            console.error(
                "Tidak dapat membaca data monitoring:",
                error
            );


            return [];

        }

    }


    // --------------------------------------------------
    // Beberapa client dapat membungkus result
    // --------------------------------------------------

    if (
        typeof data ===
        "object"
    ) {

        if (
            Array.isArray(
                data.students
            )
        ) {

            return data.students;

        }


        if (
            Array.isArray(
                data.data
            )
        ) {

            return data.data;

        }

    }


    return [];

}


// ======================================================
// NORMALIZE SINGLE RPC
// ======================================================

function normalizeRpcSingleResult(
    data
) {

    if (
        !data
    ) {

        return null;

    }


    if (
        Array.isArray(
            data
        )
    ) {

        return data.length > 0
            ? data[0]
            : null;

    }


    if (
        typeof data ===
        "object"
    ) {

        return data;

    }


    if (
        typeof data ===
        "string"
    ) {

        try {

            const parsed =
                JSON.parse(
                    data
                );


            if (
                Array.isArray(
                    parsed
                )
            ) {

                return parsed.length > 0
                    ? parsed[0]
                    : null;

            }


            return (
                parsed &&
                typeof parsed ===
                    "object"
            )
                ? parsed
                : null;


        } catch {

            return null;

        }

    }


    return null;

}


// ======================================================
// SUMMARY
// ======================================================

function renderSummary() {

    const totalStudents =
        students.length;


    const activatedStudents =
        students.filter(
            student =>
                student.activation_status ===
                "Sudah aktivasi"
        ).length;


    const notActivatedStudents =
        students.filter(
            student =>
                student.activation_status !==
                "Sudah aktivasi"
        ).length;


    const practicedStudents =
        students.filter(
            student =>
                numberValue(
                    student.practice_sessions
                ) > 0
        ).length;


    // ==================================================
    // RATA-RATA AKURASI KELAS
    //
    // Hanya siswa yang sudah memiliki jawaban
    // yang dihitung.
    // ==================================================

    const studentsWithAnswers =
        students.filter(
            student =>
                numberValue(
                    student.total_answers
                ) > 0
        );


    let averageAccuracy =
        null;


    if (
        studentsWithAnswers.length > 0
    ) {

        const accuracyTotal =
            studentsWithAnswers.reduce(
                (
                    total,
                    student
                ) => {

                    return (
                        total +
                        numberValue(
                            student.overall_accuracy
                        )
                    );

                },
                0
            );


        averageAccuracy =
            accuracyTotal /
            studentsWithAnswers.length;

    }


    summaryTotalStudents.textContent =
        totalStudents;


    summaryActivated.textContent =
        activatedStudents;


    summaryNotActivated.textContent =
        notActivatedStudents;


    summaryPracticed.textContent =
        practicedStudents;


    summaryAccuracy.textContent =
        averageAccuracy === null
            ? "-"
            : `${Math.round(
                averageAccuracy
            )}%`;

}


// ======================================================
// FILTER STUDENTS
// ======================================================

function renderFilteredStudents() {

    const searchText =
        studentSearchInput.value
            .trim()
            .toLowerCase();


    const selectedStatus =
        activationFilter.value;


    const filteredStudents =
        students.filter(
            student => {

                const studentName =
                    String(
                        student.full_name ||
                        ""
                    )
                        .toLowerCase();


                // ------------------------------------------
                // Search
                // ------------------------------------------

                const matchesSearch =
                    searchText === ""
                    ||
                    studentName.includes(
                        searchText
                    );


                // ------------------------------------------
                // Status
                // ------------------------------------------

                const matchesStatus =
                    selectedStatus ===
                        "all"
                    ||
                    student.activation_status ===
                        selectedStatus;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    renderStudentTable(
        filteredStudents
    );

}


// ======================================================
// RENDER STUDENT TABLE
// ======================================================

function renderStudentTable(
    studentList
) {

    studentTableBody.innerHTML =
        "";


    visibleStudentCount.textContent =
        studentList.length;


    // --------------------------------------------------
    // Empty
    // --------------------------------------------------

    if (
        studentList.length === 0
    ) {

        emptyStudents.hidden =
            false;


        return;

    }


    emptyStudents.hidden =
        true;


    // --------------------------------------------------
    // Rows
    // --------------------------------------------------

    studentList.forEach(
        student => {

            const row =
                createStudentRow(
                    student
                );


            studentTableBody.appendChild(
                row
            );

        }
    );

}


// ======================================================
// CREATE STUDENT ROW
// ======================================================

function createStudentRow(
    student
) {

    const row =
        document.createElement(
            "tr"
        );


    const activationStatus =
        String(
            student.activation_status ||
            "-"
        );


    const statusClass =
        getStatusClass(
            activationStatus
        );


    const practiceSessions =
        numberValue(
            student.practice_sessions
        );


    const masteredLevels =
        numberValue(
            student.mastered_levels
        );


    const totalAnswers =
        numberValue(
            student.total_answers
        );


    const accuracy =
        numberValue(
            student.overall_accuracy
        );


    const accuracyClass =
        getAccuracyClass(
            accuracy,
            totalAnswers
        );


    const averageResponse =
        nullableNumber(
            student.average_response_time_ms
        );


    // ==================================================
    // HTML
    // ==================================================

    row.innerHTML = `

        <td>

            <span class="admin-student-name">
                ${escapeHtml(
                    student.full_name ||
                    "Siswa"
                )}
            </span>

        </td>


        <td>

            <span
                class="
                    admin-status
                    ${statusClass}
                "
            >
                ${escapeHtml(
                    activationStatus
                )}
            </span>

        </td>


        <td>
            ${practiceSessions}
        </td>


        <td>
            ${masteredLevels}
        </td>


        <td>

            ${
                totalAnswers > 0

                    ? `
                        <span
                            class="
                                admin-accuracy
                                ${accuracyClass}
                            "
                        >
                            ${Math.round(
                                accuracy
                            )}%
                        </span>
                    `

                    : "-"
            }

        </td>


        <td>

            ${
                averageResponse !== null

                    ? formatResponseTime(
                        averageResponse
                    )

                    : "-"
            }

        </td>


        <td>
            ${formatDateTime(
                student.last_practice_at
            )}
        </td>


        <td>

            <button
                class="admin-reset-button"
                type="button"
            >
                Reset PIN
            </button>

        </td>

    `;


    // ==================================================
    // RESET BUTTON
    // ==================================================

    const resetButton =
        row.querySelector(
            ".admin-reset-button"
        );


    if (
        resetButton
    ) {

        resetButton.addEventListener(
            "click",
            () => {

                openResetModal(
                    student
                );

            }
        );

    }


    return row;

}


// ======================================================
// STATUS CLASS
// ======================================================

function getStatusClass(
    status
) {

    if (
        status ===
        "Sudah aktivasi"
    ) {

        return "active";

    }


    if (
        status ===
        "Belum aktivasi"
    ) {

        return "pending";

    }


    return "inactive";

}


// ======================================================
// ACCURACY CLASS
// ======================================================

function getAccuracyClass(
    accuracy,
    totalAnswers
) {

    if (
        numberValue(
            totalAnswers
        ) === 0
    ) {

        return "";

    }


    if (
        accuracy >= 80
    ) {

        return "good";

    }


    if (
        accuracy >= 60
    ) {

        return "medium";

    }


    return "low";

}


// ======================================================
// OPEN RESET MODAL
// ======================================================

function openResetModal(
    student
) {

    if (
        !student ||
        !student.student_id
    ) {

        showToast(
            "Data siswa tidak lengkap."
        );


        return;

    }


    selectedStudent =
        student;


    resetStudentName.textContent =
        student.full_name ||
        "siswa";


    confirmResetButton.disabled =
        false;


    cancelResetButton.disabled =
        false;


    confirmResetButton.textContent =
        "Reset PIN";


    resetPinModal.hidden =
        false;

}


// ======================================================
// CLOSE RESET MODAL
// ======================================================

function closeResetModal() {

    resetPinModal.hidden =
        true;


    selectedStudent =
        null;


    confirmResetButton.disabled =
        false;


    cancelResetButton.disabled =
        false;


    confirmResetButton.textContent =
        "Reset PIN";

}


// ======================================================
// CONFIRM RESET PIN
// ======================================================

async function confirmResetPin() {

    if (
        !selectedStudent ||
        !selectedStudent.student_id
    ) {

        return;

    }


    const studentId =
        selectedStudent.student_id;


    const studentName =
        selectedStudent.full_name ||
        "Siswa";


    // --------------------------------------------------
    // Disable buttons
    // --------------------------------------------------

    confirmResetButton.disabled =
        true;


    cancelResetButton.disabled =
        true;


    confirmResetButton.textContent =
        "Memproses...";


    try {

        const {
            data,
            error
        } =
            await window.db.rpc(
                "admin_reset_student_pin_by_id",
                {
                    p_token:
                        adminToken,

                    p_student_id:
                        studentId
                }
            );


        if (
            error
        ) {

            throw error;

        }


        const result =
            normalizeRpcSingleResult(
                data
            );


        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                "Reset PIN tidak berhasil."
            );

        }


        // ==================================================
        // SUCCESS
        // ==================================================

        closeResetModal();


        showToast(
            `PIN ${studentName} berhasil direset menjadi 123456.`
        );


        // --------------------------------------------------
        // Refresh monitoring
        // --------------------------------------------------

        await loadStudents();


    } catch (error) {

        console.error(
            "Reset PIN error:",
            error
        );


        if (
            isInvalidAdminSessionError(
                error
            )
        ) {

            clearAdminSession();

            redirectToAdminLogin();

            return;

        }


        showToast(
            "Reset PIN gagal. Silakan coba kembali."
        );


    } finally {

        confirmResetButton.disabled =
            false;


        cancelResetButton.disabled =
            false;


        confirmResetButton.textContent =
            "Reset PIN";

    }

}


// ======================================================
// LOGOUT ADMIN
// ======================================================

async function logoutAdmin() {

    adminLogoutButton.disabled =
        true;


    refreshButton.disabled =
        true;


    try {

        if (
            adminToken &&
            window.db
        ) {

            await window.db.rpc(
                "admin_logout",
                {
                    p_token:
                        adminToken
                }
            );

        }


    } catch (error) {

        /*
         * Logout browser tetap dilakukan meskipun
         * request ke server gagal.
         */

        console.error(
            "Admin logout error:",
            error
        );

    }


    clearAdminSession();


    redirectToAdminLogin();

}


// ======================================================
// CLEAR ADMIN SESSION
// ======================================================

function clearAdminSession() {

    sessionStorage.removeItem(
        "admin_session_token"
    );


    sessionStorage.removeItem(
        "admin_display_name"
    );


    adminToken =
        null;

}


// ======================================================
// REDIRECT
// ======================================================

function redirectToAdminLogin() {

    window.location.replace(
        "admin-login.html"
    );

}


// ======================================================
// LOADING
// ======================================================

function setLoading(
    loading
) {

    adminLoading.hidden =
        !loading;


    if (
        loading
    ) {

        adminContent.hidden =
            true;

    }

}


// ======================================================
// ERROR
// ======================================================

function showError(
    message
) {

    adminError.hidden =
        false;


    adminErrorMessage.textContent =
        message;

}


function hideError() {

    adminError.hidden =
        true;


    adminErrorMessage.textContent =
        "";

}


// ======================================================
// INVALID ADMIN SESSION ERROR
// ======================================================

function isInvalidAdminSessionError(
    error
) {

    const message =
        String(
            error?.message ||
            ""
        ).toLowerCase();


    return (
        message.includes(
            "sesi admin"
        )
        ||
        message.includes(
            "session admin"
        )
        ||
        message.includes(
            "kedaluwarsa"
        )
    );

}


// ======================================================
// FRIENDLY MONITORING ERROR
// ======================================================

function getFriendlyMonitoringError(
    error
) {

    const message =
        String(
            error?.message ||
            ""
        ).toLowerCase();


    if (
        message.includes(
            "get_admin_student_monitoring"
        )
        &&
        (
            message.includes(
                "function"
            )
            ||
            message.includes(
                "schema cache"
            )
        )
    ) {

        return "Fungsi monitoring admin belum tersedia di server.";

    }


    if (
        message.includes(
            "fetch"
        )
        ||
        message.includes(
            "network"
        )
    ) {

        return "Tidak dapat terhubung ke server. Periksa koneksi internet lalu coba kembali.";

    }


    return "Data siswa gagal dimuat. Silakan tekan Perbarui Data.";

}


// ======================================================
// TOAST
// ======================================================

function showToast(
    message
) {

    if (
        toastTimer
    ) {

        window.clearTimeout(
            toastTimer
        );

    }


    adminToast.textContent =
        message;


    adminToast.hidden =
        false;


    toastTimer =
        window.setTimeout(
            () => {

                adminToast.hidden =
                    true;


                toastTimer =
                    null;

            },
            3500
        );

}


// ======================================================
// NUMBER VALUE
// ======================================================

function numberValue(
    value
) {

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


// ======================================================
// NULLABLE NUMBER
// ======================================================

function nullableNumber(
    value
) {

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


// ======================================================
// RESPONSE TIME
// ======================================================

function formatResponseTime(
    milliseconds
) {

    const number =
        Number(
            milliseconds
        );


    if (
        !Number.isFinite(
            number
        )
    ) {

        return "-";

    }


    const seconds =
        number / 1000;


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


// ======================================================
// DATE TIME
// ======================================================

function formatDateTime(
    value
) {

    if (
        !value
    ) {

        return "Belum pernah";

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

function escapeHtml(
    value
) {

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
