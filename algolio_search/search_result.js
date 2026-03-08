/* =============================================================================
   !search_result.js — Connects to the Aircraft Search Results Page (/aircraft)
   =============================================================================
   Implemented Features:
   1. Flight Search API Integration
      - Reads stored search data from sessionStorage ("storeData")
      - Fires One-Way or Round Trip API calls based on trip type
      - Polls results API every 1.5s until all aircraft data is returned (max 10 attempts)
      - Shows/hides a loading spinner during API calls

   2. Aircraft Grid View (Card Renderer)
      - Renders one card per aircraft inside .search_aircraft_result
      - Displays aircraft name, category, capacity, range, speed, and price
      - Supports price sorting (Low to High / High to Low) via .price_filter_grid
      - Arrow icon rotates to indicate sort direction

   3. Aircraft Table View (Table Renderer)
      - Groups aircraft by category (Turboprop, Light Jet, Midsize, etc.)
      - Renders sortable table rows with price sorting support
      - Arrow icon rotates to indicate sort direction

   4. Category Dropdown Filter
      - Highlights available/recommended/unavailable categories from API data
      - Multi-select filtering: clicking dropdown items filters cards by category
      - Dropdown label updates to reflect current selection

   5. Grid / Table View Toggle
      - Switches between grid and table layout using CSS class toggling
      - Hides the grid price filter when table view is active

   6. Search History & Warning Banner
      - Calls the search history API if user is logged in (authToken cookie)
      - Injects different HTML into .warning_inject based on search_limited status:
          → search_limited: true  → shows "Search Limit Reached" warning with phone CTA
          → search_limited: false → shows "X of 11 Searches Used" with quote request button
      - Clears .warning_inject on logout or when not logged in
      - Re-fetches search history on login without page reload (listens to userLoggedIn event)

   7. Price Blur
      - Blurs .src_card_price elements when blur_pricing === true from API
      - Removes blur when blur_pricing === false (user has pricing access)
      - Applies blur immediately after render using window._blurPricing flag to fix race condition
      - Clears blur on logout
   ============================================================================= */

const getStoredData = JSON.parse(sessionStorage.getItem("storeData"));

const ONE_WAY_API =
   "https://operators-dashboard.bubbleapps.io/api/1.1/wf/webflow_one_way_flight_flyt";
const ROUND_TRIP_API =
   "https://operators-dashboard.bubbleapps.io/api/1.1/wf/webflow_round_trip_flight_flyt";
const POLL_API =
   "https://operators-dashboard.bubbleapps.io/api/1.1/wf/webflow_return_data_flyt";

// Converts "3:30 PM" → "15:30:00" for building API timestamps.
function to24HourTime(timeStr) {
   if (!timeStr) return "00:00:00";
   const [time, modifier] = timeStr.split(" ");
   let [hours, minutes] = time.split(":");
   if (modifier === "PM" && hours !== "12") hours = String(Number(hours) + 12);
   if (modifier === "AM" && hours === "12") hours = "00";
   return `${hours.padStart(2, "0")}:${minutes}:00`;
}

// Returns a valid Unix timestamp in seconds; builds one from date+time text if stored value is missing.
function ensureValidTimestamp(timestamp, dateText, timeText) {
   if (timestamp && timestamp !== 0) return timestamp;
   try {
      const isoTime = to24HourTime(timeText || "12:00 AM");
      const d = new Date(`${dateText}T${isoTime}`);
      if (!isNaN(d.getTime())) return Math.floor(d.getTime() / 1000);
   } catch (e) {}
   return null;
}

// Polls /webflow_return_data_flyt every 1.5s until aircraft count matches expected or 10 attempts are reached.
async function pollForAircraft(
   flightRequestId,
   expectedSearchResults,
   maxAttempts = 10,
   interval = 1500,
) {
   let attempt = 0;

   while (attempt < maxAttempts) {
      attempt++;

      const response = await fetch(POLL_API, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ flightrequest: flightRequestId }),
      });

      const data = await response.json();
      console.log(`Poll attempt ${attempt} response:`, data.response);

      const aircraftCount = data.response?.aircraft?.length ?? 0;
      const matched = aircraftCount === expectedSearchResults;

      if (matched || attempt >= maxAttempts) return data.response;

      await new Promise((resolve) => setTimeout(resolve, interval));
   }
   return null;
}

// Fires the main search API, extracts flightRequestId + expected count, then starts polling.
async function makeApiCall() {
   if (!getStoredData) return;

   // Show loader — hide both views via CSS
   const resultWrapper = document.querySelector(".api_result_display");
   if (resultWrapper) {
      resultWrapper.classList.add("loading_mode");

      const existingLoader = resultWrapper.querySelector(".src_loader_main");
      if (existingLoader) existingLoader.remove();

      const loader = document.createElement("div");
      loader.className = "src_loader src_loader_main";
      loader.innerHTML = `<div class="src_loader_spinner"></div>`;
      resultWrapper.prepend(loader);
   }

   // Show loader in dropdown
   const dropdownWrapper = document.querySelector(".drp_class_wrapper");
   if (dropdownWrapper) {
      dropdownWrapper
         .querySelectorAll(".drp_class_item")
         .forEach((item) => (item.style.display = "none"));
      const dropLoader = document.createElement("div");
      dropLoader.className = "src_loader src_drop_loader";
      dropLoader.innerHTML = `<div class="src_loader_spinner"></div>`;
      dropdownWrapper.appendChild(dropLoader);
   }

   const isOneWay = getStoredData.way?.toLowerCase() === "one way";
   const apiUrl = isOneWay ? ONE_WAY_API : ROUND_TRIP_API;
   let requestBody;

   if (isOneWay) {
      const timestamp = ensureValidTimestamp(
         getStoredData.timeStamp,
         getStoredData.dateAsText,
         getStoredData.timeAsText,
      );
      requestBody = {
         "from airport id": getStoredData.fromId,
         "to airport id": getStoredData.toId,
         date: timestamp ? timestamp * 1000 : null,
         pax: getStoredData.pax,
         date_as_text: getStoredData.dateAsText,
         time_as_text: getStoredData.timeAsText,
      };
   } else {
      const depTimestamp = ensureValidTimestamp(
         getStoredData.timeStamp,
         getStoredData.dateAsText,
         getStoredData.timeAsText,
      );
      const retTimestamp = ensureValidTimestamp(
         getStoredData.timeStampReturn,
         getStoredData.returnDateAsText,
         getStoredData.timeAsTextReturn,
      );
      requestBody = {
         "out-dep airport id": getStoredData.fromId,
         "out-arr airport id": getStoredData.toId,
         "out-dep date": depTimestamp ? depTimestamp * 1000 : null,
         "out-pax": getStoredData.pax,
         "ret-date": retTimestamp ? retTimestamp * 1000 : null,
         "ret-dep airport id": getStoredData.returnFromId,
         "ret-arr airport id": getStoredData.returnToId,
         "ret-pax": getStoredData.paxReturn,
         Dep_date_as_text: getStoredData.dateAsText,
         Ret_date_as_text: getStoredData.returnDateAsText,
         Dep_time_as_text: getStoredData.timeAsText,
         Ret_time_as_text: getStoredData.timeAsTextReturn,
      };
   }

   // Step 1: Fire the main search API
   const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
   });

   const data = await response.json();
   console.log("Step 1 - Main API Response:", data.response);

   const flightRequestId = data.response.flightrequest;
   const expectedSearchResults = data.response["Expected Search Results"];

   // Save flightRequestId in sessionStorage as an array
   let storedFlightIds = JSON.parse(
      sessionStorage.getItem("flightRequestId") || "[]",
   );
   if (flightRequestId && !storedFlightIds.includes(flightRequestId)) {
      storedFlightIds.push(flightRequestId);
      sessionStorage.setItem(
         "flightRequestId",
         JSON.stringify(storedFlightIds),
      );

      // Check if user is logged in and send the data
      const userEmail =
         typeof Cookies !== "undefined" ? Cookies.get("userEmail") : null;
      const authToken =
         typeof Cookies !== "undefined" ? Cookies.get("authToken") : null;
      if (userEmail && authToken) {
         sendFlightRequestIdsIfLoggedIn();
      }
   }

   console.log("flightRequestId:", flightRequestId);
   console.log("Expected Search Results:", expectedSearchResults);

   // Step 2: Poll until aircraft results are ready
   const pollResponse = await pollForAircraft(
      flightRequestId,
      expectedSearchResults,
   );
   console.log("Final Poll Response:", pollResponse);

   // Step 3: Remove loader and restore view
   const mainLoader = document.querySelector(".src_loader_main");
   if (mainLoader) mainLoader.remove();

   if (resultWrapper) resultWrapper.classList.remove("loading_mode");

   if (pollResponse?.aircraft?.length) {
      renderAircraftResults(pollResponse.aircraft);
      renderAircraftTable(pollResponse.aircraft);
      highlightMatchingDropdownItems(pollResponse.aircraft);

      // Apply blur if fetchSearchHistory already resolved with blur_pricing = true
      if (window._blurPricing === true) {
         document.querySelectorAll(".src_card_price").forEach((el) => {
            el.style.filter = "blur(5px)";
         });
      }
   }

   // Remove dropdown loader and show items
   const dropLoader = document.querySelector(".src_drop_loader");
   if (dropLoader) dropLoader.remove();
   const dropWrapper = document.querySelector(".drp_class_wrapper");
   if (dropWrapper) {
      dropWrapper
         .querySelectorAll(".drp_class_item")
         .forEach((item) => (item.style.display = ""));
   }
}

// =============================================================================
// AIRCRAFT RESULTS RENDERER
// Generates one card per aircraft inside .search_aircraft_result.
// =============================================================================

function renderAircraftResults(aircraft, sortDirection = "asc") {
   const container = document.querySelector(".search_aircraft_result");
   if (!container) return;

   // Store aircraft data for re-sorting
   container._aircraftData = aircraft;
   container._sortDirection = sortDirection;
   container.innerHTML = "";

   // Sort by price based on direction
   if (sortDirection === "asc") {
      aircraft.sort((a, b) => (a.price_number || 0) - (b.price_number || 0));
   } else {
      aircraft.sort((a, b) => (b.price_number || 0) - (a.price_number || 0));
   }

   aircraft.forEach((item) => {
      // Fix protocol-relative image URL
      const imgSrc = item.aircraft_image_image
         ? item.aircraft_image_image.startsWith("//")
            ? "https:" + item.aircraft_image_image
            : item.aircraft_image_image
         : "";

      // Format price with commas, 2 decimal places
      const price = item.price_number
         ? "$" + Math.round(Number(item.price_number)).toLocaleString()
         : "";

      const card = document.createElement("div");
      card.className = "src_aircraft_card";
      card.dataset.category = item.category_text || "";

      card.innerHTML = `
      <div class="src_card_wrapper at_cata_block_item">
        <div class="src_card_image at_cata_block_list_img">
          ${imgSrc ? `<img class="at_cata_block_img" src="${imgSrc}" alt="${item.model_text || ""}" />` : ""}
        </div>
        
        <div class="src_card_body at_cata_block_heading">
            <div class="src_card_type at_cata_block_hpara">
               <span class="src_type_badge${item.type_text === "Request To Book" ? " src_request_to_book" : ""}">${item.type_text || ""}</span>
            </div>

            <div class="src_card_model">
               <p class="src_model_name at_cata_block_name">${item.model_text || ""}</p>
               <p class="src_model_similar at_cata_block_trip">
               <span class="src_or_similar">Or similar</span>
               <span class="src_category">${item.category_text || ""}</span>
               </p>
            </div>
         </div>

         <div class="src_card_footer">
         <div class="src_card_pax">
            <span class="src_pax_icon"><img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/690c96fecdb4c59f1ce07269_pax.webp" alt="icon" /></span>
            <span class="src_pax_count">${item.max_pax_number ? `${item.max_pax_number} ${item.max_pax_number > 1 ? "seats" : "seat"}` : ""}</span>
         </div>
         <div class="src_card_price">
            <span class="src_price_arrow"><img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69a23c01efc11bc69dc7d4a1_planb.png" alt="icon" /></span>
            <span class="src_price_value">${price}</span>
         </div>
         </div>        
        <img class="at_cata_block_list_flogo" src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/690c9beeaacf18341a56ca94_f_sm.webp" alt="f_sm_icon" />
      </div>
    `;

      container.appendChild(card);
   });
}

// =============================================================================
// AIRCRAFT TABLE RENDERER
// Groups aircraft by category and renders them in .search_result_table
// =============================================================================

// Static category definitions — always rendered on the left side
const STATIC_CATEGORIES = [
   {
      name: "Turboprop",
      filterKey: "turbo prop",
      img: "https://cdn.prod.website-files.com/673728493d38fb595b0df373/69ace42b0a89583c0590e29d_ctg1.png",
   },
   {
      name: "Light Jet",
      filterKey: "light jet",
      img: "https://cdn.prod.website-files.com/673728493d38fb595b0df373/69ace43b73c45b37b855ae46_ctg2.png",
   },
   {
      name: "Midsize Jet",
      filterKey: "midsize jet",
      img: "https://cdn.prod.website-files.com/673728493d38fb595b0df373/69ace449057fd6b3d43e2339_ctg3.png",
   },
   {
      name: "Super Midsize Jet",
      filterKey: "super midsize jet",
      img: "https://cdn.prod.website-files.com/673728493d38fb595b0df373/69ace459837c01311f85521a_ctg4.png",
   },
   {
      name: "Heavy Jet",
      filterKey: "heavy jet",
      img: "https://cdn.prod.website-files.com/673728493d38fb595b0df373/69ace4682229115f556abbed_ctg5.png",
   },
   {
      name: "Ultra Long Range Jet",
      filterKey: "ultra long range jet",
      img: "https://cdn.prod.website-files.com/673728493d38fb595b0df373/69ace477102e5aaee7840c03_ctg6.png",
   },
];

function renderAircraftTable(aircraft, sortDirection = "asc") {
   const table = document.querySelector(".search_result_table");
   if (!table) return;

   // Store aircraft data for re-sorting
   table._aircraftData = aircraft;
   table.innerHTML = "";

   // Group aircraft by category (lowercase key)
   const grouped = {};
   aircraft.forEach((item) => {
      const cat = (item.category_text || "").trim().toLowerCase();
      if (!cat) return;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
   });

   // Sort category rows by price
   const sortedCategories = [...STATIC_CATEGORIES].sort((a, b) => {
      const aItems = grouped[a.filterKey] || [];
      const bItems = grouped[b.filterKey] || [];
      if (aItems.length === 0 && bItems.length === 0) return 0;
      if (aItems.length === 0) return 1;
      if (bItems.length === 0) return -1;
      const aPrice = Math.min(...aItems.map((i) => i.price_number || 0));
      const bPrice = Math.min(...bItems.map((i) => i.price_number || 0));
      return sortDirection === "asc" ? aPrice - bPrice : bPrice - aPrice;
   });

   const sortLabel = sortDirection === "asc" ? "Low to High" : "High to Low";

   // ── Left column (sticky) ──
   const leftCol = document.createElement("div");
   leftCol.className = "srt_left";

   // Left header
   const leftHeader = document.createElement("div");
   leftHeader.className = "srt_left_header";
   leftHeader.textContent = "Category";
   leftCol.appendChild(leftHeader);

   // Category cells
   sortedCategories.forEach((cat) => {
      const catImg = cat.img || "";
      const catCell = document.createElement("div");
      catCell.className = "srt_cat_cell";
      catCell.dataset.category = cat.filterKey;
      catCell.innerHTML = `
         <div class="srt_cat_img">
            ${catImg ? `<img src="${catImg}" alt="${cat.name}" />` : ""}
         </div>
         <p class="srt_cat_name">${cat.name}</p>
         <img class="frelated_icon" src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/690c9beeaacf18341a56ca94_f_sm.webp" alt="f_icon" />
      `;
      leftCol.appendChild(catCell);
   });

   // ── Right column (scrollable) ──
   const rightCol = document.createElement("div");
   rightCol.className = "srt_right";

   // Right header
   const rightHeader = document.createElement("div");
   rightHeader.className = "srt_right_header";
   rightHeader.innerHTML = `
      <div class="srt_header_list">Aircraft List</div>
      <div class="srt_header_sort">Price: <strong>${sortLabel}</strong> <span class="srt_sort_arrow${sortDirection === "desc" ? " srt_sort_desc" : ""}"><img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69a175cc005163c0925a8b3d_down_arrow.png" alt="down arrow icon" style="${sortDirection === "desc" ? "transform: rotate(180deg);" : ""}" /></span></div>
   `;
   rightCol.appendChild(rightHeader);

   // Sort click handler
   rightHeader
      .querySelector(".srt_header_sort")
      .addEventListener("click", () => {
         const newDirection = sortDirection === "asc" ? "desc" : "asc";
         renderAircraftTable(table._aircraftData, newDirection);
      });

   // Aircraft rows (one per category, aligned with left cells)
   sortedCategories.forEach((cat) => {
      const items = grouped[cat.filterKey] || [];
      if (sortDirection === "asc") {
         items.sort((a, b) => (a.price_number || 0) - (b.price_number || 0));
      } else {
         items.sort((a, b) => (b.price_number || 0) - (a.price_number || 0));
      }

      const listRow = document.createElement("div");
      listRow.className = "srt_list_row";
      listRow.dataset.category = cat.filterKey;

      if (items.length === 0) {
         listRow.classList.add("srt_list_row_empty");
         listRow.innerHTML = `<p class="srt_no_aircraft">No aircraft available</p>`;
      }

      items.forEach((item) => {
         const imgSrc = item.aircraft_image_image
            ? item.aircraft_image_image.startsWith("//")
               ? "https:" + item.aircraft_image_image
               : item.aircraft_image_image
            : "";

         const price = item.price_number
            ? "$" + Math.round(Number(item.price_number)).toLocaleString()
            : "";

         const isRequestToBook =
            (item.type_text || "").toUpperCase() === "REQUEST TO BOOK";

         const card = document.createElement("div");
         card.className = "srt_aircraft_card";
         card.innerHTML = `            
            <div class="srt_card_img">
               ${imgSrc ? `<img src="${imgSrc}" alt="${item.model_text || ""}" />` : ""}
            </div>            
            <div class="booking_details">
               <div class="srt_card_badge${isRequestToBook ? " srt_request_book" : ""}">
                  ${item.type_text || ""}
               </div>
               <p class="srt_card_model">${item.model_text || ""}</p>
               <div class="srt_card_info">
                  <span class="srt_card_pax">
                     <img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/690c96fecdb4c59f1ce07269_pax.webp" alt="pax" />
                     ${item.max_pax_number ? `${item.max_pax_number} seats` : ""}
                  </span>
                  <span class="srt_card_price">
                     <img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69a23c01efc11bc69dc7d4a1_planb.png" alt="price" />
                     ${price}
                  </span>
               </div>
            </div>
         `;
         listRow.appendChild(card);
      });

      rightCol.appendChild(listRow);
   });

   table.appendChild(leftCol);
   table.appendChild(rightCol);
}

// =============================================================================
// DROPDOWN CATEGORY FILTER
// Highlights dropdown items that match API categories & filters cards on click.
// =============================================================================

// Marks dropdown items based on API aircraft data:
// - Available + recommended → "Most Popular" (green)
// - Available + not recommended → empty label
// - Not available → "N/A" (red) + disabled
function highlightMatchingDropdownItems(aircraft) {
   const dropdownItems = document.querySelectorAll(
      ".drp_class_item[data-filter-text]",
   );

   // Build a map: category (lowercase) → is_recommended
   const categoryMap = {};
   aircraft.forEach((item) => {
      const cat = (item.category_text || "").trim().toLowerCase();
      if (!cat) return;
      // If any aircraft in this category is recommended, mark it true
      if (!categoryMap[cat]) {
         categoryMap[cat] = { recommended: false };
      }
      if (item.is_recommended__boolean === true) {
         categoryMap[cat].recommended = true;
      }
   });

   // Update each dropdown item
   dropdownItems.forEach((item) => {
      const filterText = (item.getAttribute("data-filter-text") || "")
         .trim()
         .toLowerCase();
      const apiEl = item.querySelector(".drop_clas_api");

      if (categoryMap[filterText]) {
         // Category exists in API response
         item.classList.add("drp_class_selected");
         item.classList.remove("drp_class_disabled");

         if (apiEl) {
            if (categoryMap[filterText].recommended) {
               apiEl.textContent = "Most Popular";
               apiEl.style.color = "#35a413";
            } else {
               apiEl.textContent = "";
            }
         }
      } else {
         // Category NOT in API response
         item.classList.remove("drp_class_selected");
         item.classList.add("drp_class_disabled");

         if (apiEl) {
            apiEl.textContent = "N/A";
            apiEl.style.color = "#f13314";
         }
      }
   });

   // Update the dropdown label to reflect auto-selected items
   updateDropdownLabel(dropdownItems);
}

// Click handler: multi-select dropdown items to filter aircraft cards by category.
function setupDropdownFilter() {
   const dropdownItems = document.querySelectorAll(
      ".drp_class_item[data-filter-text]",
   );

   dropdownItems.forEach((item) => {
      item.addEventListener("click", () => {
         // Toggle selected state on clicked item
         item.classList.toggle("drp_class_selected");

         // Gather all currently selected categories
         const selectedCategories = [];
         dropdownItems.forEach((di) => {
            if (di.classList.contains("drp_class_selected")) {
               selectedCategories.push(
                  (di.getAttribute("data-filter-text") || "")
                     .trim()
                     .toLowerCase(),
               );
            }
         });

         // Filter cards: show all if nothing selected, otherwise only matching
         const cards = document.querySelectorAll(".src_aircraft_card");
         const tableRows = document.querySelectorAll(
            ".srt_list_row[data-category]",
         );
         const catCells = document.querySelectorAll(
            ".srt_cat_cell[data-category]",
         );

         if (selectedCategories.length === 0) {
            cards.forEach((card) => (card.style.display = ""));
            tableRows.forEach((row) => (row.style.display = ""));
            catCells.forEach((cell) => (cell.style.display = ""));
         } else {
            cards.forEach((card) => {
               const cardCat = (card.dataset.category || "")
                  .trim()
                  .toLowerCase();
               card.style.display = selectedCategories.includes(cardCat)
                  ? ""
                  : "none";
            });
            tableRows.forEach((row) => {
               const rowCat = (row.dataset.category || "").trim().toLowerCase();
               row.style.display = selectedCategories.includes(rowCat)
                  ? ""
                  : "none";
            });
            catCells.forEach((cell) => {
               const cellCat = (cell.dataset.category || "")
                  .trim()
                  .toLowerCase();
               cell.style.display = selectedCategories.includes(cellCat)
                  ? ""
                  : "none";
            });
         }

         // Update the dropdown label inside .src_left_drop_list
         updateDropdownLabel(dropdownItems);
      });
   });
}

// Updates the .src_left_drop_list text to reflect selected items.
// Shows "Select aircraft" when none selected, or "First Name +N" when multiple.
function updateDropdownLabel(dropdownItems) {
   const labelContainer = document.querySelector(".src_left_drop_list");
   if (!labelContainer) return;

   const selectedNames = [];
   dropdownItems.forEach((di) => {
      if (di.classList.contains("drp_class_selected")) {
         selectedNames.push((di.getAttribute("data-filter-text") || "").trim());
      }
   });

   const labelEl = labelContainer.querySelector(".src_aircraft");

   if (selectedNames.length === 0) {
      if (labelEl) labelEl.textContent = "Select aircraft";
   } else if (selectedNames.length === 1) {
      if (labelEl) labelEl.textContent = selectedNames[0];
   } else {
      if (labelEl)
         labelEl.textContent = `${selectedNames[0]} +${selectedNames.length - 1}`;
   }
}

// Fetches search history if user is logged in (authToken cookie exists).
async function fetchSearchHistory() {
   if (typeof Cookies === "undefined") return;
   const token = Cookies.get("authToken");
   if (!token) {
      const warningInject = document.querySelector(".warning_inject");
      if (warningInject) warningInject.innerHTML = "";
      return;
   }

   try {
      const response = await fetch(
         "https://operators-dashboard.bubbleapps.io/api/1.1/wf/webflow_return_search_history",
         {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               Authorization: `Bearer ${token}`,
            },
         },
      );
      const data = await response.json();
      console.log("Search History Response:", data);

      // Inject warning HTML into .warning_inject based on search_limited
      const warningInject = document.querySelector(".warning_inject");
      if (warningInject) {
         if (data.response?.search_limited === true) {
            warningInject.innerHTML = `
                <div class="true_wraning">
                     <div class="sc_war_left">
                        <div class="sc_war_left_icon">
                           <img
                              src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69a2494f9a23d14e20a1f78d_info_icon.png"
                              loading="lazy"
                              alt=""
                              class="sc_war_left_icon_pic sc_icon_info"
                           />
                        </div>
                        <div class="sc_war_left_text true_warning_text">
                           <h3 class="sc_war_left_h3">Search Limit Reached</h3>
                           <p class="sc_war_left_para">
                              Unlimited searches are reserved for our <span class="sc_war_span">Members and Customers.</span> To access our pricing receive a quote, or inquire about any of the <span class="sc_war_span">2,400+ aircraft</span> in the extensive global network, please contact our team of aviation experts, available day or night by <span class="sc_war_span">calling Us.</span>
                           </p>
                        </div>
                     </div>
                     <div class="sc_war_button">
                        <a class="telnumber" href="telto:+(866) 321-JETS"><img class="telephone_icon" src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69a7f32a60d1d5b09efb44f7_telephone_icon.png" alt="phone icon" /><span class="telephn_number">+(866) 321-JETS</span></a>
                     </div>
                </div>
             `;
         } else {
            warningInject.innerHTML = `
                 <div class="false_wraning">
                     <div class="sc_war_left">
                        <div class="sc_war_left_icon">
                           <img
                              src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69a2494f9a23d14e20a1f78d_info_icon.png"
                              loading="lazy"
                              alt=""
                              class="sc_war_left_icon_pic sc_icon_info"
                           />
                        </div>
                        <div class="sc_war_left_text">
                           <h3 class="sc_war_left_h3">
                              <span class="sc_count">1</span> of 11 Searches Used
                           </h3>
                           <p class="sc_war_left_para">
                              Unlimited searches are reserved for our
                              <span class="sc_war_span">Members and Customers.</span> Our
                              team is ready to help you with any custom quote.
                           </p>
                        </div>
                     </div>
                     <div class="sc_war_button">
                        <div
                           id="w-node-_9d765e8c-1117-f30f-9454-6c61b782b51b-b782b51b"
                           class="btn_common btn_white"
                        >
                           <a href="#" class="btnc_link w-inline-block"
                              ><p class="btnc_text black_link">requests A Custom Quote</p>
                              <div class="btnc_icon_wrap">
                                 <img
                                    loading="lazy"
                                    src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/68f35aaf95f1c9a722887386_flogo.webp"
                                    alt="logo"
                                    class="btnc_icon"
                                 /></div
                           ></a>
                        </div>
                     </div>
                  </div>
             `;

            // Update search_count inside the injected HTML
            if (data.response?.search_count !== undefined) {
               const scCountEl = warningInject.querySelector(".sc_count");
               if (scCountEl)
                  scCountEl.textContent = data.response.search_count;
            }
         }
      }

      // Store blur state globally so renderAircraftResults can use it if it runs later
      window._blurPricing = data.response?.blur_pricing === true;

      // Blur or unblur pricing based on blur_pricing
      if (window._blurPricing) {
         document.querySelectorAll(".src_card_price").forEach((el) => {
            el.style.filter = "blur(5px)";
         });
      } else {
         document.querySelectorAll(".src_card_price").forEach((el) => {
            el.style.filter = "";
         });
      }
   } catch (error) {
      console.error("Search History Error:", error);
   }
}

// =============================================================================
// GRID PRICE SORT TOGGLE
// =============================================================================

function setupGridPriceSort() {
   const sortTrigger = document.querySelector(".price_filter_grid");
   if (!sortTrigger) return;

   sortTrigger.addEventListener("click", () => {
      const container = document.querySelector(".search_aircraft_result");
      if (!container || !container._aircraftData) return;

      const currentDir = container._sortDirection || "asc";
      const newDir = currentDir === "asc" ? "desc" : "asc";

      // Update label text
      const label = sortTrigger.querySelector(".price_filter_name");
      if (label)
         label.textContent = newDir === "asc" ? "Low to High" : "High to Low";

      // Flip arrow
      const arrow = sortTrigger.querySelector(".price_filter_arrow");
      if (arrow)
         arrow.style.transform = newDir === "desc" ? "rotate(180deg)" : "";

      // Re-render with new sort
      renderAircraftResults([...container._aircraftData], newDir);
   });
}

// =============================================================================
// VIEW TOGGLE (Grid / Table)
// =============================================================================

function setupViewToggle() {
   const tableBtn = document.querySelector(".table_view");
   const gridBtn = document.querySelector(".grid_view");
   const wrapper = document.querySelector(".api_result_display");
   const gridPriceFilter = document.querySelector(".price_filter_grid");

   if (!tableBtn || !gridBtn || !wrapper) return;

   gridBtn.addEventListener("click", () => {
      wrapper.classList.remove("table_mode");
      gridBtn.classList.add("src_view_active");
      tableBtn.classList.remove("src_view_active");
      if (gridPriceFilter) gridPriceFilter.style.display = "";
   });

   tableBtn.addEventListener("click", () => {
      wrapper.classList.add("table_mode");
      tableBtn.classList.add("src_view_active");
      gridBtn.classList.remove("src_view_active");
      if (gridPriceFilter) gridPriceFilter.style.display = "none";
   });
}

// Starts the API call when the page finishes loading.
document.addEventListener("DOMContentLoaded", () => {
   makeApiCall();
   fetchSearchHistory();
   setupDropdownFilter();
   setupDropdownToggle();
   setupViewToggle();
   setupGridPriceSort();
});

// Re-fetch search history immediately after login/signup (no reload needed)
window.addEventListener("userLoggedIn", () => {
   fetchSearchHistory();
});

// Clear warning section and remove price blur on logout
window.addEventListener("userLoggedOut", () => {
   const warningInject = document.querySelector(".warning_inject");
   if (warningInject) warningInject.innerHTML = "";
   document.querySelectorAll(".src_card_price").forEach((el) => {
      el.style.filter = "";
   });
});

// =============================================================================
// DROPDOWN OPEN / CLOSE TOGGLE
// =============================================================================

function setupDropdownToggle() {
   const trigger = document.querySelector(".src_left_drop_list");
   const dropdown = document.querySelector(".drp_class");
   const crossBtn = document.querySelector(".drp_class_croxx");

   if (!trigger || !dropdown) return;

   function openDropdown() {
      dropdown.classList.add("drp_tiggerd");
      document.body.classList.add("drp_overlay");
   }

   function closeDropdown() {
      dropdown.classList.remove("drp_tiggerd");
      document.body.classList.remove("drp_overlay");
   }

   // Click trigger to open/close
   trigger.addEventListener("click", () => {
      const isOpen = dropdown.classList.contains("drp_tiggerd");
      isOpen ? closeDropdown() : openDropdown();
   });

   // Click cross to close
   if (crossBtn) {
      crossBtn.addEventListener("click", (e) => {
         e.stopPropagation();
         closeDropdown();
      });
   }

   // Outside click to close
   document.addEventListener("click", (e) => {
      if (!dropdown.classList.contains("drp_tiggerd")) return;
      if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
         closeDropdown();
      }
   });
}
