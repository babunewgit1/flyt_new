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

async function fetchAircraftDetail() {
   try {
      const response = await fetch(AIRCRAFT_DETAIL_API, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ aircraftid: bookingId }),
      });

      const data = await response.json();
      console.log("Aircraft Detail Response:", data.response);

      const detail = data.response?.aircraft_detail;
      if (!detail) return;

      // render heading
      renderHeading(detail);
   } catch (error) {
      console.error("Aircraft Detail Error:", error);
   } finally {
      hideLoader();
   }
}

// =============================================================================
// RENDER: Heading Block → .adi_heading_wrapper
// =============================================================================
function renderHeading(detail) {
   const headingWrapper = document.querySelector(".adi_heading_wrapper");
   if (!headingWrapper) return;

   headingWrapper.innerHTML = `
      <div class="adi_heading_arrow">
         <a href="/aircraft"><img src="https://cdn.prod.website-files.com/673728493d38fb595b0df373/69c37498460e7320906ec1a3_arrow_right.png" alt="" /></a>
      </div>
      <div class="adi_heading_content">
         <h2 data-wf--white_heading_h2--variant="black_version" class="hm_sponser_h2 adi_heading_h2 w-variant-c97c5271-25fa-0785-e5a2-babd61f625cd">${detail.model_text || ""}</h2>
         <p data-wf--global_para--variant="black_color" class="whole_para adi_heading_para w-variant-124bf981-d164-97ae-531d-77453bb396cb">${detail.model_message_text || ""}</p>
      </div>
   `;
}

document.addEventListener("DOMContentLoaded", () => {
   // Inject loader into the page
   const loaderEl = document.createElement("div");
   loaderEl.className = "adi_page_loader";
   loaderEl.innerHTML = `<div class="adi_loader_spinner"></div>`;
   document.body.appendChild(loaderEl);

   fetchAircraftDetail();
});
