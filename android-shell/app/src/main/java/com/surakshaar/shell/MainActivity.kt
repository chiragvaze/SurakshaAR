package com.surakshaar.shell

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.webkit.ServiceWorkerClientCompat
import androidx.webkit.ServiceWorkerControllerCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import androidx.webkit.WebViewFeature

/**
 * Hosts the unchanged Phase 1 web app (web-app/, copied into assets/web at build time) and
 * bridges it to the Unity AR trainer.
 *
 *   JS  -> Android.launchAR(module, lang)          (WebAppBridge)
 *   Android -> ARUnityActivity (Unity, own process) with Intent extras
 *   Unity -> ARUnityActivity.returnARResult(json)  -> setResult -> back here
 *   Android -> window.SurakshaAR.onARResult(json)   (web validates + re-scores)
 *
 * Everything is local: assets are served by WebViewAssetLoader, no network is used.
 */
class MainActivity : ComponentActivity() {

    companion object {
        private const val TAG = "SurakshaShell"
        private const val START_URL = "https://appassets.androidplatform.net/assets/web/index.html"
        private const val ASSET_HOST = "appassets.androidplatform.net"
    }

    private lateinit var webView: WebView
    private lateinit var assetLoader: WebViewAssetLoader
    private var pageReady = false
    private var pendingJs: String? = null
    private var arRunning = false

    private val arLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { res ->
        onArFinished(res.resultCode, res.data)
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)

        assetLoader = WebViewAssetLoader.Builder()
            .setDomain(ASSET_HOST)
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this)
        setContentView(webView)
        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true            // localStorage "sa_v1"
            allowFileAccess = false
            allowContentAccess = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            setSupportZoom(false)
        }
        webView.webViewClient = LocalOnlyClient()

        // The web app registers a service worker on https origins; route its fetches to local assets too.
        if (WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_BASIC_USAGE) &&
            WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_SHOULD_INTERCEPT_REQUEST)
        ) {
            ServiceWorkerControllerCompat.getInstance().setServiceWorkerClient(object : ServiceWorkerClientCompat() {
                override fun shouldInterceptRequest(request: WebResourceRequest): WebResourceResponse? =
                    assetLoader.shouldInterceptRequest(request.url)
            })
        }

        webView.addJavascriptInterface(WebAppBridge(), "Android")

        if (savedInstanceState != null) {
            arRunning = savedInstanceState.getBoolean("arRunning", false)
            webView.restoreState(savedInstanceState)
        }
        if (webView.url == null) webView.loadUrl(START_URL)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putBoolean("arRunning", arRunning)
        webView.saveState(outState)
    }

    override fun onDestroy() {
        webView.removeJavascriptInterface("Android")
        webView.destroy()
        super.onDestroy()
    }

    // ---------------------------------------------------------------- JS bridge

    /** Exposed to the page as window.Android. Methods run on a WebView background thread. */
    inner class WebAppBridge {
        @JavascriptInterface
        fun launchAR(module: String?, lang: String?) {
            runOnUiThread { startAr(module, lang) }
        }
    }

    private fun startAr(module: String?, lang: String?) {
        if (arRunning) return // ignore double taps
        if (!BridgeContract.isValidLaunch(module, lang)) {
            Log.w(TAG, "launchAR rejected: module=$module lang=$lang")
            deliverJs(BridgeContract.jsCall("onARError", "bad_params"))
            return
        }
        val intent = Intent(this, ARUnityActivity::class.java)
            .putExtra(BridgeContract.EXTRA_MODULE, module)
            .putExtra(BridgeContract.EXTRA_LANG, lang)
        try {
            arRunning = true
            arLauncher.launch(intent)
        } catch (e: Exception) {
            arRunning = false
            Log.e(TAG, "Unity launch failed", e)
            Toast.makeText(this, R.string.ar_launch_failed, Toast.LENGTH_LONG).show()
            deliverJs(BridgeContract.jsCall("onARError", "launch_failed"))
        }
    }

    private fun onArFinished(resultCode: Int, data: Intent?) {
        arRunning = false
        if (resultCode == RESULT_OK) {
            val json = BridgeContract.sanitizeResult(data?.getStringExtra(BridgeContract.EXTRA_RESULT))
            if (json != null) {
                Log.i(TAG, "AR result -> web: $json")
                deliverJs(BridgeContract.jsCall("onARResult", json))
            } else {
                Log.w(TAG, "AR result rejected (malformed)")
                Toast.makeText(this, R.string.ar_bad_result, Toast.LENGTH_LONG).show()
                deliverJs(BridgeContract.jsCall("onARError", "bad_result"))
            }
        } else {
            val reason = data?.getStringExtra(BridgeContract.EXTRA_REASON) ?: "cancelled"
            Log.i(TAG, "AR closed without result: $reason")
            if (reason == "ar_unsupported" || reason == "camera_denied") {
                Toast.makeText(this, R.string.ar_unavailable, Toast.LENGTH_LONG).show()
            }
            deliverJs(BridgeContract.jsCall("onARError", reason.take(40)))
        }
    }

    /** Run JS now, or after the page finishes loading (e.g. if this activity was recreated). */
    private fun deliverJs(js: String) {
        if (pageReady) webView.evaluateJavascript(js, null) else pendingJs = js
    }

    // ---------------------------------------------------------------- WebView client

    private inner class LocalOnlyClient : WebViewClientCompat() {
        override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
            assetLoader.shouldInterceptRequest(request.url)

        /** Only the bundled app may load; anything else is blocked (no external navigation). */
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean =
            !isLocal(request.url)

        override fun onPageFinished(view: WebView, url: String?) {
            pageReady = true
            pendingJs?.let {
                pendingJs = null
                view.evaluateJavascript(it, null)
            }
        }

        private fun isLocal(uri: Uri) = uri.scheme == "https" && uri.host == ASSET_HOST
    }
}
