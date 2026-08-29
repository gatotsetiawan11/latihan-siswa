// ======================================================
// LATIHAN SISWA
// LOGIN V2
//
// FLOW:
// 1. NISN
// 2. Check account status
// 3. Registered -> ask PIN
// 4. Login NISN + PIN
// 5. Default PIN -> activation page
// 6. Unknown NISN -> self registration
// ======================================================


document.addEventListener(
    "DOMContentLoaded",
    initLoginPage
);


// ======================================================
// DOM
// ======================================================

const nisnSection =
    document.getElementById(
        "nisnSection"
    );

const pinSection =
    document.getElementById(
        "pinSection"
    );

const pendingLoginSection =
    document.getElementById(
        "pendingLoginSection"
    );

const guestArea =
    document.getElementById(
        "guestArea"
    );


// NISN
const nisnForm =
    document.getElementById(
        "nisnForm"
    );

const nisnInput =
    document.getElementById(
        "nisnInput"
    );

const nisnButton =
    document.getElementById(
        "nisnButton"
    );

const nisnMessage =
    document.getElementById(
        "nisnMessage"
    );

const manualRegisterLink =
    document.getElementById(
        "manualRegisterLink"
    );


// PIN
const pinForm =
    document.getElementById(
        "pinForm"
    );

const pinInput =
    document.getElementById(
        "pinInput"
    );

const pinButton =
    document.getElementById(
        "pinButton"
    );

const pinMessage =
    document.getElementById(
        "pinMessage"
    );

const selectedNisn =
    document.getElementById(
        "selectedNisn"
    );

const changeNisnButton =
    document.getElementById(
        "changeNisnButton"
    );


// Pending
const pendingLoginNisn =
    document.getElementById(
        "pendingLoginNisn"
    );

const pendingBackButton =
    document.getElementById(
        "pendingBackButton"
    );


// Guest
const guestButton =
    document.getElementById(
        "guestButton"
    );


// ======================================================
// STORAGE KEYS
// ======================================================

const LOGIN_MODE_KEY =
    "login_mode";

const SESSION_TOKEN_KEY =
    "student_session_token";

const REGISTER_MODE_KEY =
    "register_mode";

const PENDING_NISN_KEY =
    "pending_nisn";

const PENDING_NAME_KEY =
    "pending_student_name";


// ======================================================
// STATE
// ======================================================

let currentNisn = "";


// ======================================================
// INIT
// ======================================================

function initLoginPage() {

    /*
     * Saat membuka halaman login,
     * hapus session login lama.
     *
     * Ini TIDAK menghapus data progress
     * di server.
     */

    sessionStorage.clear();


    showNisnStep();


    setupNumericInputs();


    nisnForm.addEventListener(
        "submit",
        handleNisnSubmit
    );


    pinForm.addEventListener(
        "submit",
        handlePinSubmit
    );


    changeNisnButton.addEventListener(
        "click",
        handleChangeNisn
    );


    pendingBackButton.addEventListener(
        "click",
        showNisnStep
    );


    guestButton.addEventListener(
        "click",
        handleGuestLogin
    );


    manualRegisterLink.addEventListener(
        "click",
        handleManualRegister
    );

}


// ======================================================
// NUMERIC INPUT
// ======================================================

function setupNumericInputs() {

    nisnInput.addEventListener(
        "input",
        () => {

            nisnInput.value =
                nisnInput.value
                    .replace(
                        /\D/g,
                        ""
                    )
                    .slice(
                        0,
                        10
                    );

        }
    );


    pinInput.addEventListener(
        "input",
        () => {

            pinInput.value =
                pinInput.value
                    .replace(
                        /\D/g,
                        ""
                    )
                    .slice(
                        0,
                        6
                    );

        }
    );

}


// ======================================================
// STEP CONTROL
// ======================================================

function hideAllLoginSections() {

    nisnSection.hidden = true;

    pinSection.hidden = true;

    pendingLoginSection.hidden = true;

}


function showNisnStep() {

    hideAllLoginSections();

    nisnSection.hidden = false;

    guestArea.hidden = false;


    currentNisn = "";

    pinInput.value = "";

    selectedNisn.textContent = "-";


    clearMessage(
        nisnMessage
    );

    clearMessage(
        pinMessage
    );


    nisnInput.focus();

}


function showPinStep(nisn) {

    hideAllLoginSections();

    pinSection.hidden = false;

    guestArea.hidden = false;


    currentNisn = nisn;

    selectedNisn.textContent =
        nisn;


    pinInput.value = "";


    clearMessage(
        pinMessage
    );


    pinInput.focus();

}


function showPendingStep(nisn) {

    hideAllLoginSections();

    pendingLoginSection.hidden =
        false;

    guestArea.hidden =
        false;


    pendingLoginNisn.textContent =
        nisn;

}


// ======================================================
// NISN SUBMIT
// ======================================================

async function handleNisnSubmit(
    event
) {

    event.preventDefault();


    clearMessage(
        nisnMessage
    );


    nisnInput.classList.remove(
        "input-error"
    );


    const nisn =
        nisnInput.value.trim();


    if (!isValidNisn(nisn)) {

        nisnInput.classList.add(
            "input-error"
        );


        showMessage(
            nisnMessage,
            "NISN harus terdiri dari tepat 10 angka.",
            "error"
        );


        nisnInput.focus();

        return;

    }


    setButtonLoading(
        nisnButton,
        true,
        "Memeriksa..."
    );


    try {

        const {
            data,
            error
        } = await window.db.rpc(
            "get_student_account_status",
            {
                p_nisn: nisn
            }
        );


        if (error) {

            throw error;

        }


        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            throw new Error(
                "Status akun tidak tersedia."
            );

        }


        const result =
            data[0];


        const status =
            result.account_status;


        // ==============================================
        // REGISTERED
        // ==============================================

        if (status === "registered") {

            showPinStep(
                nisn
            );

            return;

        }


        // ==============================================
        // NOT REGISTERED
        //
        // Redirect langsung ke registrasi mandiri.
        // NISN disimpan di sessionStorage,
        // bukan URL.
        // ==============================================

        if (status === "not_registered") {

            sessionStorage.setItem(
                REGISTER_MODE_KEY,
                "self"
            );

            sessionStorage.setItem(
                PENDING_NISN_KEY,
                nisn
            );


            window.location.href =
                "register.html";

            return;

        }


        // ==============================================
        // REJECTED
        //
        // Boleh mengirim registrasi ulang.
        // ==============================================

        if (status === "rejected") {

            sessionStorage.setItem(
                REGISTER_MODE_KEY,
                "self"
            );

            sessionStorage.setItem(
                PENDING_NISN_KEY,
                nisn
            );


            window.location.href =
                "register.html";

            return;

        }


        // ==============================================
        // PENDING
        // ==============================================

        if (status === "pending") {

            showPendingStep(
                nisn
            );

            return;

        }


        // ==============================================
        // INACTIVE
        // ==============================================

        if (status === "inactive") {

            showMessage(
                nisnMessage,
                "Akun dengan NISN ini sedang tidak aktif. Silakan hubungi admin.",
                "error"
            );

            return;

        }


        // ==============================================
        // INVALID
        // ==============================================

        if (status === "invalid") {

            showMessage(
                nisnMessage,
                "NISN harus terdiri dari tepat 10 angka.",
                "error"
            );

            return;

        }


        throw new Error(
            "Status akun tidak dikenali."
        );


    } catch (error) {

        console.error(
            "Account status error:",
            error
        );


        showMessage(
            nisnMessage,
            "Tidak dapat memeriksa akun. Silakan coba lagi.",
            "error"
        );

    } finally {

        setButtonLoading(
            nisnButton,
            false,
            "Lanjut"
        );

    }

}


// ======================================================
// PIN LOGIN
// ======================================================

async function handlePinSubmit(
    event
) {

    event.preventDefault();


    clearMessage(
        pinMessage
    );


    pinInput.classList.remove(
        "input-error"
    );


    if (!isValidNisn(currentNisn)) {

        showNisnStep();

        return;

    }


    const pin =
        pinInput.value.trim();


    if (!isValidPin(pin)) {

        pinInput.classList.add(
            "input-error"
        );


        showMessage(
            pinMessage,
            "PIN harus terdiri dari tepat 6 angka.",
            "error"
        );


        pinInput.focus();

        return;

    }


    setButtonLoading(
        pinButton,
        true,
        "Memeriksa..."
    );


    try {

        const {
            data,
            error
        } = await window.db.rpc(
            "login_student",
            {
                p_nisn:
                    currentNisn,

                p_pin:
                    pin
            }
        );


        /*
         * Hapus PIN dari input sesegera mungkin.
         */

        pinInput.value = "";


        if (error) {

            throw error;

        }


        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            throw new Error(
                "Respons login tidak valid."
            );

        }


        const result =
            data[0];


        // ==============================================
        // LOGIN GAGAL
        // ==============================================

        if (!result.success) {

            handleLoginFailure(
                result
            );

            return;

        }


        if (!result.session_token) {

            throw new Error(
                "Token sesi tidak tersedia."
            );

        }


        // ==============================================
        // SIMPAN TOKEN SESSION
        //
        // TIDAK menyimpan PIN.
        // ==============================================

        sessionStorage.clear();


        sessionStorage.setItem(
            LOGIN_MODE_KEY,
            "student"
        );


        sessionStorage.setItem(
            SESSION_TOKEN_KEY,
            result.session_token
        );


        // ==============================================
        // LOGIN PERTAMA / PIN DEFAULT
        // ==============================================

        if (
            result.pin_must_change === true
        ) {

            sessionStorage.setItem(
                REGISTER_MODE_KEY,
                "activation"
            );


            sessionStorage.setItem(
                PENDING_NISN_KEY,
                currentNisn
            );


            if (result.full_name) {

                sessionStorage.setItem(
                    PENDING_NAME_KEY,
                    result.full_name
                );

            }


            window.location.href =
                "register.html";

            return;

        }


        // ==============================================
        // NORMAL LOGIN
        // ==============================================

        window.location.href =
            "dashboard.html";


    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        showMessage(
            pinMessage,
            "Tidak dapat masuk. Silakan coba lagi.",
            "error"
        );

    } finally {

        setButtonLoading(
            pinButton,
            false,
            "Masuk"
        );

    }

}


// ======================================================
// LOGIN FAILURE
// ======================================================

function handleLoginFailure(
    result
) {

    const errorCode =
        result.error_code;


    if (
        errorCode ===
        "ACCOUNT_LOCKED"
    ) {

        showMessage(
            pinMessage,
            "Terlalu banyak percobaan PIN yang salah. Akun dikunci sementara. Silakan coba kembali beberapa saat lagi.",
            "error"
        );

        return;

    }


    if (
        errorCode ===
        "PIN_NOT_READY"
    ) {

        showMessage(
            pinMessage,
            "PIN akun belum tersedia. Silakan hubungi admin.",
            "error"
        );

        return;

    }


    /*
     * Jangan memberi tahu apakah masalah
     * berasal dari NISN atau PIN.
     */

    showMessage(
        pinMessage,
        "NISN atau PIN tidak sesuai.",
        "error"
    );


    pinInput.focus();

}


// ======================================================
// CHANGE NISN
// ======================================================

function handleChangeNisn(
    event
) {

    event.preventDefault();


    const previousNisn =
        currentNisn;


    showNisnStep();


    nisnInput.value =
        previousNisn;


    nisnInput.focus();

}


// ======================================================
// MANUAL REGISTER
// ======================================================

function handleManualRegister(
    event
) {

    event.preventDefault();


    sessionStorage.clear();


    sessionStorage.setItem(
        REGISTER_MODE_KEY,
        "self"
    );


    window.location.href =
        "register.html";

}


// ======================================================
// GUEST
// ======================================================

function handleGuestLogin() {

    sessionStorage.clear();


    sessionStorage.setItem(
        LOGIN_MODE_KEY,
        "guest"
    );


    window.location.href =
        "dashboard.html";

}


// ======================================================
// VALIDATION
// ======================================================

function isValidNisn(value) {

    return /^[0-9]{10}$/.test(
        value
    );

}


function isValidPin(value) {

    return /^[0-9]{6}$/.test(
        value
    );

}


// ======================================================
// MESSAGE
// ======================================================

function showMessage(
    element,
    message,
    type
) {

    element.textContent =
        message;


    element.className =
        `auth-message ${type}`;


    element.hidden =
        false;

}


function clearMessage(element) {

    element.textContent = "";


    element.className =
        "auth-message";


    element.hidden =
        true;

}


// ======================================================
// BUTTON STATE
// ======================================================

function setButtonLoading(
    button,
    loading,
    text
) {

    button.disabled =
        loading;


    button.textContent =
        text;

}
