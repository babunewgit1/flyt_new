/*
=====================================================================
    !custom_request.js — Connects "Create Aircraft Request" for FLYT.com
=====================================================================
*/

// =============================================================================
// EXPLORE MODAL — open/close
// =============================================================================
const modalBtn = document.querySelectorAll(".explore");
const popModalClose = document.querySelectorAll(".popx_close");

modalBtn.forEach((btn) => {
   btn.addEventListener("click", function (e) {
      e.preventDefault();
      const item = btn.closest(".cadi_item_unit");
      if (!item) return;
      const modal = item.querySelector(".car_popup_wrapper");
      if (modal) modal.style.display = "flex";
   });
});

popModalClose.forEach((closeItem) => {
   closeItem.addEventListener("click", function () {
      closeItem.closest(".car_popup_wrapper").style.display = "none";
   });
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

// Global store for API response data
let crData = null;

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

   // ── Sync checkboxes → selected_item display ───────────────────
   const selectedItemDiv = document.querySelector(".selected_item");
   if (selectedItemDiv) {
      document.querySelectorAll(".checkbox-input").forEach((checkbox) => {
         checkbox.addEventListener("change", () => {
            const checked = document.querySelectorAll(
               ".checkbox-input:checked",
            );
            if (checked.length === 0) {
               selectedItemDiv.innerHTML = "No class selected";
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
   `;

   // Init Leaflet map
   const mapFromLat = firstLeg.mobile_app_from_latitude_number || 0;
   const mapFromLng = firstLeg.mobile_app_from_longitude_number || 0;
   const mapToLat = firstLeg.mobile_app_to_latitude_number || 0;
   const mapToLng = firstLeg.mobile_app_to_longitude_number || 0;
   initLeafletMap(mapFromLat, mapFromLng, mapToLat, mapToLng);
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
// MAIN — Fetch data and render
// =============================================================================
async function initCustomRequest() {
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

      // Render Right Column (map)
      renderRightColumn(crData);

      // Init passenger edit modal
      initPassengerModal();
   } catch (error) {
      console.error("Custom Request Error:", error);
   }
}

// Fire on DOM ready
initCustomRequest();
