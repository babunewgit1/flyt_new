window.addEventListener("load", function () {
   sessionStorage.setItem("formSubmitted", "false");
   sessionStorage.setItem("pendingFormSubmission", "false");

   // Check if fRequestIdForApi exists in session storage
   const flightRequestId = sessionStorage.getItem("fRequestIdForApi");
   if (!flightRequestId) {
      displayMessage("Something wrong! Please search again");
      setTimeout(() => {
         window.location.href = "/";
      }, 2000);
   }
});

function displayMessage(message) {
   if (typeof showToastMessage === "function") {
      showToastMessage(message);
   } else {
      alert(message);
   }
}

//!disable webflow default form submit
document.addEventListener("DOMContentLoaded", function () {
   document.querySelector(".car_from_wrapper").reset();
});

const formWrapper = document.querySelector(".car_form_block");
formWrapper.addEventListener("click", function (e) {
   if (e.target.type === "submit") {
      e.preventDefault();

      //? prevent from submiting if there is no checkbox selected
      const checkedBoxes = document.querySelectorAll(".checkbox-input:checked");
      if (checkedBoxes.length === 0) {
         displayMessage("Please select at least one option before submitting!");
         return;
      }
      // Check if user is logged in
      sessionStorage.setItem("formSubmitted", "true");
      checkAuthenticationAndSubmit();
   }
});

// Function to check authentication and handle form submission
async function checkAuthenticationAndSubmit() {
   const userEmail =
      typeof Cookies !== "undefined" ? Cookies.get("userEmail") : null;
   const authToken =
      typeof Cookies !== "undefined" ? Cookies.get("authToken") : null;

   if (userEmail && authToken) {
      await submitFormWithAPI();
   } else {
      showLoginForm();
   }
}

// Function to make API call
async function submitFormWithAPI() {
   const submitButton = document.querySelector(".car_text_submit");
   const originalText = submitButton.value;

   try {
      // Change button text to show loading state

      submitButton.value = "SENDING REQUEST...";
      submitButton.disabled = true;

      // Check membership status first
      const membershipResponse = await fetch(
         "https://operators-dashboard.bubbleapps.io/api/1.1/wf/webflow_membership_status_blackjet",
         {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               Authorization: `Bearer ${Cookies.get("authToken")}`,
            },
         },
      );

      if (!membershipResponse.ok) {
         submitButton.value = originalText;
         submitButton.disabled = false;
         sessionStorage.removeItem("formSubmitted");
         displayMessage(
            "Unable to verify membership status. Please try again.",
         );
         return;
      }

      const membershipData = await membershipResponse.json();

      // Check if membership is active
      if (!membershipData.response["membership_active?"]) {
         submitButton.value = originalText;
         submitButton.disabled = false;
         sessionStorage.removeItem("formSubmitted");
         document.querySelector(".member_popup").style.display = "flex";
         return;
      }

      const checkedBoxes = document.querySelectorAll(".checkbox-input:checked");

      // Prepare API parameters
      const apiParams = {
         turboprop: "no",
         lightjet: "no",
         midsizejet: "no",
         supermidsizejet: "no",
         heavyjet: "no",
         ultralongrange: "no",
         specialrequests: "",
         flightrequestid: sessionStorage.getItem("fRequestIdForApi"),
      };

      // Update parameters based on selected checkboxes using input values
      checkedBoxes.forEach((checkbox) => {
         const inputValue = checkbox.value;
         if (apiParams.hasOwnProperty(inputValue)) {
            apiParams[inputValue] = "yes";
         }
      });

      const textarea = document.querySelector(".car_text_request");
      if (textarea) {
         apiParams.specialrequests = textarea.value.trim();
      }
      const response = await fetch(
         "https://operators-dashboard.bubbleapps.io/api/1.1/wf/webflow_custom_request_blackjet",
         {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               Authorization: `Bearer ${Cookies.get("authToken")}`,
            },
            body: JSON.stringify(apiParams),
         },
      );

      if (response.ok) {
         // Clear any pending form submission flag before redirect
         sessionStorage.removeItem("pendingFormSubmission");
         // Keep formSubmitted flag for confirmation page validation
         sessionStorage.setItem("formSubmitted", "true");
         window.location.href = "/request-confirmation";
      } else {
         // Restore button state on error
         sessionStorage.removeItem("formSubmitted");
         sessionStorage.removeItem("pendingFormSubmission");
         submitButton.value = originalText;
         submitButton.disabled = false;
         displayMessage("An error occurred. Please search flight again.");
      }
   } catch (error) {
      // Restore button state on error
      sessionStorage.removeItem("formSubmitted");
      sessionStorage.removeItem("pendingFormSubmission");
      submitButton.value = originalText;
      submitButton.disabled = false;
      console.error("API call error:", error);
      displayMessage("An error occurred. Please search flight again.");
   }
}

// Function to show login form
function showLoginForm() {
   // Check if auth popup elements exist
   const authPopUpWrapper = document.querySelector(".auth-popup");
   const authBlockPopup = document.querySelector(".auth_block_popup");
   const authForget = document.querySelector(".auth_forget");

   if (authPopUpWrapper && authBlockPopup && authForget) {
      // Show login popup
      authPopUpWrapper.classList.add("active_popup");
      authBlockPopup.style.display = "block";
      authForget.style.display = "none";

      // Set signin tab as active
      const signinTab = document.querySelector("#signin");
      const signupTab = document.querySelector("#signup");
      if (signinTab) signinTab.classList.add("active_form");
      if (signupTab) signupTab.classList.remove("active_form");

      // Show signin block and hide signup block
      const signinBlock = document.querySelector("[data='signin']");
      const signupBlock = document.querySelector("[data='signup']");
      if (signinBlock) signinBlock.style.display = "block";
      if (signupBlock) signupBlock.style.display = "none";

      // Set flag to indicate we need to handle form submission after login
      // Don't set automatic redirect - we'll handle it manually after API call
      sessionStorage.setItem("pendingFormSubmission", "true");
      sessionStorage.removeItem("redirectAfterLogin");
      sessionStorage.removeItem("redirectTo");
   } else {
      // Fallback: show toast if auth popup elements don't exist
      displayMessage("Please log in to continue. Login form not available.");
   }
}

// Listen for successful login event
window.addEventListener("userLoggedIn", async function () {
   // Check if we have a pending form submission
   if (sessionStorage.getItem("pendingFormSubmission") === "true") {
      // Clear the pending flag
      sessionStorage.removeItem("pendingFormSubmission");

      // Submit the form with API call and proper error handling
      await submitFormWithAPI();
   }
});

//! open modal and close modal
const modalBtn = document.querySelectorAll(".explore");
const popModalClose = document.querySelectorAll(".popx_close");

modalBtn.forEach((btn) => {
   btn.addEventListener("click", function () {
      btn.closest(
         ".car_check_modal_check_item",
      ).nextElementSibling.style.display = "flex";
   });
});

popModalClose.forEach((closeItem) => {
   closeItem.addEventListener("click", function () {
      closeItem.closest(".car_popup_wrapper").style.display = "none";
   });
});

//! display select checkbox
const checkboxes = document.querySelectorAll(".checkbox-input");
const selectedItemDiv = document.querySelector(".selected_item");
checkboxes.forEach((checkbox) => {
   checkbox.addEventListener("change", function () {
      const checkedBoxes = document.querySelectorAll(".checkbox-input:checked");

      if (checkedBoxes.length === 0) {
         selectedItemDiv.innerHTML = "No class selected";
      } else {
         const selectedLabels = Array.from(checkedBoxes).map((checkbox) => {
            const labelElement = checkbox
               .closest(".checkbox-item")
               .querySelector(".checkbox-label");
            return labelElement.textContent;
         });
         selectedItemDiv.innerHTML = selectedLabels
            .map(
               (label) => `<div class="selectedItem">
          <p>${label}</p>
        </div>`,
            )
            .join("");
      }
   });
});

//remove popup
const poupClose = document.querySelector(".member_popup_logo_cross");
const popupWrap = document.querySelector(".member_popup");

poupClose.addEventListener("click", function () {
   popupWrap.style.display = "none";
});
