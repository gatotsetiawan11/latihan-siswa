// ============================================================
// LATIHAN SISWA
// COLUMN VISIBILITY FIX V3 - STABLE
//
// Tingkat 10 - 15 = perkalian bersusun.
//
// V3:
// - tidak memakai MutationObserver
// - tidak memakai setInterval
// - tidak menulis style berulang-ulang
// - menghindari layout/viewport bergetar di HP
// ============================================================

(() => {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const currentStage =
        Number(
            params.get(
                "stage"
            )
        );


    const columnMode =

        Number.isInteger(
            currentStage
        )

        &&

        currentStage >= 10

        &&

        currentStage <= 15;


    // ========================================================
    // ROOT CLASS
    // ========================================================

    document.documentElement
        .classList
        .toggle(
            "column-mode-active",
            columnMode
        );


    // ========================================================
    // APPLY SEKALI
    // ========================================================

    function applyVisibility() {

        if (!document.body) {

            return;
        }


        document.body
            .classList
            .toggle(
                "column-mode-active",
                columnMode
            );


        const directArea =
            document.getElementById(
                "directQuestionArea"
            );


        const columnArea =
            document.getElementById(
                "columnQuestionArea"
            );


        const answerInput =
            document.getElementById(
                "answerInput"
            );


        if (columnMode) {

            // ================================================
            // MODE BERSUSUN
            // ================================================

            if (directArea) {

                directArea
                    .classList
                    .add(
                        "hidden"
                    );


                directArea.setAttribute(
                    "aria-hidden",
                    "true"
                );
            }


            if (answerInput) {

                answerInput.disabled =
                    true;


                answerInput.tabIndex =
                    -1;
            }


            if (columnArea) {

                columnArea
                    .classList
                    .remove(
                        "hidden"
                    );


                columnArea.removeAttribute(
                    "aria-hidden"
                );
            }


        } else {

            // ================================================
            // MODE BIASA
            // ================================================

            if (directArea) {

                directArea
                    .classList
                    .remove(
                        "hidden"
                    );


                directArea.removeAttribute(
                    "aria-hidden"
                );
            }


            if (answerInput) {

                answerInput.disabled =
                    false;


                answerInput.tabIndex =
                    0;
            }
        }
    }


    // ========================================================
    // DOM SUDAH SIAP
    // ========================================================

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            applyVisibility,
            {
                once: true
            }
        );


    } else {

        applyVisibility();
    }


    // ========================================================
    // KEMBALI DARI BACK/FORWARD CACHE
    // ========================================================

    window.addEventListener(
        "pageshow",
        applyVisibility
    );

})();
