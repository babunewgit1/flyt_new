/*
=====================================================================
    !custom_request.js — Connects "Create Aircraft Request" for FLYT.com
=====================================================================
*/

// =============================================================================
// EXPLORE MODAL — open/close
// =============================================================================
document.addEventListener("click", function (e) {
   // Open explore modal
   const exploreBtn = e.target.closest(".explore");
   if (exploreBtn) {
      e.preventDefault();
      const item = exploreBtn.closest(".cadi_item_unit");
      if (!item) return;
      const modal = item.querySelector(".car_popup_wrapper");
      if (modal) {
         modal.style.display = "flex";
         document.body.style.overflow = "hidden";
      }
      return;
   }

   // Close explore modal
   const closeBtn = e.target.closest(".popx_close");
   if (closeBtn) {
      const wrapper = closeBtn.closest(".car_popup_wrapper");
      if (wrapper) wrapper.style.display = "none";
      document.body.style.overflow = "";
   }
});

// =============================================================================
// URL PARAM GUARD
// =============================================================================
const urlParams = new URLSearchParams(window.location.search);
const flightRequestId = urlParams.get("id");

if (!flightRequestId) {
   window.location.href = "/aircraft";
   throw new Error("No flight request ID");
}

// Reset all checkboxes on page load
document.querySelectorAll(".checkbox-input").forEach((cb) => {
   cb.checked = false;
});

// =============================================================================
// CONSTANTS
// =============================================================================
const CUSTOM_REQUEST_API =
   "https://operators-dashboard.bubbleapps.io/api/1.1/wf/webflow_return_data_flyt";

const BUBBLE_BASE_URL = "https://operators-dashboard.bubbleapps.io";
const SUBMIT_REQUEST_API = `${BUBBLE_BASE_URL}/api/1.1/wf/webflow_book_now_with_card_flyt`;

// Global store for API response data
let crData = null;
let submitSuccess = false;

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
// HELPER FUNCTIONS
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

function formatTime(timestamp) {
   if (!timestamp) return "";
   return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
   });
}

// =============================================================================
// RENDER — Itinerary + Airports
// =============================================================================
function renderItineraryAndAirports(responseData) {
   const wrapper = document.querySelector(".cadi_main_js_block");
   if (!wrapper) return;

   const legs = responseData.flight_legs || [];
   if (!legs.length) return;

   // ── Build itinerary rows ──────────────────────────────────────
   const itineraryRows = legs
      .map((leg) => {
         const depTimestamp = leg.date_date || 0;
         const depDate = depTimestamp
            ? formatDate(depTimestamp)
            : formatDate(leg.date_as_text1_text);
         const depTime = formatTime(depTimestamp);

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

   // ── Passenger count ───────────────────────────────────────────
   const firstLeg = legs[0] || {};
   const pax = firstLeg.pax1_number || "";

   // ── Airport alternatives ──────────────────────────────────────
   const primaryFromICAO =
      firstLeg.mobile_app_from_airport_icao_code_text || "";
   const primaryToICAO = firstLeg.mobile_app_to_airport_icao_code_text || "";

   const fromAlts = responseData.alternate_departure_airports || [];
   const toAlts = responseData.alternate_arrival_airports || [];

   // Build airport data arrays: primary first, then alternatives
   const primaryFromData = {
      id: firstLeg.from_custom_airport || "",
      icao: primaryFromICAO,
      lat: firstLeg.mobile_app_from_latitude_number || 0,
      lng: firstLeg.mobile_app_from_longitude_number || 0,
      name: firstLeg.mobile_app_from_airport_name_short_text || primaryFromICAO,
   };
   const primaryToData = {
      id: firstLeg.to_custom_airport || "",
      icao: primaryToICAO,
      lat: firstLeg.mobile_app_to_latitude_number || 0,
      lng: firstLeg.mobile_app_to_longitude_number || 0,
      name: firstLeg.mobile_app_to_airport_name_short_text || primaryToICAO,
   };

   const fromAirportData = [
      primaryFromData,
      ...fromAlts
         .filter((a) => (a.aviapages_main_code_text || "") !== primaryFromICAO)
         .map((a) => ({
            id: a._id || "",
            icao: a.aviapages_main_code_text || "",
            lat: a.latitude_number || 0,
            lng: a.longitude_number || 0,
            name: a.airportnameshort_text || a.aviapages_main_code_text || "",
         })),
   ].filter((a) => a.icao);

   const toAirportData = [
      primaryToData,
      ...toAlts
         .filter((a) => (a.aviapages_main_code_text || "") !== primaryToICAO)
         .map((a) => ({
            id: a._id || "",
            icao: a.aviapages_main_code_text || "",
            lat: a.latitude_number || 0,
            lng: a.longitude_number || 0,
            name: a.airportnameshort_text || a.aviapages_main_code_text || "",
         })),
   ].filter((a) => a.icao);

   // Store for map modal (if needed later)
   window._crFromAirports = fromAirportData;
   window._crToAirports = toAirportData;

   // Build radio HTML — first item is pre-selected
   const CHECKMARK_SVG = `<svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 5L4.5 8.5L11 1" stroke="#04142a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

   const fromRadios = fromAirportData
      .map(
         (airport, i) => `
      <label class="rtb_airport_option${i === 0 ? " rtb_airport_selected" : ""}">
         <input type="radio" name="cr_from_airport" value="${airport.id}" ${i === 0 ? "checked" : ""} />
         <span class="rtb_airport_custom">${i === 0 ? CHECKMARK_SVG : ""}</span>
         <span class="rtb_airport_code">${airport.icao}</span>
      </label>`,
      )
      .join("");

   const toRadios = toAirportData
      .map(
         (airport, i) => `
      <label class="rtb_airport_option${i === 0 ? " rtb_airport_selected" : ""}">
         <input type="radio" name="cr_to_airport" value="${airport.id}" ${i === 0 ? "checked" : ""} />
         <span class="rtb_airport_custom">${i === 0 ? CHECKMARK_SVG : ""}</span>
         <span class="rtb_airport_code">${airport.icao}</span>
      </label>`,
      )
      .join("");

   // ── Inject HTML ───────────────────────────────────────────────
   wrapper.innerHTML = `
      <!-- Itinerary -->
      <div class="adi_itinerary">
         <h4 class="adi_section_title">ITINERARY</h4>
         ${itineraryRows}
      </div>

      <!-- Airport Selection -->
      <div class="adi_airports_section">
         <h4 class="adi_section_title">AIRPORTS</h4>
         <div class="rtb_airports_grid">
            <div class="rtb_airports_col">
               <div class="rtb_airports_col_header">
                  <span class="rtb_airports_col_label">Departure:</span>
                  <button class="rtb_map_link" id="cr_show_from_map">Show on the map</button>
               </div>
               <div class="rtb_airport_list" id="cr_from_list">${fromRadios}</div>
            </div>
            <div class="rtb_airports_col">
               <div class="rtb_airports_col_header">
                  <span class="rtb_airports_col_label">Arrival:</span>
                  <button class="rtb_map_link" id="cr_show_to_map">Show on the map</button>
               </div>
               <div class="rtb_airport_list" id="cr_to_list">${toRadios}</div>
            </div>
         </div>
      </div>

      <!-- Passengers -->
      <div class="adi_passengers_row">
         <h4 class="adi_passengers_label">PASSENGERS: <span>${pax}</span></h4>
         <button class="adi_edit_pax_btn adi_map_link">Edit Passenger No.</button>
      </div>

   `;

   // ── Airport radio interaction ─────────────────────────────────
   initAirportRadios();

   // ── Show on the map buttons ───────────────────────────────────
   const showFromMapBtn = document.getElementById("cr_show_from_map");
   const showToMapBtn = document.getElementById("cr_show_to_map");

   if (showFromMapBtn) {
      showFromMapBtn.addEventListener("click", () => {
         openCrAirportMap(window._crFromAirports, "Departure Airports");
      });
   }
   if (showToMapBtn) {
      showToMapBtn.addEventListener("click", () => {
         openCrAirportMap(window._crToAirports, "Arrival Airports");
      });
   }
}

// =============================================================================
// AIRPORT RADIO — click interaction (same as RTB)
// =============================================================================
function initAirportRadios() {
   const CHECKMARK_SVG = `<svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 5L4.5 8.5L11 1" stroke="#04142a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

   document.querySelectorAll(".rtb_airport_option").forEach((label) => {
      label.addEventListener("click", function () {
         const group = this.closest(".rtb_airport_list");
         if (!group) return;

         // Remove selected state from all in this group
         group.querySelectorAll(".rtb_airport_option").forEach((opt) => {
            opt.classList.remove("rtb_airport_selected");
            const customSpan = opt.querySelector(".rtb_airport_custom");
            if (customSpan) customSpan.innerHTML = "";
         });

         // Set selected state on clicked item
         this.classList.add("rtb_airport_selected");
         const customSpan = this.querySelector(".rtb_airport_custom");
         if (customSpan) customSpan.innerHTML = CHECKMARK_SVG;

         // Check the radio
         const radio = this.querySelector('input[type="radio"]');
         if (radio) radio.checked = true;
      });
   });
}

// =============================================================================
// AIRPORT MAP MODAL — Leaflet popup showing all airports as markers
// =============================================================================
let _crMapInstance = null;

function openCrAirportMap(airports, title) {
   if (typeof L === "undefined") {
      alert("Map library not loaded. Please refresh the page.");
      return;
   }

   // Inject modal HTML once
   if (!document.getElementById("cr_airport_map_overlay")) {
      document.body.insertAdjacentHTML(
         "beforeend",
         `<div class="rtb_airport_map_overlay" id="cr_airport_map_overlay">
            <div class="rtb_airport_map_modal">
               <div class="rtb_airport_map_header">
                  <h4 class="rtb_airport_map_title" id="cr_airport_map_title"></h4>
                  <button class="rtb_airport_map_close" id="cr_airport_map_close" aria-label="Close">
                     <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 1L15 15M15 1L1 15" stroke="#04142a" stroke-width="2" stroke-linecap="round"/></svg>
                  </button>
               </div>
               <div id="cr_airport_map_container" class="rtb_airport_map_container"></div>
            </div>
         </div>`,
      );

      document
         .getElementById("cr_airport_map_close")
         .addEventListener("click", closeCrAirportMap);
      document
         .getElementById("cr_airport_map_overlay")
         .addEventListener("click", (e) => {
            if (e.target.id === "cr_airport_map_overlay") closeCrAirportMap();
         });
   }

   // Set title
   document.getElementById("cr_airport_map_title").textContent = title;

   // Show overlay
   const overlay = document.getElementById("cr_airport_map_overlay");
   overlay.classList.add("rtb_airport_map_open");
   document.body.style.overflow = "hidden";

   // Destroy previous map
   if (_crMapInstance) {
      _crMapInstance.remove();
      _crMapInstance = null;
   }

   // Reset container
   const container = document.getElementById("cr_airport_map_container");
   container.innerHTML = "";

   // Wait for browser paint then init
   requestAnimationFrame(() => {
      requestAnimationFrame(() => {
         _crMapInstance = L.map("cr_airport_map_container", {
            scrollWheelZoom: true,
         });

         L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            {
               maxZoom: 19,
               attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
            },
         ).addTo(_crMapInstance);

         const pinIcon = L.divIcon({
            className: "",
            html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36"><path fill="#e53935" stroke="#fff" stroke-width="1.2" d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0zm0 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/></svg>`,
            iconSize: [24, 36],
            iconAnchor: [12, 36],
         });

         const validAirports = airports.filter(
            (a) =>
               a.lat != null &&
               a.lng != null &&
               (Number(a.lat) !== 0 || Number(a.lng) !== 0),
         );

         const bounds = [];

         validAirports.forEach((a) => {
            const lat = Number(a.lat);
            const lng = Number(a.lng);
            const marker = L.marker([lat, lng], { icon: pinIcon }).addTo(
               _crMapInstance,
            );
            marker.bindTooltip(
               `<div class="rtb_map_popup"><strong>${a.icao}</strong><span>${a.name || ""}</span></div>`,
               {
                  direction: "top",
                  offset: [0, -36],
                  className: "rtb_map_tooltip",
               },
            );
            bounds.push([lat, lng]);
         });

         // Recalc size first
         _crMapInstance.invalidateSize({ animate: false });

         // Fit bounds
         if (bounds.length > 1) {
            _crMapInstance.fitBounds(L.latLngBounds(bounds), {
               padding: [60, 60],
               maxZoom: 12,
               animate: false,
            });
         } else if (bounds.length === 1) {
            _crMapInstance.setView(bounds[0], 10, { animate: false });
         } else {
            _crMapInstance.setView([20, 0], 2, { animate: false });
         }
      });
   });
}

function closeCrAirportMap() {
   const overlay = document.getElementById("cr_airport_map_overlay");
   if (overlay) overlay.classList.remove("rtb_airport_map_open");
   document.body.style.overflow = "";
}

// =============================================================================
// PASSENGER EDIT MODAL
// =============================================================================
function initPassengerModal() {
   // Inject modal HTML
   const modalHTML = `
   <div class="adi_pax_overlay" id="adi_pax_overlay">
      <div class="adi_pax_modal">
         <h3 class="adi_pax_modal_title">Edit Passenger Count</h3>
         <div class="passenger_edit_block">
            <div class="adi_pax_label_row">
               <span>PASSENGERS:</span>
            </div>
            <div class="adi_pax_counter">
               <button id="adi_pax_minus">&#8722;</button>
               <div class="adi_pax_count_val" id="adi_pax_val">1</div>
               <button id="adi_pax_plus">&#43;</button>
            </div>
         </div>
         <div class="adi_pax_modal_footer">
            <button class="adi_pax_cancel_btn" id="adi_pax_cancel">Cancel</button>
            <button class="adi_pax_save_btn" id="adi_pax_save">Save</button>
         </div>
      </div>
   </div>`;
   document.body.insertAdjacentHTML("beforeend", modalHTML);

   const overlay = document.getElementById("adi_pax_overlay");
   const valEl = document.getElementById("adi_pax_val");
   const minusBtn = document.getElementById("adi_pax_minus");
   const plusBtn = document.getElementById("adi_pax_plus");
   let currentPax = 1;
   let maxPax = 99;

   function openPaxModal(pax, max) {
      currentPax = pax || 1;
      maxPax = max || 99;
      valEl.textContent = currentPax;
      overlay.classList.add("open");
   }

   function closePaxModal() {
      overlay.classList.remove("open");
   }

   minusBtn.addEventListener("click", () => {
      if (currentPax > 1) {
         currentPax--;
         valEl.textContent = currentPax;
      }
   });

   plusBtn.addEventListener("click", () => {
      if (currentPax < maxPax) {
         currentPax++;
         valEl.textContent = currentPax;
      }
   });

   document
      .getElementById("adi_pax_cancel")
      .addEventListener("click", closePaxModal);

   // Close on overlay background click
   overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closePaxModal();
   });

   // Save → update passenger count on the page
   document.getElementById("adi_pax_save").addEventListener("click", () => {
      const paxSpan = document.querySelector(".adi_passengers_label span");
      if (paxSpan) paxSpan.textContent = currentPax;
      closePaxModal();
   });

   // Open modal when "Edit Passenger No." is clicked
   document.addEventListener("click", (e) => {
      if (e.target.closest(".adi_edit_pax_btn")) {
         const paxSpan = document.querySelector(".adi_passengers_label span");
         const curPax = parseInt(paxSpan?.textContent) || 1;
         openPaxModal(curPax, 99);
      }
   });
}

// =============================================================================
// RIGHT COLUMN — Route Map (same as RTB)
// =============================================================================
function renderRightColumn(responseData) {
   const wrapper = document.querySelector(".cadi_main_right");
   if (!wrapper) return;

   const legs = responseData.flight_legs || [];
   const firstLeg = legs[0] || {};

   wrapper.innerHTML = `
      <!-- Route Map -->
      <div class="adi_map_wrapper">
         <div id="adi_leaflet_map" class="adi_map_iframe"></div>
      </div>

      <!-- Selected Cabin Classes -->
      <div class="selected_checkbox">
         <h4 class="adi_section_title">Your Selected Cabin Classes</h4>
         <p class="selected_checkbox_desc">Build your trip, choose your preferred aircraft class, and receive quotes from local operators—ready to confirm in one click.</p>
         <div class="selected_item"><span class="noclass">No class selected</span></div>
      </div>

      <!-- Information Card — $1 Credit Card Hold -->
      <div class="rtb_info_panel">
         <h4 class="adi_section_title">INFORMATION</h4>
         <div class="rtb_info_hold">
            <div class="rtb_info_hold_header">
               <img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69e8d386030571ad5363ed66_idea.png" alt="info" class="rtb_info_icon" />                     
            </div>
            <div class="trb_into_para">
               <h5>Credit Card Hold</h5>
               <p class="rtb_info_text">In order to proceed with this request, you must provide a valid form of payment. Please keep in mind that your card will not be charged at this time, however FOR VERIFICATION PURPOSES A HOLD IN THE AMOUNT OF $1 will be placed on your card. If you decide not to proceed with this request, this amount will be refunded.</p>
            </div>
         </div>               
      </div>
      <div class="rtb_payment_list">
         <div class="adi_estimate_row">
            <span class="adi_estimate_label">Hold:</span>
            <span class="adi_estimate_value">$1</span>
         </div>
      </div>

      <!-- Payment Method -->
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
            <div class="co_payment_redirect">
               <div data-wf--btn--variant="black" class="btn_common button_redirect w-variant-717a8abf-6071-4cd8-7483-e0b5d36c316c yeash">
                  <a href="#" class="btnc_link w-inline-block">
                     <p class="btnc_text">Submit Request</p>
                     <div class="btnc_icon_wrap">
                        <img loading="lazy" src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/68f1ce68d69455e26961b49e_45d32b1e5e78559aa8e96f0801193e00_icon.png" alt="logo" class="btnc_icon" />
                     </div>
                  </a>
               </div>
            </div>
         </div>
      </div>
   `;

   // Init Leaflet map
   const mapFromLat = firstLeg.mobile_app_from_latitude_number || 0;
   const mapFromLng = firstLeg.mobile_app_from_longitude_number || 0;
   const mapToLat = firstLeg.mobile_app_to_latitude_number || 0;
   const mapToLng = firstLeg.mobile_app_to_longitude_number || 0;
   initLeafletMap(mapFromLat, mapFromLng, mapToLat, mapToLng);

   // ── Sync checkboxes → selected_item display ───────────────────
   const selectedItemDiv = wrapper.querySelector(".selected_item");
   if (selectedItemDiv) {
      document.querySelectorAll(".checkbox-input").forEach((checkbox) => {
         checkbox.addEventListener("change", () => {
            const checked = document.querySelectorAll(
               ".checkbox-input:checked",
            );
            if (checked.length === 0) {
               selectedItemDiv.innerHTML = `<span class="noclass">No class selected</span>`;
            } else {
               selectedItemDiv.innerHTML = Array.from(checked)
                  .map((cb) => {
                     const label =
                        cb
                           .closest(".checkbox-item")
                           ?.querySelector(".checkbox-label")?.textContent ||
                        "";
                     return `<div class="selectedItem"><p>${label}</p></div>`;
                  })
                  .join("");
            }
         });
      });
   }
}

// Great Circle interpolation — same as RTB
function greatCirclePoints(lat1, lng1, lat2, lng2, n) {
   n = n || 100;
   const toRad = (d) => (d * Math.PI) / 180;
   const toDeg = (r) => (r * 180) / Math.PI;
   const p1 = toRad(lat1),
      l1 = toRad(lng1);
   const p2 = toRad(lat2),
      l2 = toRad(lng2);
   const d =
      2 *
      Math.asin(
         Math.sqrt(
            Math.pow(Math.sin((p2 - p1) / 2), 2) +
               Math.cos(p1) *
                  Math.cos(p2) *
                  Math.pow(Math.sin((l2 - l1) / 2), 2),
         ),
      );
   if (d === 0)
      return [
         [lat1, lng1],
         [lat2, lng2],
      ];
   const pts = [];
   for (let i = 0; i <= n; i++) {
      const f = i / n;
      const A = Math.sin((1 - f) * d) / Math.sin(d);
      const B = Math.sin(f * d) / Math.sin(d);
      const x =
         A * Math.cos(p1) * Math.cos(l1) + B * Math.cos(p2) * Math.cos(l2);
      const y =
         A * Math.cos(p1) * Math.sin(l1) + B * Math.cos(p2) * Math.sin(l2);
      const z = A * Math.sin(p1) + B * Math.sin(p2);
      pts.push([
         toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))),
         toDeg(Math.atan2(y, x)),
      ]);
   }
   return pts;
}

// Leaflet route map — same as RTB
function initLeafletMap(fLat, fLng, tLat, tLng) {
   const mapEl = document.getElementById("adi_leaflet_map");
   if (!mapEl || typeof L === "undefined") return;

   const MAPBOX_TOKEN =
      "pk.eyJ1IjoianVzdGluY3JhYmJlIiwiYSI6ImNtZTVrNThybzBzNWkybHB1OWhtY3VibGwifQ.D-Z2RTCheu1vdwey8DqsJw";

   const map = L.map("adi_leaflet_map", {
      scrollWheelZoom: false,
      worldCopyJump: true,
   });

   L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
      {
         tileSize: 512,
         zoomOffset: -1,
         attribution:
            '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
   ).addTo(map);

   const redIcon = L.divIcon({
      className: "",
      html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="40"><path fill="#e53935" stroke="#fff" stroke-width="1" d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0zm0 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/></svg>`,
      iconSize: [28, 40],
      iconAnchor: [14, 40],
      popupAnchor: [0, -40],
   });

   L.marker([fLat, fLng], { icon: redIcon }).addTo(map);
   L.marker([tLat, tLng], { icon: redIcon }).addTo(map);

   const arcPoints = greatCirclePoints(fLat, fLng, tLat, tLng, 120);
   L.polyline(arcPoints, { color: "#1565C0", weight: 2.5, opacity: 1 }).addTo(
      map,
   );
   map.fitBounds(
      [
         [fLat, fLng],
         [tLat, tLng],
      ],
      { padding: [50, 50] },
   );
}

// =============================================================================
// SUBMIT REQUEST — same as RTB
// =============================================================================
async function submitRequest() {
   const authToken =
      typeof Cookies !== "undefined" ? Cookies.get("authToken") : null;
   if (!authToken) {
      window.toast.error("You must be logged in to submit a request.");
      return;
   }

   const allCardRadios = document.querySelectorAll(".co_saved_card_radio");
   if (allCardRadios.length === 0) {
      window.toast.error("Please add a card to continue.");
      return;
   }

   const selectedCardRadio = document.querySelector(
      ".co_saved_card_radio:checked",
   );
   if (!selectedCardRadio) {
      window.toast.error("Please select a saved card to proceed.");
      return;
   }

   const profileId =
      selectedCardRadio.closest(".co_saved_card")?.dataset.profileId;
   if (!profileId) {
      window.toast.error("Could not read card details. Please try again.");
      return;
   }

   const selectedFrom = document.querySelector(
      "input[name='rtb_from_airport']:checked",
   );
   const selectedTo = document.querySelector(
      "input[name='rtb_to_airport']:checked",
   );
   const fromAirport = selectedFrom?.value || "";
   const toAirport = selectedTo?.value || "";

   const specialRequests =
      document.getElementById("rtb_special_requests_input")?.value.trim() || "";

   const paxCount =
      parseInt(
         document.querySelector(".adi_passengers_label span")?.textContent,
      ) || 1;

   const submitBtnWrap = document.querySelector(".co_payment_redirect");
   const btnText = document.querySelector(".co_payment_redirect .btnc_text");
   const yeash = document.querySelector(".co_payment_redirect .yeash");
   if (submitBtnWrap) submitBtnWrap.style.pointerEvents = "none";
   if (btnText) btnText.textContent = "Submitting...";
   if (yeash) yeash.classList.add("btn_loading");

   try {
      const res = await fetch(SUBMIT_REQUEST_API, {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
         },
         body: JSON.stringify({
            quote: crData?.quote,
            payment_profile_id: profileId,
            wire_payment: "no",
            alternate_departure_airport_id: fromAirport,
            alternate_arrival_airport_id: toAirport,
            special_requests: specialRequests,
            pax: paxCount,
         }),
      });

      const data = await res.json();
      console.log(data);

      if (
         res.ok &&
         data.response &&
         !data.response.has_error &&
         data.response.transaction_id
      ) {
         submitSuccess = true;
         if (btnText) btnText.textContent = "Redirecting...";
         window.toast.success(
            data.response.message ||
               "Your request has been submitted successfully.",
         );
         setTimeout(() => {
            window.location.href = `/booking-confirmed?transaction_id=${encodeURIComponent(data.response.transaction_id)}`;
         }, 800);
      } else {
         const errMsg =
            (data.response && data.response.message) ||
            data.message ||
            "Submission failed. Please try again.";
         window.toast.error(errMsg);
      }
   } catch (err) {
      console.error("Submit Request Error:", err);
      window.toast.error("Something went wrong. Please try again.");
   } finally {
      if (!submitSuccess) {
         if (submitBtnWrap) submitBtnWrap.style.pointerEvents = "";
         if (btnText) btnText.textContent = "Submit Request";
         if (yeash) yeash.classList.remove("btn_loading");
      }
   }
}

// =============================================================================
// SAVED CARDS — same as RTB
// =============================================================================
function getCardLogo(cardType) {
   if (cardType) {
      const key = cardType.toLowerCase();
      if (CARD_LOGOS[key]) return { logo: CARD_LOGOS[key], type: cardType };
   }
   return { logo: CARD_LOGOS.default, type: "Card" };
}

function renderSavedCards(cards) {
   const container = document.getElementById("co_saved_cards");
   if (!container) return;

   if (!cards || cards.length === 0) {
      container.innerHTML = `<div class="co_no_cards req_no_card"><p>No saved cards</p></div>`;
      return;
   }

   let html = "";
   cards.forEach((card) => {
      const profileId = card["_api_c2_customerPaymentProfileId"] || "";
      const lastFour = (
         card["_api_c2_payment.creditCard.cardNumber"] || ""
      ).replace(/X/g, "");
      const cardType = card["_api_c2_payment.creditCard.cardType"] || null;
      const isDefault = card["_api_c2_defaultPaymentProfile"] === true;
      const { logo, type } = getCardLogo(cardType);

      html += `
         <label class="co_saved_card ${isDefault ? "co_saved_card_active" : ""}" data-profile-id="${profileId}" data-card-type="${type}" data-last-four="${lastFour}">
            <input type="radio" name="saved_card" class="co_saved_card_radio" ${isDefault ? "checked" : ""} />
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

   container.querySelectorAll(".co_saved_card_radio").forEach((radio) => {
      radio.addEventListener("change", () => {
         container.querySelectorAll(".co_saved_card").forEach((el) => {
            el.classList.remove("co_saved_card_active");
         });
         radio.closest(".co_saved_card").classList.add("co_saved_card_active");
      });
   });

   container.querySelectorAll(".co_set_default").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
         e.preventDefault();
         e.stopPropagation();
         const pid = btn.dataset.profileId;
         const original = btn.textContent;
         btn.textContent = "Please wait...";
         btn.disabled = true;
         await updateDefaultCard(pid, true);
         btn.textContent = original;
         btn.disabled = false;
      });
   });

   container.querySelectorAll(".co_remove_default").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
         e.preventDefault();
         e.stopPropagation();
         const pid = btn.dataset.profileId;
         const original = btn.textContent;
         btn.textContent = "Please wait...";
         btn.disabled = true;
         await updateDefaultCard(pid, false);
         btn.textContent = original;
         btn.disabled = false;
      });
   });

   container.querySelectorAll(".co_saved_card_delete").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
         e.preventDefault();
         e.stopPropagation();
         const pid = btn.dataset.profileId;

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
               return await deleteCard(pid);
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
      if (res.ok && !(data.response && data.response.has_error)) {
         window.toast.success(
            isDefault ? "Default card updated!" : "Default card removed!",
         );
         fetchSavedCards();
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
// MODALS: Add new card — same as RTB
// =============================================================================
function setupModals() {
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
                  <div class="modal_one_link co_modal_add_btn" id="co_open_modal_2">
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
                  <p>Please provide your credit card details below. All transactions are encrypted and processed securely.</p>
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
                     <div class="co_card_input co_card_phone">
                        <input required id="co_phone" name="phone" type="text" placeholder="Phone Number" />
                     </div>
                     <div class="co_card_grp">
                        <div class="co_card_input">
                           <input type="text" id="co_city" placeholder="City" autocomplete="address-level2" />
                        </div>
                        <div class="co_card_input">
                           <input type="text" id="co_state" placeholder="State" autocomplete="address-level1" />
                        </div>
                     </div>
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

   document.addEventListener("click", (e) => {
      if (e.target.closest(".co_addcard_button")) {
         const isLoggedIn =
            typeof Cookies !== "undefined" &&
            !!Cookies.get("authToken") &&
            !!Cookies.get("userEmail");

         if (isLoggedIn) {
            openModal(modal1Overlay);
         } else {
            window.onAuthSuccess = function () {
               openModal(modal1Overlay);
            };
            const onLoggedIn = () => {
               window.removeEventListener("userLoggedIn", onLoggedIn);
               if (typeof window.onAuthSuccess === "function") {
                  const cb = window.onAuthSuccess;
                  window.onAuthSuccess = null;
                  setTimeout(() => {
                     cb();
                  }, 800);
               }
            };
            window.addEventListener("userLoggedIn", onLoggedIn);

            const loginForm = document.querySelector(".fl_auth.login_form");
            if (loginForm) {
               document
                  .querySelectorAll(".fl_auth")
                  .forEach((f) => f.classList.add("form_hide"));
               loginForm.classList.remove("form_hide");
               document.body.classList.add("overflow");
            }
         }
      }
   });

   document
      .getElementById("co_modal_1")
      .addEventListener("click", (e) => e.stopPropagation());
   document
      .getElementById("co_modal_1_close")
      .addEventListener("click", () => closeModal(modal1Overlay));
   modal1Overlay.addEventListener("click", () => closeModal(modal1Overlay));

   let coItiInitialized = false;
   document.getElementById("co_open_modal_2").addEventListener("click", () => {
      closeModal(modal1Overlay);
      openModal(modal2Overlay);
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

   setupCardValidation();
}

// =============================================================================
// CARD FORM VALIDATION — same as RTB
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

   [coCity, coState, coZip].forEach((el) => {
      if (el) el.addEventListener("input", () => clearError(el));
   });
   if (coCountry)
      coCountry.addEventListener("change", () => clearError(coCountry));
   if (coAddress)
      coAddress.addEventListener("input", () => clearError(coAddress));
   if (coPhone) coPhone.addEventListener("input", () => clearError(coPhone));

   cardNumber.addEventListener("input", () => {
      let v = cardNumber.value.replace(/\D/g, "").slice(0, 16);
      cardNumber.value = v.replace(/(\d{4})(?=\d)/g, "$1 ");
      clearError(cardNumber);
   });

   cardExpiry.addEventListener("input", () => {
      let v = cardExpiry.value.replace(/\D/g, "").slice(0, 4);
      if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
      cardExpiry.value = v;
      clearError(cardExpiry);
   });

   cardCvv.addEventListener("input", () => {
      cardCvv.value = cardCvv.value.replace(/\D/g, "").slice(0, 4);
      clearError(cardCvv);
   });

   cardName.addEventListener("input", () => clearError(cardName));

   function validateCard() {
      let valid = true;
      const rawNum = cardNumber.value.replace(/\s/g, "");
      if (rawNum.length < 13 || rawNum.length > 16) {
         setError(cardNumber, "Enter a valid card number.");
         valid = false;
      } else {
         clearError(cardNumber);
      }

      if (cardName.value.trim().length < 2) {
         setError(cardName, "Enter the card holder name.");
         valid = false;
      } else {
         clearError(cardName);
      }

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

      if (cardCvv.value.length < 3) {
         setError(cardCvv, "Enter a valid CVV.");
         valid = false;
      } else {
         clearError(cardCvv);
      }

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

      if (coCity && coCity.value.trim().length < 1) {
         setError(coCity, "Enter your city.");
         valid = false;
      } else if (coCity) {
         clearError(coCity);
      }
      if (coState && coState.value.trim().length < 1) {
         setError(coState, "Enter your state.");
         valid = false;
      } else if (coState) {
         clearError(coState);
      }
      if (coZip && coZip.value.trim().length < 3) {
         setError(coZip, "Enter a valid zip code.");
         valid = false;
      } else if (coZip) {
         clearError(coZip);
      }
      if (coCountry && coCountry.value.trim().length < 1) {
         setError(coCountry, "Enter your country.");
         valid = false;
      } else if (coCountry) {
         clearError(coCountry);
      }
      if (coAddress && coAddress.value.trim().length < 1) {
         setError(coAddress, "Enter your billing address.");
         valid = false;
      } else if (coAddress) {
         clearError(coAddress);
      }

      return valid;
   }

   submitBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!validateCard()) return;

      const authToken =
         typeof Cookies !== "undefined" ? Cookies.get("authToken") : null;
      if (!authToken) {
         window.toast.error("Not authenticated.");
         return;
      }

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
         nameParts.length > 1 ? nameParts.slice(1).join(" ") : firstName;

      const phoneNumber =
         window.coIti && typeof window.coIti.getNumber === "function"
            ? window.coIti.getNumber()
            : coPhone?.value || "";

      const originalBtnText =
         submitBtn.querySelector(".btnc_text")?.textContent;
      if (submitBtn.querySelector(".btnc_text")) {
         submitBtn.querySelector(".btnc_text").textContent = "Saving...";
      }
      submitBtn.disabled = true;

      try {
         const res = await fetch(
            `${BUBBLE_BASE_URL}/api/1.1/wf/webflow_add_card_flyt`,
            {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${authToken}`,
               },
               body: JSON.stringify({
                  card_number: rawCardNum,
                  expiry_month: expMonth,
                  expiry_year: expYear,
                  card_code: cvv,
                  first_name: firstName,
                  last_name: lastName,
                  phone_number: phoneNumber,
                  city: coCity?.value || "",
                  state: coState?.value || "",
                  zip: coZip?.value || "",
                  country: coCountry?.value || "",
                  address: coAddress?.value || "",
               }),
            },
         );

         const data = await res.json();
         console.log(data);

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

// Inject loader element (same as RTB)
const loaderEl = document.createElement("div");
loaderEl.className = "adi_page_loader";
loaderEl.innerHTML = `<div class="adi_loader_spinner"></div>`;
document.body.appendChild(loaderEl);

function showLoader() {
   const loader = document.querySelector(".adi_page_loader");
   if (loader) loader.classList.remove("hidden");
}

function hideLoader() {
   const loader = document.querySelector(".adi_page_loader");
   if (loader) loader.classList.add("hidden");
}

async function initCustomRequest() {
   showLoader();
   try {
      console.log("Fetching custom request data for:", flightRequestId);

      const response = await fetch(CUSTOM_REQUEST_API, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ flightrequest: flightRequestId }),
      });

      const data = await response.json();
      console.log("Custom Request API Response:", data);

      if (!data.response) {
         console.error("API returned no response data.");
         return;
      }

      crData = data.response;

      // Render Itinerary + Airports (left column)
      renderItineraryAndAirports(crData);

      // Render Right Column (map + info + payment)
      renderRightColumn(crData);

      // Init passenger edit modal
      initPassengerModal();

      // Fetch saved cards
      fetchSavedCards();

      // Setup add card modals
      setupModals();

      // Wire submit button
      const submitBtn = document.querySelector(
         ".co_payment_redirect .btnc_link",
      );
      if (submitBtn) {
         submitBtn.addEventListener("click", (e) => {
            e.preventDefault();

            const isLoggedIn =
               typeof Cookies !== "undefined" &&
               !!Cookies.get("authToken") &&
               !!Cookies.get("userEmail");

            if (isLoggedIn) {
               submitRequest();
            } else {
               window.onAuthSuccess = function () {
                  submitRequest();
               };
               const onLoggedIn = () => {
                  window.removeEventListener("userLoggedIn", onLoggedIn);
                  if (typeof window.onAuthSuccess === "function") {
                     const cb = window.onAuthSuccess;
                     window.onAuthSuccess = null;
                     setTimeout(() => {
                        cb();
                     }, 800);
                  }
               };
               window.addEventListener("userLoggedIn", onLoggedIn);

               const loginForm = document.querySelector(".fl_auth.login_form");
               if (loginForm) {
                  document
                     .querySelectorAll(".fl_auth")
                     .forEach((f) => f.classList.add("form_hide"));
                  loginForm.classList.remove("form_hide");
                  document.body.classList.add("overflow");
               }
            }
         });
      }
   } catch (error) {
      console.error("Custom Request Error:", error);
   } finally {
      hideLoader();
   }
}

// Fire on DOM ready
initCustomRequest();
