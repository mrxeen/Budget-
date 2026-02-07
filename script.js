const monthlyIncomeInput = document.querySelector("#monthly-income");
const monthlySavingsInput = document.querySelector("#monthly-savings");
const dailyBudgetInput = document.querySelector("#daily-budget");
const calendar = document.querySelector("#calendar");
const weekdayRow = document.querySelector("#weekday-row");
const monthLabel = document.querySelector("#month-label");
const totalIncomeLabel = document.querySelector("#total-income");
const totalExpensesLabel = document.querySelector("#total-expenses");
const totalAvailableLabel = document.querySelector("#total-available");
const predictedSavingsLabel = document.querySelector("#predicted-savings");
const entryList = document.querySelector("#entry-list");

const modal = document.querySelector("#entry-modal");
const openModalButton = document.querySelector("#open-modal");
const closeModalButton = document.querySelector("#close-modal");
const entryForm = document.querySelector("#entry-form");
const entryType = document.querySelector("#entry-type");
const entryDescription = document.querySelector("#entry-description");
const entryAmount = document.querySelector("#entry-amount");
const entryDay = document.querySelector("#entry-day");

const entries = [];

const formatCurrency = (value) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);

const getCurrentMonthInfo = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const label = now.toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });
  return { year, month, daysInMonth, label };
};

const getTotals = () => {
  const baseIncome = Number(monthlyIncomeInput.value) || 0;
  const savings = Number(monthlySavingsInput.value) || 0;
  const additionalIncome = entries
    .filter((entry) => entry.type === "income")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const expenses = entries
    .filter((entry) => entry.type === "expense")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const available = baseIncome - savings + additionalIncome - expenses;
  return { baseIncome, savings, additionalIncome, expenses, available };
};

const getDailyBudget = (baseIncome, savings, daysInMonth) => {
  const distributable = baseIncome - savings;
  return daysInMonth > 0 ? distributable / daysInMonth : 0;
};

const renderCalendar = () => {
  const { daysInMonth, label, month, year } = getCurrentMonthInfo();
  const { baseIncome, savings, available } = getTotals();
  const dailyBudget = getDailyBudget(baseIncome, savings, daysInMonth);
  const weekdayLabels = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  monthLabel.textContent = `Kalender für ${label}`;
  dailyBudgetInput.value = formatCurrency(dailyBudget);
  entryDay.max = String(daysInMonth);

  weekdayRow.innerHTML = "";
  weekdayLabels.forEach((labelText) => {
    const labelItem = document.createElement("span");
    labelItem.textContent = labelText;
    weekdayRow.appendChild(labelItem);
  });

  calendar.innerHTML = "";
  for (let slot = 0; slot < firstDayIndex; slot += 1) {
    const empty = document.createElement("div");
    empty.className = "day-card empty-slot";
    calendar.appendChild(empty);
  }

  let carryover = 0;
  let remainingMonthly = available;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayEntries = entries.filter((entry) => entry.day === day);
    const dailyAdjustment = dayEntries.reduce((sum, entry) => {
      return entry.type === "income" ? sum + entry.amount : sum - entry.amount;
    }, 0);
    const baseWithCarryover = dailyBudget + carryover;
    const remaining = baseWithCarryover + dailyAdjustment;
    remainingMonthly = remainingMonthly - dailyBudget + dailyAdjustment;

    const card = document.createElement("article");
    card.className = "day-card";
    const entryNotes = dayEntries
      .map(
        (entry) =>
          `${entry.description || "Eintrag"}: ${formatCurrency(
            entry.type === "income" ? entry.amount : -entry.amount
          )}`
      )
      .join("<br />");
    card.innerHTML = `
      <div>
        <h4>Tag ${day}</h4>
        <p class="note">Tagesgeld: ${formatCurrency(dailyBudget)}</p>
        <p class="carryover">Übertrag: ${formatCurrency(carryover)}</p>
      </div>
      <div>
        <div class="remaining">${formatCurrency(remaining)}</div>
        <p class="note">Restbudget Monat: ${formatCurrency(remainingMonthly)}</p>
        ${entryNotes ? `<p class="note">${entryNotes}</p>` : ""}
      </div>
    `;
    calendar.appendChild(card);
    carryover = remaining;
  }
  return carryover;
};

const renderEntries = () => {
  entryList.innerHTML = "";
  entries.forEach((entry, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <strong>${entry.description || "Ohne Beschreibung"}</strong>
        <div class="note">Tag ${entry.day || "-"}</div>
      </div>
      <div>
        <span class="pill ${entry.type}">${
          entry.type === "income" ? "Einkommen" : "Ausgabe"
        }</span>
        <strong>${formatCurrency(entry.amount)}</strong>
      </div>
      <button type="button" data-index="${index}" class="text-button">Entfernen</button>
    `;
    entryList.appendChild(li);
  });
};

const updateTotals = () => {
  const { baseIncome, savings, additionalIncome, expenses, available } =
    getTotals();
  totalIncomeLabel.textContent = formatCurrency(baseIncome + additionalIncome);
  totalExpensesLabel.textContent = formatCurrency(expenses);
  totalAvailableLabel.textContent = formatCurrency(available);
  predictedSavingsLabel.textContent = formatCurrency(savings);
};

const updateUI = () => {
  updateTotals();
  renderEntries();
  const predictedSavings = renderCalendar();
  predictedSavingsLabel.textContent = formatCurrency(predictedSavings);
};

monthlyIncomeInput.addEventListener("input", updateUI);
monthlySavingsInput.addEventListener("input", updateUI);

openModalButton.addEventListener("click", () => {
  modal.showModal();
});

closeModalButton.addEventListener("click", () => {
  modal.close();
});

entryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const amount = Number(entryAmount.value);
  if (!amount) {
    return;
  }
  entries.push({
    type: entryType.value,
    description: entryDescription.value.trim(),
    amount,
    day: Number(entryDay.value) || null,
  });
  entryForm.reset();
  modal.close();
  updateUI();
});

entryList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-index]");
  if (!button) return;
  const index = Number(button.dataset.index);
  entries.splice(index, 1);
  updateUI();
});

updateUI();
