# HANDOFF PROJECT --- AI Question Generator (Rule-v2)

## Ringkasan

Sistem generator soal berbasis rule engine dengan pipeline:

Concept ↓ Skill Resolver ↓ Cognitive Mapping ↓ Question Generator ↓
Option Generator ↓ Quality Check ↓ Database Insert

## Status Implementasi

### Database

Kolom metadata:

``` sql
alter table questions
add column cognitive_level text,
add column difficulty integer,
add column difficulty_label text,
add column quality_score integer,
add column concept_id uuid;
```

## Level Selesai

### C1 Mengenal

Status: selesai

-   cognitive: C1
-   difficulty: 1
-   label: basic recall

### C2 Memahami Dasar

Status: selesai

-   cognitive: C2
-   difficulty: 2
-   label: understanding

### C3 Penerapan

Status: selesai dan stabil.

-   skill: penerapan
-   cognitive: C3
-   difficulty: 4
-   label: application

Level ID:

`813ecd1a-0657-45d1-a17a-8124f8ddb4e1`

Pola:

aktivitas nyata + tujuan + pemilihan organ

## cleanText

Sudah ditingkatkan untuk:

-   duplikasi kata
-   spasi
-   tanda baca

## C4 Analisis

Status: sedang dikembangkan.

Mapping:

-   cognitive: C4
-   difficulty: 5
-   label: deep analysis

Level ID:

`f47613a5-a934-49e4-b780-a520e07f0f68`

## Masalah C4

Metadata sudah C4, tetapi pola soal masih terlalu dekat dengan C3.

Pola lama:

fungsi hilang → cari organ

Contoh:

"Fani tidak mampu mengecap rasa. Organ yang bermasalah adalah..."

Target C4:

informasi normal + informasi normal + informasi terganggu → analisis →
kesimpulan

## Fungsi yang Perlu Dicek

Fokus:

``` ts
function generateAnalysisQuestion(concept:any)
```

Pastikan tidak memakai:

``` ts
const functionText = getFunction(concept);
```

atau template lama.

Harus menggunakan:

``` ts
const scenarioList = getAnalysisScenario(concept);
const scenario = randomItem(scenarioList);
```

## getAnalysisScenario

Harus menghasilkan scenario kompleks:

``` ts
{
 condition:"",
 clue:""
}
```

Bentuk ideal:

-   fungsi A normal
-   fungsi B normal
-   fungsi C terganggu

## Test C4

Gunakan:

``` json
{
 "level_id":"f47613a5-a934-49e4-b780-a520e07f0f68",
 "jumlah":10
}
```

Validasi:

-   cognitive_level C4
-   difficulty sesuai
-   tidak ada undefined
-   soal membutuhkan analisis

## Roadmap

1.  Finalisasi C4
2.  Bangun C5 evaluasi/HOTS

## Status

  Modul               Status
  ------------------- ---------
  Database metadata   selesai
  Skill resolver      selesai
  C1                  selesai
  C2                  selesai
  C3                  selesai
  Grammar cleaning    selesai
  C4 routing          selesai
  C4 kualitas soal    proses
  C5                  belum

## Prioritas Developer Berikutnya

1.  Perbaiki generateAnalysisQuestion()
2.  Test C4 10 soal
3.  Pastikan soal benar-benar analisis
4.  Lanjut C5
