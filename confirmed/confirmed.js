/*
=====================================================================
    !confirmed.js file will connect "booking-confirmed" for FLYT.com
=====================================================================
*/

// =============================================================================
// BOOKING CONFIRMED PAGE — GUARD
// Verifies transaction_id from URL against the API before showing page content
// =============================================================================

const VERIFY_PAYMENT_API =
   "https://operators-dashboard.bubbleapps.io/api/1.1/wf/webflow_verify_payment_flyt";

(async function verifyBooking() {
   const urlParams = new URLSearchParams(window.location.search);
   const transactionId = urlParams.get("transaction_id");
   const authToken =
      typeof Cookies !== "undefined" ? Cookies.get("authToken") : null;

   // ── 1. No transaction_id or not logged in → redirect home ──
   if (!transactionId || !authToken) {
      window.location.href = "/";
      throw new Error("Missing transaction ID or auth token");
   }

   try {
      const res = await fetch(VERIFY_PAYMENT_API, {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
         },
         body: JSON.stringify({
            transaction_id: transactionId,
         }),
      });

      const data = await res.json();

      // ── 2. API says invalid → redirect home ──
      if (!res.ok || !data.response || !data.response.payment_verified) {
         window.location.href = "/";
         throw new Error("Invalid payment verification");
      }

      // ── 3. Valid — show page content ──
      document.body.classList.remove("confirmed_loading");
   } catch (err) {
      console.error("Verify Payment Error:", err);
      window.location.href = "/";
      throw new Error("Verification error");
   }
})();
