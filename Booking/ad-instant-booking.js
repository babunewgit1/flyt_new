// Guard: Redirect to /aircraft if no id param in URL
const urlParams = new URLSearchParams(window.location.search);
const bookingId = urlParams.get("id");

if (!bookingId) {
   window.location.href = "/aircraft";
}

// =============================================================================
// FETCH AIRCRAFT DETAILS
// Calls the API with the booking ID from the URL and logs the response.
// =============================================================================

const AIRCRAFT_DETAIL_API =
   "https://operators-dashboard.bubbleapps.io/api/1.1/wf/webflow_return_aircraft_detail_flyt";

// Maps currency_text from the API to the correct display symbol.
// Same as search_result.js
const CURRENCY_SYMBOLS = {
   usd: "$",
   eur: "\u20ac",
   cad: "C$",
};

// =============================================================================
// LOADER HELPERS
// =============================================================================
function showLoader() {
   const loader = document.querySelector(".adi_page_loader");
   if (loader) loader.classList.remove("hidden");
}

function hideLoader() {
   const loader = document.querySelector(".adi_page_loader");
   if (loader) loader.classList.add("hidden");
}

function redirectToBooking(item) {
   const id = item._id || "";
   const isInstant =
      (item.type_text || "").trim().toUpperCase() === "INSTANT BOOKING";
   const isNotInstant =
      (item.type_text || "").trim().toUpperCase() !== "INSTANT BOOKING";

   // Condition 1: Has ID and booking type is INSTANT BOOKING
   if (id && isInstant) {
      window.location.href = `/ad-instant-booking?id=${encodeURIComponent(id)}`;
   }

   // Condition 2: Has ID and booking type is NOT INSTANT BOOKING
   if (id && isNotInstant) {
      window.location.href = `/late_book?id=${encodeURIComponent(id)}`;
   }
}

let apiResponseData = null;

async function fetchAircraftDetail() {
   showLoader();
   try {
      const currencyCode =
         JSON.parse(sessionStorage.getItem("currency"))?.api_currency || "USD";

      const response = await fetch(AIRCRAFT_DETAIL_API, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            aircraftid: bookingId,
            currency_code: currencyCode,
         }),
      });

      const data = await response.json();
      console.log("Aircraft Detail Response:", data.response);
      apiResponseData = data.response;

      const detail = data.response?.aircraft_detail;
      // If aircraft_detail is missing or empty object (wrong ID) → redirect
      if (!detail || !detail._id) {
         window.location.href = "/aircraft";
         return;
      }

      // render blocks
      renderHeading(detail);
      renderMainSection(data.response);
      renderJetSlider(data.response.aircraft || []);

      // Apply price blur only if user is logged in AND blur_pricing === true
      // (same logic as search_result.js fetchSearchHistory)
      const isLoggedIn =
         typeof Cookies !== "undefined" && !!Cookies.get("authToken");
      if (isLoggedIn && data.response?.blur_pricing === true) {
         // Blur both the related jet slider prices AND the main booking card prices
         document
            .querySelectorAll(
               ".adj_card_price, .adi_info_price span, .adi_estimate_value",
            )
            .forEach((el) => {
               el.style.filter = "blur(5px)";
            });
      }
   } catch (error) {
      console.error("Aircraft Detail Error:", error);
   } finally {
      hideLoader();
   }
}

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
// RENDER: Heading Block → .adi_heading_wrapper
// =============================================================================
function renderHeading(detail) {
   const headingWrapper = document.querySelector(".adi_heading_wrapper");
   if (!headingWrapper) return;

   headingWrapper.innerHTML = `
      <div class="adi_heading_arrow">
         <a href="/aircraft#sc_result"><img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69c37498460e7320906ec1a3_arrow_right.png" alt="" /></a>
      </div>
      <div class="adi_heading_content">
         <h2 data-wf--white_heading_h2--variant="black_version" class="hm_sponser_h2 adi_heading_h2 w-variant-c97c5271-25fa-0785-e5a2-babd61f625cd">${detail.model_text || ""}</h2>
         <p data-wf--global_para--variant="black_color" class="whole_para adi_heading_para w-variant-124bf981-d164-97ae-531d-77453bb396cb">${detail.model_message_text || ""}</p>
      </div>
   `;
}

// =============================================================================
// RENDER: Main Section → .adi_main_wrapper
// =============================================================================
function renderMainSection(responseData) {
   const wrapper = document.querySelector(".adi_main_wrapper");
   if (!wrapper) return;

   const d = responseData.aircraft_detail;
   const legs = responseData.flight_legs || [];

   // flight_legs.length === 1 → one way  |  > 1 → round trip
   const legEFTTextKeys = ["leg_1_flight_time_text", "leg_2_flight_time_text"];

   const imgs = d.aircraft_image_s__list_image?.length
      ? d.aircraft_image_s__list_image
      : [d.aircraft_image_image];
   const slides = imgs
      .map(
         (img) =>
            `<div class="swiper-slide"><img src="https:${img}" alt="${d.model_text || ""}" class="adi_slide_img" /></div>`,
      )
      .join("");

   // Use top-level values directly — no calculation needed
   const charter = responseData.price || 0;
   const carbon = responseData.carbon_offset || 0;
   const subtotal = responseData.subtotal || 0;

   // Dynamic currency symbol from aircraft_detail.currency_text — same as search_result.js
   const currencySymbol =
      CURRENCY_SYMBOLS[(d.currency_text || "").toLowerCase()] || "$";

   // First leg coordinates for the map
   const firstLeg = legs[0] || {};
   const mapFromLat = firstLeg.mobile_app_from_latitude_number || 0;
   const mapFromLng = firstLeg.mobile_app_from_longitude_number || 0;
   const mapToLat = firstLeg.mobile_app_to_latitude_number || 0;
   const mapToLng = firstLeg.mobile_app_to_longitude_number || 0;

   // Build itinerary blocks — one way: 1 leg, round trip: 2+ legs
   const itineraryRows = legs
      .map((leg, i) => {
         const eft = formatEFTFromText(d[legEFTTextKeys[i]]);
         const depTimestamp = leg.date_date || 0;
         // Safari fix: use timestamp (same path as arrDate) instead of
         // ISO string to avoid Safari UTC-vs-local parsing inconsistency.
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

   // Build airport cards — only from the 1st leg (from + to)
   const airportMapData = [];
   const airportCards = (() => {
      const leg = legs[0];
      if (!leg) return "";

      const fICAO = leg.mobile_app_from_airport_icao_code_text || "";
      const fLat = leg.mobile_app_from_latitude_number || 0;
      const fLng = leg.mobile_app_from_longitude_number || 0;
      const tICAO = leg.mobile_app_to_airport_icao_code_text || "";
      const tLat = leg.mobile_app_to_latitude_number || 0;
      const tLng = leg.mobile_app_to_longitude_number || 0;
      const mapFromLink = `https://www.google.com/maps?q=${fLat},${fLng}`;
      const mapToLink = `https://www.google.com/maps?q=${tLat},${tLng}`;

      airportMapData.push({ id: "adi_mini_map_from", lat: fLat, lng: fLng });
      airportMapData.push({ id: "adi_mini_map_to", lat: tLat, lng: tLng });

      return `
         <div class="adi_airport_card">
            <p class="adi_port_card_heading">Departure:</p>
            <div class="adi_airport_img_wrap"><div id="adi_mini_map_from" class="adi_airport_mini_map"></div></div>
            <div class="adi_airport_footer">
               <span class="adi_airport_code">${fICAO}</span>
               <a href="${mapFromLink}" target="_blank" class="adi_map_link">Show on the map</a>
            </div>
         </div>
         <div class="adi_airport_card">
            <p class="adi_port_card_heading">Arrival:</p>
            <div class="adi_airport_img_wrap"><div id="adi_mini_map_to" class="adi_airport_mini_map"></div></div>
            <div class="adi_airport_footer">
               <span class="adi_airport_code">${tICAO}</span>
               <a href="${mapToLink}" target="_blank" class="adi_map_link">Show on the map</a>
            </div>
         </div>`;
   })();

   wrapper.innerHTML = `
      <div class="adi_main_grid">
         <!-- LEFT COLUMN -->
         <div class="adi_main_left">
            <!-- Slider -->
            <div class="swiper adi_aircraft_swiper">
               <div class="swiper-wrapper">${slides}</div>
               <div class="adi_swiper_prev"><span><img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69c4bbcbd27769d32c27fe7d_tsl_left.png" alt="icon" /></span></div>
               <div class="adi_swiper_next"><span><img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69c4bbcc622beb0fcc70e62c_tsl_right.png" alt="icon" /></span></div>
            </div>

            <!-- Info Card -->
            <div class="adi_info_card">
               <div class="adi_info_card_left">
                  <span class="adi_type_badge">${d.type_text || ""}</span>
                  <h3 class="adi_info_model">${d.model_text || ""}</h3>
                  <p class="adi_info_similar">Or similar ${d.category_text || ""}</p>
               </div>
               <div class="adi_info_card_right">
                  <div class="adi_info_stat"> <img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/690c96fecdb4c59f1ce07269_pax.webp" alt="icon" /> <span>${d.max_pax_number || ""} seats</span></div>
                  <div class="adi_info_stat adi_info_price"><img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69a171c7de9c5a2b6e4253c2_planx.png" alt="icon" /> <span>${currencySymbol}${formatPrice(charter)}</span></div>
               </div>
            </div>

            <!-- Itinerary (one block per leg) -->
            <div class="adi_itinerary">
               <h4 class="adi_section_title">ITINERARY</h4>
               ${itineraryRows}
            </div>

            <!-- Airports (from + to for each leg) -->
            <div class="adi_airports_section">
               <h4 class="adi_section_title">AIRPORTS</h4>
               <div class="adi_airports_grid">${airportCards}</div>
            </div>

            <!-- Passengers Row -->
            <div class="adi_passengers_row">
               <h4 class="adi_passengers_label">PASSENGERS: <span>${(legs[0] || {}).pax1_number || ""}</span></h4>
               <button class="adi_edit_pax_btn adi_map_link">Edit Passenger No.</button>
            </div>

            <!-- Carbon Offset Card -->
            <div class="adi_carbon_card">
               <div class="adi_carbon_top">
                  <div class="adi_carbon_icon_wrap">
                     <img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69c5f78ea329100463773d9f_co2.png" alt="icon" />
                  </div>
                  <div class="adi_carbon_content">
                     <h4 class="adi_carbon_title" id="adi_carbon_title">CARBON OFFSET ${currencySymbol}${Number(d.carbon_offset_cost_number || 0).toLocaleString("en-US")}</h4>
                     <p class="adi_carbon_desc">Your flight will generate approximately ${d.emissions_number || ""} tons of CO<sub>2</sub> emissions. Unless cancelled, we will offset the flight emissions on your behalf, through certified carbon credits.</p>
                     <div class="adi_carbon_bottom">
                        <div id="w-node-_9d765e8c-1117-f30f-9454-6c61b782b51b-b782b51b" class="btn_common btn_white"><a href="#" class="btnc_link w-inline-block"><p class="btnc_text black_link">Learn More</p><div class="btnc_icon_wrap"><img loading="lazy" src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/68f35aaf95f1c9a722887386_b9efed4e28c59ac8b27d106d67944ee0_flogo.png" alt="logo" class="btnc_icon"></div></a></div>
                     </div>
                  </div>
                  <label class="adi_toggle_switch">
                     <input type="checkbox" checked />
                     <span class="adi_toggle_slider"></span>
                  </label>
               </div>               
            </div>

         </div><!-- /.adi_main_left -->

         <!-- RIGHT COLUMN -->
         <div class="adi_main_right">

            <!-- Route Map (Leaflet + Mapbox) -->
            <div class="adi_map_wrapper">
               <div id="adi_leaflet_map" class="adi_map_iframe"></div>
            </div>            

            <!-- Flight Estimate -->
            <div class="adi_estimate_card">
               <h4 class="adi_estimate_title">FLIGHT ESTIMATE</h4>
               <div class="adi_estimate_row">
                  <span class="adi_estimate_label">Charter price:</span>
                  <span class="adi_estimate_value">${currencySymbol}${formatPrice(charter)}</span>
               </div>
               <div class="adi_estimate_row">
                  <span class="adi_estimate_label">Carbon offset:</span>
                  <span class="adi_estimate_value" id="adi_carbon_estimate_val">${currencySymbol}${formatPrice(carbon)}</span>
               </div>
               <div class="adi_estimate_divider"></div>
               <div class="adi_estimate_row adi_estimate_subtotal_row">
                  <span class="adi_estimate_label"><strong>Subtotal:</strong></span>
                  <span class="adi_estimate_value" id="adi_subtotal_val"><strong>${currencySymbol}${formatPrice(subtotal)}</strong></span>
               </div>
               <div class="pc_checkout trip_submit">
                  <div id="w-node-_0a19b2cd-9b93-3c1d-bbd6-a41fe53ed149-e53ed149" data-wf--btn--variant="black" class="btn_common w-variant-717a8abf-6071-4cd8-7483-e0b5d36c316c yeash"><a href="#" class="btnc_link w-inline-block"><p class="btnc_text">Proceed To Checkout</p><div class="btnc_icon_wrap"><img loading="lazy" src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/68f1ce68d69455e26961b49e_45d32b1e5e78559aa8e96f0801193e00_icon.png" alt="logo" class="btnc_icon"></div></a></div>
               </div>
            </div>

         </div><!-- /.adi_main_right -->

      </div><!-- /.adi_main_grid -->
   `;

   // Init Swiper (CDN must be loaded by the time this runs)
   if (typeof Swiper !== "undefined") {
      new Swiper(".adi_aircraft_swiper", {
         loop: true,
         navigation: {
            nextEl: ".adi_aircraft_swiper .adi_swiper_next",
            prevEl: ".adi_aircraft_swiper .adi_swiper_prev",
         },
      });
   }

   // Init Leaflet main map + airport mini-maps after DOM is ready
   initLeafletMap(mapFromLat, mapFromLng, mapToLat, mapToLng);
   initAirportMiniMaps(airportMapData);

   // ── Carbon Offset Toggle ──────────────────────────────────────
   const carbonToggle = wrapper.querySelector(".adi_toggle_switch input");
   const carbonTitleEl = document.getElementById("adi_carbon_title");
   const carbonEstimateEl = document.getElementById("adi_carbon_estimate_val");
   const subtotalEl = document.getElementById("adi_subtotal_val");

   if (carbonToggle) {
      carbonToggle.addEventListener("change", () => {
         if (carbonToggle.checked) {
            // Toggle ON — include carbon offset
            carbonTitleEl.textContent = `CARBON OFFSET ${currencySymbol}${formatPrice(carbon)}`;
            carbonEstimateEl.textContent = `${currencySymbol}${formatPrice(carbon)}`;
            subtotalEl.innerHTML = `<strong>${currencySymbol}${formatPrice(subtotal)}</strong>`;
         } else {
            // Toggle OFF — exclude carbon offset
            carbonTitleEl.textContent = `CARBON OFFSET ${currencySymbol}0`;
            carbonEstimateEl.textContent = `${currencySymbol}0`;
            subtotalEl.innerHTML = `<strong>${currencySymbol}${formatPrice(charter)}</strong>`;
         }
      });
   }

   // ── Checkout Button ───────────────────────────────────────────
   const checkoutBtn = wrapper.querySelector(".trip_submit button");
   if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
         const includeCarbon = carbonToggle ? carbonToggle.checked : true;
         window.location.href = `/checkout?id=${encodeURIComponent(bookingId)}&carbon=${includeCarbon}`;
      });
   }
}

// =============================================================================
// RENDER: Jet Slider → .ad_jet_wrapper
// =============================================================================
function renderJetSlider(aircraftList) {
   const wrapper = document.querySelector(".ad_jet_wrapper");
   if (!wrapper || !aircraftList.length) return;

   // Exclude the aircraft already shown as detail (matched by URL id)
   const filtered = aircraftList.filter((ac) => ac._id !== bookingId);

   const slides = filtered
      .map((ac) => {
         const img = ac.aircraft_image_image || "";
         const imgSrc = img ? `https:${img}` : "";
         const model = ac.model_text || "";
         const category = ac.category_text || "";
         const seats = ac.max_pax_number || "";
         const price = Math.round(
            ac.leg_1_average_speed_price_number || ac.price_number || 0,
         ).toLocaleString("en-US");
         const currency =
            CURRENCY_SYMBOLS[(ac.currency_text || "").toLowerCase()] || "$";
         const type = ac.type_text || "";
         const badgeClass =
            type === "INSTANT BOOKING"
               ? "adj_badge adj_badge_instant"
               : "adj_badge adj_badge_request";
         const badgeText = type;

         return `
         <div class="swiper-slide adj_slide">
            <div class="adj_card" data-ac-id="${ac._id || ""}">
               <div class="adj_card_img_wrap">
                  ${imgSrc ? `<img src="${imgSrc}" alt="${model}" class="adj_card_img" />` : ""}
                  <img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/690c9beeaacf18341a56ca94_f_sm.webp" alt="F" class="adj_flogo" />
               </div>
               <div class="adj_card_body">
                  <div class="adj_card_cnt">
                     <span class="${badgeClass}">${badgeText}</span>
                     <h3 class="adj_model">${model}</h3>
                     <p class="adj_models_text">Or ${category} Jet</p>
                  </div>
                  <div class="adj_card_footer">
                     <div class="adj_stat">
                        <img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/690c96fecdb4c59f1ce07269_pax.webp" alt="pax" class="adj_stat_icon" />
                        <span>${seats} seats</span>
                     </div>
                     <div class="adj_stat">
                        <img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69a171c7de9c5a2b6e4253c2_planx.png" alt="price" class="adj_stat_icon" />
                        <span class="adj_card_price">${currency}${price}</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>`;
      })
      .join("");

   wrapper.innerHTML = `
      <div class="swiper adj_swiper">
         <div class="swiper-wrapper">${slides}</div>
         <div class="adj_nav">
             <div class="adj_prev adj_sl_icon"><img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69c4bbcbd27769d32c27fe7d_tsl_left.png" alt="icon" /></div>
            <div class="adj_next adj_sl_icon"><img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69c4bbcc622beb0fcc70e62c_tsl_right.png" alt="icon" /></div>
         </div>
      </div>`;

   // Attach click handlers — same pattern as search_result.js redirectToBooking(item)
   wrapper.querySelectorAll(".adj_card").forEach((card) => {
      const acId = card.dataset.acId;
      const item = filtered.find((a) => a._id === acId);
      if (item) {
         card.addEventListener("click", () => redirectToBooking(item));
      }
   });

   if (typeof Swiper !== "undefined") {
      new Swiper(".adj_swiper", {
         slidesPerView: 4,
         spaceBetween: 26,
         loop: true,
         watchOverflow: true,
         navigation: {
            nextEl: ".adj_next",
            prevEl: ".adj_prev",
         },
         breakpoints: {
            0: { slidesPerView: 1.2, centeredSlides: true, spaceBetween: 10 },
            577: { slidesPerView: 1.2, centeredSlides: true, spaceBetween: 10 },
            768: {
               slidesPerView: 2.2,
               centeredSlides: false,
               spaceBetween: 10,
            },
            992: { slidesPerView: 4, centeredSlides: false },
         },
      });
   }
}

// =============================================================================
// HELPER: Great Circle interpolation points
// Returns an array of [lat, lng] points along the shortest spherical path
// =============================================================================
function greatCirclePoints(lat1, lng1, lat2, lng2, n) {
   n = n || 100;
   const toRad = function (d) {
      return (d * Math.PI) / 180;
   };
   const toDeg = function (r) {
      return (r * 180) / Math.PI;
   };
   const φ1 = toRad(lat1),
      λ1 = toRad(lng1);
   const φ2 = toRad(lat2),
      λ2 = toRad(lng2);
   const d =
      2 *
      Math.asin(
         Math.sqrt(
            Math.pow(Math.sin((φ2 - φ1) / 2), 2) +
               Math.cos(φ1) *
                  Math.cos(φ2) *
                  Math.pow(Math.sin((λ2 - λ1) / 2), 2),
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
         A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
      const y =
         A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
      const z = A * Math.sin(φ1) + B * Math.sin(φ2);
      pts.push([
         toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))),
         toDeg(Math.atan2(y, x)),
      ]);
   }
   return pts;
}

// =============================================================================
// MAP: Leaflet + Mapbox — great circle route
// CDN required: Leaflet CSS + JS (connect from your HTML)
// Replace YOUR_MAPBOX_TOKEN with your actual Mapbox public token
// =============================================================================
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
            '© <a href="https://www.mapbox.com/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
   ).addTo(map);

   // Custom red drop-pin icon
   const redIcon = L.divIcon({
      className: "",
      html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="40"><path fill="#e53935" stroke="#fff" stroke-width="1" d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0zm0 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/></svg>`,
      iconSize: [28, 40],
      iconAnchor: [14, 40],
      popupAnchor: [0, -40],
   });

   L.marker([fLat, fLng], { icon: redIcon }).addTo(map);
   L.marker([tLat, tLng], { icon: redIcon }).addTo(map);

   // Draw great circle arc
   const arcPoints = greatCirclePoints(fLat, fLng, tLat, tLng, 120);
   L.polyline(arcPoints, {
      color: "#1565C0",
      weight: 2.5,
      opacity: 1,
   }).addTo(map);

   // Fit map view to show both markers
   map.fitBounds(
      [
         [fLat, fLng],
         [tLat, tLng],
      ],
      { padding: [50, 50] },
   );
}

// =============================================================================
// MAP: Airport mini-maps (Leaflet + Esri satellite — free, no API key needed)
// =============================================================================
function initAirportMiniMaps(mapsData) {
   if (typeof L === "undefined") return;

   const redIcon = L.divIcon({
      className: "",
      html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="20" height="28"><path fill="#e53935" stroke="#fff" stroke-width="1" d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0zm0 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/></svg>`,
      iconSize: [20, 28],
      iconAnchor: [10, 28],
   });

   mapsData.forEach(function (item) {
      const el = document.getElementById(item.id);
      if (!el) return;

      const miniMap = L.map(item.id, {
         center: [item.lat, item.lng],
         zoom: 15,
         zoomControl: true,
         // Safari fix: scrollWheelZoom & dragging disabled to prevent
         // scroll trap on Mac Safari trackpad / iOS touch scroll.
         scrollWheelZoom: false,
         dragging: false,
         doubleClickZoom: false,
         attributionControl: false,
      });

      // Esri World Imagery — free satellite tiles, no API key required
      L.tileLayer(
         "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
         { attribution: "Esri" },
      ).addTo(miniMap);

      L.marker([item.lat, item.lng], { icon: redIcon }).addTo(miniMap);
   });
}

document.addEventListener("DOMContentLoaded", () => {
   // Inject loader into the page
   const loaderEl = document.createElement("div");
   loaderEl.className = "adi_page_loader";
   loaderEl.innerHTML = `<div class="adi_loader_spinner"></div>`;
   document.body.appendChild(loaderEl);

   // ─── Inject Passenger Edit Modal ────────────────────────────
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
         const max = apiResponseData?.max_pax || 99;
         openPaxModal(curPax, max);
      }
   });

   fetchAircraftDetail();
});

// Remove price blur on logout (same as search_result.js)
window.addEventListener("userLoggedOut", () => {
   document.querySelectorAll(".adj_card_price").forEach((el) => {
      el.style.filter = "";
   });
});

// Re-apply price blur immediately on login (no reload needed)
window.addEventListener("userLoggedIn", () => {
   if (apiResponseData?.blur_pricing === true) {
      document
         .querySelectorAll(
            ".adj_card_price, .adi_info_price span, .adi_estimate_value",
         )
         .forEach((el) => {
            el.style.filter = "blur(5px)";
         });
   }
});
