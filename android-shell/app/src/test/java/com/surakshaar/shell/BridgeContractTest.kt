package com.surakshaar.shell

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class BridgeContractTest {

    @Test
    fun launchParamsAreWhitelisted() {
        assertTrue(BridgeContract.isValidLaunch("fire_explosion", "en"))
        assertTrue(BridgeContract.isValidLaunch("gas_confined", "sat"))
        assertFalse(BridgeContract.isValidLaunch("machinery", "en"))
        assertFalse(BridgeContract.isValidLaunch("fire_explosion", "fr"))
        assertFalse(BridgeContract.isValidLaunch(null, "en"))
        assertFalse(BridgeContract.isValidLaunch("fire_explosion", null))
    }

    @Test
    fun validResultIsNormalized() {
        val out = JSONObject(BridgeContract.sanitizeResult("""{"module":"fire_explosion","score":100,"wrong":0,"completed":true,"extra":"x"}""")!!)
        assertEquals("fire_explosion", out.getString("module"))
        assertEquals(100, out.getInt("score"))
        assertEquals(0, out.getInt("wrong"))
        assertEquals(true, out.getBoolean("completed"))
        assertFalse("unknown keys are dropped", out.has("extra"))
    }

    @Test
    fun scoreIsOptional() {
        val out = JSONObject(BridgeContract.sanitizeResult("""{"module":"gas_confined","wrong":2,"completed":true}""")!!)
        assertEquals(2, out.getInt("wrong"))
        assertFalse(out.has("score"))
    }

    @Test
    fun malformedResultsAreRejected() {
        listOf(
            null,
            "",
            "not json",
            "[]",
            """{"module":"machinery","wrong":0,"completed":true}""",
            """{"module":"fire_explosion","wrong":0,"completed":false}""",
            """{"module":"fire_explosion","wrong":0}""",
            """{"module":"fire_explosion","wrong":"0","completed":true}""",
            """{"module":"fire_explosion","wrong":-1,"completed":true}""",
            """{"module":"fire_explosion","wrong":0,"score":"100","completed":true}""",
            """{"module":"fire_explosion","wrong":0,"score":101,"completed":true}""",
            """{"module":"fire_explosion","wrong":0,"completed":"true"}""",
            "{\"module\":\"fire_explosion\",\"wrong\":0,\"completed\":true,\"pad\":\"" + "x".repeat(2000) + "\"}"
        ).forEach { assertNull("should reject: ${it?.take(60)}", BridgeContract.sanitizeResult(it)) }
    }

    @Test
    fun jsCallQuotesArgumentSafely() {
        val arg = """{"a":"</script>'\"x"}"""
        val js = BridgeContract.jsCall("onARResult", arg)
        assertTrue(js.contains("s.onARResult(" + JSONObject.quote(arg) + ")"))
        assertFalse("raw argument must not appear unquoted", js.contains("($arg)"))
    }

    @Test(expected = IllegalArgumentException::class)
    fun jsCallRejectsBadFunctionName() {
        BridgeContract.jsCall("alert(1);x", "")
    }
}
