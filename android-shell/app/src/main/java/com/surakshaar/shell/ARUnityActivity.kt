package com.surakshaar.shell

import android.content.Intent
import com.unity3d.player.UnityPlayerActivity

/**
 * Unity AR trainer host. Runs in its own process (":unity", see AndroidManifest.xml) so that
 * Unity shutting down on finish() can never take the WebView/localStorage process with it.
 *
 * Unity reads Intent extras "module"/"lang" (unity-ar/Assets/Scripts/Bridge/AndroidBridge.cs)
 * and calls the two methods below through JNI. The result travels back to MainActivity via
 * setResult(), which works across processes.
 */
class ARUnityActivity : UnityPlayerActivity() {

    /** Called by Unity (AndroidBridge.SendResult) when training completes. */
    fun returnARResult(json: String?) {
        runOnUiThread {
            setResult(RESULT_OK, Intent().putExtra(BridgeContract.EXTRA_RESULT, json))
            finish()
        }
    }

    /** Called by Unity (AndroidBridge.Cancel): user closed AR, AR unsupported, permission denied... */
    fun cancelAR(reason: String?) {
        runOnUiThread {
            setResult(RESULT_CANCELED, Intent().putExtra(BridgeContract.EXTRA_REASON, reason ?: "cancelled"))
            finish()
        }
    }
}
