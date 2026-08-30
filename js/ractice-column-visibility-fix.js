// ======================================================
// LATIHAN SISWA
// FIX VISIBILITY MODE BERSUSUN
//
// Tujuan:
// - Saat mode bersusun aktif, area soal biasa disembunyikan.
// - Hanya area perkalian bersusun yang tampil.
// - Berlaku untuk 2x1, 3x1, dan 2x2.
// ======================================================

(() => {

    function safeIsColumnMode() {

        try {

            if (
                typeof isColumnMode === "function"
            ) {

                return isColumnMode();
            }

        } catch (error) {}


        const method =
            String(
                window.levelData
                    ?.config
                    ?.column_method
                ||
                ""
            );


        return method.startsWith(
            "long_"
        );
    }


    function applyColumnVisibility() {

        const directQuestionArea =
            document.getElementById(
                "directQuestionArea"
            );


        const columnQuestionArea =
            document.getElementById(
                "columnQuestionArea"
            );


        if (
            !directQuestionArea
            ||
            !columnQuestionArea
        ) {

            return;
        }


        const columnActive =
            safeIsColumnMode();


        document.body.classList.toggle(
            "column-mode-active",
            columnActive
        );


        if (columnActive) {

            directQuestionArea.classList.add(
                "hidden"
            );

            directQuestionArea.style.display =
                "none";

            directQuestionArea.setAttribute(
                "aria-hidden",
                "true"
            );


            columnQuestionArea.classList.remove(
                "hidden"
            );

            columnQuestionArea.style.display =
                "";

            columnQuestionArea.removeAttribute(
                "aria-hidden"
            );

        } else {

            directQuestionArea.classList.remove(
                "hidden"
            );

            directQuestionArea.style.display =
                "";

            directQuestionArea.removeAttribute(
                "aria-hidden"
            );


            columnQuestionArea.style.display =
                "";
        }
    }


    function runSoon() {

        requestAnimationFrame(
            () => {

                setTimeout(
                    applyColumnVisibility,
                    0
                );

            }
        );
    }


    window.addEventListener(
        "load",
        runSoon
    );


    document.addEventListener(
        "DOMContentLoaded",
        runSoon
    );


    const observer =
        new MutationObserver(
            () => {

                runSoon();
            }
        );


    function startObserver() {

        if (!document.body) {

            setTimeout(
                startObserver,
                100
            );

            return;
        }


        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: [
                    "class"
                ]
            }
        );
    }


    startObserver();


    // Safety check tambahan
    setInterval(
        applyColumnVisibility,
        500
    );

})();
