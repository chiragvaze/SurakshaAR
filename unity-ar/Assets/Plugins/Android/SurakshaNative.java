package com.surakshaar.unity;

import android.app.Activity;
import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.speech.tts.TextToSpeech;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextPaint;
import android.util.Log;

import java.io.ByteArrayOutputStream;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Native helpers for the Unity AR trainer.
 *
 * 1. renderText: Unity's text renderers cannot shape Devanagari (matras/conjuncts), so all
 *    Hindi/Santali text is laid out by Android (HarfBuzz/Minikin) into a PNG that Unity shows
 *    as a texture.
 * 2. Text-to-speech: offline Android TTS for voice instructions. If the language voice is not
 *    installed the trainer simply stays text-only (docs/08_LOCALIZATION.md fallback).
 * 3. Santali voice: pre-recorded clips bundled in the APK's web assets (assets/web/audio/sat/...),
 *    played with MediaPlayer, one sequence at a time (docs/SANTALI_LOCALIZATION.md).
 * Nothing here uses the network or the camera.
 */
public final class SurakshaNative {
    private static final String TAG = "SurakshaNative";

    private SurakshaNative() {}

    // ------------------------------------------------------------------ text rendering

    /**
     * @param align 0 = left, 1 = center, 2 = right
     * @return PNG bytes (width = widthPx, height fits the wrapped text), or null on error
     */
    public static byte[] renderText(String text, int widthPx, float textSizePx, int textColor, int bgColor,
                                    boolean bold, int align, int paddingPx, float cornerRadiusPx) {
        try {
            if (text == null) text = "";
            TextPaint paint = new TextPaint(Paint.ANTI_ALIAS_FLAG);
            paint.setTextSize(textSizePx);
            paint.setColor(textColor);
            paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, bold ? Typeface.BOLD : Typeface.NORMAL));

            int innerWidth = Math.max(1, widthPx - 2 * paddingPx);
            Layout.Alignment a = align == 1 ? Layout.Alignment.ALIGN_CENTER
                    : align == 2 ? Layout.Alignment.ALIGN_OPPOSITE : Layout.Alignment.ALIGN_NORMAL;
            StaticLayout layout = StaticLayout.Builder.obtain(text, 0, text.length(), paint, innerWidth)
                    .setAlignment(a)
                    .setIncludePad(true)
                    .setLineSpacing(0f, 1.1f)
                    .build();

            int height = Math.max(1, layout.getHeight() + 2 * paddingPx);
            Bitmap bmp = Bitmap.createBitmap(widthPx, height, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bmp);
            if ((bgColor >>> 24) != 0) {
                Paint bg = new Paint(Paint.ANTI_ALIAS_FLAG);
                bg.setColor(bgColor);
                canvas.drawRoundRect(new RectF(0, 0, widthPx, height), cornerRadiusPx, cornerRadiusPx, bg);
            }
            canvas.translate(paddingPx, paddingPx);
            layout.draw(canvas);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            bmp.compress(Bitmap.CompressFormat.PNG, 100, out);
            bmp.recycle();
            return out.toByteArray();
        } catch (Throwable t) {
            Log.e(TAG, "renderText failed", t);
            return null;
        }
    }

    // ------------------------------------------------------------------ text-to-speech

    private static TextToSpeech tts;
    private static volatile boolean ttsReady;
    private static volatile int ttsState; // 0 = not started, 1 = starting, 2 = ready, -1 = unavailable
    private static String ttsLang = "en";

    /** Start the TTS engine (asynchronous). Safe to call more than once. */
    public static void ttsInit(final Activity activity) {
        if (ttsState != 0 || activity == null) return;
        ttsState = 1;
        activity.runOnUiThread(new Runnable() {
            @Override public void run() {
                try {
                    tts = new TextToSpeech(activity.getApplicationContext(), new TextToSpeech.OnInitListener() {
                        @Override public void onInit(int status) {
                            ttsState = status == TextToSpeech.SUCCESS ? 2 : -1;
                            if (ttsState == 2) applyLanguage(ttsLang);
                            Log.i(TAG, "TTS init status=" + status);
                        }
                    });
                } catch (Throwable t) {
                    ttsState = -1;
                    Log.e(TAG, "TTS init failed", t);
                }
            }
        });
    }

    /** "en" -> en-IN, "hi" -> hi-IN. Returns true if a voice for that language is usable. */
    public static boolean ttsSetLanguage(String lang) {
        ttsLang = lang == null ? "en" : lang;
        return ttsState == 2 && applyLanguage(ttsLang);
    }

    private static boolean applyLanguage(String lang) {
        if (tts == null) return false;
        Locale locale = "hi".equals(lang) ? new Locale("hi", "IN") : new Locale("en", "IN");
        int r = tts.setLanguage(locale);
        if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) {
            if (!"hi".equals(lang)) r = tts.setLanguage(Locale.ENGLISH);
            ttsReady = !"hi".equals(lang) && r >= TextToSpeech.LANG_AVAILABLE;
        } else {
            ttsReady = true;
        }
        Log.i(TAG, "TTS language " + lang + " usable=" + ttsReady);
        return ttsReady;
    }

    /** 2 = ready, 1 = starting, 0 = not started, -1 = unavailable. */
    public static int ttsState() {
        return ttsState;
    }

    public static boolean ttsSpeak(String text) {
        if (ttsState != 2 || !ttsReady || tts == null || text == null) return false;
        return tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "suraksha") == TextToSpeech.SUCCESS;
    }

    public static void ttsStop() {
        if (tts != null) tts.stop();
    }

    public static void ttsShutdown() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
            tts = null;
        }
        ttsState = 0;
        ttsReady = false;
    }

    // ------------------------------------------------------------------ Santali voice clips

    /** Only clip paths from the voice manifest shape are accepted (no arbitrary asset access). */
    private static final Pattern CLIP_PATH = Pattern.compile("^audio/sat/[a-z]+/sat_[a-z0-9_]+\\.ogg$");
    private static Context appContext;
    private static MediaPlayer player;
    private static String[] clipQueue;
    private static int clipIndex;

    public static void voiceInit(final Activity activity) {
        if (activity != null) appContext = activity.getApplicationContext();
    }

    /** True if every clip exists in the APK (assets/web/<path>) and has an allowed path. */
    public static boolean voiceHas(String[] paths) {
        if (appContext == null || paths == null || paths.length == 0) return false;
        for (String p : paths) {
            if (p == null || !CLIP_PATH.matcher(p).matches()) return false;
            try (AssetFileDescriptor fd = appContext.getAssets().openFd("web/" + p)) {
                if (fd.getLength() <= 0) return false;
            } catch (Exception e) {
                return false;
            }
        }
        return true;
    }

    /** Plays the clips in order, stopping anything already playing. False if any clip is unusable. */
    public static synchronized boolean voicePlay(String[] paths) {
        voiceStop();
        if (!voiceHas(paths)) return false;
        clipQueue = paths.clone();
        clipIndex = 0;
        return playNextClip();
    }

    private static synchronized boolean playNextClip() {
        releasePlayer();
        if (clipQueue == null || clipIndex >= clipQueue.length) { clipQueue = null; return false; }
        String path = clipQueue[clipIndex++];
        MediaPlayer mp = new MediaPlayer();
        try (AssetFileDescriptor fd = appContext.getAssets().openFd("web/" + path)) {
            mp.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build());
            mp.setDataSource(fd.getFileDescriptor(), fd.getStartOffset(), fd.getLength());
            mp.setOnCompletionListener(m -> {
                synchronized (SurakshaNative.class) { if (player == m) playNextClip(); }
            });
            mp.setOnErrorListener((m, what, extra) -> {
                Log.w(TAG, "voice clip error " + what + "/" + extra);
                synchronized (SurakshaNative.class) { if (player == m) voiceStop(); }
                return true;
            });
            mp.prepare(); // local asset: fast and synchronous
            mp.start();
            player = mp;
            return true;
        } catch (Exception e) {
            Log.w(TAG, "voice clip failed: " + path, e);
            mp.release();
            clipQueue = null;
            return false;
        }
    }

    public static synchronized boolean voicePlaying() {
        return player != null;
    }

    public static synchronized void voiceStop() {
        clipQueue = null;
        releasePlayer();
    }

    private static void releasePlayer() {
        if (player == null) return;
        try { player.stop(); } catch (Exception ignore) { /* not started */ }
        player.release();
        player = null;
    }
}
