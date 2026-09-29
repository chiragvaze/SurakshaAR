package com.surakshaar.shell

import org.json.JSONException
import org.json.JSONObject

/**
 * Web <-> Android <-> Unity contract (docs/07_API_AND_BRIDGE_CONTRACTS.md).
 *
 * The Android shell only does structural checks. The web layer (web-app/js/services/training.js)
 * re-validates and RE-SCORES every result before it can become an attempt or certificate.
 */
object BridgeContract {
    val MODULES = setOf("fire_explosion", "gas_confined")
    val LANGUAGES = setOf("en", "hi", "sat")

    const val EXTRA_MODULE = "module"
    const val EXTRA_LANG = "lang"
    const val EXTRA_RESULT = "result"
    const val EXTRA_REASON = "reason"

    const val MAX_RESULT_LENGTH = 1024
    private const val MAX_STEPS = 20

    fun isValidLaunch(module: String?, lang: String?): Boolean = module in MODULES && lang in LANGUAGES

    /**
     * Returns a normalized JSON string for {"module","score","wrong","completed"} or null if the
     * payload is malformed, too large, for an unknown module, or not completed.
     */
    fun sanitizeResult(json: String?): String? {
        if (json == null || json.length > MAX_RESULT_LENGTH) return null
        val obj = try {
            JSONObject(json)
        } catch (e: JSONException) {
            return null
        }
        val module = obj.optString("module", "")
        if (module !in MODULES) return null
        if (!obj.has("completed") || obj.opt("completed") != true) return null
        val wrong = obj.opt("wrong") as? Int ?: return null
        if (wrong < 0 || wrong > MAX_STEPS) return null
        val out = JSONObject()
            .put("module", module)
            .put("wrong", wrong)
            .put("completed", true)
        if (obj.has("score")) {
            val score = obj.opt("score") as? Int ?: return null
            if (score < 0 || score > 100) return null
            out.put("score", score)
        }
        return out.toString()
    }

    /** Safe JavaScript call into the web app; the argument is JSON-quoted, never concatenated raw. */
    fun jsCall(function: String, argument: String): String {
        require(function.matches(Regex("^[A-Za-z]+$"))) { "bad function name" }
        val quoted = JSONObject.quote(argument)
        return "(function(){var s=window.SurakshaAR;if(s&&typeof s.$function==='function'){s.$function($quoted);}})();"
    }
}
