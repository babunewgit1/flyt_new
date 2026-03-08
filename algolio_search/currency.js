/*-- code for country and currency dropdown --*/
const currencyMenu = document.querySelector(".currency_menu");
const currencyTrigger = currencyMenu?.querySelector("a.nav_bar_link");
const navCountry = document.querySelector(".nav_country");
const navCurrency = document.querySelector(".nav_currency");

// ── Update nav bar display from sessionStorage ──────────────────────────────
function updateNavDisplay() {
  const savedCountry = JSON.parse(sessionStorage.getItem("country"));
  const savedCurrency = JSON.parse(sessionStorage.getItem("currency"));

  if (savedCountry && navCountry) {
    navCountry.textContent = savedCountry.shortCode;
  }

  if (savedCurrency && navCurrency) {
    // currency name is like "USD – $", extract the symbol after "–"
    const symbol = savedCurrency.name.split("–")[1]?.trim();
    navCurrency.textContent = symbol || savedCurrency.name;
  }
}

// ── Mark active items from sessionStorage ───────────────────────────────────
function setActiveItems() {
  const savedCountry = JSON.parse(sessionStorage.getItem("country"));
  const savedCurrency = JSON.parse(sessionStorage.getItem("currency"));

  // Country items
  const countryItems = currencyMenu?.querySelectorAll(
    ".cl_list_wrapper .clist_item",
  );
  countryItems?.forEach(function (item, index) {
    const code = item.getAttribute("data-short-cl");
    const isMatch = savedCountry
      ? savedCountry.shortCode === code
      : index === 0;
    item.classList.toggle("active", isMatch);
  });

  // Currency items
  const currencyItems = currencyMenu?.querySelectorAll(
    ".carrency_list_wrapper .clist_item",
  );
  currencyItems?.forEach(function (item, index) {
    const code = item.getAttribute("data-short-currency");
    const isMatch = savedCurrency
      ? savedCurrency.shortCode === code
      : index === 0;
    item.classList.toggle("active", isMatch);
  });
}

// Run on page load
updateNavDisplay();
setActiveItems();

// ── Toggle dropdown open/close ──────────────────────────────────────────────
currencyTrigger?.addEventListener("click", function (e) {
  e.preventDefault();
  e.stopPropagation();
  const isOpen = currencyMenu.classList.toggle("currency_open");
  document.body.classList.toggle("currency_menu_open", isOpen);
});

// ── Close when clicking outside ─────────────────────────────────────────────
document.addEventListener("click", function (e) {
  if (!currencyMenu?.contains(e.target)) {
    currencyMenu?.classList.remove("currency_open");
    document.body.classList.remove("currency_menu_open");
  }
});

// ── Country item click → save & update display ──────────────────────────────
const countryItems = currencyMenu?.querySelectorAll(
  ".cl_list_wrapper .clist_item",
);
countryItems?.forEach(function (item) {
  item.addEventListener("click", function () {
    const name = item.querySelector(".clist_para")?.textContent.trim();
    const shortCode = item.getAttribute("data-short-cl");
    sessionStorage.setItem(
      "country",
      JSON.stringify({ name: name, shortCode: shortCode }),
    );
    location.reload();
  });
});

// ── Currency item click → save & update display ─────────────────────────────
const currencyItems = currencyMenu?.querySelectorAll(
  ".carrency_list_wrapper .clist_item",
);
currencyItems?.forEach(function (item) {
  item.addEventListener("click", function () {
    const name = item.querySelector(".clist_para")?.textContent.trim();
    const shortCode = item.getAttribute("data-short-currency");
    const apiCurrency = item.getAttribute("data_api_currency");
    sessionStorage.setItem(
      "currency",
      JSON.stringify({
        name: name,
        shortCode: shortCode,
        api_currency: apiCurrency,
      }),
    );
    location.reload();
  });
});
