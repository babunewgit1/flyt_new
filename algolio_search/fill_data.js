/* =============================================================================
   !fill_data.js — Connects to the Aircraft Search Results Page (/aircraft)
   =============================================================================
   Implemented Features:
   1. Session Storage Data Restoration
      - Reads "storeData" from sessionStorage saved by script.js on form submit
      - Parses the JSON data and determines trip type (One-Way or Round Trip)

   2. Form Pre-Population
      - Fills the correct search form (one-way or round trip) with saved airport data
      - Populates departure and arrival airport input fields, port IDs, short codes, and city names
      - Restores selected date(s) and time(s) into the form display elements
      - Restores passenger count input

   3. Active Tab & Form Visibility
      - Activates the correct search tab (One-Way or Round Trip) based on trip type
      - Toggles "active_search" class to show/hide the appropriate form

   4. Date Formatting
      - Converts stored ISO date strings ("2026-03-28") to human-readable format ("Mar 28, 2026")
   ============================================================================= */

document.addEventListener("DOMContentLoaded", function () {
   const raw = sessionStorage.getItem("storeData");
   if (!raw) return;

   let data;
   try {
      data = JSON.parse(raw);
   } catch (e) {
      console.error("fill_data.js: Could not parse storeData.", e);
      return;
   }

   const isOneWay = data.way?.toLowerCase() === "one way";

   const oneWayForm = document.querySelector(
      ".search_form[data-search='one_way']",
   );
   const roundTripForm = document.querySelector(
      ".search_form[data-search='round_way']",
   );

   // Show correct form by toggling active_search class (CSS controls display: block)
   if (oneWayForm) oneWayForm.classList.toggle("active_search", isOneWay);
   if (roundTripForm)
      roundTripForm.classList.toggle("active_search", !isOneWay);

   // Activate the correct tab
   const tabs = document.querySelectorAll(".search_tab_item");
   tabs.forEach((tab) => tab.classList.remove("active_search"));
   const activeTab = isOneWay ? tabs[0] : tabs[1];
   if (activeTab) activeTab.classList.add("active_search");

   function fillAirportBlock(block, inputText, portId, shortCode, cityName) {
      if (!block) return;
      const textInput = block.querySelector(".algolio_input");
      if (textInput) textInput.value = inputText || "";
      const portIdEl = block.querySelector(".portid");
      const shortCodeEl = block.querySelector(".airportshort");
      const cityEl = block.querySelector(".airportcity");
      if (portIdEl) portIdEl.textContent = portId || "";
      if (shortCodeEl) shortCodeEl.textContent = shortCode || "";
      if (cityEl) cityEl.textContent = cityName || "";
   }

   // Converts "2026-03-28" → "Mar 28, 2026"
   function formatDate(dateStr) {
      if (!dateStr) return "";
      const [yyyy, mm, dd] = dateStr.split("-");
      const months = [
         "Jan",
         "Feb",
         "Mar",
         "Apr",
         "May",
         "Jun",
         "Jul",
         "Aug",
         "Sep",
         "Oct",
         "Nov",
         "Dec",
      ];
      return `${months[parseInt(mm, 10) - 1]} ${parseInt(dd, 10)}, ${yyyy}`;
   }

   if (isOneWay && oneWayForm) {
      fillAirportBlock(
         oneWayForm.querySelector(".departure_block"),
         data.full_departure_airport_name,
         data.fromId,
         data.fromShortCode,
         data.formIdInput,
      );
      fillAirportBlock(
         oneWayForm.querySelector(".arrival_block"),
         data.full_arrival_airport_name,
         data.toId,
         data.toShortCode,
         data.toIdInput,
      );

      const dateEl = oneWayForm.querySelector(".one_way_date");
      const timeEl = oneWayForm.querySelector(".one_way_time");
      if (dateEl) {
         dateEl.classList.remove("one_way_date_placeholder");
         dateEl.textContent = formatDate(data.dateAsText);
      }
      if (timeEl) timeEl.textContent = data.timeAsText || "";

      const multipul = oneWayForm.querySelector(".form_input_multipul");
      if (multipul && data.dateAsText) {
         multipul.dataset.depDate = data.dateAsText;
         multipul.dataset.selectedDate = data.dateAsText;
      }

      const paxInput = oneWayForm.querySelector(".form_input_pax_input input");
      if (paxInput && data.pax) paxInput.value = data.pax;
   }

   if (!isOneWay && roundTripForm) {
      fillAirportBlock(
         roundTripForm.querySelector(".departure_block"),
         data.full_departure_airport_name,
         data.fromId,
         data.fromShortCode,
         data.formIdInput,
      );
      fillAirportBlock(
         roundTripForm.querySelector(".arrival_block"),
         data.full_arrival_airport_name,
         data.toId,
         data.toShortCode,
         data.toIdInput,
      );

      const depDateEl = roundTripForm.querySelector(
         ".round_trip_departure_date",
      );
      const depTimeEl = roundTripForm.querySelector(
         ".round_trip_departure_time",
      );
      const retDateEl = roundTripForm.querySelector(".round_trip_return_date");
      const retTimeEl = roundTripForm.querySelector(".round_trip_return_time");

      if (depDateEl) depDateEl.textContent = formatDate(data.dateAsText);
      if (depTimeEl) depTimeEl.textContent = data.timeAsText || "";
      if (retDateEl) retDateEl.textContent = formatDate(data.returnDateAsText);
      if (retTimeEl) retTimeEl.textContent = data.timeAsTextReturn || "";

      const placeholder = roundTripForm.querySelector(".round_placeholder");
      if (placeholder && (data.dateAsText || data.returnDateAsText)) {
         placeholder.style.display = "none";
      }

      const multipul = roundTripForm.querySelector(".form_input_multipul");
      if (multipul) {
         if (data.dateAsText) multipul.dataset.depDate = data.dateAsText;
         if (data.returnDateAsText)
            multipul.dataset.retDate = data.returnDateAsText;
      }

      const paxInput = roundTripForm.querySelector(
         ".form_input_pax_input input",
      );
      if (paxInput && data.pax) paxInput.value = data.pax;
   }
});
