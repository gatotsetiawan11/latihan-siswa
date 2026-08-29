// ======================================================
// LATIHAN SISWA
// SERVICE WORKER - WEB PUSH V1
//
// Fungsi:
// - Menerima Web Push
// - Menampilkan notifikasi
// - Membuka halaman admin ketika notifikasi diketuk
//
// File ini HARUS berada di root:
// /sw.js
//
// Jangan taruh di folder /js
// ======================================================


const DEFAULT_NOTIFICATION_TITLE =
    "Latihan Siswa";


const DEFAULT_NOTIFICATION_BODY =
    "Ada informasi baru untuk administrator.";


const DEFAULT_NOTIFICATION_URL =
    "./admin.html";


// ======================================================
// INSTALL
// ======================================================

self.addEventListener(
    "install",
    event => {

        /*
         * Service Worker baru langsung dipersiapkan
         * tanpa menunggu versi lama terlalu lama.
         */

        self.skipWaiting();

    }
);


// ======================================================
// ACTIVATE
// ======================================================

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(
            self.clients.claim()
        );

    }
);


// ======================================================
// PUSH
// ======================================================

self.addEventListener(
    "push",
    event => {

        let payload = {};


        // ==================================================
        // READ PAYLOAD
        // ==================================================

        if (
            event.data
        ) {

            try {

                payload =
                    event.data.json();

            } catch {

                try {

                    payload = {
                        body:
                            event.data.text()
                    };

                } catch {

                    payload = {};

                }

            }

        }


        // ==================================================
        // SAFE CONTENT
        //
        // Jangan memasukkan NISN, PIN, WA, atau data
        // siswa sensitif ke lock screen.
        // ==================================================

        const title =
            typeof payload.title ===
                "string"
                &&
                payload.title.trim() !== ""

                ? payload.title.trim()

                : DEFAULT_NOTIFICATION_TITLE;


        const body =
            typeof payload.body ===
                "string"
                &&
                payload.body.trim() !== ""

                ? payload.body.trim()

                : DEFAULT_NOTIFICATION_BODY;


        const targetUrl =
            typeof payload.url ===
                "string"
                &&
                payload.url.trim() !== ""

                ? payload.url.trim()

                : DEFAULT_NOTIFICATION_URL;


        // ==================================================
        // OPTIONS
        // ==================================================

        const options = {

            body:
                body,

            /*
             * Tag mencegah banyak notifikasi pendaftaran
             * memenuhi notification tray.
             */

            tag:
                typeof payload.tag === "string"
                    ? payload.tag
                    : "latihan-siswa-admin",

            renotify:
                true,

            requireInteraction:
                false,

            /*
             * Simpan URL tujuan secara internal.
             */

            data: {
                url:
                    targetUrl
            }

        };


        // ==================================================
        // OPTIONAL ICONS
        //
        // Jika nanti ada icon aplikasi, dapat kita
        // tambahkan. Untuk sekarang jangan referensikan
        // file yang belum ada.
        // ==================================================


        event.waitUntil(

            self.registration.showNotification(
                title,
                options
            )

        );

    }
);


// ======================================================
// NOTIFICATION CLICK
// ======================================================

self.addEventListener(
    "notificationclick",
    event => {

        event.notification.close();


        const targetUrl =
            event.notification?.data?.url ||
            DEFAULT_NOTIFICATION_URL;


        event.waitUntil(

            openOrFocusAdminPage(
                targetUrl
            )

        );

    }
);


// ======================================================
// OPEN / FOCUS ADMIN PAGE
// ======================================================

async function openOrFocusAdminPage(
    targetUrl
) {

    const clientList =
        await self.clients.matchAll({
            type:
                "window",

            includeUncontrolled:
                true
        });


    // ==================================================
    // CARI TAB APLIKASI YANG SUDAH TERBUKA
    // ==================================================

    for (
        const client
        of clientList
    ) {

        /*
         * Jika origin sama, gunakan tab tersebut.
         */

        try {

            const clientUrl =
                new URL(
                    client.url
                );


            const scopeUrl =
                new URL(
                    self.registration.scope
                );


            if (
                clientUrl.origin ===
                scopeUrl.origin
            ) {

                if (
                    "navigate" in client
                ) {

                    await client.navigate(
                        targetUrl
                    );

                }


                if (
                    "focus" in client
                ) {

                    return client.focus();

                }

            }


        } catch {

            // Abaikan URL client yang tidak dapat dibaca.

        }

    }


    // ==================================================
    // BELUM ADA TAB APLIKASI
    // ==================================================

    if (
        self.clients.openWindow
    ) {

        return self.clients.openWindow(
            targetUrl
        );

    }


    return null;

}
