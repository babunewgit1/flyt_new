//! open modal and close modal
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
