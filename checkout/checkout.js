// =============================================================================
// URL PARAM GUARDS
// =============================================================================
const urlParams = new URLSearchParams(window.location.search);

const bookingId = urlParams.get("id");
const carbonParam = urlParams.get("carbon");
const paxParam = urlParams.get("pax");

if (!bookingId) {
   window.location.href = "/aircraft";
}
if (carbonParam !== "true" && carbonParam !== "false") {
   window.location.href = "/aircraft";
}
if (!paxParam || isNaN(parseInt(paxParam)) || parseInt(paxParam) < 1) {
   window.location.href = "/aircraft";
}

const includeCarbon = carbonParam === "true";
const passengerCount = parseInt(paxParam) || 1;

// =============================================================================
// CONSTANTS  — same as ad-instant-booking.js
// =============================================================================
const CHECKOUT_API =
   "https://operators-dashboard.bubbleapps.io/api/1.1/wf/webflow_return_aircraft_detail_flyt";

const CURRENCY_SYMBOLS = {
   usd: "$",
   eur: "€",
   cad: "C$",
};

// =============================================================================
// HELPER FUNCTIONS — copied from ad-instant-booking.js
// =============================================================================
function formatDate(dateInput) {
   if (!dateInput) return "";
   let d;
   if (typeof dateInput === "string") {
      d = new Date(dateInput.replace(/-/g, "/"));
   } else {
      d = new Date(dateInput);
   }
   return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
   });
}

function formatPrice(num) {
   return Math.round(Number(num)).toLocaleString("en-US");
}

function formatEFTFromText(timeText) {
   if (!timeText) return "";
   const match = timeText.match(/(\d+)\s*hr?\s*(\d+)\s*min?/i);
   if (match) return `EFT ${match[1]}H ${match[2]}M`;
   const mins = parseInt(timeText, 10);
   if (!isNaN(mins)) return `EFT ${Math.floor(mins / 60)}H ${mins % 60}M`;
   return timeText;
}

function parseFlightMins(timeText) {
   if (!timeText) return 0;
   const match = timeText.match(/(\d+)\s*hr?\s*(\d+)\s*min?/i);
   if (match) return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
   const mins = parseInt(timeText, 10);
   return isNaN(mins) ? 0 : mins;
}

function formatTime(timestamp) {
   if (!timestamp) return "";
   return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
   });
}

// =============================================================================
// LOADER HELPERS — same as ad-instant-booking.js
// =============================================================================
function showLoader() {
   const loader = document.querySelector(".adi_page_loader");
   if (loader) loader.classList.remove("hidden");
}

function hideLoader() {
   const loader = document.querySelector(".adi_page_loader");
   if (loader) loader.classList.add("hidden");
}

// =============================================================================
// FETCH API
// =============================================================================
async function fetchCheckoutData() {
   showLoader();
   try {
      const currencyCode =
         JSON.parse(sessionStorage.getItem("currency"))?.api_currency || "USD";

      const response = await fetch(CHECKOUT_API, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            aircraftid: bookingId,
            currency_code: currencyCode,
            carbon_offset: includeCarbon,
            pax: passengerCount,
         }),
      });

      const data = await response.json();
      const detail = data.response?.aircraft_detail;

      // Redirect if wrong/invalid ID
      if (!detail || !detail._id) {
         window.location.href = "/aircraft";
         return;
      }

      console.log(data.response);

      renderMainSection(data.response);
   } catch (error) {
      console.error("Checkout Fetch Error:", error);
   } finally {
      hideLoader();
   }
}

// =============================================================================
// RENDER: Heading Block → .adi_heading_wrapper
// =============================================================================
function renderHeading() {
   const headingWrapper = document.querySelector(".adi_heading_wrapper");
   if (!headingWrapper) return;

   headingWrapper.innerHTML = `
      <div class="adi_heading_arrow">
         <a href="/instant-book?id=${encodeURIComponent(bookingId)}"><img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69c37498460e7320906ec1a3_arrow_right.png" alt="" /></a>
      </div>
      <div class="adi_heading_content">
         <h2 data-wf--white_heading_h2--variant="black_version" class="hm_sponser_h2 adi_heading_h2 w-variant-c97c5271-25fa-0785-e5a2-babd61f625cd">Checkout</h2>
         <p data-wf--global_para--variant="black_color" class="whole_para adi_heading_para w-variant-124bf981-d164-97ae-531d-77453bb396cb">Our checkout is 100% secure and encrypted. Your personal and payment details are safe with us.</p>
      </div>
   `;
}

// =============================================================================
// RENDER: Main Section
// =============================================================================
function renderMainSection(responseData) {
   const wrapper = document.querySelector(".adi_main_wrapper");
   if (!wrapper) return;

   const d = responseData.aircraft_detail;
   const legs = responseData.flight_legs || [];
   const legEFTTextKeys = ["leg_1_flight_time_text", "leg_2_flight_time_text"];

   const currencySymbol =
      CURRENCY_SYMBOLS[(d.currency_text || "").toLowerCase()] || "$";

   // Prices
   const charter = responseData.price || 0;
   const carbon = responseData.carbon_offset || 0;
   const total = responseData.total || 0;
   const finalTotal = includeCarbon ? total : total - carbon;

   // Build dynamic tax rows from applicable_tax_1 … applicable_tax_5
   let taxRows = "";
   for (let i = 1; i <= 5; i++) {
      const raw = responseData[`applicable_tax_${i}`];
      if (!raw) continue;

      const parts = raw.split("|").map((s) => s.trim());
      const labelPart = parts[0] || "";
      const ratePart = parts[1] || "";
      const amtStr = parts[2] || "";

      const amtNum = parseFloat(amtStr.replace(/[^0-9.]/g, ""));
      if (!amtNum || amtNum <= 0) continue;
      const fullLabel = ratePart ? `${labelPart} ${ratePart}` : labelPart;

      taxRows += `
               <div class="adi_estimate_row">
                  <span class="adi_estimate_label">${fullLabel}</span>
                  <span class="adi_estimate_value">${amtStr}</span>
               </div>`;
   }

   // Adjustment fees
   const interchangeRate = responseData.interchange_rate || 0;
   const interchangeFee = responseData.interchange_fee || 0;
   const priorityPercent = responseData.priority_booking_percent || 0;
   const priorityWindow = responseData.priority_booking_window || 72;
   const priorityFee = responseData.priority_booking_fee || 0;
   const peakPercent = responseData.peak_day_percent || 0;
   const peakFee = responseData.peak_travel_fee || 0;
   const intlPercent = responseData.international_fee_percent || 0;
   const intlFee = responseData.international_fee || 0;
   const tailPremium = responseData.tail_selection_premium || 0;

   // Build itinerary rows — copied from ad-instant-booking.js
   const itineraryRows = legs
      .map((leg, i) => {
         const eft = formatEFTFromText(d[legEFTTextKeys[i]]);
         const depTimestamp = leg.date_date || 0;
         const depDate = depTimestamp
            ? formatDate(depTimestamp)
            : formatDate(leg.date_as_text1_text);
         const depTime = formatTime(depTimestamp);
         const flightMins = parseFlightMins(d[legEFTTextKeys[i]]);
         const arrTimestamp = depTimestamp
            ? depTimestamp + flightMins * 60 * 1000
            : 0;
         const arrDate = arrTimestamp ? formatDate(arrTimestamp) : depDate;
         const arrTime = formatTime(arrTimestamp);
         const fICAO = leg.mobile_app_from_airport_icao_code_text || "";
         const fName = leg.mobile_app_from_airport_name_short_text || "";
         const fCity = leg.mobile_app_from_city_text_text || "";
         const tICAO = leg.mobile_app_to_airport_icao_code_text || "";
         const tName = leg.mobile_app_to_airport_name_short_text || "";
         const tCity = leg.mobile_app_to_city_text_text || "";
         return `
         <div class="adi_itin_leg">
            <div class="adi_itin_dates_row">
               <div class="adi_itin_date_block">
                  <span class="adi_itin_date">${depDate}</span>
                  <span class="adi_itin_time">${depTime}</span>
               </div>
               <span class="adi_eft_badge">${eft}</span>
               <div class="adi_itin_date_block adi_itin_date_block_right">
                  <span class="adi_itin_date">${arrDate}</span>
                  <span class="adi_itin_time">${arrTime}</span>
               </div>
            </div>
            <div class="adi_itin_route_row">
               <span class="adi_icao_code">${fICAO}</span>
               <span class="adi_route_line_wrap">
                  <img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69a23c01efc11bc69dc7d4a1_planb.png" alt="icon" />
               </span>
               <span class="adi_icao_code adi_icao_right">${tICAO}</span>
            </div>
            <div class="adi_itin_airports_row">
               <div class="adi_itin_airport">
                  <p class="adi_airport_name">${fName}</p>
                  <p class="adi_airport_city">${fCity}</p>
               </div>
               <div class="adi_itin_airport adi_itin_airport_right">
                  <p class="adi_airport_name">${tName}</p>
                  <p class="adi_airport_city">${tCity}</p>
               </div>
            </div>
         </div>`;
      })
      .join("");

   // Build adjustment rows — same as ad-instant-booking.js
   let adjRows = `
      <div class="adi_estimate_row adi_adj_row">
         <span class="adi_estimate_label">Minimum + Taxi Time</span>
         <span class="adi_estimate_value adi_adj_included">INCLUDED</span>
      </div>`;

   if (interchangeFee > 0) {
      adjRows += `
      <div class="adi_estimate_row adi_adj_row">
         <div class="adi_adj_label_wrap">
            <span class="adi_estimate_label">Interchange</span>
            <span class="adi_adj_badge">Midsize Upgrade (${interchangeRate}x)</span>
         </div>
         <span class="adi_estimate_value">${currencySymbol}${formatPrice(interchangeFee)}</span>
      </div>`;
   }
   if (priorityFee > 0) {
      adjRows += `
      <div class="adi_estimate_row adi_adj_row">
         <div class="adi_adj_label_wrap">
            <span class="adi_estimate_label">Priority Booking</span>
            <span class="adi_adj_badge">Within ${priorityWindow} hours (+${priorityPercent}%)</span>
         </div>
         <span class="adi_estimate_value">${currencySymbol}${formatPrice(priorityFee)}</span>
      </div>`;
   }
   if (peakFee > 0) {
      adjRows += `
      <div class="adi_estimate_row adi_adj_row">
         <div class="adi_adj_label_wrap">
            <span class="adi_estimate_label">Peak Travel</span>
            <span class="adi_adj_badge">High-demand date (+${peakPercent}%)</span>
         </div>
         <span class="adi_estimate_value">${currencySymbol}${formatPrice(peakFee)}</span>
      </div>`;
   }
   if (intlFee > 0) {
      adjRows += `
      <div class="adi_estimate_row adi_adj_row">
         <div class="adi_adj_label_wrap">
            <span class="adi_estimate_label">International</span>
            <span class="adi_adj_badge">Cross-border ops (+${intlPercent}%)</span>
         </div>
         <span class="adi_estimate_value">${currencySymbol}${formatPrice(intlFee)}</span>
      </div>`;
   }
   if (tailPremium > 0) {
      adjRows += `
      <div class="adi_estimate_row adi_adj_row">
         <div class="adi_adj_label_wrap">
            <span class="adi_estimate_label">Tail Selection</span>
            <span class="adi_adj_badge">Specific aircraft requested</span>
         </div>
         <span class="adi_estimate_value">${currencySymbol}${formatPrice(tailPremium)}</span>
      </div>`;
   }

   wrapper.innerHTML = `
      <div class="adi_main_grid">

         <!-- LEFT COLUMN -->
         <div class="adi_main_left co_main_left">
         <div class="co_main_left_wrapper">
            <!-- Itinerary -->
            <div class="adi_itinerary">
               <h4 class="adi_section_title">ITINERARY</h4>
               ${itineraryRows}
            </div>
            
            <div class="terms">
               <div class="term_heading">
                  <h4 class="adi_section_title">Terms of service</h4>
                  <h5>Cancellation Policy:</h5>
               </div>
               <div class="term_para">
                  <p class="term_para_main">For one-way, multi-leg, and multi-day one-way flights, the cancellation policy is as follows:</p>
                  <p class="term_para_blod">Greater than 72 hours prior to departure: fully refundable</p>
                  <p class="term_para_blod">72 Hours to 48 hours prior to departure: 50% refundable</p>
                  <p class="term_para_blod">48 hours or less prior to departure: non-refundable</p>
               </div>
               <div class="term_para">
                  <p class="term_para_main">For round trip flights:</p>
                  <p class="term_para_blod">Greater than 72 hours prior to departure: fully refundable</p>
                  <p class="term_para_blod">72 Hours to 48 hours prior to departure: 50% refundable</p>
                  <p class="term_para_blod">48 hours or less prior to departure: non-refundable</p>
               </div>
               <div class="term_para">
                  <p class="term_para_main">In cases of no-shows, a cancellation fee equal to 100% of the full contract amount, along with any related expenses incurred, will be applied. Trips scheduled during peak travel periods are subject to a 100% cancellation charge. In addition to dates that fall within 3 days of a federal holiday, the following dates are subject to peak travel terms: November 21st - 30th, December 21st - 31st, and January 1st - January 7th. Major sporting events include, but are not limited to, the following: Super Bowl, Masters Golf Tournament, Kentucky Derby, World Series, NCAA Final Four, and NCAA Football Championship. Peak Travel Terms apply if you are traveling to any airport surrounding the event.</p>
               </div>
                <div class="term_para">
                  <p class="term_para_main"><strong>FLYT</strong> reserves the right to fulfill your booking on another aircraft model that is equivalent or greater in class and may adjust your departure time by <strong class="light_strong">+/- 1 hour.</strong></p>
               </div>
               <div class="term_para">
                  <p class="term_para_main">No shows, failure to arrive at least 30 minutes prior to the departure time (unless otherwise approved by <strong>FLYT</strong>) in possession of valid government-issued identification, and failure to board the aircraft upon crew’s instructions will be treated as a no show subject to a 100% cancellation penalty whereby you will be charged the full cost of the flight.</p>
               </div>
               <div class="term_para">
                  <p class="term_para_main"><strong>FLYT</strong> does not own or operate any aircraft. <strong>FLYT</strong> will act as your Authorized Agent in arranging this flight. <strong>FLYT</strong> maintains non-owned aircraft liability insurance in an amount not less than <strong class="light_strong">$300,000,000,</strong> personal injury coverage of <strong class="light_strong">$25,000,000</strong> per occurrence and in the aggregate, and <strong class="light_strong">$250,000</strong> in coverage for each passenger’s personal effects.</p>
               </div>
            </div>

            <div class="checkbox">
               <label class="co_checkbox_label">
                  <input type="checkbox" class="co_checkbox_input" id="terms_checkbox" checked />
                  <span class="co_checkbox_custom">
                     <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 5L4.5 8.5L11 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                     </svg>
                  </span>
                  <span class="co_checkbox_text">Accept charter flight terms and conditions</span>
               </label>
            </div>
         </div>
         </div><!-- /.adi_main_left -->

         <!-- RIGHT COLUMN -->
         <div class="adi_main_right">

            <div class="co_member">
               <div class="co_member_top">
                  <div class="comt_left">
                     <img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69d4794c41bb9f7aaab72e92_batch.png" alt="batch_icon" />
                  </div>
                  <div class="comt_right">
                     <h4 class="adi_section_title text-white">Become a <br />FLYT Member today</h4>
                     <p>Upgrade to an FLYT Membership with a separate Initial Deposit of at least <strong>$100,000</strong> within 6 days of booking, receive improved cancellation terms, 24/7 account support, and improved access to the Vista members' fleet. <strong> $995 / year</strong></p>
                     <p>Renews each year until you cancel</p>
                     <div class="comt_right_btn">
                        <div id="w-node-_9d765e8c-1117-f30f-9454-6c61b782b51b-b782b51b" class="btn_common btn_white"><a href="#" class="btnc_link w-inline-block"><p class="btnc_text black_link">Learn More</p><div class="btnc_icon_wrap"><img loading="lazy" src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/68f35aaf95f1c9a722887386_b9efed4e28c59ac8b27d106d67944ee0_flogo.png" alt="logo" class="btnc_icon"></div></a></div>
                     </div>
                  </div>
               </div>
               <div class="co_member_bottom">
                  <div class="comb_heading">
                     <div class="comb_heading_left">
                        <p>Become a member:</p>
                     </div>
                     <div class="comb_heading_right">
                        <label class="adi_toggle_switch co_toggle_switch">
                           <input type="checkbox" />
                           <span class="adi_toggle_slider"></span>
                        </label>
                     </div>
                  </div>
                  <div class="comb_check_list">
                     <div class="comb_check_item">
                        <div class="comb_check_item_icon">
                           <img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69d4813dcc00c8704f195e56_check_com.png" alt="" />
                        </div>
                        <div class="comb_check_item_para">
                           <p>Your FLYT Membership will start when FLYT receives and records your Initial Deposit and Membership Fee and will continue until cancelled.</p>
                        </div>
                     </div>
                     <div class="comb_check_item">
                        <div class="comb_check_item_icon">
                           <img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69d4813dcc00c8704f195e56_check_com.png" alt="" />
                        </div>
                        <div class="comb_check_item_para">
                           <p>Annual Membership Fees are deducted from Account Balance.</p>
                        </div>
                     </div>
                     <div class="comb_check_item">
                        <div class="comb_check_item_icon">
                           <img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69d4813dcc00c8704f195e56_check_com.png" alt="" />
                        </div>
                        <div class="comb_check_item_para">
                           <p>Please review Membership Agreement for a complete list of terms and conditions.</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <!-- Flight Estimate -->
            <div class="adi_estimate_card co_estimate_card">
               <h4 class="adi_estimate_title">FLIGHT ESTIMATE</h4>
               <div class="adi_estimate_row">
                  <span class="adi_estimate_label">Charter price</span>
                  <span class="adi_estimate_value">${currencySymbol}${formatPrice(charter)}</span>
               </div>
               <div class="adi_estimate_divider"></div>
               ${adjRows}
               ${
                  includeCarbon
                     ? `
               <div class="adi_estimate_row">
                  <span class="adi_estimate_label">Carbon offset</span>
                  <span class="adi_estimate_value">${currencySymbol}${formatPrice(carbon)}</span>
               </div>`
                     : ""
               }
               ${taxRows}
               <div class="adi_estimate_divider"></div>
               <div class="adi_estimate_row adi_estimate_subtotal_row co_tota_row">
                  <span class="adi_estimate_label"><strong>Total:</strong></span>
                  <span class="adi_estimate_value"><strong>${currencySymbol}${formatPrice(finalTotal)}</strong></span>
               </div>
            </div>

            <div class="co_payment">
               <div class="co_payment_cardblock">
                  <div class="co_payment_heading">
                     <h4 class="adi_section_title">Choose payment type</h4>
                  </div>
                  <div class="co_payment_wrapper">
                     <label class="co_payment_option" id="co_pay_wire_label">
                        <input type="radio" name="payment_type" value="wire" class="co_payment_radio" checked />
                        <span class="co_payment_radio_custom">
                           <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                           </svg>
                        </span>
                        <div class="co_payment_content">
                           <p class="co_payment_title">Credit card hold + wire payment</p>
                           <p class="co_payment_desc">By selecting this option, you agree to pay ${currencySymbol}${formatPrice(finalTotal)} via wire transfer within 6 days of the credit card hold or 48 hours before the departure date, whichever comes first. You authorize FLYT to place a hold on the Credit Card below for ${currencySymbol}${formatPrice(finalTotal)}, which is the total amount of the flight charge plus a 3.5% administrative fee. If FLYT does not receive the wire payment within 6 days of the credit card hold or 48 hours before the departure date (whichever comes first), you authorize FLYT to charge ${currencySymbol}${formatPrice(finalTotal)} to the credit card listed below.</p>
                        </div>
                     </label>

                     <label class="co_payment_option" id="co_pay_card_label">
                        <input type="radio" name="payment_type" value="card" class="co_payment_radio" />
                        <span class="co_payment_radio_custom">
                           <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                           </svg>
                        </span>
                        <div class="co_payment_content">
                           <p class="co_payment_title">Credit card</p>
                           <p class="co_payment_desc">By selecting this option, you authorize FLYT to charge the card below for ${currencySymbol}${formatPrice(finalTotal)}, which is the total amount of the flight charge plus a 3.5% administrative fee.</p>
                        </div>
                     </label>
                  </div>
               </div>
            </div>

            <div class="co_payblock">
               <div class="co_addcard">
                  <p>Payment method</p>
                  <div class="co_addcard_button">
                     <div class="co_addcard_button_icon">
                        <img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69d4a2ca043f6a5000357dba_plus_card.png" alt="icon" />
                     </div>
                     <p>Add new card</p>
                  </div>
               </div>
               <div class="co_payment_link">
                  <p>Pay via: ${currencySymbol}${formatPrice(finalTotal)}</p>
                  <div class="co_payment_redirect">
                      <div data-wf--btn--variant="black" class="btn_common button_redirect w-variant-717a8abf-6071-4cd8-7483-e0b5d36c316c yeash"><a href="#" class="btnc_link w-inline-block"><p class="btnc_text">Book Your Flight</p><div class="btnc_icon_wrap"><img loading="lazy" src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/68f1ce68d69455e26961b49e_45d32b1e5e78559aa8e96f0801193e00_icon.png" alt="logo" class="btnc_icon"></div></a></div>
                   </div>
               </div>
            </div>

         </div><!-- /.adi_main_right -->

      </div><!-- /.adi_main_grid -->
   `;

   // ── Terms Checkbox + Payment Type Guard ───────────────────────
   const termsCheckbox = document.getElementById("terms_checkbox");
   const bookBtn = document.querySelector(".co_payment_redirect .btnc_link");
   const paymentRadios = document.querySelectorAll(
      "input[name='payment_type']",
   );

   function isValid() {
      const termsAccepted = termsCheckbox?.checked;
      const paymentSelected = document.querySelector(
         "input[name='payment_type']:checked",
      );
      return termsAccepted && paymentSelected;
   }

   function updateBookBtn() {
      if (!bookBtn) return;
      if (isValid()) {
         bookBtn.classList.remove("co_btn_disabled");
         bookBtn.removeAttribute("aria-disabled");
      } else {
         bookBtn.classList.add("co_btn_disabled");
         bookBtn.setAttribute("aria-disabled", "true");
      }
   }

   if (bookBtn) {
      bookBtn.addEventListener("click", (e) => {
         if (!isValid()) {
            e.preventDefault();
         }
      });
   }

   if (termsCheckbox) {
      termsCheckbox.addEventListener("change", updateBookBtn);
   }

   paymentRadios.forEach((radio) => {
      radio.addEventListener("change", updateBookBtn);
   });

   updateBookBtn();
}

// =============================================================================
// Card adding modal
// =============================================================================
function setupModals() {
   // Inject HTML
   document.body.insertAdjacentHTML(
      "beforeend",
      `
      <!-- Modal 1 -->
      <div class="co_modal_overlay" id="co_modal_1_overlay">
         <div class="co_modal" id="co_modal_1">
            <button class="co_modal_close" id="co_modal_1_close" aria-label="Close">
               <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L15 15M15 1L1 15" stroke="#04142a" stroke-width="2" stroke-linecap="round"/>
               </svg>
            </button>
            <div class="co_modal_body">
               <div class="co_modal_body_wrapper">
                  <img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69d4bb1b90c4172b491d4b24_card_visa.png" alt="visa card" />
                  <h4 class="adi_section_title">Please add your credit card information</h4>
                  <p><strong>Note:</strong> Check to see if your pop-up blocker has not prevented a new tab from opening.</p>
                  <div class="modal_one_link co_modal_add_btn"  id="co_open_modal_2">
                     <div data-wf--btn--variant="black" class="btn_common button_redirect w-variant-717a8abf-6071-4cd8-7483-e0b5d36c316c yeash"><button class="btnc_link w-inline-block"><p class="btnc_text">Add New Card</p><div class="btnc_icon_wrap"><img loading="lazy" src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/68f1ce68d69455e26961b49e_45d32b1e5e78559aa8e96f0801193e00_icon.png" alt="logo" class="btnc_icon"></div></button></div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <!-- Modal 2 -->
      <div class="co_modal_overlay" id="co_modal_2_overlay">
         <div class="co_modal" id="co_modal_2">
            <div class="flying_img">
               <img class="modal_bannar_img" src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69d4c17b4166bd525121f7eb_plan_fly.png" alt="plan_fly" />
            </div>
            <button class="co_modal_close" id="co_modal_2_close" aria-label="Close">
               <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L15 15M15 1L1 15" stroke="#04142a" stroke-width="2" stroke-linecap="round"/>
               </svg>
            </button>
            <div class="co_modal_body">
               <div class="co_modal_body_wrapper comodaltwo">
                  <h4 class="adi_section_title">Please enter your credit card information</h4>
                  <p>Please provide your credit card details below.All transactions are encrypted and processed securely.</p>
                  <div class="co_card_form">
                     <div class="co_card_input">
                        <input type="text" id="co_card_number" placeholder="Card No." maxlength="19" autocomplete="cc-number" inputmode="numeric" />
                     </div>
                     <div class="co_card_input">
                        <input type="text" id="co_card_name" placeholder="Card Holder Name" autocomplete="cc-name" />
                     </div>
                     <div class="co_card_grp">
                        <div class="co_card_input">
                           <input type="text" id="co_card_expiry" placeholder="MM/YY" maxlength="5" autocomplete="cc-exp" inputmode="numeric" />
                        </div>
                        <div class="co_card_input co_card_info">
                           <input type="text" id="co_card_cvv" placeholder="CVV" maxlength="4" autocomplete="cc-csc" inputmode="numeric" />
                           <div class="info_ch_box">
                              <img class="ch_info" src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69d4c778268a0f79511a251a_info_card_pic.png" alt="info_icon" />
                              <div class="infoch_pic">
                                 <img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69d5facc9e245e088a06a308_card_ulta.png" alt="card_ulta" />
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                     <div class="co_modal_add_btn">
                      <div data-wf--btn--variant="black" class="btn_common button_redirect w-variant-717a8abf-6071-4cd8-7483-e0b5d36c316c yeash"><button id="co_modal_2_submit" class="btnc_link w-inline-block"><p class="btnc_text">Save This Card</p><div class="btnc_icon_wrap"><img loading="lazy" src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/68f1ce68d69455e26961b49e_45d32b1e5e78559aa8e96f0801193e00_icon.png" alt="logo" class="btnc_icon"></div></button></div>
                   </div>
               </div>
            </div>
         </div>
      </div>
   `,
   );

   const modal1Overlay = document.getElementById("co_modal_1_overlay");
   const modal2Overlay = document.getElementById("co_modal_2_overlay");

   function openModal(overlay) {
      overlay.classList.add("co_modal_open");
      document.body.style.overflow = "hidden";
   }

   function closeModal(overlay) {
      overlay.classList.remove("co_modal_open");
      document.body.style.overflow = "";
   }

   // Open Modal 1
   document.addEventListener("click", (e) => {
      if (e.target.closest(".co_addcard_button")) {
         openModal(modal1Overlay);
      }
   });

   // Prevent clicks inside modal from bubbling to overlay
   document
      .getElementById("co_modal_1")
      .addEventListener("click", (e) => e.stopPropagation());
   document
      .getElementById("co_modal_2")
      .addEventListener("click", (e) => e.stopPropagation());

   // Close Modal 1 — only when clicking the overlay background
   document
      .getElementById("co_modal_1_close")
      .addEventListener("click", () => closeModal(modal1Overlay));
   modal1Overlay.addEventListener("click", () => closeModal(modal1Overlay));

   // Open Modal 2 when "Add New Card" button is clicked inside Modal 1
   document.getElementById("co_open_modal_2").addEventListener("click", () => {
      closeModal(modal1Overlay);
      openModal(modal2Overlay);
   });

   // Close Modal 2 — only when clicking the overlay background
   document
      .getElementById("co_modal_2_close")
      .addEventListener("click", () => closeModal(modal2Overlay));
   modal2Overlay.addEventListener("click", () => closeModal(modal2Overlay));

   // ── Card Form Validation & Auto-Format ─────────────────────────
   setupCardValidation();
}

// =============================================================================
// CARD FORM VALIDATION
// =============================================================================
function setupCardValidation() {
   const cardNumber = document.getElementById("co_card_number");
   const cardName = document.getElementById("co_card_name");
   const cardExpiry = document.getElementById("co_card_expiry");
   const cardCvv = document.getElementById("co_card_cvv");
   const submitBtn = document.getElementById("co_modal_2_submit");

   if (!cardNumber || !submitBtn) return;

   // ── helpers ──────────────────────────────────────────────────
   function setError(input, msg) {
      const wrap = input.closest(".co_card_input");
      wrap.classList.add("co_input_error");
      let err = wrap.querySelector(".co_field_error");
      if (!err) {
         err = document.createElement("span");
         err.className = "co_field_error";
         wrap.appendChild(err);
      }
      err.textContent = msg;
   }

   function clearError(input) {
      const wrap = input.closest(".co_card_input");
      wrap.classList.remove("co_input_error");
      const err = wrap.querySelector(".co_field_error");
      if (err) err.remove();
   }

   // Luhn algorithm — basic card number authenticity check
   function luhnCheck(num) {
      const digits = num.replace(/\s/g, "");
      let sum = 0;
      let alt = false;
      for (let i = digits.length - 1; i >= 0; i--) {
         let n = parseInt(digits[i], 10);
         if (alt) {
            n *= 2;
            if (n > 9) n -= 9;
         }
         sum += n;
         alt = !alt;
      }
      return sum % 10 === 0;
   }

   // ── auto-format: card number (groups of 4) ────────────────────
   cardNumber.addEventListener("input", () => {
      let v = cardNumber.value.replace(/\D/g, "").slice(0, 16);
      cardNumber.value = v.replace(/(\d{4})(?=\d)/g, "$1 ");
      clearError(cardNumber);
   });

   // ── auto-format: expiry MM/YY ─────────────────────────────────
   cardExpiry.addEventListener("input", (e) => {
      let v = cardExpiry.value.replace(/\D/g, "").slice(0, 4);
      if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
      cardExpiry.value = v;
      clearError(cardExpiry);
   });

   // ── auto-format: CVV (digits only) ───────────────────────────
   cardCvv.addEventListener("input", () => {
      cardCvv.value = cardCvv.value.replace(/\D/g, "").slice(0, 4);
      clearError(cardCvv);
   });

   cardName.addEventListener("input", () => clearError(cardName));

   // ── validate all fields, return true if clean ─────────────────
   function validateCard() {
      let valid = true;

      // Card number
      const rawNum = cardNumber.value.replace(/\s/g, "");
      if (rawNum.length < 13) {
         setError(cardNumber, "Enter a valid card number.");
         valid = false;
      } else if (!luhnCheck(rawNum)) {
         setError(cardNumber, "Card number is invalid.");
         valid = false;
      } else {
         clearError(cardNumber);
      }

      // Card holder name
      if (cardName.value.trim().length < 2) {
         setError(cardName, "Enter the card holder name.");
         valid = false;
      } else {
         clearError(cardName);
      }

      // Expiry
      const expParts = cardExpiry.value.split("/");
      const expMonth = parseInt(expParts[0], 10);
      const expYear = parseInt("20" + (expParts[1] || ""), 10);
      const now = new Date();
      const nowYear = now.getFullYear();
      const nowMonth = now.getMonth() + 1;
      if (
         cardExpiry.value.length !== 5 ||
         expMonth < 1 ||
         expMonth > 12 ||
         expYear < nowYear ||
         (expYear === nowYear && expMonth < nowMonth)
      ) {
         setError(cardExpiry, "Invalid or expired date.");
         valid = false;
      } else {
         clearError(cardExpiry);
      }

      // CVV
      if (cardCvv.value.length < 3) {
         setError(cardCvv, "Enter a valid CVV.");
         valid = false;
      } else {
         clearError(cardCvv);
      }

      return valid;
   }

   // ── submit handler ────────────────────────────────────────────
   submitBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (validateCard()) {
         // All fields are valid — proceed with booking
         console.log("Card validated. Proceeding to book.");
         // TODO: plug in your booking API call here
      }
   });
}

// =============================================================================
// INIT
// =============================================================================
document.addEventListener("DOMContentLoaded", () => {
   // Inject loader
   const loaderEl = document.createElement("div");
   loaderEl.className = "adi_page_loader";
   loaderEl.innerHTML = `<div class="adi_loader_spinner"></div>`;
   document.body.appendChild(loaderEl);

   renderHeading();
   fetchCheckoutData();
   setupModals();
});
