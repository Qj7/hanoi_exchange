import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = [
    "fromCurrency", "toCurrency", "amountInput", "calculatedOutput",
    "inputCurrencyLabel", "outputCurrencyLabel", "form", "sumField", "toReceiveAmount"
  ];

  connect() {
    this.updateLabels();
    this.amountInputTarget.value = "";

    // Поп-ап элементы
    this.popup = document.getElementById("popup");
    this.popupClose = document.getElementById("popupClose");

    if (this.popupClose) {
      this.popupClose.addEventListener("click", () => this.hidePopup());
    }
  }

  toggleExchange() {
    const fromValue = this.fromCurrencyTarget.value;
    const toValue = this.toCurrencyTarget.value;

    this.fromCurrencyTarget.value = toValue;
    this.toCurrencyTarget.value = fromValue;

    this.updateLabels();
    this.calculateAmount();
  }

  updateLabels() {
    this.inputCurrencyLabelTarget.textContent = this.fromCurrencyTarget.value;
    this.outputCurrencyLabelTarget.textContent = this.toCurrencyTarget.value;
  }

  formatNumberWithSpaces(value) {
    return value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  formatCurrencyOnInput(event) {
    let input = event.target;
    let caretPos = input.selectionStart;

    input.value = this.formatNumberWithSpaces(input.value);
    input.setSelectionRange(caretPos, caretPos);
  }

  formatCurrencyOnBlur() {
    let value = this.amountInputTarget.value.replace(/\s/g, '');
    this.amountInputTarget.value = this.formatNumberWithSpaces(value);
  }

  calculateAmount() {
    const fromCurrency = this.fromCurrencyTarget.value;
    const toCurrency = this.toCurrencyTarget.value;
    const amountValue = this.amountInputTarget.value.replace(/\s/g, '');
    const amount = parseFloat(amountValue) || 0;

    if (!amount || fromCurrency === toCurrency) {
      this.calculatedOutputTarget.textContent = "Выберите разные валюты или введите сумму.";
      return;
    }

    fetch("/calculate_exchange", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector("meta[name='csrf-token']").getAttribute("content")
      },
      body: JSON.stringify({
        from_currency: fromCurrency,
        to_currency: toCurrency,
        amount: amount
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.converted_amount !== undefined && !isNaN(data.converted_amount)) {
        const convertedAmount = parseInt(data.converted_amount); // Преобразуем результат в целое число
        this.calculatedOutputTarget.textContent = this.formatNumberWithSpaces(
          convertedAmount.toString() // Отображаем как строку
        );
        this.sumFieldTarget.value = amountValue;
        this.toReceiveAmountTarget.value = convertedAmount.toString();
      } else {
        console.error("Ошибка при расчете: данные не содержат корректное число.");
        this.calculatedOutputTarget.textContent = "Курс недоступен";
      }
    })
    .catch(error => {
      console.error("Ошибка при расчете:", error);
      this.calculatedOutputTarget.textContent = "Ошибка при расчете";
    });
  }

  showPopup() {
    this.popup.classList.remove("hidden");
    setTimeout(() => this.hidePopup(), 3000);
  }

  hidePopup() {
    this.popup.classList.add("hidden");
  }

  submitRequest() {
    this.sumFieldTarget.value = this.amountInputTarget.value.replace(/\s/g, '');
    this.formTarget.requestSubmit();
    this.showPopup();
    this.amountInputTarget.value = "";
  }
}
