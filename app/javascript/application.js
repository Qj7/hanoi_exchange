// Entry point for the build script in your package.json
import "@hotwired/turbo-rails";
import "./controllers";

import Choices from "choices.js";

function hideLoader() {
  const loader = document.getElementById("loadWrapper");
  if (loader) {
    loader.classList.add("hidden");
  }
}

document.addEventListener("turbo:before-render", function () {
  const loader = document.getElementById("loadWrapper");
  if (loader) {
    loader.classList.remove("hidden");
  }
});

document.addEventListener("turbo:load", hideLoader);

document.addEventListener("DOMContentLoaded", function () {
  // Удаляем класс 'loading' после полной загрузки страницы, чтобы отобразить содержимое
  document.body.classList.remove("loading");

  // Скрываем лоадер
  hideLoader();

  // Инициализация Choices.js для всех select элементов с классом .custom-select
  const elements = document.querySelectorAll(".custom-select");
  elements.forEach((element) => {
    new Choices(element, {
      removeItemButton: true,
      searchEnabled: false
    });
  });
});
