// ======================================================
// LATIHAN SISWA
// ADMIN WEB PUSH V1
//
// Fungsi:
// - Register /sw.js
// - Meminta izin notifikasi
// - Membuat PushSubscription
// - Menyimpan subscription ke Supabase
// - Menonaktifkan notifikasi perangkat
//
// PENTING:
// HANYA VAPID PUBLIC KEY yang boleh ada di file ini.
// PRIVATE KEY JANGAN PERNAH dimasukkan ke GitHub.
// ======================================================


// ======================================================
// VAPID PUBLIC KEY
//
// GANTI nilai di bawah dengan VAPID_PUBLIC_KEY milikmu.
//
// Contoh:
// const VAPID_PUBLIC_KEY = "BH...abc";
//
// Jangan masukkan:
// VAPID_PUBLIC_KEY=
//
// Cukup nilainya saja.
// ======================================================

const VAPID_PUBLIC_KEY =
    "BADeIj2ZxvReA6SqPbz3OgFzBLRi5P625gL6DfGoNLTbBGRJvliPOO27iwvtlmDwC34mwDvO8SHD2deS-_FvYTg
";


// ======================================================
// DOM
// ======================================================

const pushCard =
    document.getElementById(
        "adminPushCard"
    );


const pushStatusTitle =
    document.getElementById(
        "adminPushStatusTitle"
    );


const pushStatusText =
    document.getElementById(
        "adminPushStatusText"
    );


const pushDeviceCount =
    document.getElementById(
        "adminPushDeviceCount"
    );


const enablePushButton =
    document.getElementById(
        "enablePushButton"
    );


const disablePushButton =
    document.getElementById(
        "disablePushButton"
    );


// ======================================================
// STATE
// ======================================================

let pushRegistration =
    null;


let pushSubscription =
    null;


let pushBusy =
    false;


// ======================================================
// INITIALIZE
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeAdminPush
);


async function initializeAdminPush() {

    if (
        !pushCard
        ||
        !enablePushButton
        ||
        !disablePushButton
    ) {

        return;

    }


    bindPushEvents();


    if (
        !isPushSupported()
    ) {

        showPushUnsupported();

        return;

    }


    if (
        !hasValidVapidPublicKey()
    ) {

        showPushError(
            "VAPID Public Key belum dipasang pada js/admin-push.js."
        );

        return;

    }


    try {

        pushRegistration =
            await navigator.serviceWorker.register(
                "/sw.js"
            );


        await navigator.serviceWorker.ready;


        pushSubscription =
            await pushRegistration
                .pushManager
                .getSubscription();


        await refreshPushState();


    } catch (error) {

        console.error(
            "Push initialization error:",
            error
        );


        showPushError(
            "Service Worker atau Web Push gagal dijalankan."
        );

    }

}


// ======================================================
// EVENTS
// ======================================================

function bindPushEvents() {

    enablePushButton.addEventListener(
        "click",
        enableAdminPush
    );


    disablePushButton.addEventListener(
        "click",
        disableAdminPush
    );

}


// ======================================================
// ENABLE PUSH
// ======================================================

async function enableAdminPush() {

    if (
        pushBusy
    ) {

        return;

    }


    const adminToken =
        getAdminToken();


    if (
        !adminToken
    ) {

        showPushError(
            "Sesi admin tidak ditemukan. Silakan login kembali."
        );

        return;

    }


    setPushBusy(
        true
    );


    try {

        pushRegistration =
            pushRegistration
            ||
            await navigator.serviceWorker.register(
                "/sw.js"
            );


        await navigator.serviceWorker.ready;


        // ==================================================
        // ASK PERMISSION
        // ==================================================

        let permission =
            Notification.permission;


        if (
            permission ===
            "default"
        ) {

            permission =
                await Notification.requestPermission();

        }


        if (
            permission !==
            "granted"
        ) {

            showPermissionDenied();

            return;

        }


        // ==================================================
        // EXISTING SUBSCRIPTION
        // ==================================================

        pushSubscription =
            await pushRegistration
                .pushManager
                .getSubscription();


        // ==================================================
        // CREATE SUBSCRIPTION
        // ==================================================

        if (
            !pushSubscription
        ) {

            pushSubscription =
                await pushRegistration
                    .pushManager
                    .subscribe({

                        userVisibleOnly:
                            true,

                        applicationServerKey:
                            urlBase64ToUint8Array(
                                VAPID_PUBLIC_KEY
                            )

                    });

        }


        // ==================================================
        // SAVE TO SUPABASE
        // ==================================================

        await saveSubscriptionToServer(
            pushSubscription
        );


        await refreshPushState();


    } catch (error) {

        console.error(
            "Enable push error:",
            error
        );


        showPushError(
            getReadablePushError(
                error
            )
        );


    } finally {

        setPushBusy(
            false
        );

    }

}


// ======================================================
// DISABLE PUSH
// ======================================================

async function disableAdminPush() {

    if (
        pushBusy
    ) {

        return;

    }


    const adminToken =
        getAdminToken();


    if (
        !adminToken
    ) {

        showPushError(
            "Sesi admin tidak ditemukan."
        );

        return;

    }


    setPushBusy(
        true
    );


    try {

        pushRegistration =
            pushRegistration
            ||
            await navigator.serviceWorker.getRegistration(
                "/"
            );


        if (
            pushRegistration
        ) {

            pushSubscription =
                await pushRegistration
                    .pushManager
                    .getSubscription();

        }


        if (
            pushSubscription
        ) {

            /*
             * Hapus dari database sebelum unsubscribe,
             * karena endpoint diperlukan RPC server.
             */

            await removeSubscriptionFromServer(
                pushSubscription.endpoint
            );


            await pushSubscription.unsubscribe();

        }


        pushSubscription =
            null;


        await refreshPushState();


    } catch (error) {

        console.error(
            "Disable push error:",
            error
        );


        showPushError(
            "Notifikasi gagal dinonaktifkan."
        );


    } finally {

        setPushBusy(
            false
        );

    }

}


// ======================================================
// SAVE SUBSCRIPTION
// ======================================================

async function saveSubscriptionToServer(
    subscription
) {

    const adminToken =
        getAdminToken();


    if (
        !adminToken
    ) {

        throw new Error(
            "Sesi admin tidak ditemukan."
        );

    }


    const json =
        subscription.toJSON();


    const endpoint =
        json.endpoint;


    const p256dh =
        json.keys?.p256dh;


    const auth =
        json.keys?.auth;


    if (
        !endpoint
        ||
        !p256dh
        ||
        !auth
    ) {

        throw new Error(
            "Data PushSubscription tidak lengkap."
        );

    }


    const {
        data,
        error
    } =
        await window.db.rpc(
            "save_admin_push_subscription",
            {

                p_token:
                    adminToken,

                p_endpoint:
                    endpoint,

                p_p256dh:
                    p256dh,

                p_auth:
                    auth,

                p_user_agent:
                    navigator.userAgent

            }
        );


    if (
        error
    ) {

        throw error;

    }


    const result =
        normalizePushResult(
            data
        );


    if (
        !result
        ||
        result.success !== true
    ) {

        throw new Error(
            "Subscription tidak dapat disimpan."
        );

    }

}


// ======================================================
// REMOVE SUBSCRIPTION
// ======================================================

async function removeSubscriptionFromServer(
    endpoint
) {

    const adminToken =
        getAdminToken();


    if (
        !adminToken
    ) {

        throw new Error(
            "Sesi admin tidak ditemukan."
        );

    }


    const {
        error
    } =
        await window.db.rpc(
            "remove_admin_push_subscription",
            {

                p_token:
                    adminToken,

                p_endpoint:
                    endpoint

            }
        );


    if (
        error
    ) {

        throw error;

    }

}


// ======================================================
// REFRESH STATE
// ======================================================

async function refreshPushState() {

    const permission =
        Notification.permission;


    if (
        permission ===
        "denied"
    ) {

        showPermissionDenied();

        await refreshServerDeviceCount();

        return;

    }


    if (
        pushRegistration
    ) {

        pushSubscription =
            await pushRegistration
                .pushManager
                .getSubscription();

    }


    /*
     * Jika browser sudah punya subscription,
     * sinkronkan lagi ke server.
     *
     * Berguna jika database pernah dibersihkan atau
     * subscription diperbarui browser.
     */

    if (
        permission ===
            "granted"
        &&
        pushSubscription
    ) {

        try {

            await saveSubscriptionToServer(
                pushSubscription
            );

        } catch (error) {

            console.error(
                "Push sync error:",
                error
            );

        }

    }


    if (
        permission ===
            "granted"
        &&
        pushSubscription
    ) {

        showPushEnabled();

    } else {

        showPushDisabled();

    }


    await refreshServerDeviceCount();

}


// ======================================================
// SERVER DEVICE COUNT
// ======================================================

async function refreshServerDeviceCount() {

    const adminToken =
        getAdminToken();


    if (
        !adminToken
    ) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await window.db.rpc(
                "get_admin_push_status",
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


        const result =
            normalizePushResult(
                data
            );


        const count =
            Number(
                result?.device_count
            );


        if (
            Number.isFinite(
                count
            )
            &&
            count > 0
        ) {

            pushDeviceCount.textContent =
                count === 1
                    ? "Aktif di 1 perangkat."
                    : `Aktif di ${count} perangkat.`;


            pushDeviceCount.hidden =
                false;

        } else {

            pushDeviceCount.textContent =
                "";


            pushDeviceCount.hidden =
                true;

        }


    } catch (error) {

        console.error(
            "Push status error:",
            error
        );

    }

}


// ======================================================
// UI STATE - ENABLED
// ======================================================

function showPushEnabled() {

    pushCard.classList.remove(
        "is-error"
    );


    pushCard.classList.add(
        "is-active"
    );


    pushStatusTitle.textContent =
        "Notifikasi aktif";


    pushStatusText.textContent =
        "HP ini siap menerima notifikasi admin meskipun halaman sedang tidak dibuka.";


    enablePushButton.hidden =
        true;


    disablePushButton.hidden =
        false;

}


// ======================================================
// UI STATE - DISABLED
// ======================================================

function showPushDisabled() {

    pushCard.classList.remove(
        "is-active",
        "is-error"
    );


    pushStatusTitle.textContent =
        "Notifikasi belum aktif";


    pushStatusText.textContent =
        "Aktifkan agar HP admin dapat menerima pemberitahuan pendaftaran siswa baru.";


    enablePushButton.hidden =
        false;


    disablePushButton.hidden =
        true;

}


// ======================================================
// UI STATE - PERMISSION DENIED
// ======================================================

function showPermissionDenied() {

    pushCard.classList.remove(
        "is-active"
    );


    pushCard.classList.add(
        "is-error"
    );


    pushStatusTitle.textContent =
        "Izin notifikasi diblokir";


    pushStatusText.textContent =
        "Izinkan notifikasi untuk latihan-soal.my.id melalui pengaturan browser, lalu buka kembali halaman ini.";


    enablePushButton.hidden =
        true;


    disablePushButton.hidden =
        true;

}


// ======================================================
// UI STATE - UNSUPPORTED
// ======================================================

function showPushUnsupported() {

    pushCard.classList.remove(
        "is-active"
    );


    pushCard.classList.add(
        "is-error"
    );


    pushStatusTitle.textContent =
        "Web Push tidak tersedia";


    pushStatusText.textContent =
        "Browser atau perangkat ini tidak mendukung Web Push.";


    enablePushButton.hidden =
        true;


    disablePushButton.hidden =
        true;


    pushDeviceCount.hidden =
        true;

}


// ======================================================
// UI STATE - ERROR
// ======================================================

function showPushError(
    message
) {

    pushCard.classList.remove(
        "is-active"
    );


    pushCard.classList.add(
        "is-error"
    );


    pushStatusTitle.textContent =
        "Notifikasi belum dapat diaktifkan";


    pushStatusText.textContent =
        message;


    enablePushButton.hidden =
        false;


    disablePushButton.hidden =
        true;

}


// ======================================================
// BUSY
// ======================================================

function setPushBusy(
    busy
) {

    pushBusy =
        busy;


    enablePushButton.disabled =
        busy;


    disablePushButton.disabled =
        busy;


    if (
        busy
    ) {

        if (
            !enablePushButton.hidden
        ) {

            enablePushButton.textContent =
                "Memproses...";

        }


        if (
            !disablePushButton.hidden
        ) {

            disablePushButton.textContent =
                "Memproses...";

        }

    } else {

        enablePushButton.textContent =
            "Aktifkan Notifikasi";


        disablePushButton.textContent =
            "Nonaktifkan";

    }

}


// ======================================================
// CHECK SUPPORT
// ======================================================

function isPushSupported() {

    return (

        "serviceWorker" in
            navigator

        &&

        "PushManager" in
            window

        &&

        "Notification" in
            window

    );

}


// ======================================================
// VAPID VALIDATION
// ======================================================

function hasValidVapidPublicKey() {

    return (

        typeof VAPID_PUBLIC_KEY ===
            "string"

        &&

        VAPID_PUBLIC_KEY.length >
            50

        &&

        !VAPID_PUBLIC_KEY.includes(
            "PASTE_"
        )

    );

}


// ======================================================
// ADMIN TOKEN
// ======================================================

function getAdminToken() {

    return sessionStorage.getItem(
        "admin_session_token"
    );

}


// ======================================================
// BASE64 URL → UINT8ARRAY
// ======================================================

function urlBase64ToUint8Array(
    base64String
) {

    const padding =
        "=".repeat(
            (
                4 -
                (
                    base64String.length %
                    4
                )
            ) %
            4
        );


    const base64 =
        (
            base64String +
            padding
        )
            .replace(
                /-/g,
                "+"
            )
            .replace(
                /_/g,
                "/"
            );


    const rawData =
        window.atob(
            base64
        );


    const outputArray =
        new Uint8Array(
            rawData.length
        );


    for (
        let i = 0;
        i < rawData.length;
        i++
    ) {

        outputArray[i] =
            rawData.charCodeAt(
                i
            );

    }


    return outputArray;

}


// ======================================================
// NORMALIZE RPC RESULT
// ======================================================

function normalizePushResult(
    data
) {

    if (
        data === null
        ||
        data === undefined
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
// FRIENDLY ERROR
// ======================================================

function getReadablePushError(
    error
) {

    const name =
        String(
            error?.name ||
            ""
        );


    const message =
        String(
            error?.message ||
            ""
        );


    if (
        name ===
        "NotAllowedError"
    ) {

        return "Izin notifikasi tidak diberikan oleh browser.";

    }


    if (
        name ===
        "AbortError"
    ) {

        return "Browser gagal membuat subscription. Coba muat ulang halaman.";

    }


    if (
        message.toLowerCase().includes(
            "applicationserverkey"
        )
    ) {

        return "VAPID Public Key tidak valid.";

    }


    return (
        message ||
        "Web Push gagal diaktifkan."
    );

}
