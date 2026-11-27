(function () {
  var button = document.querySelector(".menu");
  var menu = document.querySelector(".links");
  if (!button || !menu) return;

  var openLabel = button.getAttribute("data-label-open") || "Close";
  var closedLabel = button.getAttribute("data-label-closed") || button.textContent.trim();

  function setOpen(open) {
    button.setAttribute("aria-expanded", open ? "true" : "false");
    menu.classList.toggle("open", open);
    button.textContent = open ? openLabel : closedLabel;
  }

  button.addEventListener("click", function () {
    setOpen(button.getAttribute("aria-expanded") !== "true");
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      button.focus();
    }
  });

  document.addEventListener("click", function (event) {
    if (button.getAttribute("aria-expanded") !== "true") return;
    if (button.contains(event.target) || menu.contains(event.target)) return;
    setOpen(false);
  });
})();
