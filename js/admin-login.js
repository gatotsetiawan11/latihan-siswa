// ======================================================
// LATIHAN SISWA
// ADMIN LOGIN V1
//
// Fungsi:
// - Login administrator
// - Validasi session admin
// - Menyimpan session token admin
// - Tidak menyimpan password
// - Redirect otomatis jika session admin masih aktif
// ======================================================


document.addEventListener(
    "DOMContentLoaded",
    initializeAdminLogin
);


// ======================================================
// DOM ELEMENTS
// ======================================================

const adminLoginForm =
    document.getElementById(
        "adminLoginForm"
    );


const adminUsername =
    document.getElementById(
        "adminUsername"
    );


const adminPassword =
    document.getElementById(
        "adminPassword"
    );


const adminLoginMessage =
    document.getElementById(
        "adminLoginMessage"
    );


const adminLoginButton =
    document.getElementById(
        "adminLoginButton"
    );


// ======================================================
// INITIALIZE
// ======================================================

async function initializeAdminLogin() {

    // --------------------------------------------------
    // Pastikan elemen halaman tersedia
    // --------------------------------------------------

    if (
        !adminLoginForm ||
        !adminUsername ||
        !adminPassword ||
        !adminLoginMessage ||
        !adminLoginButton
    ) {

        console.error(
            "Elemen admin login tidak lengkap."
        );

        return;

    }


    // --------------------------------------------------
    // Cek session admin yang sudah ada
    // --------------------------------------------------

    const existingToken =
        sessionStorage.getItem(
            "admin_session_token"
        );


    if (
        existingToken
    ) {

        setLoginLoading(
            true
        );


        const valid =
            await validateExistingAdminSession(
                existingToken
            );


        if (
            valid
        ) {

            window.location.href =
                "admin.html";

            return;

        }


        clearAdminSession();


        setLoginLoading(
            false
        );

    }


    // --------------------------------------------------
    // Form submit
    // --------------------------------------------------

    adminLoginForm.addEventListener(
        "submit",
        handleAdminLogin
    );


    // --------------------------------------------------
    // Fokus awal
    // --------------------------------------------------

    adminUsername.focus();

}


// ======================================================
// VALIDATE EXISTING ADMIN SESSION
// ======================================================

async function validateExistingAdminSession(
    token
) {

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
                        token
                }
            );


        if (
            error
        ) {

            console.error(
                "Admin session validation error:",
                error
            );

            return false;

        }


        const result =
            normalizeRpcSingleResult(
                data
            );


        if (
            !result
        ) {

            return false;

        }


        if (
            result.valid !== true
        ) {

            return false;

        }


        // --------------------------------------------------
        // Simpan nama admin bila server mengembalikannya
        // --------------------------------------------------

        if (
            result.display_name
        ) {

            sessionStorage.setItem(
                "admin_display_name",
                result.display_name
            );

        }


        return true;


    } catch (error) {

        console.error(
            "Admin session check failed:",
            error
        );


        return false;

    }

}


// ======================================================
// HANDLE LOGIN
// ======================================================

async function handleAdminLogin(
    event
) {

    event.preventDefault();


    clearLoginMessage();


    // --------------------------------------------------
    // Ambil input
    // --------------------------------------------------

    const username =
        adminUsername.value
            .trim()
            .toLowerCase();


    const password =
        adminPassword.value;


    // --------------------------------------------------
    // Validasi username
    // --------------------------------------------------

    if (
        username === ""
    ) {

        showLoginMessage(
            "Username harus diisi."
        );


        adminUsername.focus();


        return;

    }


    // --------------------------------------------------
    // Validasi password
    // --------------------------------------------------

    if (
        password === ""
    ) {

        showLoginMessage(
            "Password harus diisi."
        );


        adminPassword.focus();


        return;

    }


    // --------------------------------------------------
    // Loading
    // --------------------------------------------------

    setLoginLoading(
        true
    );


    try {

        if (
            !window.db
        ) {

            throw new Error(
                "Supabase client tidak tersedia."
            );

        }


        // ==================================================
        // LOGIN KE SUPABASE RPC
        // ==================================================

        const {
            data,
            error
        } =
            await window.db.rpc(
                "admin_login",
                {
                    p_username:
                        username,

                    p_password:
                        password
                }
            );


        // ==================================================
        // RPC ERROR
        // ==================================================

        if (
            error
        ) {

            throw error;

        }


        // ==================================================
        // NORMALIZE RESPONSE
        // ==================================================

        const result =
            normalizeRpcSingleResult(
                data
            );


        // ==================================================
        // LOGIN GAGAL
        // ==================================================

        if (
            !result ||
            result.success !== true
        ) {

            handleLoginFailure(
                result
            );


            return;

        }


        // ==================================================
        // VALIDASI TOKEN
        // ==================================================

        if (
            !result.session_token
        ) {

            throw new Error(
                "Server tidak mengembalikan session token."
            );

        }


        // ==================================================
        // LOGIN BERHASIL
        // ==================================================

        /*
         * Browser yang digunakan sebagai admin sebaiknya
         * tidak membawa session siswa/guest sebelumnya.
         *
         * sessionStorage tidak dikirim ke server lain
         * dan hanya berlaku pada tab/browser session ini.
         */

        sessionStorage.clear();


        // --------------------------------------------------
        // Simpan token admin
        // --------------------------------------------------

        sessionStorage.setItem(
            "admin_session_token",
            result.session_token
        );


        // --------------------------------------------------
        // Simpan nama admin untuk tampilan
        // --------------------------------------------------

        sessionStorage.setItem(
            "admin_display_name",
            result.display_name ||
            "Administrator"
        );


        // --------------------------------------------------
        // Password tidak disimpan
        // --------------------------------------------------

        adminPassword.value =
            "";


        // --------------------------------------------------
        // Masuk dashboard admin
        // --------------------------------------------------

        window.location.href =
            "admin.html";


    } catch (error) {

        console.error(
            "Admin login error:",
            error
        );


        showLoginMessage(
            getFriendlyLoginError(
                error
            )
        );


    } finally {

        setLoginLoading(
            false
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
        result?.error_code ||
        "INVALID_CREDENTIALS";


    // --------------------------------------------------
    // ACCOUNT LOCKED
    // --------------------------------------------------

    if (
        errorCode ===
        "ACCOUNT_LOCKED"
    ) {

        showLoginMessage(
            "Akun admin terkunci sementara karena terlalu banyak percobaan login. Coba kembali beberapa menit lagi."
        );


        adminPassword.value =
            "";


        adminPassword.focus();


        return;

    }


    // --------------------------------------------------
    // INVALID CREDENTIALS
    // --------------------------------------------------

    showLoginMessage(
        "Username atau password tidak sesuai."
    );


    adminPassword.value =
        "";


    adminPassword.focus();

}


// ======================================================
// FRIENDLY ERROR
// ======================================================

function getFriendlyLoginError(
    error
) {

    const message =
        String(
            error?.message ||
            ""
        ).toLowerCase();


    // --------------------------------------------------
    // RPC belum tersedia
    // --------------------------------------------------

    if (
        message.includes(
            "admin_login"
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

        return "Fungsi login admin belum tersedia di server.";

    }


    // --------------------------------------------------
    // Network
    // --------------------------------------------------

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


    return "Login admin gagal. Silakan coba kembali.";

}


// ======================================================
// NORMALIZE RPC SINGLE RESULT
// ======================================================

function normalizeRpcSingleResult(
    data
) {

    if (
        !data
    ) {

        return null;

    }


    // --------------------------------------------------
    // Supabase TABLE return biasanya berupa array
    // --------------------------------------------------

    if (
        Array.isArray(
            data
        )
    ) {

        return data.length > 0
            ? data[0]
            : null;

    }


    // --------------------------------------------------
    // Object langsung
    // --------------------------------------------------

    if (
        typeof data ===
        "object"
    ) {

        return data;

    }


    // --------------------------------------------------
    // JSON string
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


            if (
                Array.isArray(
                    parsed
                )
            ) {

                return parsed.length > 0
                    ? parsed[0]
                    : null;

            }


            if (
                parsed &&
                typeof parsed ===
                    "object"
            ) {

                return parsed;

            }


        } catch (error) {

            console.error(
                "Tidak dapat membaca response login:",
                error
            );

        }

    }


    return null;

}


// ======================================================
// LOGIN MESSAGE
// ======================================================

function showLoginMessage(
    message
) {

    adminLoginMessage.textContent =
        message;

}


function clearLoginMessage() {

    adminLoginMessage.textContent =
        "";

}


// ======================================================
// LOADING STATE
// ======================================================

function setLoginLoading(
    loading
) {

    adminLoginButton.disabled =
        loading;


    adminUsername.disabled =
        loading;


    adminPassword.disabled =
        loading;


    adminLoginButton.textContent =
        loading
            ? "Memeriksa..."
            : "Masuk";

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

}
