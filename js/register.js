// ======================================================
// LATIHAN SISWA
// REGISTER / FIRST LOGIN ACTIVATION V1
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    initRegisterPage
);


// ======================================================
// DOM
// ======================================================

const activationSection =
    document.getElementById(
        "activationSection"
    );

const registrationSection =
    document.getElementById(
        "registrationSection"
    );

const pendingSection =
    document.getElementById(
        "pendingSection"
    );

const invalidSection =
    document.getElementById(
        "invalidSection"
    );


// Activation
const activationForm =
    document.getElementById(
        "activationForm"
    );

const activationNisn =
    document.getElementById(
        "activationNisn"
    );

const activationNameRow =
    document.getElementById(
        "activationNameRow"
    );

const activationName =
    document.getElementById(
        "activationName"
    );

const activationPin =
    document.getElementById(
        "activationPin"
    );

const activationPinConfirm =
    document.getElementById(
        "activationPinConfirm"
    );

const activationWhatsapp =
    document.getElementById(
        "activationWhatsapp"
    );

const activationMessage =
    document.getElementById(
        "activationMessage"
    );

const activationButton =
    document.getElementById(
        "activationButton"
    );


// Registration
const registrationForm =
    document.getElementById(
        "registrationForm"
    );

const registrationNisn =
    document.getElementById(
        "registrationNisn"
    );

const registrationName =
    document.getElementById(
        "registrationName"
    );

const registrationPin =
    document.getElementById(
        "registrationPin"
    );

const registrationPinConfirm =
    document.getElementById(
        "registrationPinConfirm"
    );

const registrationWhatsapp =
    document.getElementById(
        "registrationWhatsapp"
    );

const registrationMessage =
    document.getElementById(
        "registrationMessage"
    );

const registrationButton =
    document.getElementById(
        "registrationButton"
    );


// Pending
const pendingNisn =
    document.getElementById(
        "pendingNisn"
    );


// ======================================================
// CONSTANTS
// ======================================================

const REGISTER_MODE_KEY =
    "register_mode";

const PENDING_NISN_KEY =
    "pending_nisn";

const PENDING_NAME_KEY =
    "pending_student_name";

const LOGIN_MODE_KEY =
    "login_mode";

const SESSION_TOKEN_KEY =
    "student_session_token";


// ======================================================
// INITIALIZE
// ======================================================

function initRegisterPage() {

    hideAllSections();

    setupNumericInputs();

    activationForm.addEventListener(
        "submit",
        handleActivation
    );

    registrationForm.addEventListener(
        "submit",
        handleRegistration
    );


    const mode =
        sessionStorage.getItem(
            REGISTER_MODE_KEY
        );


    if (mode === "activation") {

        showActivationMode();
        return;

    }


    if (mode === "self") {

        showRegistrationMode();
        return;

    }


    /*
     * Kalau register.html dibuka langsung,
     * tampilkan registrasi mandiri.
     */

    showRegistrationMode();

}


// ======================================================
// SECTION CONTROL
// ======================================================

function hideAllSections() {

    activationSection.hidden = true;
    registrationSection.hidden = true;
    pendingSection.hidden = true;
    invalidSection.hidden = true;

}


function showActivationMode() {

    const token =
        sessionStorage.getItem(
            SESSION_TOKEN_KEY
        );

    const nisn =
        sessionStorage.getItem(
            PENDING_NISN_KEY
        );

    const name =
        sessionStorage.getItem(
            PENDING_NAME_KEY
        );


    /*
     * Aktivasi hanya boleh dilakukan
     * sesudah login pertama berhasil.
     */

    if (!token) {

        hideAllSections();

        invalidSection.hidden = false;

        return;

    }


    hideAllSections();

    activationSection.hidden = false;


    activationNisn.textContent =
        nisn || "NISN terverifikasi";


    if (name) {

        activationName.textContent =
            name;

        activationNameRow.hidden =
            false;

    } else {

        activationNameRow.hidden =
            true;

    }


    activationPin.focus();

}


function showRegistrationMode() {

    hideAllSections();

    registrationSection.hidden = false;


    const pendingNisnValue =
        sessionStorage.getItem(
            PENDING_NISN_KEY
        );


    if (
        pendingNisnValue &&
        /^[0-9]{10}$/.test(
            pendingNisnValue
        )
    ) {

        registrationNisn.value =
            pendingNisnValue;

    }


    registrationNisn.focus();

}


// ======================================================
// NUMERIC INPUT
// ======================================================

function setupNumericInputs() {

    const numericInputs = [
        registrationNisn,
        registrationPin,
        registrationPinConfirm,
        activationPin,
        activationPinConfirm
    ];


    numericInputs.forEach(
        (input) => {

            input.addEventListener(
                "input",
                () => {

                    input.value =
                        input.value.replace(
                            /\D/g,
                            ""
                        );

                }
            );

        }
    );

}


// ======================================================
// ACTIVATION
// ======================================================

async function handleActivation(event) {

    event.preventDefault();

    clearMessage(
        activationMessage
    );

    clearInputErrors([
        activationPin,
        activationPinConfirm,
        activationWhatsapp
    ]);


    const token =
        sessionStorage.getItem(
            SESSION_TOKEN_KEY
        );


    if (!token) {

        showMessage(
            activationMessage,
            "Sesi aktivasi tidak tersedia. Silakan masuk kembali.",
            "error"
        );

        return;

    }


    const newPin =
        activationPin.value.trim();

    const confirmPin =
        activationPinConfirm.value.trim();

    const whatsapp =
        activationWhatsapp.value.trim();


    if (!isValidPin(newPin)) {

        activationPin.classList.add(
            "input-error"
        );

        showMessage(
            activationMessage,
            "PIN baru harus terdiri dari tepat 6 angka.",
            "error"
        );

        activationPin.focus();

        return;

    }


    if (newPin === "123456") {

        activationPin.classList.add(
            "input-error"
        );

        showMessage(
            activationMessage,
            "PIN baru tidak boleh menggunakan PIN awal 123456.",
            "error"
        );

        activationPin.focus();

        return;

    }


    if (newPin !== confirmPin) {

        activationPinConfirm.classList.add(
            "input-error"
        );

        showMessage(
            activationMessage,
            "Konfirmasi PIN tidak sama dengan PIN baru.",
            "error"
        );

        activationPinConfirm.focus();

        return;

    }


    if (
        whatsapp &&
        !isReasonableWhatsapp(
            whatsapp
        )
    ) {

        activationWhatsapp.classList.add(
            "input-error"
        );

        showMessage(
            activationMessage,
            "Nomor WhatsApp tidak valid. Kosongkan jika tidak ingin mengisinya.",
            "error"
        );

        activationWhatsapp.focus();

        return;

    }


    setButtonLoading(
        activationButton,
        true,
        "Menyimpan..."
    );


    try {

        const {
            data,
            error
        } = await window.db.rpc(
            "complete_student_activation",
            {
                p_token: token,
                p_new_pin: newPin,
                p_whatsapp:
                    whatsapp || null
            }
        );


        if (error) {

            throw error;

        }


        if (
            !Array.isArray(data) ||
            data.length === 0 ||
            !data[0].session_token
        ) {

            throw new Error(
                "Respons aktivasi tidak valid."
            );

        }


        const result =
            data[0];


        /*
         * Server menghapus token lama
         * dan membuat token baru.
         */

        sessionStorage.setItem(
            SESSION_TOKEN_KEY,
            result.session_token
        );

        sessionStorage.setItem(
            LOGIN_MODE_KEY,
            "student"
        );


        sessionStorage.removeItem(
            REGISTER_MODE_KEY
        );

        sessionStorage.removeItem(
            PENDING_NISN_KEY
        );

        sessionStorage.removeItem(
            PENDING_NAME_KEY
        );


        /*
         * PIN dan WhatsApp tidak pernah
         * disimpan di browser.
         */

        activationPin.value = "";
        activationPinConfirm.value = "";
        activationWhatsapp.value = "";


        showMessage(
            activationMessage,
            "PIN berhasil diganti. Membuka dashboard...",
            "success"
        );


        window.setTimeout(
            () => {

                window.location.href =
                    "dashboard.html";

            },
            600
        );

    } catch (error) {

        console.error(
            "Activation error:",
            error
        );


        const message =
            getFriendlyError(
                error,
                "Aktivasi akun gagal. Silakan coba lagi."
            );


        showMessage(
            activationMessage,
            message,
            "error"
        );

    } finally {

        setButtonLoading(
            activationButton,
            false,
            "Simpan dan Lanjut"
        );

    }

}


// ======================================================
// SELF REGISTRATION
// ======================================================

async function handleRegistration(
    event
) {

    event.preventDefault();

    clearMessage(
        registrationMessage
    );

    clearInputErrors([
        registrationNisn,
        registrationName,
        registrationPin,
        registrationPinConfirm,
        registrationWhatsapp
    ]);


    const nisn =
        registrationNisn.value.trim();

    const fullName =
        normalizeName(
            registrationName.value
        );

    const pin =
        registrationPin.value.trim();

    const confirmPin =
        registrationPinConfirm.value.trim();

    const whatsapp =
        registrationWhatsapp.value.trim();


    if (!isValidNisn(nisn)) {

        registrationNisn.classList.add(
            "input-error"
        );

        showMessage(
            registrationMessage,
            "NISN harus terdiri dari tepat 10 angka.",
            "error"
        );

        registrationNisn.focus();

        return;

    }


    if (
        fullName.length < 2 ||
        fullName.length > 120
    ) {

        registrationName.classList.add(
            "input-error"
        );

        showMessage(
            registrationMessage,
            "Masukkan nama lengkap siswa.",
            "error"
        );

        registrationName.focus();

        return;

    }


    if (!isValidPin(pin)) {

        registrationPin.classList.add(
            "input-error"
        );

        showMessage(
            registrationMessage,
            "PIN harus terdiri dari tepat 6 angka.",
            "error"
        );

        registrationPin.focus();

        return;

    }


    if (pin === "123456") {

        registrationPin.classList.add(
            "input-error"
        );

        showMessage(
            registrationMessage,
            "PIN 123456 hanya digunakan untuk akun yang didaftarkan admin. Buat PIN lain.",
            "error"
        );

        registrationPin.focus();

        return;

    }


    if (pin !== confirmPin) {

        registrationPinConfirm.classList.add(
            "input-error"
        );

        showMessage(
            registrationMessage,
            "Konfirmasi PIN tidak sama.",
            "error"
        );

        registrationPinConfirm.focus();

        return;

    }


    if (
        whatsapp &&
        !isReasonableWhatsapp(
            whatsapp
        )
    ) {

        registrationWhatsapp.classList.add(
            "input-error"
        );

        showMessage(
            registrationMessage,
            "Nomor WhatsApp tidak valid. Kosongkan jika tidak ingin mengisinya.",
            "error"
        );

        registrationWhatsapp.focus();

        return;

    }


    setButtonLoading(
        registrationButton,
        true,
        "Mengirim..."
    );


    try {

        /*
         * Cek dulu supaya user mendapat
         * pesan yang lebih jelas.
         */

        const {
            data: statusData,
            error: statusError
        } = await window.db.rpc(
            "get_student_account_status",
            {
                p_nisn: nisn
            }
        );


        if (statusError) {

            throw statusError;

        }


        const status =
            Array.isArray(statusData) &&
            statusData.length > 0
                ? statusData[0].account_status
                : null;


        if (status === "registered") {

            showMessage(
                registrationMessage,
                "NISN ini sudah terdaftar. Silakan kembali ke halaman masuk.",
                "info"
            );

            return;

        }


        if (status === "inactive") {

            showMessage(
                registrationMessage,
                "Akun dengan NISN ini sedang tidak aktif. Silakan hubungi admin.",
                "error"
            );

            return;

        }


        if (status === "pending") {

            showPendingResult(
                nisn
            );

            return;

        }


        /*
         * Rejected boleh mengirim ulang.
         * not_registered juga boleh daftar.
         */

        const {
            data,
            error
        } = await window.db.rpc(
            "submit_student_registration",
            {
                p_nisn: nisn,
                p_full_name: fullName,
                p_pin: pin,
                p_whatsapp:
                    whatsapp || null
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
                "Respons pendaftaran tidak valid."
            );

        }


        /*
         * Jangan simpan PIN atau WA.
         */

        registrationPin.value = "";
        registrationPinConfirm.value = "";
        registrationWhatsapp.value = "";


        sessionStorage.removeItem(
            REGISTER_MODE_KEY
        );

        sessionStorage.removeItem(
            PENDING_NISN_KEY
        );

        sessionStorage.removeItem(
            PENDING_NAME_KEY
        );


        showPendingResult(
            nisn
        );

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );


        const message =
            getFriendlyError(
                error,
                "Pendaftaran gagal. Silakan coba lagi."
            );


        showMessage(
            registrationMessage,
            message,
            "error"
        );

    } finally {

        setButtonLoading(
            registrationButton,
            false,
            "Ajukan Pendaftaran"
        );

    }

}


// ======================================================
// PENDING SCREEN
// ======================================================

function showPendingResult(nisn) {

    hideAllSections();

    pendingNisn.textContent =
        nisn;

    pendingSection.hidden =
        false;

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


function isReasonableWhatsapp(
    value
) {

    const digits =
        value.replace(
            /\D/g,
            ""
        );


    /*
     * Server tetap menjadi validator utama.
     * Ini hanya validasi awal di browser.
     */

    return (
        digits.length >= 9 &&
        digits.length <= 15
    );

}


function normalizeName(value) {

    return value
        .trim()
        .replace(
            /\s+/g,
            " "
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
// INPUT ERROR
// ======================================================

function clearInputErrors(inputs) {

    inputs.forEach(
        (input) => {

            input.classList.remove(
                "input-error"
            );

        }
    );

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


// ======================================================
// FRIENDLY ERROR
// ======================================================

function getFriendlyError(
    error,
    fallback
) {

    const rawMessage =
        String(
            error?.message ||
            ""
        );


    const lower =
        rawMessage.toLowerCase();


    if (
        lower.includes(
            "nisn sudah terdaftar"
        )
    ) {

        return "NISN ini sudah terdaftar. Silakan masuk menggunakan akun yang sudah ada.";

    }


    if (
        lower.includes(
            "pin baru harus"
        )
    ) {

        return "PIN baru harus terdiri dari tepat 6 angka.";

    }


    if (
        lower.includes(
            "pin harus"
        )
    ) {

        return "PIN harus terdiri dari tepat 6 angka.";

    }


    if (
        lower.includes(
            "123456"
        )
    ) {

        return "PIN 123456 tidak dapat digunakan sebagai PIN pribadi.";

    }


    if (
        lower.includes(
            "whatsapp"
        )
    ) {

        return "Format nomor WhatsApp tidak valid. Anda juga boleh mengosongkannya.";

    }


    if (
        lower.includes(
            "sesi"
        ) ||
        lower.includes(
            "expired"
        ) ||
        lower.includes(
            "kedaluwarsa"
        )
    ) {

        return "Sesi sudah tidak berlaku. Silakan masuk kembali.";

    }


    return fallback;

}
