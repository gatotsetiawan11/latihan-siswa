# English AI Next Phase

## Tujuan
Mengubah Conversation AI dari satu materi tetap menjadi engine pembelajaran berbasis level.

## Status Saat Ini
- Frontend conversation sudah mendukung konfigurasi level.
- Hands-free flow sudah diperbaiki.
- TTS dan speech recognition tetap melalui alur aman.
- API key OpenAI tetap di Edge Function.

## Tahap Berikutnya

### 1. Edge Function Prompt Engine
Edge Function `english-conversation` perlu membaca konfigurasi level:

```json
{
  "scenario": "Greeting and introduction",
  "assistant_role": "friendly English partner",
  "target_vocabulary": ["name", "age", "hello"],
  "grammar_focus": ["I am", "My name is"],
  "max_turns": 6
}
```

### 2. Response AI Standar
Output AI tetap:

```json
{
  "assistant_text": "Nice to meet you!",
  "feedback": "Good answer",
  "correction": "My name is Andi",
  "relevant": true,
  "should_end": false
}
```

### 3. Materi Level
Contoh urutan:

1. Introduction
2. Greeting & Feeling
3. Family
4. School
5. Hobbies
6. Daily Activities

### 4. Laporan
Data yang perlu disimpan:

- jumlah percakapan;
- skor relevansi;
- kosakata muncul;
- kesalahan umum;
- level selesai.

## Catatan Debug
Jika avatar berhenti pada Thinking:

1. cek Edge Function log;
2. cek OpenAI response;
3. cek autentikasi Supabase;
4. cek format JSON response.

Jangan melakukan perubahan frontend sebelum sumber error backend diketahui.
