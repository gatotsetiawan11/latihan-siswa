// ======================================================
// LATIHAN SISWA
// ADMIN DASHBOARD V2
//
// Fitur:
// - Validasi session admin
// - Monitoring siswa
// - Ringkasan progress
// - Cari siswa
// - Filter aktivasi
// - Reset PIN siswa
// - Melihat pendaftaran pending
// - Approve pendaftaran
// - Reject pendaftaran
// - Logout admin
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
// DOM - HEADER
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


// ======================================================
// DOM - PAGE STATE
// ======================================================

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


// ======================================================
// DOM - SUMMARY
// ======================================================

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


// ======================================================
// DOM - REGISTRATION
// ======================================================

const pendingRegistrationCount =
    document.getElementById(
        "pendingRegistrationCount"
    );


const pendingRegistrationList =
    document.getElementById(
        "pendingRegistrationList"
    );


const pendingRegistrationEmpty =
    document.getElementById(
        "pendingRegistrationEmpty"
    );


// ======================================================
// DOM - STUDENT FILTER
// ======================================================

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


// ======================================================
// DOM - STUDENT TABLE
// ======================================================

const studentTableBody =
    document.getElementById(
        "studentTableBody"
    );


const emptyStudents =
    document.getElementById(
        "emptyStudents"
    );


// ======================================================
// DOM - RESET PIN
// ======================================================

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


// ======================================================
// DOM - APPROVE
// ======================================================

const approveRegistrationModal =
    document.getElementById(
        "approveRegistrationModal"
    );


const approveRegistrationName =
    document.getElementById(
        "approveRegistrationName"
    );


const cancelApproveButton =
    document.getElementById(
        "cancelApproveButton"
    );


const confirmApproveButton =
    document.getElementById(
        "confirmApproveButton"
    );


// ======================================================
// DOM - REJECT
// ======================================================

const rejectRegistrationModal =
    document.getElementById(
        "rejectRegistrationModal"
    );


const rejectRegistrationName =
    document.getElementById(
        "rejectRegistrationName"
    );


const rejectReason =
    document.getElementById(
        "rejectReason"
    );


const cancelRejectButton =
    document.getElementById(
        "cancelRejectButton"
    );


const confirmRejectButton =
    document.getElementById(
        "confirmRejectButton"
    );


// ======================================================
// DOM - TOAST
// ======================================================

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


let pendingRegistrations =
    [];


let selectedStudent =
    null;


let selectedRegistration =
    null;


let toastTimer =
    null;


// ======================================================
// INITIALIZE
// ======================================================

async function initializeAdminDashboard() {

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


    bindEvents();


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


    await loadDashboardData();

}


// ======================================================
// EVENTS
// ======================================================

function bindEvents() {

    adminLogoutButton.addEventListener(
        "click",
        logoutAdmin
    );


    refreshButton.addEventListener(
        "click",
        loadDashboardData
    );


    studentSearchInput.addEventListener(
        "input",
        renderFilteredStudents
    );


    activationFilter.addEventListener(
        "change",
        renderFilteredStudents
    );


    cancelResetButton.addEventListener(
        "click",
        closeResetModal
    );


    confirmResetButton.addEventListener(
        "click",
        confirmResetPin
    );


    cancelApproveButton.addEventListener(
        "click",
        closeApproveModal
    );


    confirmApproveButton.addEventListener(
        "click",
        confirmApproveRegistration
    );


    cancelRejectButton.addEventListener(
        "click",
        closeRejectModal
    );


    confirmRejectButton.addEventListener(
        "click",
        confirmRejectRegistration
    );


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


    approveRegistrationModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                approveRegistrationModal
            ) {

                closeApproveModal();

            }

        }
    );


    rejectRegistrationModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                rejectRegistrationModal
            ) {

                closeRejectModal();

            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }


            if (
                !resetPinModal.hidden
            ) {

                closeResetModal();

            }


            if (
                !approveRegistrationModal.hidden
            ) {

                closeApproveModal();

            }


            if (
                !rejectRegistrationModal.hidden
            ) {

                closeRejectModal();

            }

        }
    );

}


// ======================================================
// VALIDATE ADMIN SESSION
// ======================================================

async function validateAdminSession() {

    try {

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
            normalizeSingleResult(
                data
            );


        if (
            !result ||
            result.valid !== true
        ) {

            return false;

        }


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
            "Admin session validation error:",
            error
        );


        return false;

    }

}


// ======================================================
// LOAD DASHBOARD
// ======================================================

async function loadDashboardData() {

    hideError();


    setLoading(
        true
    );


    refreshButton.disabled =
        true;


    try {

        await Promise.all([

            loadStudents(),

            loadPendingRegistrations()

        ]);


        renderSummary();


        renderFilteredStudents();


        renderPendingRegistrations();


        adminContent.hidden =
            false;


    } catch (error) {

        console.error(
            "Admin dashboard load error:",
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
            "Data admin gagal dimuat. Silakan tekan Perbarui Data."
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
// LOAD STUDENTS
// ======================================================

async function loadStudents() {

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
        normalizeArrayResult(
            data
        );

}


// ======================================================
// LOAD REGISTRATIONS
// ======================================================

async function loadPendingRegistrations() {

    const {
        data,
        error
    } =
        await window.db.rpc(
            "get_admin_pending_registrations",
            {
                p_token:
                    adminToken
            }
        );


    if (
        error
    ) {

        throw error;

    }


    pendingRegistrations =
        normalizeArrayResult(
            data
        );

}


// ======================================================
// SUMMARY
// ======================================================

function renderSummary() {

    const total =
        students.length;


    const activated =
        students.filter(
            student =>
                student.activation_status ===
                "Sudah aktivasi"
        ).length;


    const notActivated =
        students.filter(
            student =>
                student.activation_status !==
                "Sudah aktivasi"
        ).length;


    const practiced =
        students.filter(
            student =>
                numberValue(
                    student.practice_sessions
                ) > 0
        ).length;


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

        const totalAccuracy =
            studentsWithAnswers.reduce(
                (
                    totalValue,
                    student
                ) => {

                    return (
                        totalValue +
                        numberValue(
                            student.overall_accuracy
                        )
                    );

                },
                0
            );


        averageAccuracy =
            totalAccuracy /
            studentsWithAnswers.length;

    }


    summaryTotalStudents.textContent =
        total;


    summaryActivated.textContent =
        activated;


    summaryNotActivated.textContent =
        notActivated;


    summaryPracticed.textContent =
        practiced;


    summaryAccuracy.textContent =
        averageAccuracy === null
            ? "-"
            : `${Math.round(
                averageAccuracy
            )}%`;

}


// ======================================================
// RENDER PENDING REGISTRATIONS
// ======================================================

function renderPendingRegistrations() {

    pendingRegistrationList.innerHTML =
        "";


    pendingRegistrationCount.textContent =
        pendingRegistrations.length;


    if (
        pendingRegistrations.length === 0
    ) {

        pendingRegistrationEmpty.hidden =
            false;


        return;

    }


    pendingRegistrationEmpty.hidden =
        true;


    pendingRegistrations.forEach(
        registration => {

            const card =
                createRegistrationCard(
                    registration
                );


            pendingRegistrationList.appendChild(
                card
            );

        }
    );

}


// ======================================================
// CREATE REGISTRATION CARD
// ======================================================

function createRegistrationCard(
    registration
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "registration-card";


    card.innerHTML = `

        <div class="registration-main">

            <div class="registration-avatar">
                ${getInitial(
                    registration.full_name
                )}
            </div>


            <div>

                <strong class="registration-name">
                    ${escapeHtml(
                        registration.full_name ||
                        "Siswa"
                    )}
                </strong>


                <div class="registration-meta">

                    <span>
                        NISN:
                        <strong>
                            ${escapeHtml(
                                registration.nisn_masked ||
                                "-"
                            )}
                        </strong>
                    </span>


                    <span>
                        WhatsApp:
                        <strong>
                            ${escapeHtml(
                                registration.whatsapp_masked ||
                                "Tidak diisi"
                            )}
                        </strong>
                    </span>


                    <span>
                        Daftar:
                        <strong>
                            ${escapeHtml(
                                formatDateTime(
                                    registration.created_at
                                )
                            )}
                        </strong>
                    </span>

                </div>

            </div>

        </div>


        <div class="registration-actions">

            <button
                type="button"
                class="registration-reject-button"
            >
                Tolak
            </button>


            <button
                type="button"
                class="registration-approve-button"
            >
                Setujui
            </button>

        </div>

    `;


    const approveButton =
        card.querySelector(
            ".registration-approve-button"
        );


    const rejectButton =
        card.querySelector(
            ".registration-reject-button"
        );


    approveButton.addEventListener(
        "click",
        () => {

            openApproveModal(
                registration
            );

        }
    );


    rejectButton.addEventListener(
        "click",
        () => {

            openRejectModal(
                registration
            );

        }
    );


    return card;

}


// ======================================================
// STUDENT FILTER
// ======================================================

function renderFilteredStudents() {

    const search =
        studentSearchInput.value
            .trim()
            .toLowerCase();


    const status =
        activationFilter.value;


    const filtered =
        students.filter(
            student => {

                const name =
                    String(
                        student.full_name ||
                        ""
                    ).toLowerCase();


                const matchesSearch =
                    search === ""
                    ||
                    name.includes(
                        search
                    );


                const matchesStatus =
                    status === "all"
                    ||
                    student.activation_status ===
                        status;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    renderStudentTable(
        filtered
    );

}


// ======================================================
// STUDENT TABLE
// ======================================================

function renderStudentTable(
    studentList
) {

    studentTableBody.innerHTML =
        "";


    visibleStudentCount.textContent =
        studentList.length;


    if (
        studentList.length === 0
    ) {

        emptyStudents.hidden =
            false;


        return;

    }


    emptyStudents.hidden =
        true;


    studentList.forEach(
        student => {

            studentTableBody.appendChild(
                createStudentRow(
                    student
                )
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


    const totalAnswers =
        numberValue(
            student.total_answers
        );


    const accuracy =
        numberValue(
            student.overall_accuracy
        );


    const averageResponse =
        nullableNumber(
            student.average_response_time_ms
        );


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
                    ${getStatusClass(
                        student.activation_status
                    )}
                "
            >
                ${escapeHtml(
                    student.activation_status ||
                    "-"
                )}
            </span>

        </td>


        <td>
            ${numberValue(
                student.practice_sessions
            )}
        </td>


        <td>
            ${numberValue(
                student.mastered_levels
            )}
        </td>


        <td>

            ${
                totalAnswers > 0

                    ? `
                        <span
                            class="
                                admin-accuracy
                                ${getAccuracyClass(
                                    accuracy
                                )}
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
            ${escapeHtml(
                formatDateTime(
                    student.last_practice_at
                )
            )}
        </td>


        <td>

            <button
                type="button"
                class="admin-reset-button"
            >
                Reset PIN
            </button>

        </td>

    `;


    row
        .querySelector(
            ".admin-reset-button"
        )
        .addEventListener(
            "click",
            () => {

                openResetModal(
                    student
                );

            }
        );


    return row;

}


// ======================================================
// RESET PIN MODAL
// ======================================================

function openResetModal(
    student
) {

    if (
        !student?.student_id
    ) {

        return;

    }


    selectedStudent =
        student;


    resetStudentName.textContent =
        student.full_name ||
        "siswa";


    resetPinModal.hidden =
        false;

}


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
// RESET PIN
// ======================================================

async function confirmResetPin() {

    if (
        !selectedStudent?.student_id
    ) {

        return;

    }


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
                        selectedStudent.student_id
                }
            );


        if (
            error
        ) {

            throw error;

        }


        const result =
            normalizeSingleResult(
                data
            );


        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                "Reset PIN gagal."
            );

        }


        const name =
            selectedStudent.full_name ||
            "Siswa";


        closeResetModal();


        showToast(
            `PIN ${name} berhasil direset.`
        );


        await loadDashboardData();


    } catch (error) {

        handleActionError(
            error,
            "Reset PIN gagal."
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
// APPROVE MODAL
// ======================================================

function openApproveModal(
    registration
) {

    selectedRegistration =
        registration;


    approveRegistrationName.textContent =
        registration.full_name ||
        "siswa";


    approveRegistrationModal.hidden =
        false;

}


function closeApproveModal() {

    approveRegistrationModal.hidden =
        true;


    selectedRegistration =
        null;


    confirmApproveButton.disabled =
        false;


    cancelApproveButton.disabled =
        false;


    confirmApproveButton.textContent =
        "Setujui";

}


// ======================================================
// APPROVE REGISTRATION
// ======================================================

async function confirmApproveRegistration() {

    if (
        !selectedRegistration?.id
    ) {

        return;

    }


    const registrationId =
        selectedRegistration.id;


    const registrationName =
        selectedRegistration.full_name ||
        "Siswa";


    confirmApproveButton.disabled =
        true;


    cancelApproveButton.disabled =
        true;


    confirmApproveButton.textContent =
        "Memproses...";


    try {

        const {
            data,
            error
        } =
            await window.db.rpc(
                "admin_approve_student_registration",
                {
                    p_token:
                        adminToken,

                    p_request_id:
                        registrationId,

                    p_class_name:
                        MONITORED_CLASS
                }
            );


        if (
            error
        ) {

            throw error;

        }


        const result =
            normalizeSingleResult(
                data
            );


        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                "Persetujuan gagal."
            );

        }


        closeApproveModal();


        showToast(
            `${registrationName} berhasil disetujui.`
        );


        await loadDashboardData();


    } catch (error) {

        handleActionError(
            error,
            "Pendaftaran gagal disetujui."
        );

    } finally {

        confirmApproveButton.disabled =
            false;


        cancelApproveButton.disabled =
            false;


        confirmApproveButton.textContent =
            "Setujui";

    }

}


// ======================================================
// REJECT MODAL
// ======================================================

function openRejectModal(
    registration
) {

    selectedRegistration =
        registration;


    rejectRegistrationName.textContent =
        registration.full_name ||
        "siswa";


    rejectReason.value =
        "";


    rejectRegistrationModal.hidden =
        false;

}


function closeRejectModal() {

    rejectRegistrationModal.hidden =
        true;


    selectedRegistration =
        null;


    rejectReason.value =
        "";


    confirmRejectButton.disabled =
        false;


    cancelRejectButton.disabled =
        false;


    confirmRejectButton.textContent =
        "Tolak";

}


// ======================================================
// REJECT REGISTRATION
// ======================================================

async function confirmRejectRegistration() {

    if (
        !selectedRegistration?.id
    ) {

        return;

    }


    const registrationId =
        selectedRegistration.id;


    const registrationName =
        selectedRegistration.full_name ||
        "Siswa";


    const reason =
        rejectReason.value
            .trim();


    confirmRejectButton.disabled =
        true;


    cancelRejectButton.disabled =
        true;


    confirmRejectButton.textContent =
        "Memproses...";


    try {

        const {
            data,
            error
        } =
            await window.db.rpc(
                "admin_reject_student_registration",
                {
                    p_token:
                        adminToken,

                    p_request_id:
                        registrationId,

                    p_reason:
                        reason === ""
                            ? null
                            : reason
                }
            );


        if (
            error
        ) {

            throw error;

        }


        const result =
            normalizeSingleResult(
                data
            );


        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                "Penolakan gagal."
            );

        }


        closeRejectModal();


        showToast(
            `Pendaftaran ${registrationName} ditolak.`
        );


        await loadDashboardData();


    } catch (error) {

        handleActionError(
            error,
            "Pendaftaran gagal ditolak."
        );

    } finally {

        confirmRejectButton.disabled =
            false;


        cancelRejectButton.disabled =
            false;


        confirmRejectButton.textContent =
            "Tolak";

    }

}


// ======================================================
// ACTION ERROR
// ======================================================

function handleActionError(
    error,
    fallbackMessage
) {

    console.error(
        "Admin action error:",
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
        fallbackMessage
    );

}


// ======================================================
// LOGOUT
// ======================================================

async function logoutAdmin() {

    adminLogoutButton.disabled =
        true;


    try {

        if (
            adminToken
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

        console.error(
            "Admin logout error:",
            error
        );

    }


    clearAdminSession();


    redirectToAdminLogin();

}


// ======================================================
// STATUS
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
// ACCURACY
// ======================================================

function getAccuracyClass(
    accuracy
) {

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
// INVALID SESSION
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
// SESSION
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


function redirectToAdminLogin() {

    window.location.replace(
        "admin-login.html"
    );

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
// NORMALIZE ARRAY
// ======================================================

function normalizeArrayResult(
    data
) {

    if (
        data === null ||
        data === undefined
    ) {

        return [];

    }


    if (
        Array.isArray(
            data
        )
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


            return Array.isArray(
                parsed
            )
                ? parsed
                : [];


        } catch {

            return [];

        }

    }


    return [];

}


// ======================================================
// NORMALIZE SINGLE
// ======================================================

function normalizeSingleResult(
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

        return data[0] ||
            null;

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

                return parsed[0] ||
                    null;

            }


            return parsed;


        } catch {

            return null;

        }

    }


    return null;

}


// ======================================================
// NUMBER
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

    const seconds =
        Number(
            milliseconds
        ) / 1000;


    if (
        !Number.isFinite(
            seconds
        )
    ) {

        return "-";

    }


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
// INITIAL
// ======================================================

function getInitial(
    value
) {

    const text =
        String(
            value ||
            "S"
        ).trim();


    return escapeHtml(
        text.charAt(0)
            .toUpperCase()
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
