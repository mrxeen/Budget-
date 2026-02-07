const monthlyIncomeInput = document.querySelector("#monthly-income");
const dailyBudgetInput = document.querySelector("#daily-budget");
const calendar = document.querySelector("#calendar");
const monthLabel = document.querySelector("#month-label");
const totalIncomeLabel = document.querySelector("#total-income");
const totalExpensesLabel = document.querySelector("#total-expenses");
const totalAvailableLabel = document.querySelector("#total-available");
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
  const additionalIncome = entries
    .filter((entry) => entry.type === "income")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const expenses = entries
    .filter((entry) => entry.type === "expense")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const available = baseIncome + additionalIncome - expenses;
  return { baseIncome, additionalIncome, expenses, available };
};

const getDailyBudget = (available, daysInMonth) =>
  daysInMonth > 0 ? available / daysInMonth : 0;

const renderCalendar = () => {
  const { daysInMonth, label } = getCurrentMonthInfo();
  const { available } = getTotals();
  const dailyBudget = getDailyBudget(available, daysInMonth);
  monthLabel.textContent = `Kalender für ${label}`;
  dailyBudgetInput.value = formatCurrency(dailyBudget);

  calendar.innerHTML = "";
  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayEntries = entries.filter((entry) => entry.day === day);
    const dailyAdjustment = dayEntries.reduce((sum, entry) => {
      return entry.type === "income" ? sum + entry.amount : sum - entry.amount;
    }, 0);
    const remaining = dailyBudget + dailyAdjustment;

    const card = document.createElement("article");
    card.className = "day-card";
    card.innerHTML = `
      <div>
        <h4>Tag ${day}</h4>
        <p class="note">Tagesgeld: ${formatCurrency(dailyBudget)}</p>
      </div>
      <div>
        <div class="remaining">${formatCurrency(remaining)}</div>
        <p class="note">Übrig nach Einträgen</p>
      </div>
    `;
    calendar.appendChild(card);
  }
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
  const { baseIncome, additionalIncome, expenses, available } = getTotals();
  totalIncomeLabel.textContent = formatCurrency(baseIncome + additionalIncome);
  totalExpensesLabel.textContent = formatCurrency(expenses);
  totalAvailableLabel.textContent = formatCurrency(available);
};

const updateUI = () => {
  updateTotals();
  renderEntries();
  renderCalendar();
};

monthlyIncomeInput.addEventListener("input", updateUI);

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
