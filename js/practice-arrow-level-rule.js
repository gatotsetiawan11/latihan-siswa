// ============================================================
// LATIHAN SISWA
// ATURAN BANTUAN PANAH BERDASARKAN LEVEL
//
// Level 1 - 5  : panah bantuan AKTIF
// Level 6 ke atas: panah bantuan DISEMBUNYIKAN
//
// Berlaku untuk:
// - perkalian bersusun 2 digit x 1 digit
// - perkalian bersusun 3 digit x 1 digit
// - perkalian bersusun 2 digit x 2 digit
// ============================================================

(() => {

    // ========================================================
    // AMBIL NOMOR LEVEL
    // ========================================================

    let currentLevel = 0;


    // Coba ambil dari practice.js terlebih dahulu.
    try {

        if (
            typeof levelNumber !== "undefined"
        ) {

            currentLevel =
                Number(
                    levelNumber
                );
        }

    } catch (error) {

        currentLevel = 0;
    }


    // ========================================================
    // FALLBACK:
    // ambil langsung dari URL
    //
    // contoh:
    // practice.html?...&level=6
    // ========================================================

    if (
        !Number.isInteger(
            currentLevel
        )
        ||
        currentLevel <= 0
    ) {

        const params =
            new URLSearchParams(
                window.location.search
            );


        currentLevel =
            Number(
                params.get(
                    "level"
                )
            );
    }


    // ========================================================
    // CSS KHUSUS
    // ========================================================

    const style =
        document.createElement(
            "style"
        );


    style.textContent = `

        /* ====================================================
           LEVEL 6 KE ATAS
           SEMUA PANAH BANTUAN DISEMBUNYIKAN
           ==================================================== */

        html.practice-arrows-off
        #columnGuideArrow,

        html.practice-arrows-off
        .column-guide-arrow,

        html.practice-arrows-off
        #lm22Arrow,

        html.practice-arrows-off
        .lm22-arrow {

            display:
                none
                !important;

            visibility:
                hidden
                !important;

            opacity:
                0
                !important;

            pointer-events:
                none
                !important;
        }

    `;


    document.head.appendChild(
        style
    );


    // ========================================================
    // TERAPKAN ATURAN
    // ========================================================

    if (
        Number.isInteger(
            currentLevel
        )
        &&
        currentLevel >= 6
    ) {

        document.documentElement
            .classList
            .add(
                "practice-arrows-off"
            );


        console.log(
            `Practice arrow: OFF untuk Level ${currentLevel}`
        );

    } else {

        document.documentElement
            .classList
            .remove(
                "practice-arrows-off"
            );


        console.log(
            `Practice arrow: ON untuk Level ${currentLevel}`
        );
    }

})();
