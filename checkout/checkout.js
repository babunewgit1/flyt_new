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

// =============================================================================
// LOGIN GUARD — checkout requires authentication
// =============================================================================
const detailsPageURL = `/instant-book?id=${encodeURIComponent(bookingId)}`;

(function checkLoginOnLoad() {
   if (typeof Cookies === "undefined") return;
   const isLoggedIn = !!Cookies.get("authToken") && !!Cookies.get("userEmail");
   if (!isLoggedIn) {
      window.location.href = detailsPageURL;
   }
})();

const includeCarbon = carbonParam === "true";
const passengerCount = parseInt(paxParam) || 1;

// =============================================================================
// CONSTANTS  — same as ad-instant-booking.js
// =============================================================================
const CHECKOUT_API =
   "https://operators-dashboard.bubbleapps.io/api/1.1/wf/webflow_return_aircraft_detail_flyt";

const BUBBLE_BASE_URL =
   "https://operators-dashboard.bubbleapps.io/version-test";

// Card logo URLs — update each URL individually when real logos are ready
const CARD_LOGOS = {
   visa: "https://cdn.prod.website-files.com/673728493d38fb595b0df373/69d4bb1b90c4172b491d4b24_card_visa.png",
   mastercard:
      "https://cdn.prod.website-files.com/673728493d38fb595b0df373/69d4bb1b90c4172b491d4b24_card_visa.png",
   "american express":
      "https://cdn.prod.website-files.com/673728493d38fb595b0df373/69d4bb1b90c4172b491d4b24_card_visa.png",
   discover:
      "https://cdn.prod.website-files.com/673728493d38fb595b0df373/69d4bb1b90c4172b491d4b24_card_visa.png",
   jcb: "https://cdn.prod.website-files.com/673728493d38fb595b0df373/69d4bb1b90c4172b491d4b24_card_visa.png",
   "diners club":
      "https://cdn.prod.website-files.com/673728493d38fb595b0df373/69d4bb1b90c4172b491d4b24_card_visa.png",
   unionpay:
      "https://cdn.prod.website-files.com/673728493d38fb595b0df373/69d4bb1b90c4172b491d4b24_card_visa.png",
   default:
      "https://cdn.prod.website-files.com/673728493d38fb595b0df373/69d4bb1b90c4172b491d4b24_card_visa.png",
};

const CURRENCY_SYMBOLS = {
   usd: "$",
   eur: "€",
   cad: "C$",
};

const COUNTRIES = [
   { code: "US", name: "United States" },
   { code: "AF", name: "Afghanistan" },
   { code: "AL", name: "Albania" },
   { code: "DZ", name: "Algeria" },
   { code: "AS", name: "American Samoa" },
   { code: "AD", name: "Andorra" },
   { code: "AO", name: "Angola" },
   { code: "AI", name: "Anguilla" },
   { code: "AG", name: "Antigua and Barbuda" },
   { code: "AR", name: "Argentina" },
   { code: "AM", name: "Armenia" },
   { code: "AW", name: "Aruba" },
   { code: "AU", name: "Australia" },
   { code: "AT", name: "Austria" },
   { code: "AZ", name: "Azerbaijan" },
   { code: "BS", name: "Bahamas" },
   { code: "BH", name: "Bahrain" },
   { code: "BD", name: "Bangladesh" },
   { code: "BB", name: "Barbados" },
   { code: "BY", name: "Belarus" },
   { code: "BE", name: "Belgium" },
   { code: "BZ", name: "Belize" },
   { code: "BJ", name: "Benin" },
   { code: "BM", name: "Bermuda" },
   { code: "BT", name: "Bhutan" },
   { code: "BO", name: "Bolivia" },
   { code: "BA", name: "Bosnia and Herzegovina" },
   { code: "BW", name: "Botswana" },
   { code: "BR", name: "Brazil" },
   { code: "BN", name: "Brunei" },
   { code: "BG", name: "Bulgaria" },
   { code: "BF", name: "Burkina Faso" },
   { code: "BI", name: "Burundi" },
   { code: "CV", name: "Cabo Verde" },
   { code: "KH", name: "Cambodia" },
   { code: "CM", name: "Cameroon" },
   { code: "CA", name: "Canada" },
   { code: "KY", name: "Cayman Islands" },
   { code: "CF", name: "Central African Republic" },
   { code: "TD", name: "Chad" },
   { code: "CL", name: "Chile" },
   { code: "CN", name: "China" },
   { code: "CO", name: "Colombia" },
   { code: "KM", name: "Comoros" },
   { code: "CG", name: "Congo" },
   { code: "CD", name: "Congo (DRC)" },
   { code: "CK", name: "Cook Islands" },
   { code: "CR", name: "Costa Rica" },
   { code: "CI", name: "Côte d'Ivoire" },
   { code: "HR", name: "Croatia" },
   { code: "CU", name: "Cuba" },
   { code: "CW", name: "Curaçao" },
   { code: "CY", name: "Cyprus" },
   { code: "CZ", name: "Czech Republic" },
   { code: "DK", name: "Denmark" },
   { code: "DJ", name: "Djibouti" },
   { code: "DM", name: "Dominica" },
   { code: "DO", name: "Dominican Republic" },
   { code: "EC", name: "Ecuador" },
   { code: "EG", name: "Egypt" },
   { code: "SV", name: "El Salvador" },
   { code: "GQ", name: "Equatorial Guinea" },
   { code: "ER", name: "Eritrea" },
   { code: "EE", name: "Estonia" },
   { code: "SZ", name: "Eswatini" },
   { code: "ET", name: "Ethiopia" },
   { code: "FK", name: "Falkland Islands" },
   { code: "FO", name: "Faroe Islands" },
   { code: "FJ", name: "Fiji" },
   { code: "FI", name: "Finland" },
   { code: "FR", name: "France" },
   { code: "GF", name: "French Guiana" },
   { code: "PF", name: "French Polynesia" },
   { code: "GA", name: "Gabon" },
   { code: "GM", name: "Gambia" },
   { code: "GE", name: "Georgia" },
   { code: "DE", name: "Germany" },
   { code: "GH", name: "Ghana" },
   { code: "GI", name: "Gibraltar" },
   { code: "GR", name: "Greece" },
   { code: "GL", name: "Greenland" },
   { code: "GD", name: "Grenada" },
   { code: "GP", name: "Guadeloupe" },
   { code: "GU", name: "Guam" },
   { code: "GT", name: "Guatemala" },
   { code: "GG", name: "Guernsey" },
   { code: "GN", name: "Guinea" },
   { code: "GW", name: "Guinea-Bissau" },
   { code: "GY", name: "Guyana" },
   { code: "HT", name: "Haiti" },
   { code: "HN", name: "Honduras" },
   { code: "HK", name: "Hong Kong" },
   { code: "HU", name: "Hungary" },
   { code: "IS", name: "Iceland" },
   { code: "IN", name: "India" },
   { code: "ID", name: "Indonesia" },
   { code: "IR", name: "Iran" },
   { code: "IQ", name: "Iraq" },
   { code: "IE", name: "Ireland" },
   { code: "IM", name: "Isle of Man" },
   { code: "IL", name: "Israel" },
   { code: "IT", name: "Italy" },
   { code: "JM", name: "Jamaica" },
   { code: "JP", name: "Japan" },
   { code: "JE", name: "Jersey" },
   { code: "JO", name: "Jordan" },
   { code: "KZ", name: "Kazakhstan" },
   { code: "KE", name: "Kenya" },
   { code: "KI", name: "Kiribati" },
   { code: "KP", name: "North Korea" },
   { code: "KR", name: "South Korea" },
   { code: "KW", name: "Kuwait" },
   { code: "KG", name: "Kyrgyzstan" },
   { code: "LA", name: "Laos" },
   { code: "LV", name: "Latvia" },
   { code: "LB", name: "Lebanon" },
   { code: "LS", name: "Lesotho" },
   { code: "LR", name: "Liberia" },
   { code: "LY", name: "Libya" },
   { code: "LI", name: "Liechtenstein" },
   { code: "LT", name: "Lithuania" },
   { code: "LU", name: "Luxembourg" },
   { code: "MO", name: "Macau" },
   { code: "MG", name: "Madagascar" },
   { code: "MW", name: "Malawi" },
   { code: "MY", name: "Malaysia" },
   { code: "MV", name: "Maldives" },
   { code: "ML", name: "Mali" },
   { code: "MT", name: "Malta" },
   { code: "MH", name: "Marshall Islands" },
   { code: "MQ", name: "Martinique" },
   { code: "MR", name: "Mauritania" },
   { code: "MU", name: "Mauritius" },
   { code: "YT", name: "Mayotte" },
   { code: "MX", name: "Mexico" },
   { code: "FM", name: "Micronesia" },
   { code: "MD", name: "Moldova" },
   { code: "MC", name: "Monaco" },
   { code: "MN", name: "Mongolia" },
   { code: "ME", name: "Montenegro" },
   { code: "MS", name: "Montserrat" },
   { code: "MA", name: "Morocco" },
   { code: "MZ", name: "Mozambique" },
   { code: "MM", name: "Myanmar" },
   { code: "NA", name: "Namibia" },
   { code: "NR", name: "Nauru" },
   { code: "NP", name: "Nepal" },
   { code: "NL", name: "Netherlands" },
   { code: "NC", name: "New Caledonia" },
   { code: "NZ", name: "New Zealand" },
   { code: "NI", name: "Nicaragua" },
   { code: "NE", name: "Niger" },
   { code: "NG", name: "Nigeria" },
   { code: "MK", name: "North Macedonia" },
   { code: "NO", name: "Norway" },
   { code: "OM", name: "Oman" },
   { code: "PK", name: "Pakistan" },
   { code: "PW", name: "Palau" },
   { code: "PS", name: "Palestine" },
   { code: "PA", name: "Panama" },
   { code: "PG", name: "Papua New Guinea" },
   { code: "PY", name: "Paraguay" },
   { code: "PE", name: "Peru" },
   { code: "PH", name: "Philippines" },
   { code: "PL", name: "Poland" },
   { code: "PT", name: "Portugal" },
   { code: "PR", name: "Puerto Rico" },
   { code: "QA", name: "Qatar" },
   { code: "RE", name: "Réunion" },
   { code: "RO", name: "Romania" },
   { code: "RU", name: "Russia" },
   { code: "RW", name: "Rwanda" },
   { code: "BL", name: "Saint Barthélemy" },
   { code: "KN", name: "Saint Kitts and Nevis" },
   { code: "LC", name: "Saint Lucia" },
   { code: "MF", name: "Saint Martin" },
   { code: "VC", name: "Saint Vincent and the Grenadines" },
   { code: "WS", name: "Samoa" },
   { code: "SM", name: "San Marino" },
   { code: "ST", name: "São Tomé and Príncipe" },
   { code: "SA", name: "Saudi Arabia" },
   { code: "SN", name: "Senegal" },
   { code: "RS", name: "Serbia" },
   { code: "SC", name: "Seychelles" },
   { code: "SL", name: "Sierra Leone" },
   { code: "SG", name: "Singapore" },
   { code: "SX", name: "Sint Maarten" },
   { code: "SK", name: "Slovakia" },
   { code: "SI", name: "Slovenia" },
   { code: "SB", name: "Solomon Islands" },
   { code: "SO", name: "Somalia" },
   { code: "ZA", name: "South Africa" },
   { code: "SS", name: "South Sudan" },
   { code: "ES", name: "Spain" },
   { code: "LK", name: "Sri Lanka" },
   { code: "SD", name: "Sudan" },
   { code: "SR", name: "Suriname" },
   { code: "SE", name: "Sweden" },
   { code: "CH", name: "Switzerland" },
   { code: "SY", name: "Syria" },
   { code: "TW", name: "Taiwan" },
   { code: "TJ", name: "Tajikistan" },
   { code: "TZ", name: "Tanzania" },
   { code: "TH", name: "Thailand" },
   { code: "TL", name: "Timor-Leste" },
   { code: "TG", name: "Togo" },
   { code: "TK", name: "Tokelau" },
   { code: "TO", name: "Tonga" },
   { code: "TT", name: "Trinidad and Tobago" },
   { code: "TN", name: "Tunisia" },
   { code: "TR", name: "Turkey" },
   { code: "TM", name: "Turkmenistan" },
   { code: "TC", name: "Turks and Caicos Islands" },
   { code: "TV", name: "Tuvalu" },
   { code: "UG", name: "Uganda" },
   { code: "UA", name: "Ukraine" },
   { code: "AE", name: "United Arab Emirates" },
   { code: "GB", name: "United Kingdom" },
   { code: "UY", name: "Uruguay" },
   { code: "UZ", name: "Uzbekistan" },
   { code: "VU", name: "Vanuatu" },
   { code: "VA", name: "Vatican City" },
   { code: "VE", name: "Venezuela" },
   { code: "VN", name: "Vietnam" },
   { code: "VG", name: "Virgin Islands (British)" },
   { code: "VI", name: "Virgin Islands (U.S.)" },
   { code: "WF", name: "Wallis and Futuna" },
   { code: "YE", name: "Yemen" },
   { code: "ZM", name: "Zambia" },
   { code: "ZW", name: "Zimbabwe" },
];

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
               <div id="co_saved_cards" class="co_saved_cards"></div>
               <div class="co_payment_link">
                  <p id="co_pay_via_text" style="display:none;"></p>
                  <p id="co_pay_via_amount" class="co_pay_via_amount">${currencySymbol}${formatPrice(finalTotal)}</p>
                  <div class="co_payment_redirect">
                      <div data-wf--btn--variant="black" class="btn_common button_redirect w-variant-717a8abf-6071-4cd8-7483-e0b5d36c316c yeash"><a href="#" class="btnc_link w-inline-block"><p class="btnc_text">Book Your Flight</p><div class="btnc_icon_wrap"><img loading="lazy" src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/68f1ce68d69455e26961b49e_45d32b1e5e78559aa8e96f0801193e00_icon.png" alt="logo" class="btnc_icon"></div></a></div>
                   </div>
               </div>
            </div>

         </div><!-- /.adi_main_right -->

      </div><!-- /.adi_main_grid -->
   `;

   // ── Fetch saved cards (after HTML is rendered) ────────────────
   fetchSavedCards();

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

                     <!-- Phone Number (full row, intl-tel-input) -->
                     <div class="co_card_input co_card_phone">
                        <input required id="co_phone" name="phone" type="text" placeholder="Phone Number" />
                     </div>

                     <!-- City + State (half row each) -->
                     <div class="co_card_grp">
                        <div class="co_card_input">
                           <input type="text" id="co_city" placeholder="City" autocomplete="address-level2" />
                        </div>
                        <div class="co_card_input">
                           <input type="text" id="co_state" placeholder="State" autocomplete="address-level1" />
                        </div>
                     </div>

                     <!-- Zip + Country (half row each) -->
                     <div class="co_card_grp">
                        <div class="co_card_input">
                           <input type="text" id="co_zip" placeholder="Zip Code" autocomplete="postal-code" inputmode="numeric" />
                        </div>
                        <div class="co_card_input co_card_select">
                           <select id="co_country" autocomplete="country-name">
                              <option value="" disabled selected>Country</option>
                              ${COUNTRIES.map((c) => `<option value="${c.code}">${c.name}</option>`).join("")}
                           </select>
                        </div>
                     </div>

                     <!-- Address (full row) -->
                     <div class="co_card_input">
                        <input type="text" id="co_address" placeholder="Address" autocomplete="street-address" />
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

   // Prevent clicks inside Modal 1 from reaching the overlay
   document
      .getElementById("co_modal_1")
      .addEventListener("click", (e) => e.stopPropagation());

   // Close Modal 1 — only when clicking the overlay background
   document
      .getElementById("co_modal_1_close")
      .addEventListener("click", () => closeModal(modal1Overlay));
   modal1Overlay.addEventListener("click", () => closeModal(modal1Overlay));

   // Open Modal 2 when "Add New Card" button is clicked inside Modal 1
   let coItiInitialized = false;
   document.getElementById("co_open_modal_2").addEventListener("click", () => {
      closeModal(modal1Overlay);
      openModal(modal2Overlay);

      // ── Lazy-init intl-tel-input AFTER Modal 2 is visible ────────
      if (!coItiInitialized) {
         coItiInitialized = true;
         const coPhoneInput = document.getElementById("co_phone");
         if (coPhoneInput && typeof window.intlTelInput === "function") {
            window.coIti = window.intlTelInput(coPhoneInput, {
               initialCountry: "us",
               separateDialCode: true,
               utilsScript:
                  "https://cdn.jsdelivr.net/npm/intl-tel-input@16/build/js/utils.js",
            });
         }
      }
   });

   document
      .getElementById("co_modal_2_close")
      .addEventListener("click", () => closeModal(modal2Overlay));
   modal2Overlay.addEventListener("click", (e) => {
      if (e.target === modal2Overlay) closeModal(modal2Overlay);
   });

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
   const coPhone = document.getElementById("co_phone");
   const coCity = document.getElementById("co_city");
   const coState = document.getElementById("co_state");
   const coZip = document.getElementById("co_zip");
   const coCountry = document.getElementById("co_country");
   const coAddress = document.getElementById("co_address");
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

   // Clear errors on input for billing fields
   [coCity, coState, coZip].forEach((el) => {
      if (el) el.addEventListener("input", () => clearError(el));
   });
   if (coCountry)
      coCountry.addEventListener("change", () => clearError(coCountry));
   if (coAddress)
      coAddress.addEventListener("input", () => clearError(coAddress));
   if (coPhone) coPhone.addEventListener("input", () => clearError(coPhone));

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

      // Card number (length check only — backend validates the card)
      const rawNum = cardNumber.value.replace(/\s/g, "");
      if (rawNum.length < 13 || rawNum.length > 16) {
         setError(cardNumber, "Enter a valid card number.");
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

      // Phone
      if (window.coIti && typeof window.coIti.isValidNumber === "function") {
         if (!window.coIti.isValidNumber()) {
            setError(coPhone, "Enter a valid phone number.");
            valid = false;
         } else {
            clearError(coPhone);
         }
      } else if (coPhone && coPhone.value.trim().length < 6) {
         setError(coPhone, "Enter a valid phone number.");
         valid = false;
      } else if (coPhone) {
         clearError(coPhone);
      }

      // City
      if (coCity && coCity.value.trim().length < 1) {
         setError(coCity, "Enter your city.");
         valid = false;
      } else if (coCity) {
         clearError(coCity);
      }

      // State
      if (coState && coState.value.trim().length < 1) {
         setError(coState, "Enter your state.");
         valid = false;
      } else if (coState) {
         clearError(coState);
      }

      // Zip
      if (coZip && coZip.value.trim().length < 3) {
         setError(coZip, "Enter a valid zip code.");
         valid = false;
      } else if (coZip) {
         clearError(coZip);
      }

      // Country
      if (coCountry && coCountry.value.trim().length < 1) {
         setError(coCountry, "Enter your country.");
         valid = false;
      } else if (coCountry) {
         clearError(coCountry);
      }

      // Address
      if (coAddress && coAddress.value.trim().length < 1) {
         setError(coAddress, "Enter your billing address.");
         valid = false;
      } else if (coAddress) {
         clearError(coAddress);
      }

      return valid;
   }

   // ── submit handler ────────────────────────────────────────────
   submitBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!validateCard()) return;

      // ── Collect form data ───────────────────────────────────────
      const rawCardNum = cardNumber.value.replace(/\s/g, "");
      const expParts = cardExpiry.value.split("/");
      const expMonth = expParts[0];
      const currentCentury = Math.floor(new Date().getFullYear() / 100) * 100;
      const expYear = String(currentCentury + parseInt(expParts[1], 10));
      const cvv = cardCvv.value;
      const fullName = cardName.value.trim();
      const nameParts = fullName.split(" ");
      const firstName = nameParts[0] || "";
      const lastName =
         nameParts.length > 1 ? nameParts.slice(1).join(" ") : " ";

      const address = coAddress ? coAddress.value.trim() : "";
      const city = coCity ? coCity.value.trim() : "";
      const state = coState ? coState.value.trim() : "";
      const zip = coZip ? coZip.value.trim() : "";
      const country =
         coCountry && coCountry.selectedIndex > 0
            ? coCountry.options[coCountry.selectedIndex].text
            : "";
      let phoneNumber = "";
      if (
         window.coIti &&
         typeof window.coIti.getNumber === "function" &&
         window.coIti.isValidNumber()
      ) {
         const fmt =
            window.intlTelInputUtils && window.intlTelInputUtils.numberFormat
               ? window.intlTelInputUtils.numberFormat.E164
               : 1;
         phoneNumber = window.coIti.getNumber(fmt);
      } else if (coPhone) {
         phoneNumber = coPhone.value.trim();
      }

      // Auth token
      const authToken =
         typeof Cookies !== "undefined" ? Cookies.get("authToken") : null;
      if (!authToken) {
         window.toast.error("Please log in to save your card.");
         return;
      }

      // ── Button loading state ────────────────────────────────────
      const originalBtnText = submitBtn.querySelector(".btnc_text")
         ? submitBtn.querySelector(".btnc_text").textContent
         : "Save This Card";
      if (submitBtn.querySelector(".btnc_text")) {
         submitBtn.querySelector(".btnc_text").textContent = "Please wait...";
      }
      submitBtn.disabled = true;

      // ── API call ────────────────────────────────────────────────
      const payload = {
         card_number: rawCardNum,
         expiry_month: expMonth,
         expiry_year: expYear,
         card_code: cvv,
         first_name: firstName,
         last_name: lastName,
         address: address,
         city: city,
         state: state,
         zip: zip,
         country: country,
         phone_number: phoneNumber,
      };
      console.log("Save Card Payload:", payload);

      try {
         const res = await fetch(
            `${BUBBLE_BASE_URL}/api/1.1/wf/webflow_add_card_flyt`,
            {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${authToken}`,
               },
               body: JSON.stringify(payload),
            },
         );

         const data = await res.json();
         console.log("✅ Save Card Response:", data);

         if (res.ok && !(data.response && data.response.has_error)) {
            window.toast.success("Card saved successfully!");
            cardNumber.value = "";
            cardName.value = "";
            cardExpiry.value = "";
            cardCvv.value = "";
            if (coPhone) coPhone.value = "";
            if (coCity) coCity.value = "";
            if (coState) coState.value = "";
            if (coZip) coZip.value = "";
            if (coCountry) coCountry.value = "";
            if (coAddress) coAddress.value = "";

            const modal2Overlay = document.getElementById("co_modal_2_overlay");
            if (modal2Overlay) {
               modal2Overlay.classList.remove("co_modal_open");
               document.body.style.overflow = "";
            }

            // Refresh saved cards list
            fetchSavedCards();
         } else {
            const errMsg =
               (data.response && data.response.message) ||
               data.message ||
               "Failed to save card. Please try again.";
            window.toast.error(errMsg);
         }
      } catch (err) {
         console.error("Save Card Error:", err);
         window.toast.error("Something went wrong. Please try again.");
      } finally {
         if (submitBtn.querySelector(".btnc_text")) {
            submitBtn.querySelector(".btnc_text").textContent = originalBtnText;
         }
         submitBtn.disabled = false;
      }
   });
}

// =============================================================================
// SAVED CARDS — Fetch & Render
// =============================================================================
function getCardLogo(cardType) {
   if (cardType) {
      const key = cardType.toLowerCase();
      if (CARD_LOGOS[key]) return { logo: CARD_LOGOS[key], type: cardType };
   }
   // cardType is null — use generic logo
   return { logo: CARD_LOGOS.default, type: "Card" };
}

function renderSavedCards(cards) {
   const container = document.getElementById("co_saved_cards");
   if (!container) return;

   if (!cards || cards.length === 0) {
      container.innerHTML = `<div class="co_no_cards"><p>No saved cards</p></div>`;
      return;
   }

   let html = "";
   cards.forEach((card, index) => {
      const profileId = card["_api_c2_customerPaymentProfileId"] || "";
      const lastFour = (
         card["_api_c2_payment.creditCard.cardNumber"] || ""
      ).replace(/X/g, "");
      const cardType = card["_api_c2_payment.creditCard.cardType"] || null;
      const issuer = card["_api_c2_payment.creditCard.issuerNumber"] || "";
      const isDefault = card["_api_c2_defaultPaymentProfile"] === true;
      const { logo, type } = getCardLogo(cardType);

      html += `
         <label class="co_saved_card ${isDefault ? "co_saved_card_active" : ""}" data-profile-id="${profileId}" data-card-type="${type}" data-last-four="${lastFour}">
            <input type="radio" name="saved_card"
               class="co_saved_card_radio" ${isDefault ? "checked" : ""} />
            <span class="co_saved_card_check">
               <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
               </svg>
            </span>
            <img class="co_saved_card_logo" src="${logo}" alt="${type}" />
            <div class="co_saved_card_info">
               <p class="co_saved_card_name">${type} ending in ${lastFour}</p>
            </div>
            ${
               isDefault
                  ? `<span class="co_saved_card_default">Default</span>${cards.length > 1 ? ` <button class="co_saved_card_action co_remove_default" data-profile-id="${profileId}" aria-label="Remove default">Remove Default</button>` : ""}`
                  : `<button class="co_saved_card_action co_set_default" data-profile-id="${profileId}" aria-label="Set as default">Set Default</button>`
            }
            <button class="co_saved_card_delete" data-profile-id="${profileId}" aria-label="Delete card">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="#04142a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
               </svg>
            </button>
         </label>`;
   });

   container.innerHTML = html;

   // Card selection handler — update "Pay via" text
   function updatePayVia(cardEl) {
      const type = cardEl.dataset.cardType || "Card";
      const last4 = cardEl.dataset.lastFour || "";
      const payVia = document.getElementById("co_pay_via_text");
      if (payVia) {
         payVia.textContent = `Pay via: ${type} **** **** **** ${last4}`;
         payVia.style.display = "block";
      }
   }

   container.querySelectorAll(".co_saved_card_radio").forEach((radio) => {
      radio.addEventListener("change", () => {
         container.querySelectorAll(".co_saved_card").forEach((el) => {
            el.classList.remove("co_saved_card_active");
         });
         const cardEl = radio.closest(".co_saved_card");
         cardEl.classList.add("co_saved_card_active");
         updatePayVia(cardEl);
      });
   });

   // Set Default button handler
   container.querySelectorAll(".co_set_default").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
         e.preventDefault();
         e.stopPropagation();
         const profileId = btn.dataset.profileId;
         const original = btn.textContent;
         btn.textContent = "Please wait...";
         btn.disabled = true;
         await updateDefaultCard(profileId, true);
         btn.textContent = original;
         btn.disabled = false;
      });
   });

   // Remove Default button handler
   container.querySelectorAll(".co_remove_default").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
         e.preventDefault();
         e.stopPropagation();
         const profileId = btn.dataset.profileId;
         const original = btn.textContent;
         btn.textContent = "Please wait...";
         btn.disabled = true;
         await updateDefaultCard(profileId, false);
         btn.textContent = original;
         btn.disabled = false;
      });
   });

   // Delete card button handler
   container.querySelectorAll(".co_saved_card_delete").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
         e.preventDefault();
         e.stopPropagation();
         const profileId = btn.dataset.profileId;

         const result = await Swal.fire({
            title: "Delete Card?",
            text: "Are you sure you want to delete this card? This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#e74c3c",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Yes, delete it",
            cancelButtonText: "Cancel",
            showLoaderOnConfirm: true,
            allowOutsideClick: () => !Swal.isLoading(),
            preConfirm: async () => {
               return await deleteCard(profileId);
            },
         });

         if (result.isConfirmed) {
            if (result.value && result.value.success) {
               window.toast.success("Card deleted successfully!");
               fetchSavedCards();
            } else {
               window.toast.error(
                  result.value?.message || "Failed to delete card.",
               );
            }
         }
      });
   });

   // Set initial "Pay via" text from default/checked card
   const checkedRadio = container.querySelector(".co_saved_card_radio:checked");
   if (checkedRadio) {
      updatePayVia(checkedRadio.closest(".co_saved_card"));
   }
}

async function deleteCard(profileId) {
   const authToken =
      typeof Cookies !== "undefined" ? Cookies.get("authToken") : null;
   if (!authToken) return { success: false, message: "Not authenticated." };

   try {
      const res = await fetch(
         `${BUBBLE_BASE_URL}/api/1.1/wf/webflow_delete_card_flyt`,
         {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ payment_profile_id: profileId }),
         },
      );
      const data = await res.json();
      console.log("🗑️ Delete Card Response:", data);

      if (res.ok && !(data.response && data.response.has_error)) {
         return { success: true };
      } else {
         const message =
            (data.response && data.response.message) ||
            data.message ||
            "Failed to delete card.";
         return { success: false, message };
      }
   } catch (err) {
      console.error("Delete Card Error:", err);
      return {
         success: false,
         message: "Something went wrong. Please try again.",
      };
   }
}

async function updateDefaultCard(profileId, isDefault) {
   const authToken =
      typeof Cookies !== "undefined" ? Cookies.get("authToken") : null;
   if (!authToken) return;

   try {
      const res = await fetch(
         `${BUBBLE_BASE_URL}/api/1.1/wf/webflow_update_default_card_flyt`,
         {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
               payment_profile_id: profileId,
               is_default: isDefault,
            }),
         },
      );
      const data = await res.json();
      console.log("🔄 Update Default Card Response:", data);

      if (res.ok && !(data.response && data.response.has_error)) {
         window.toast.success(
            isDefault ? "Default card updated!" : "Default card removed!",
         );
         fetchSavedCards(); // refresh list
      } else {
         const errMsg =
            (data.response && data.response.message) ||
            data.message ||
            "Failed to update default card.";
         window.toast.error(errMsg);
      }
   } catch (err) {
      console.error("Update Default Card Error:", err);
      window.toast.error("Something went wrong. Please try again.");
   }
}

async function fetchSavedCards() {
   const authToken =
      typeof Cookies !== "undefined" ? Cookies.get("authToken") : null;
   if (!authToken) return;

   const container = document.getElementById("co_saved_cards");
   if (!container) return;

   // Show loading state
   container.innerHTML = `<div class="co_no_cards"><p>Loading cards...</p></div>`;

   try {
      const res = await fetch(
         `${BUBBLE_BASE_URL}/api/1.1/wf/webflow_get_cards_flyt`,
         {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               Authorization: `Bearer ${authToken}`,
            },
         },
      );
      const data = await res.json();
      console.log("📥 Get Cards Response:", data);

      if (res.ok && data.response && data.response.payment_methods) {
         renderSavedCards(data.response.payment_methods);
      } else {
         renderSavedCards([]);
      }
   } catch (err) {
      console.error("Get Cards Error:", err);
      renderSavedCards([]);
   }
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

// =============================================================================
// LOGOUT GUARD — if user logs out while on checkout, redirect to details page
// =============================================================================
window.addEventListener("userLoggedOut", () => {
   window.location.href = detailsPageURL;
});
