/* =============================================================================
   !script.js — Connects to the Home Page and Aircraft Search Page
   =============================================================================
   Implemented Features:
   1. Algolia Airport Search
      - Real-time airport autocomplete using Algolia search index ("Airports")
      - Debounced input handler to reduce unnecessary API calls
      - Renders search result dropdown with airport name, ICAO/IATA/FAA code
      - Handles result selection: fills input, stores portid, shortcode, cityname
      - Clears results when clicking outside the search wrapper

   2. Interactive Date & Time Calendar Widget
      - Supports both One-Way and Round Trip modes
      - Dual-month calendar view with month navigation (prev/next)
      - Date selection with range highlighting for round trips
      - Past dates and invalid return dates are disabled
      - Departure and Return time pickers with AM/PM toggle
      - Time dropdown list with scrollable options
      - Confirm button validates time conflicts on same-day round trips
      - Mobile-responsive: calendar opens as full-screen overlay on small screens
      - Clear button resets all selections
      - Animated open/close transitions

   3. Dynamic Pricing on Calendar
      - Fetches pricing data from external API based on route & passengers
      - Displays estimated price per day on calendar date cells
      - Color-coded pricing: green (standard), orange (international fee), red (peak/priority)
      - Loading skeleton shown while pricing data is being fetched
      - Price disclaimer shown when pricing data is available

   4. Session Storage — Form Submission
      - On Search button click, validates all required fields (airports, date, pax)
      - Saves One-Way and Round Trip form data to sessionStorage as "storeData"
      - Converts 12-hour time to 24-hour format and builds Unix timestamps
      - Redirects to /aircraft page after saving data
      - Shows toast notification if form is incomplete
   ============================================================================= */

// Initialize Algolia search
const searchClient = algoliasearch(
   "ZSPO7HB4MN",
   "2a3621a18dca4f1fb757e9ddaea72440",
);
const index = searchClient.initIndex("Airports");

function debounce(func, delay) {
   let timeout;
   return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
   };
}

function escapeHTML(str) {
   const div = document.createElement("div");
   div.appendChild(document.createTextNode(str));
   return div.innerHTML;
}

const handleInput = debounce(function (event) {
   const input = event.target;
   if (!input.classList.contains("algolio_input")) return;
   const query = input.value.trim();
   const eminputBlock = input.closest(".eminputblock");
   const resultsContainer = eminputBlock.querySelector(".search-results");
   if (!resultsContainer) {
      console.warn("No .search-results container found for the input.");
      return;
   }

   if (query.length === 0) {
      resultsContainer.innerHTML = "";
      resultsContainer.style.display = "none";
      return;
   }

   // Perform Algolia search
   index
      .search(query)
      .then(({ hits }) => {
         if (hits.length > 0) {
            resultsContainer.innerHTML = hits
               .map(
                  (hit) =>
                     `<div class="port" tabindex="0">
              <div class="emfieldnamewrapper">
                <img
                  src="https://cdn.prod.website-files.com/6713759f858863c516dbaa19/6739f54808efbe5ead7a23c1_Screenshot_1-removebg-preview.avif"
                  alt="Location Icon"
                />
                <p class="emfieldname">${escapeHTML(hit["All Fields"])}</p>
                <p class="uniqueid" style="display:none">${escapeHTML(hit["unique id"])}</p>
                <p class="shortcode">${
                   hit["ICAO Code"]
                      ? escapeHTML(hit["ICAO Code"])
                      : hit["IATA Code"]
                        ? escapeHTML(hit["IATA Code"])
                        : hit["FAA Code"]
                          ? escapeHTML(hit["FAA Code"])
                          : ""
                }</p>
                <p class="cityname" style="display:none">${escapeHTML(hit["AirportCity"])}</p>
              </div>
            </div>`,
               )
               .join("");
            resultsContainer.style.display = "block";
         } else {
            resultsContainer.innerHTML =
               "<p style='padding:10px'>No results found.</p>";
            resultsContainer.style.display = "block";
         }
      })
      .catch((err) => {
         console.error("Algolia search error:", err);
         resultsContainer.innerHTML = "<p>Error fetching results.</p>";
         resultsContainer.style.display = "block";
      });
}, 300);

// Function to handle click events on search results
function handleClick(event) {
   const portElement = event.target.closest(".port");
   if (portElement) {
      const emfieldname = portElement.querySelector(".emfieldname").textContent;
      const uniqueid = portElement.querySelector(".uniqueid").textContent;
      const shortcode = portElement.querySelector(".shortcode").textContent;
      const citycode = portElement.querySelector(".cityname").textContent;

      // Find the corresponding input and .portid
      const eminputBlock = portElement.closest(".eminputblock");
      const input = eminputBlock.querySelector(".algolio_input");
      const portidElement = eminputBlock.querySelector(".portid");
      const shortElement = eminputBlock.querySelector(".airportshort");
      const airportCityName = eminputBlock.querySelector(".airportcity");
      input.value = emfieldname;
      portidElement.textContent = uniqueid;
      shortElement.textContent = shortcode;
      airportCityName.textContent = citycode;
      const resultsContainer = eminputBlock.querySelector(".search-results");
      resultsContainer.innerHTML = "";
      resultsContainer.style.display = "none";
   } else {
      // Handle cross icon click
      const crossIcon = event.target.closest(".cross_input_icon");
      if (crossIcon) {
         const eminputBlock = crossIcon.closest(".eminputblock");
         if (eminputBlock) {
            const input = eminputBlock.querySelector(".algolio_input");
            const portid = eminputBlock.querySelector(".portid");
            const airportshort = eminputBlock.querySelector(".airportshort");
            const airportcity = eminputBlock.querySelector(".airportcity");
            const resultsContainer =
               eminputBlock.querySelector(".search-results");

            if (input) {
               input.value = "";
               input.focus();
            }
            if (portid) portid.textContent = "";
            if (airportshort) airportshort.textContent = "";
            if (airportcity) airportcity.textContent = "";
            if (resultsContainer) {
               resultsContainer.innerHTML = "";
               resultsContainer.style.display = "none";
            }
            eminputBlock.classList.remove("displayx");
         }
      }
   }
}

// Function to attach event listeners to a given .algolio_wrapper
function attachListeners(algolioWrapper) {
   algolioWrapper.addEventListener("input", handleInput);

   // Listener for toggling cross icon visibility
   algolioWrapper.addEventListener("input", function (event) {
      const input = event.target;
      if (input.classList.contains("algolio_input")) {
         const eminputBlock = input.closest(".eminputblock");
         if (eminputBlock) {
            if (input.value.trim() !== "") {
               eminputBlock.classList.add("displayx");
            } else {
               eminputBlock.classList.remove("displayx");
            }
         }
      }
   });

   algolioWrapper.addEventListener("click", handleClick);

   algolioWrapper.addEventListener("focusout", function (event) {
      setTimeout(() => {
         const relatedTarget = event.relatedTarget;

         if (!relatedTarget || !algolioWrapper.contains(relatedTarget)) {
            const allResults =
               algolioWrapper.querySelectorAll(".search-results");
            allResults.forEach((resultsContainer) => {
               resultsContainer.innerHTML = "";
               resultsContainer.style.display = "none";
            });
         }
      }, 100);
   });
}

// Select all existing .algolio_wrapper elements and attach listeners
const algolioWrappers = document.querySelectorAll(".algolio_wrapper");
algolioWrappers.forEach(attachListeners);

// Hide search results when clicking outside any .algolio_wrapper
document.addEventListener("click", function (event) {
   algolioWrappers.forEach((algolioWrapper) => {
      const isClickInside = algolioWrapper.contains(event.target);

      if (!isClickInside) {
         const allResults = algolioWrapper.querySelectorAll(".search-results");
         allResults.forEach((resultsContainer) => {
            resultsContainer.innerHTML = "";
            resultsContainer.style.display = "none";
         });
      }
   });
});

// Clear inputs on page load
document.addEventListener("DOMContentLoaded", function () {
   const inputs = document.querySelectorAll(".algolio_input");
   inputs.forEach((input) => {
      input.value = "";
      const eminputBlock = input.closest(".eminputblock");
      if (eminputBlock) {
         eminputBlock.classList.remove("displayx");
         const portid = eminputBlock.querySelector(".portid");
         const airportshort = eminputBlock.querySelector(".airportshort");
         const airportcity = eminputBlock.querySelector(".airportcity");
         if (portid) portid.textContent = "";
         if (airportshort) airportshort.textContent = "";
         if (airportcity) airportcity.textContent = "";
      }
   });
});

/* --- Calendar Logic --- */
document.addEventListener("DOMContentLoaded", () => {
   const widget = document.getElementById("calendar-widget");
   const inputs = document.querySelectorAll(
      ".multi-input-container, .form_input_multipul",
   );
   const leftMonthLabel = document.querySelector("#month-left .month-label");
   const rightMonthLabel = document.querySelector("#month-right .month-label");
   const leftDaysContainer = document.getElementById("days-left");
   const rightDaysContainer = document.getElementById("days-right");
   const prevBtn = document.querySelector(".prev-month");
   const nextBtns = document.querySelectorAll(".next-month");
   const timeListDep = document.getElementById("time-list-dep");
   const timeListRet = document.getElementById("time-list-ret");
   const confirmBtn = document.getElementById("confirm-selection");
   const closeBtn = document.getElementById("close-calendar");
   const clearBtn = document.getElementById("clear-selection");

   // New Time Controls
   const timeSectionRet = document.getElementById("time-section-ret");
   const timeDisplayDep = document.getElementById("time-display-dep");
   const timeDisplayRet = document.getElementById("time-display-ret");
   const ampmDep = document.getElementById("ampm-dep");
   const ampmRet = document.getElementById("ampm-ret");

   let currentInput = null;
   let viewingDate = new Date();

   // State
   let isRoundTrip = false;
   let selectedDateDep = null;
   let selectedDateRet = null;

   // Time State objects
   let timeDep = { h: "12", m: "00", ampm: "AM" };
   let timeRet = { h: "12", m: "00", ampm: "AM" };

   let activeTimeTarget = "dep";

   const monthNames = [
      "JANUARY",
      "FEBRUARY",
      "MARCH",
      "APRIL",
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER",
      "NOVEMBER",
      "DECEMBER",
   ];

   function updateRealTimeUI(showErrorToast = false) {
      if (!currentInput) return;

      const formatTime = (t) => `${t.h}:${t.m} ${t.ampm}`;
      const formatDate = (d) =>
         d
            ? d.toLocaleDateString("en-US", {
                 month: "short",
                 day: "numeric",
                 year: "numeric",
              })
            : "";

      // Time Validation Helper
      function getMinutes(t) {
         let h = parseInt(t.h);
         if (t.ampm === "PM" && h !== 12) h += 12;
         if (t.ampm === "AM" && h === 12) h = 0;
         return h * 60 + parseInt(t.m);
      }

      if (isRoundTrip) {
         // --- Round Trip Update ---
         const roundPlaceholder =
            currentInput.querySelector(".round_placeholder");
         const depDateEl = currentInput.querySelector(
            ".round_trip_departure_date",
         );
         const depTimeEl = currentInput.querySelector(
            ".round_trip_departure_time",
         );
         const retDateEl = currentInput.querySelector(
            ".round_trip_return_date",
         );
         const retTimeEl = currentInput.querySelector(
            ".round_trip_return_time",
         );

         if (selectedDateDep) {
            // 1. Hide Global Placeholder
            if (roundPlaceholder) roundPlaceholder.style.display = "none";

            // 2. Show Departure Date & Time
            if (depDateEl) {
               depDateEl.style.display = "block";
               depDateEl.textContent = formatDate(selectedDateDep);
               depDateEl.classList.remove("roundtrip_date_placeholder");
            }
            if (depTimeEl) depTimeEl.textContent = formatTime(timeDep);

            // 3. Handle Return Section
            if (selectedDateRet) {
               // Robust Date Comparison
               const isSameDay =
                  selectedDateDep.getFullYear() ===
                     selectedDateRet.getFullYear() &&
                  selectedDateDep.getMonth() === selectedDateRet.getMonth() &&
                  selectedDateDep.getDate() === selectedDateRet.getDate();

               if (isSameDay && getMinutes(timeRet) <= getMinutes(timeDep)) {
                  // Invalid Time State: Show Error using Toast ONLY if user is interacting with Time
                  if (showErrorToast && window.toast && window.toast.error) {
                     window.toast.error(
                        "Return time must be after departure time.",
                     );
                  } else if (showErrorToast) {
                     console.error("Return time must be after departure time.");
                  }

                  if (retTimeEl) {
                     // Clear the time display to indicate invalid selection
                     retTimeEl.textContent = "";
                  }
               } else {
                  if (retTimeEl) {
                     retTimeEl.textContent = formatTime(timeRet);
                  }
               }

               if (retDateEl) {
                  retDateEl.style.display = "block";
                  retDateEl.textContent = formatDate(selectedDateRet);
               }
            } else {
               if (retDateEl) {
                  retDateEl.style.display = "block";
                  retDateEl.textContent = "Return date";
               }
               if (retTimeEl) retTimeEl.textContent = "";
            }
         } else {
            if (roundPlaceholder) roundPlaceholder.style.display = "block";

            if (depDateEl) {
               depDateEl.style.display = "none";
               depDateEl.textContent = "";
            }
            if (depTimeEl) depTimeEl.textContent = "";

            if (retDateEl) {
               retDateEl.style.display = "none";
               retDateEl.textContent = "";
            }
            if (retTimeEl) retTimeEl.textContent = "";
         }

         // Update dataset
         if (selectedDateDep)
            currentInput.dataset.depDate = selectedDateDep.toISOString();

         currentInput.dataset.depTime = JSON.stringify(timeDep);

         let isRetValid = true;
         if (
            selectedDateDep &&
            selectedDateRet &&
            selectedDateDep.getTime() === selectedDateRet.getTime()
         ) {
            if (getMinutes(timeRet) <= getMinutes(timeDep)) {
               isRetValid = false;
            }
         }

         if (selectedDateRet)
            currentInput.dataset.retDate = selectedDateRet.toISOString();
         if (isRetValid) {
            currentInput.dataset.retTime = JSON.stringify(timeRet);
         } else {
            delete currentInput.dataset.retTime;
         }
      } else {
         // --- One Way Update ---
         const oneWayDate = currentInput.querySelector(".one_way_date");
         const oneWayTime = currentInput.querySelector(".one_way_time");
         const dateField = currentInput.querySelector(".date-input"); // Legacy fallback
         const timeField = currentInput.querySelector(".time-input"); // Legacy fallback

         const dStr = formatDate(selectedDateDep);
         const tStr = formatTime(timeDep);

         if (oneWayDate && selectedDateDep) {
            oneWayDate.textContent = dStr;
            oneWayDate.classList.remove("one_way_date_placeholder");
            if (oneWayTime) oneWayTime.textContent = tStr;
         } else if (oneWayDate) {
            oneWayDate.textContent = "Date and time";
            oneWayDate.classList.add("one_way_date_placeholder");
            if (oneWayTime) oneWayTime.textContent = "";
         }

         if (dateField && selectedDateDep) dateField.value = dStr;
         if (timeField && selectedDateDep) timeField.value = tStr;

         if (selectedDateDep)
            currentInput.dataset.selectedDate = selectedDateDep.toISOString();
         currentInput.dataset.selectedHour = timeDep.h;
         currentInput.dataset.selectedMinute = timeDep.m;
         currentInput.dataset.selectedAmPm = timeDep.ampm;
      }
   }

   function updateTimeControls() {
      // Display Texts
      if (timeDisplayDep)
         timeDisplayDep.textContent = `${timeDep.h}:${timeDep.m}`;
      if (timeDisplayRet)
         timeDisplayRet.textContent = `${timeRet.h}:${timeRet.m}`;

      // AM/PM Active States
      if (ampmDep) {
         Array.from(ampmDep.children).forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.val === timeDep.ampm);
         });
      }
      if (ampmRet) {
         Array.from(ampmRet.children).forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.val === timeRet.ampm);
         });
      }
   }

   // --- Time List Generation ---
   function generateTimeList(listEl, timeObj) {
      if (!listEl) return;
      listEl.innerHTML = "";
      const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

      hours.forEach((h) => {
         ["00", "30"].forEach((m) => {
            const timeStr = `${String(h).padStart(2, "0")}:${m}`;
            const div = document.createElement("div");
            div.className = "time-option";
            div.textContent = timeStr;

            // Check Selection
            if (timeStr === `${timeObj.h}:${timeObj.m}`) {
               div.classList.add("selected");
            }

            div.onclick = (e) => {
               e.stopPropagation();
               timeObj.h = String(h).padStart(2, "0");
               timeObj.m = m;

               updateTimeControls();
               updateRealTimeUI(true); // Update DOM immediately
               listEl.classList.remove("show");
            };
            listEl.appendChild(div);
         });
      });
   }

   // --- Pricing & API Logic ---
   let pricingData = null;
   let pricingLoading = false;

   async function fetchPricingData() {
      // 1. Check Auth
      if (typeof Cookies === "undefined") return;
      const token = Cookies.get("authToken");
      if (!token) {
         pricingData = null;
         return;
      }

      // 2. Get Airport IDs
      if (!currentInput) return;
      const form = currentInput.closest(".action_form");
      if (!form) return;

      const blocks = form.querySelectorAll(".eminputblock");
      if (blocks.length < 2) return;

      const depPortId = blocks[0].querySelector(".portid")?.textContent;
      const arrPortId = blocks[1].querySelector(".portid")?.textContent;

      if (!depPortId || !arrPortId) return;

      // 3. Fetch
      pricingLoading = true;
      pricingData = null; // Clear old data
      renderCalendar();

      try {
         const url =
            "https://operators-dashboard.bubbleapps.io/api/1.1/wf/webflow_datepicker_flyt";

         const bodyData = {
            departure_airport_id: depPortId,
            arrival_airport_id: arrPortId,
            currency_code:
               JSON.parse(sessionStorage.getItem("currency"))?.api_currency ||
               "USD",
         };

         const res = await fetch(url, {
            method: "POST",
            headers: {
               Authorization: `Bearer ${token}`,
               "Content-Type": "application/json",
            },
            body: JSON.stringify(bodyData),
         });

         const json = await res.json();
         if (json.status === "success") {
            pricingData = json.response;

            console.log(pricingData);
            // Log Peak Days
            if (pricingData.peak_start_dates && pricingData.peak_end_dates) {
               console.log("=== Peak Days ===");
               for (let i = 0; i < pricingData.peak_start_dates.length; i++) {
                  const start = new Date(pricingData.peak_start_dates[i]);
                  const end = new Date(pricingData.peak_end_dates[i]);
                  console.log(
                     "Peak Range " +
                        (i + 1) +
                        ": " +
                        start.toLocaleDateString() +
                        " to " +
                        end.toLocaleDateString(),
                  );
               }
            } else {
               console.log("No peak days found in pricing data.");
            }
            // Pricing Validation Rule:
            // If One Way and outbound is 0/empty -> no prices
            // If Round Trip and (outbound is 0 OR return is 0) -> no prices
            const outPrice = pricingData.light_outbound_leg_price_usd;
            const retPrice = pricingData.light_return_leg_price_usd;

            if (!outPrice) pricingData = null;
            if (isRoundTrip && (!outPrice || !retPrice)) pricingData = null;
         } else {
            pricingData = null;
         }
      } catch (err) {
         console.error("Pricing API Error:", err);
         pricingData = null;
      } finally {
         pricingLoading = false;
         renderCalendar(); // Re-render once data is back
      }
   }

   function calculateDailyPrice(date, mode) {
      if (!pricingData) return null;

      // Mode: 'outbound' or 'return'
      const basePrice =
         mode === "return"
            ? pricingData.light_return_leg_price_usd
            : pricingData.light_outbound_leg_price_usd;

      if (!basePrice) return null;

      let finalPrice = basePrice;
      let color = "#38aa06"; // Green default
      let hasIntlFee = false;
      let hasPeakOrPriority = false;

      // 1. Peak Days
      // Check if date timestamp is within any range
      // Date object timestamp is local? API dates seem to be timestamps (ms).
      // We should normalize 'date' to start of day for cleaner comparison or just use time.
      let isPeak = false;
      if (pricingData.peak_start_dates && pricingData.peak_end_dates) {
         // Normalize calendar date to local start-of-day timestamp
         const dateOnly = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
         ).getTime();

         for (let i = 0; i < pricingData.peak_start_dates.length; i++) {
            // Convert API UTC timestamps to local start-of-day for fair comparison
            const startUTC = new Date(pricingData.peak_start_dates[i]);
            const startLocal = new Date(
               startUTC.getFullYear(),
               startUTC.getMonth(),
               startUTC.getDate(),
            ).getTime();

            const endUTC = new Date(pricingData.peak_end_dates[i]);
            const endLocal = new Date(
               endUTC.getFullYear(),
               endUTC.getMonth(),
               endUTC.getDate(),
            ).getTime();

            if (dateOnly >= startLocal && dateOnly <= endLocal) {
               isPeak = true;
               break;
            }
         }
      }

      if (isPeak) {
         console.log("Peak Date Found:", date);
         finalPrice += basePrice * (pricingData.peak_day_pct || 0);
         hasPeakOrPriority = true;
      }

      // 2. International Fee
      if (pricingData["is_international?"]) {
         finalPrice += basePrice * (pricingData.international_fee_pct || 0);
         hasIntlFee = true;
      }

      // 3. Priority Booking Fee
      // Calculate hours diff from NOW to Flight Date (start of day? or specific time?)
      // Since user hasn't picked time yet, usually we assume start of day or strict window?
      // Let's assume Flight Date starts at 00:00 or similar?
      // User requirement: "apply priority_fee_pct if departure is within X hours"
      // We compare 'date' (which is selected date 00:00 usually?) vs 'now'.
      // Note: 'date' in render loop is new Date(year, month, i).

      const now = new Date();
      const diffMs = date - now;
      const diffHrs = diffMs / (1000 * 60 * 60);

      const limitHrs = pricingData["is_international?"]
         ? pricingData.international_priority_window_hrs || 96
         : pricingData.domestic_priority_window_hrs || 72;

      if (diffHrs < limitHrs && diffHrs > -24) {
         // Apply if within window (and not way in past)
         finalPrice += basePrice * (pricingData.priority_fee_pct || 0);
         hasPeakOrPriority = true;
      }

      // Color Logic
      if (hasPeakOrPriority) {
         color = "#d22e2e"; // Red
      } else if (hasIntlFee) {
         color = "#e39000"; // Orange
      } else {
         color = "#38aa06"; // Green
      }

      return { price: finalPrice, color };
   }

   // --- Calendar Rendering ---
   function renderCalendar() {
      if (!leftMonthLabel) return;

      // Ensure Disclaimer Exists
      let disclaimer = widget.querySelector(".price-disclaimer");
      if (!disclaimer) {
         disclaimer = document.createElement("div");
         disclaimer.className = "price-disclaimer";
         disclaimer.innerText =
            "Prices shown are estimates. Final pricing, availability, and applicable fees are confirmed after submitting your search.";
         disclaimer.style.display = "none";
      }

      // Append to Widget
      if (disclaimer.parentNode !== widget) widget.appendChild(disclaimer);

      // State Management
      if (pricingLoading) {
         disclaimer.style.display = "none";
      } else {
         if (pricingData) {
            disclaimer.style.display = "block";
         } else {
            disclaimer.style.display = "none";
         }
      }

      // Show/hide Clear button based on date selection
      if (clearBtn) {
         clearBtn.closest(".calendar-bottom-bar").style.display =
            selectedDateDep ? "block" : "none";
      }

      renderMonth(viewingDate, leftMonthLabel, leftDaysContainer);

      const nextMonthDate = new Date(viewingDate);
      nextMonthDate.setMonth(viewingDate.getMonth() + 1);
      renderMonth(nextMonthDate, rightMonthLabel, rightDaysContainer);

      // Update Prev Button State
      if (prevBtn) {
         const today = new Date();
         // Compare YYYY-MM
         const currentMonthStart = new Date(
            today.getFullYear(),
            today.getMonth(),
            1,
         );
         const viewingMonthStart = new Date(
            viewingDate.getFullYear(),
            viewingDate.getMonth(),
            1,
         );

         if (viewingMonthStart <= currentMonthStart) {
            prevBtn.classList.add("disabled");
            prevBtn.style.opacity = "0.3";
            prevBtn.style.pointerEvents = "none";
         } else {
            prevBtn.classList.remove("disabled");
            prevBtn.style.opacity = "";
            prevBtn.style.pointerEvents = "";
         }
      }
   }

   function renderMonth(date, labelEl, daysEl) {
      if (!daysEl) return;
      const year = date.getFullYear();
      const month = date.getMonth();

      labelEl.textContent = `${monthNames[month]} ${year}`;
      daysEl.innerHTML = "";

      const firstDayIndex = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < firstDayIndex; i++) {
         const empty = document.createElement("div");
         empty.className = "day empty";
         daysEl.appendChild(empty);
      }

      for (let i = 1; i <= daysInMonth; i++) {
         const dayEl = document.createElement("div");
         dayEl.className = "day";

         // Price Tag Logic
         const currentDate = new Date(year, month, i);
         // Determine Mode:
         // If RoundTrip and selectedDateDep is SET (and we are NOT just editing Dep?), show Return Price?
         // Logic: if selectedDateDep is set, we are likely picking Return, so show Return prices.
         // Unless we clicked 'Departure' input specifically to re-edit?
         // Assuming sequential flow:
         let mode = "outbound";
         if (isRoundTrip && selectedDateDep && !selectedDateRet) {
            mode = "return";

            // If we are seeing dates BEFORE departure, maybe no price?
            // Or price is return leg?
         }

         let priceHtml = "";

         let isFuture = currentDate >= today;

         if (isFuture) {
            if (pricingLoading) {
               priceHtml = `<div class="date-loader"></div>`;
            } else if (pricingData) {
               const priceObj = calculateDailyPrice(currentDate, mode);
               if (priceObj) {
                  const fmtPrice = Math.round(priceObj.price).toLocaleString();
                  priceHtml = `<span class="price-tag" style="color: ${priceObj.color};">${fmtPrice}</span>`;
               }
            }
         }

         dayEl.innerHTML = `${i} ${priceHtml}`;

         // Selection Logic
         let isSelected = false;
         // Check Departure
         if (
            selectedDateDep &&
            selectedDateDep.getDate() === i &&
            selectedDateDep.getMonth() === month &&
            selectedDateDep.getFullYear() === year
         ) {
            isSelected = true;
         }
         // Check Return
         if (
            isRoundTrip &&
            selectedDateRet &&
            selectedDateRet.getDate() === i &&
            selectedDateRet.getMonth() === month &&
            selectedDateRet.getFullYear() === year
         ) {
            isSelected = true;
         }

         // Range Highlight (Optional but good)
         if (
            isRoundTrip &&
            selectedDateDep &&
            selectedDateRet &&
            currentDate > selectedDateDep &&
            currentDate < selectedDateRet
         ) {
            dayEl.classList.add("in-range"); // Add CSS for this later if desired
         }

         if (isSelected) dayEl.classList.add("selected");

         // Disable Past Dates

         // Disable Return dates before Departure
         let isDisabled = currentDate < today;
         if (
            mode === "return" &&
            selectedDateDep &&
            currentDate < selectedDateDep
         ) {
            isDisabled = true;
         }

         if (isDisabled) {
            dayEl.classList.add("disabled");
            dayEl.style.opacity = "0.3";
            dayEl.style.pointerEvents = "none";
         } else {
            dayEl.onclick = (e) => {
               e.stopPropagation();
               const clickedDate = new Date(year, month, i);

               if (isRoundTrip) {
                  // Round Trip Logic:
                  if (!selectedDateDep) {
                     selectedDateDep = clickedDate;
                  } else if (!selectedDateRet) {
                     if (clickedDate < selectedDateDep) {
                        selectedDateDep = clickedDate; // Retroactive move start
                     } else if (
                        clickedDate.getTime() === selectedDateDep.getTime()
                     ) {
                        // Same day round trip? Allow it.
                        selectedDateRet = clickedDate;
                     } else {
                        selectedDateRet = clickedDate;
                     }
                  } else {
                     // Reset triggered
                     selectedDateDep = clickedDate;
                     selectedDateRet = null;
                  }
               } else {
                  // One Way
                  selectedDateDep = clickedDate;
               }

               renderCalendar();
               updateRealTimeUI();
            };
         }

         daysEl.appendChild(dayEl);
      }
   }

   // --- Handlers ---
   if (prevBtn)
      prevBtn.onclick = (e) => {
         e.stopPropagation();
         const today = new Date();
         // Only allow going back if viewingDate is ahead of current month
         if (
            viewingDate.getFullYear() > today.getFullYear() ||
            (viewingDate.getFullYear() === today.getFullYear() &&
               viewingDate.getMonth() > today.getMonth())
         ) {
            viewingDate.setMonth(viewingDate.getMonth() - 1);
            renderCalendar();
         }
      };

   nextBtns.forEach((btn) => {
      btn.onclick = (e) => {
         e.stopPropagation();
         viewingDate.setMonth(viewingDate.getMonth() + 1);
         renderCalendar();
      };
   });

   // AM/PM setup helper
   function setupAmPm(wrapper, timeObj) {
      if (!wrapper) return;
      const btns = wrapper.querySelectorAll(".ampm-btn");
      btns.forEach((btn) => {
         btn.onclick = (e) => {
            e.stopPropagation();
            timeObj.ampm = btn.dataset.val;
            updateTimeControls();
            updateRealTimeUI(true);
         };
      });
   }
   setupAmPm(ampmDep, timeDep);
   setupAmPm(ampmRet, timeRet);

   // Time Display Click (Open Dropdown) logic helper
   function setupTimeDisplay(displayEl, listEl, timeObj) {
      if (!displayEl) return;
      displayEl.onclick = (e) => {
         e.stopPropagation();

         // Close others
         if (timeListDep) timeListDep.classList.remove("show");
         if (timeListRet) timeListRet.classList.remove("show");

         generateTimeList(listEl, timeObj);
         if (listEl) listEl.classList.add("show");
      };
   }
   setupTimeDisplay(timeDisplayDep, timeListDep, timeDep);
   setupTimeDisplay(timeDisplayRet, timeListRet, timeRet);

   // Input Click -> Open Widget
   inputs.forEach((input) => {
      input.addEventListener("click", (e) => {
         if (widget && widget.contains(e.target)) return;
         e.stopPropagation();

         currentInput = input;

         // Detect Mode
         const searchForm = input.closest(".action_form"); // .one_way_search or .round_trip_search
         isRoundTrip =
            searchForm && searchForm.classList.contains("round_trip_search");

         // UI Adjustment
         if (timeSectionRet) {
            timeSectionRet.style.display = isRoundTrip ? "block" : "none";
         }

         // Append Widget
         if (widget) {
            input.appendChild(widget);
            widget.style.top = "";
            widget.style.left = "";
            widget.classList.remove("active");
            void widget.offsetWidth;
            widget.classList.add("active");
            document.body.classList.add("datepicker-open");

            // FETCH PRICING DATA HERE
            fetchPricingData();
         }

         inputs.forEach((i) => i.classList.remove("active-input"));
         input.classList.add("active-input");

         if (currentInput.dataset.depDate) {
            selectedDateDep = new Date(currentInput.dataset.depDate);
         } else if (currentInput.dataset.selectedDate) {
            selectedDateDep = new Date(currentInput.dataset.selectedDate);
         } else {
            selectedDateDep = null;
         }

         if (currentInput.dataset.retDate)
            selectedDateRet = new Date(currentInput.dataset.retDate);
         else selectedDateRet = null;

         // Restore Time State
         if (currentInput.dataset.depTime) {
            // Round Trip Format
            try {
               const data = JSON.parse(currentInput.dataset.depTime);
               timeDep.h = data.h;
               timeDep.m = data.m;
               timeDep.ampm = data.ampm;
            } catch (e) {
               console.error("Error parsing depTime", e);
            }
         } else if (currentInput.dataset.selectedHour) {
            // One Way Format (Legacy keys)
            timeDep.h = currentInput.dataset.selectedHour;
            timeDep.m = currentInput.dataset.selectedMinute || "00";
            timeDep.ampm = currentInput.dataset.selectedAmPm || "AM";
         } else {
            // Default if nothing saved
            timeDep.h = "12";
            timeDep.m = "00";
            timeDep.ampm = "AM";
         }

         if (currentInput.dataset.retTime) {
            try {
               const data = JSON.parse(currentInput.dataset.retTime);
               timeRet.h = data.h;
               timeRet.m = data.m;
               timeRet.ampm = data.ampm;
            } catch (e) {
               console.error("Error parsing retTime", e);
            }
         } else {
            timeRet.h = "12";
            timeRet.m = "00";
            timeRet.ampm = "AM";
         }

         viewingDate = selectedDateDep ? new Date(selectedDateDep) : new Date();

         // Re-bind AM/PM handlers to ensure they point to the correct object/properties
         setupAmPm(ampmDep, timeDep);
         setupAmPm(ampmRet, timeRet);

         updateTimeControls();
         renderCalendar();
         updateRealTimeUI(); // Ensure displayed text matches state
      });
   });

   // Close / Confirm Logic
   const closeWidget = () => {
      if (widget) widget.classList.remove("active");
      if (timeListDep) timeListDep.classList.remove("show");
      if (timeListRet) timeListRet.classList.remove("show");
      inputs.forEach((i) => i.classList.remove("active-input"));
      document.body.classList.remove("datepicker-open");
   };

   if (closeBtn)
      closeBtn.onclick = (e) => {
         e.stopPropagation();
         closeWidget();
      };

   // Mobile: close calendar when tapping the backdrop (.calendar-widget) directly
   // On mobile, .calendar-widget is a full-screen overlay — clicking outside the
   // inner .calendar-main closes it.
   if (widget) {
      widget.addEventListener("click", (e) => {
         if (e.target === widget) {
            closeWidget();
         }
      });
   }

   document.addEventListener("click", (e) => {
      if (widget && widget.classList.contains("active")) {
         // Careful not to close if clicking inside widget
         if (
            !widget.contains(e.target) &&
            !Array.from(inputs).includes(e.target)
         ) {
            closeWidget();
         }
      }
      // Dropdown close logic
      // Dropdown close logic
      if (timeListDep && timeListDep.classList.contains("show")) {
         if (
            !timeListDep.contains(e.target) &&
            !timeDisplayDep.contains(e.target)
         ) {
            timeListDep.classList.remove("show");
         }
      }
      if (timeListRet && timeListRet.classList.contains("show")) {
         if (
            !timeListRet.contains(e.target) &&
            timeDisplayRet &&
            !timeDisplayRet.contains(e.target)
         ) {
            timeListRet.classList.remove("show");
         }
      }
   });

   if (clearBtn)
      clearBtn.onclick = (e) => {
         e.stopPropagation();
         // Reset dates
         selectedDateDep = null;
         selectedDateRet = null;
         // Reset times to defaults
         timeDep.h = "12";
         timeDep.m = "00";
         timeDep.ampm = "AM";
         timeRet.h = "12";
         timeRet.m = "00";
         timeRet.ampm = "AM";
         // Clear stored data on the input element
         if (currentInput) {
            delete currentInput.dataset.depDate;
            delete currentInput.dataset.retDate;
            delete currentInput.dataset.depTime;
            delete currentInput.dataset.retTime;
            delete currentInput.dataset.selectedDate;
            delete currentInput.dataset.selectedHour;
            delete currentInput.dataset.selectedMinute;
            delete currentInput.dataset.selectedAmPm;
         }
         updateTimeControls();
         renderCalendar();
         updateRealTimeUI();
      };

   if (confirmBtn)
      confirmBtn.onclick = (e) => {
         e.stopPropagation();
         // Validation?
         if (!selectedDateDep) {
            if (window.toast && window.toast.error)
               window.toast.error("Please select a departure date.");
            else console.error("Please select a departure date.");
            return;
         }
         if (isRoundTrip && !selectedDateRet) {
            if (window.toast && window.toast.error)
               window.toast.error("Please select a return date.");
            else console.error("Please select a return date.");
            return;
         }

         // Validation for Round Trip Time Conflict
         if (isRoundTrip && selectedDateDep && selectedDateRet) {
            const isSameDay =
               selectedDateDep.getFullYear() ===
                  selectedDateRet.getFullYear() &&
               selectedDateDep.getMonth() === selectedDateRet.getMonth() &&
               selectedDateDep.getDate() === selectedDateRet.getDate();

            if (isSameDay) {
               const getMins = (t) => {
                  let h = parseInt(t.h);
                  if (t.ampm === "PM" && h !== 12) h += 12;
                  if (t.ampm === "AM" && h === 12) h = 0;
                  return h * 60 + parseInt(t.m);
               };

               if (getMins(timeRet) <= getMins(timeDep)) {
                  if (window.toast && window.toast.error)
                     window.toast.error(
                        "Return time must be after departure time.",
                     );
                  else
                     console.error("Return time must be after departure time.");
                  return; // STOP here, do not close widget
               }
            }
         }

         updateRealTimeUI();
         closeWidget();
      };

   // Init
   generateTimeList(timeListDep, timeDep);
   generateTimeList(timeListRet, timeRet);
});

// calender price implementation from api.

// ============================================================
// >>>>>>>>  SESSION STORAGE – SAVE FORM DATA ON SUBMIT  <<<<<<<<
// Mirrors the logic from homeform.js so that form data is
// persisted in sessionStorage before navigating to /aircraft.
// ============================================================

// Helper: convert 12-hour time string ("12:00 AM") to 24-hour format ("00:00:00")
function to24HourTime(timeStr) {
   const [time, modifier] = timeStr.split(" ");
   let [hours, minutes] = time.split(":");
   if (modifier === "PM" && hours !== "12") hours = String(Number(hours) + 12);
   if (modifier === "AM" && hours === "12") hours = "00";
   return `${hours.padStart(2, "0")}:${minutes}:00`;
}

document.addEventListener("DOMContentLoaded", function () {
   // ---------- ONE WAY SUBMIT ----------
   const oneWayForm = document.querySelector(".one_way_search");
   if (oneWayForm) {
      const oneWaySubmitBtn = oneWayForm.querySelector(".trip_submit button");
      if (oneWaySubmitBtn) {
         oneWaySubmitBtn.addEventListener("click", function () {
            // Grab departure & arrival blocks by their dedicated class
            const fromBlock = oneWayForm.querySelector(".departure_block");
            const toBlock = oneWayForm.querySelector(".arrival_block");

            const formIdInput =
               fromBlock.querySelector(".airportcity").textContent;
            const toIdInput = toBlock.querySelector(".airportcity").textContent;
            const fromId = fromBlock.querySelector(".portid").textContent;
            const toId = toBlock.querySelector(".portid").textContent;
            const fromShortCode =
               fromBlock.querySelector(".airportshort").textContent;
            const toShortCode =
               toBlock.querySelector(".airportshort").textContent;
            const full_departure_airport_name =
               fromBlock.querySelector(".departure_airport").value;
            const full_arrival_airport_name =
               toBlock.querySelector(".arrival_airport").value;

            // Date & time come from the calendar widget's dataset (ISO format)
            const dateInput = oneWayForm.querySelector(".form_input_multipul");
            let dateAsText = "";
            let timeAsText = "12:00 AM";

            if (dateInput) {
               // Read date from dataset (stored as ISO string by calendar widget)
               const isoDate =
                  dateInput.dataset.selectedDate ||
                  dateInput.dataset.depDate ||
                  "";
               if (isoDate) {
                  const d = new Date(isoDate);
                  const yyyy = d.getFullYear();
                  const mm = String(d.getMonth() + 1).padStart(2, "0");
                  const dd = String(d.getDate()).padStart(2, "0");
                  dateAsText = `${yyyy}-${mm}-${dd}`;
               }

               // Read time from dataset
               if (dateInput.dataset.depTime) {
                  try {
                     const t = JSON.parse(dateInput.dataset.depTime);
                     timeAsText = `${t.h}:${t.m} ${t.ampm}`;
                  } catch (e) {}
               } else if (dateInput.dataset.selectedHour) {
                  const h = dateInput.dataset.selectedHour;
                  const m = dateInput.dataset.selectedMinute || "00";
                  const ap = dateInput.dataset.selectedAmPm || "AM";
                  timeAsText = `${h}:${m} ${ap}`;
               }
            }

            // PAX
            const paxInput = oneWayForm.querySelector(
               ".form_input_pax_input input",
            );
            const pax = paxInput ? paxInput.value : "1";
            const appDate = dateAsText;

            // Build timestamp
            const isoTime = to24HourTime(timeAsText);
            const combinedDateTime = `${dateAsText}T${isoTime}`;
            const dateObject = new Date(combinedDateTime);
            const timeStamp = Math.floor(dateObject.getTime() / 1000);

            // Validate
            if (
               fromId &&
               toId &&
               dateAsText &&
               pax &&
               formIdInput &&
               toIdInput &&
               fromShortCode &&
               toShortCode
            ) {
               const storeData = {
                  way: "one way",
                  fromId,
                  toId,
                  dateAsText,
                  timeAsText,
                  pax,
                  appDate,
                  timeStamp,
                  formIdInput,
                  toIdInput,
                  fromShortCode,
                  toShortCode,
                  full_departure_airport_name,
                  full_arrival_airport_name,
               };

               sessionStorage.setItem("storeData", JSON.stringify(storeData));
               window.location.href = `/aircraft`;
            } else {
               window.toast.error("Please fill up the form properly");
            }
         });
      }
   }

   // ---------- ROUND TRIP SUBMIT ----------
   const roundTripForm = document.querySelector(".round_trip_search");
   if (roundTripForm) {
      const roundTripSubmitBtn = roundTripForm.querySelector(
         ".trip_submit button",
      );
      if (roundTripSubmitBtn) {
         roundTripSubmitBtn.addEventListener("click", function () {
            const fromBlock = roundTripForm.querySelector(".departure_block");
            const toBlock = roundTripForm.querySelector(".arrival_block");

            const formIdInput =
               fromBlock.querySelector(".airportcity").textContent;
            const toIdInput = toBlock.querySelector(".airportcity").textContent;

            // Return leg swaps from ↔ to
            const fromInputReturn =
               toBlock.querySelector(".airportcity").textContent;
            const toInputReturn =
               fromBlock.querySelector(".airportcity").textContent;

            const fromId = fromBlock.querySelector(".portid").textContent;
            const toId = toBlock.querySelector(".portid").textContent;
            const returnFromId = toBlock.querySelector(".portid").textContent;
            const returnToId = fromBlock.querySelector(".portid").textContent;

            const fromShortCode =
               fromBlock.querySelector(".airportshort").textContent;
            const toShortCode =
               toBlock.querySelector(".airportshort").textContent;
            const full_departure_airport_name =
               fromBlock.querySelector(".departure_airport").value;
            const full_arrival_airport_name =
               toBlock.querySelector(".arrival_airport").value;
            const full_return_departure_airport_name =
               toBlock.querySelector(".arrival_airport").value;
            const full_return_arrival_airport_name =
               fromBlock.querySelector(".departure_airport").value;

            // Dates & times from the calendar widget's dataset (ISO format)
            const dateInput = roundTripForm.querySelector(
               ".form_input_multipul",
            );
            let dateAsText = "";
            let returnDateAsText = "";
            let timeAsText = "12:00 AM";
            let timeAsTextReturn = "12:00 AM";

            if (dateInput) {
               // Departure date from dataset
               const isoDepDate = dateInput.dataset.depDate || "";
               if (isoDepDate) {
                  const d = new Date(isoDepDate);
                  const yyyy = d.getFullYear();
                  const mm = String(d.getMonth() + 1).padStart(2, "0");
                  const dd = String(d.getDate()).padStart(2, "0");
                  dateAsText = `${yyyy}-${mm}-${dd}`;
               }

               // Return date from dataset
               const isoRetDate = dateInput.dataset.retDate || "";
               if (isoRetDate) {
                  const d = new Date(isoRetDate);
                  const yyyy = d.getFullYear();
                  const mm = String(d.getMonth() + 1).padStart(2, "0");
                  const dd = String(d.getDate()).padStart(2, "0");
                  returnDateAsText = `${yyyy}-${mm}-${dd}`;
               }

               // Departure time from dataset
               if (dateInput.dataset.depTime) {
                  try {
                     const t = JSON.parse(dateInput.dataset.depTime);
                     timeAsText = `${t.h}:${t.m} ${t.ampm}`;
                  } catch (e) {}
               }

               // Return time from dataset
               if (dateInput.dataset.retTime) {
                  try {
                     const t = JSON.parse(dateInput.dataset.retTime);
                     timeAsTextReturn = `${t.h}:${t.m} ${t.ampm}`;
                  } catch (e) {}
               }
            }

            // PAX
            const paxInput = roundTripForm.querySelector(
               ".form_input_pax_input input",
            );
            const pax = paxInput ? paxInput.value : "1";
            const paxReturn = pax;

            const appDate = dateAsText;
            const appDateReturn = returnDateAsText;

            // Build departure timestamp
            const isoTime = to24HourTime(timeAsText);
            const combinedDateTime = `${dateAsText}T${isoTime}`;
            const dateObject = new Date(combinedDateTime);
            const timeStamp = Math.floor(dateObject.getTime() / 1000);

            // Build return timestamp
            const isoTimeReturn = to24HourTime(timeAsTextReturn);
            const combinedDateTimeReturn = `${returnDateAsText}T${isoTimeReturn}`;
            const dateObjectReturn = new Date(combinedDateTimeReturn);
            const timeStampReturn = Math.floor(
               dateObjectReturn.getTime() / 1000,
            );

            // Validate
            if (
               formIdInput &&
               toIdInput &&
               dateAsText &&
               returnDateAsText &&
               pax &&
               fromId &&
               toId &&
               fromShortCode &&
               toShortCode
            ) {
               const storeData = {
                  way: "round trip",
                  formIdInput,
                  toIdInput,
                  fromInputReturn,
                  toInputReturn,
                  fromId,
                  toId,
                  returnFromId,
                  returnToId,
                  dateAsText,
                  returnDateAsText,
                  timeAsText,
                  timeAsTextReturn,
                  pax,
                  paxReturn,
                  appDate,
                  appDateReturn,
                  timeStamp,
                  timeStampReturn,
                  fromShortCode,
                  toShortCode,
                  full_departure_airport_name,
                  full_arrival_airport_name,
                  full_return_departure_airport_name,
                  full_return_arrival_airport_name,
               };
               sessionStorage.setItem("storeData", JSON.stringify(storeData));
               window.location.href = `/aircraft`;
            } else {
               window.toast.error("Please fill up the form properly");
            }
         });
      }
   }
});
