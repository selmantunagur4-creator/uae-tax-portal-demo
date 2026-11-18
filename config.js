/* =====================================================================
 *  DTA e-Services (Demo) - Countly demo portal
 *  CONFIGURATION FILE - this is the ONLY file you need to edit
 *  before running the demo.
 * =====================================================================
 *
 *  THE LIVE APP KEY IS ALREADY SET ON THE "APP_KEY" LINE BELOW.
 *  This copy targets the UAE Tax Authority app on https://trial-uaetaxauthority.count.ly (moved from staging.count.ly on 2026-10-01; same app key)
 *  (the original in C:\Countly\DTA_Demo\portal still targets demo-ui.count.ly).
 *
 *  To point the portal at a different Countly app, replace that one
 *  string. Where to find it: Countly dashboard -> (your app) ->
 *  Management -> Applications -> "App Key".
 *
 *  Nothing else in the portal needs changing. app.js reads every value
 *  from window.DTA_DEMO_CONFIG below.
 * ===================================================================== */

window.DTA_DEMO_CONFIG = {

  /* ---------------------------------------------------------------
   * 1) Countly server URL (no trailing slash).
   * --------------------------------------------------------------- */
  COUNTLY_URL: "https://trial-uaetaxauthority.count.ly",

  /* ---------------------------------------------------------------
   * 2) >>>>>>>>>>  THE APP KEY LIVES HERE  <<<<<<<<<<
   *    This is the live key for the demo app on demo-ui.count.ly.
   *    Replace the whole string to target a different Countly app.
   *    If it is ever wrong or missing, the SDK still loads and every
   *    code path still runs - the server just rejects each request
   *    with HTTP 400.
   * --------------------------------------------------------------- */
  APP_KEY: "d5e48c5851466f83f0d3077142c649b0a5f1a0bf",   // UAE Tax Authority (trial-uaetaxauthority.count.ly, same key as on staging)

  /* ---------------------------------------------------------------
   * 3) Link used by the "Open Countly" button in the demo panel.
   *    The Event Log lives inside the Countly dashboard; the exact
   *    route differs between Countly versions, so this just opens the
   *    dashboard root. Paste a deep link to your Event Log here if you
   *    want the button to jump straight to it during the demo.
   * --------------------------------------------------------------- */
  EVENT_LOG_URL: "https://trial-uaetaxauthority.count.ly/",

  /* ---------------------------------------------------------------
   * 4) Reported as app_version on every request / crash report.
   * --------------------------------------------------------------- */
  APP_VERSION: "1.0.0",

  /* ---------------------------------------------------------------
   * 5) Countly SDK debug logging in the browser console.
   *    Leave true for a demo - it makes the SDK narrate what it does,
   *    which is useful if you open devtools on the projector.
   * --------------------------------------------------------------- */
  DEBUG: true,

  /* ---------------------------------------------------------------
   * 6) Remote config / A/B test key. Must match taxonomy.json.
   *    Create a remote config value with this key in Countly and
   *    attach the A/B test to it to drive live variant assignment.
   * --------------------------------------------------------------- */
  AB_TEST_KEY: "filing_form_layout",
  AB_VARIANTS: ["control", "variant_a_fewer_fields", "variant_b_guided"],

  /* ---------------------------------------------------------------
   * 7) How long to wait for remote config before falling back to a
   *    locally chosen variant (milliseconds).
   * --------------------------------------------------------------- */
  REMOTE_CONFIG_TIMEOUT_MS: 4000
};
