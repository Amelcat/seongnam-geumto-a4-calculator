const START_YEAR = 2026;
const START_MONTH = 11;
const HOPE_RATE = 0.013;
const LOAN_LIMIT = 400000000;
const BALCONY_PRICES = {
  "55A": 6529000,
  "55B": 6033000,
  "55C": 4378000,
  "55D": 5752000,
  "55E": 4753000,
  "55F": 6783000,
};
const MINUS_OPTION_BALCONY_PRICES = {
  "55A": 5550000,
  "55B": 5128000,
  "55C": 3721000,
  "55D": 4890000,
  "55E": 4040000,
  "55F": 5766000,
};
const HOUSING_PRICES = {
  "55A": {
    "1층": { "기본형": 584590000, "마이너스옵션": 557634000 },
    "2층": { "기본형": 590810000, "마이너스옵션": 563854000 },
    "3층": { "기본형": 603250000, "마이너스옵션": 576294000 },
    "4층": { "기본형": 615690000, "마이너스옵션": 588734000 },
    "5층~최상층": { "기본형": 621910000, "마이너스옵션": 594954000 },
  },
  "55B": {
    "1층": { "기본형": 586660000, "마이너스옵션": 558147000 },
    "2층": { "기본형": 592900000, "마이너스옵션": 564387000 },
    "3층": { "기본형": 605380000, "마이너스옵션": 576867000 },
    "4층": { "기본형": 617860000, "마이너스옵션": 589347000 },
    "5층~최상층": { "기본형": 624110000, "마이너스옵션": 595597000 },
  },
  "55C": {
    "1층": { "기본형": 578920000, "마이너스옵션": 552225000 },
    "2층": { "기본형": 585080000, "마이너스옵션": 558385000 },
    "3층": { "기본형": 597400000, "마이너스옵션": 570705000 },
    "4층": { "기본형": 609720000, "마이너스옵션": 583025000 },
    "5층~최상층": { "기본형": 615880000, "마이너스옵션": 589185000 },
  },
  "55D": {
    "1층": { "기본형": 584550000, "마이너스옵션": 557596000 },
    "2층": { "기본형": 590770000, "마이너스옵션": 563816000 },
    "3층": { "기본형": 603210000, "마이너스옵션": 576256000 },
    "4층": { "기본형": 615650000, "마이너스옵션": 588696000 },
    "5층~최상층": { "기본형": 621870000, "마이너스옵션": 594916000 },
  },
  "55E": {
    "1층": { "기본형": 589130000, "마이너스옵션": 561965000 },
    "2층": { "기본형": 595400000, "마이너스옵션": 568235000 },
    "3층": { "기본형": 607930000, "마이너스옵션": 580765000 },
    "4층": { "기본형": 620470000, "마이너스옵션": 593305000 },
    "5층~최상층": { "기본형": 626740000, "마이너스옵션": 599575000 },
  },
  "55F": {
    "1층": { "기본형": 586450000, "마이너스옵션": 559408000 },
    "2층": { "기본형": 592690000, "마이너스옵션": 565648000 },
    "3층": { "기본형": 605170000, "마이너스옵션": 578128000 },
    "4층": { "기본형": 617650000, "마이너스옵션": 590608000 },
    "5층~최상층": { "기본형": 623890000, "마이너스옵션": 596848000 },
  },
};
const LTV_BUCKETS = [30, 40, 50, 60, 70];
const BASE_RATES = {
  70: [50, 40, 30],
  60: [45, 35, 25],
  50: [40, 30, 20],
  40: [35, 25, 15],
  30: [30, 20, 10],
};
const MIN_RATES = {
  70: [20, 15, 10],
  60: [10, 10, 10],
  50: [10, 10, 10],
  40: [10, 10, 10],
  30: [10, 10, 10],
};

const form = document.querySelector("#calculatorForm");
const housingTypeInput = document.querySelector("#housingType");
const floorTypeInput = document.querySelector("#floorType");
const optionTypeInput = document.querySelector("#optionType");
const balconyExpansionInput = document.querySelector("#balconyExpansion");
const optionPriceInput = document.querySelector("#optionPrice");
const loanAmountInput = document.querySelector("#loanAmount");
const sellPriceInput = document.querySelector("#sellPrice");
const childrenInput = document.querySelector("#children");
const holdingYearsInput = document.querySelector("#holdingYears");
const normalRateInput = document.querySelector("#normalRate");
const loanTermInput = document.querySelector("#loanTerm");
const ltvHint = document.querySelector("#ltvHint");
const growthHint = document.querySelector("#growthHint");
const purchasePriceDisplay = document.querySelector("#purchasePriceDisplay");
const purchasePriceHint = document.querySelector("#purchasePriceHint");
const tableCaption = document.querySelector("#tableCaption");
const settlementTableBody = document.querySelector("#settlementTable tbody");
const ltvButtons = Array.from(document.querySelectorAll("[data-ltv]"));

const settlementTable = buildSettlementTable();

init();

function init() {
  updateHoldingYearOptions();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    calculate();
  });

  [housingTypeInput, floorTypeInput, optionTypeInput, balconyExpansionInput].forEach((input) => {
    input.addEventListener("input", () => {
      updateHoldingYearOptions();
      calculate();
    });
  });

  optionPriceInput.addEventListener("input", () => {
    optionPriceInput.value = formatNumber(parseMoneyInput(optionPriceInput.value));
    updateHoldingYearOptions();
    calculate();
  });

  loanAmountInput.addEventListener("input", () => {
    loanAmountInput.value = formatNumber(parseMoneyInput(loanAmountInput.value));
    updateHoldingYearOptions();
    calculate();
  });

  sellPriceInput.addEventListener("input", () => {
    sellPriceInput.value = formatNumber(parseMoneyInput(sellPriceInput.value));
    calculate();
  });

  childrenInput.addEventListener("input", () => {
    updateHoldingYearOptions();
    calculate();
  });

  [holdingYearsInput, normalRateInput, loanTermInput].forEach((input) => {
    input.addEventListener("input", calculate);
  });

  ltvButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const ltv = Number(button.dataset.ltv);
      const loanAmount = Math.min(getLtvPurchasePrice() * (ltv / 100), LOAN_LIMIT);
      loanAmountInput.value = formatNumber(Math.round(loanAmount));
      updateHoldingYearOptions();
      calculate();
    });
  });

  calculate();
}

function updateHoldingYearOptions() {
  const selectedYear = holdingYearsInput.value || "10";
  const children = Number(childrenInput.value);
  const loanAmount = parseMoneyInput(loanAmountInput.value);
  const ltvPurchasePrice = getLtvPurchasePrice();
  const ltv = loanAmount > 0 ? (loanAmount / ltvPurchasePrice) * 100 : 0;
  const bucket = getLtvBucket(ltv);

  holdingYearsInput.textContent = "";

  for (let year = 1; year <= 30; year += 1) {
    const option = document.createElement("option");
    const shareRate = bucket ? settlementTable[bucket][year][children] : 0;
    option.value = String(year);
    option.textContent = `${formatSaleDate(year)} (${year}년 후, 환수율 ${shareRate}%)`;
    holdingYearsInput.append(option);
  }

  holdingYearsInput.value = selectedYear;
}

function buildSettlementTable() {
  return LTV_BUCKETS.reduce((table, bucket) => {
    table[bucket] = [];

    for (let year = 1; year <= 30; year += 1) {
      const reduction = year < 10 ? 0 : (year - 9) * 2;
      table[bucket][year] = BASE_RATES[bucket].map((rate, index) => {
        return Math.max(MIN_RATES[bucket][index], rate - reduction);
      });
    }

    return table;
  }, {});
}

function calculate() {
  const basePurchasePrice = getBasePurchasePrice();
  const balconyPrice = getBalconyPrice();
  const ltvPurchasePrice = basePurchasePrice + balconyPrice;
  const optionPrice = parseMoneyInput(optionPriceInput.value);
  const purchasePrice = ltvPurchasePrice + optionPrice;
  const loanAmount = parseMoneyInput(loanAmountInput.value);
  const sellPrice = parseMoneyInput(sellPriceInput.value);
  const children = Number(childrenInput.value);
  const holdingYears = Number(holdingYearsInput.value);
  const normalRate = Number(normalRateInput.value) / 100;
  const loanTerm = Number(loanTermInput.value);
  const gain = sellPrice - purchasePrice;
  const ltv = loanAmount > 0 ? (loanAmount / ltvPurchasePrice) * 100 : 0;
  const bucket = getLtvBucket(ltv);
  const shareRate = gain > 0 && bucket ? settlementTable[bucket][holdingYears][children] : 0;
  const shareAmount = gain > 0 ? gain * (shareRate / 100) : 0;
  const hopeLoan = calcLoanDetails(loanAmount, HOPE_RATE, loanTerm, holdingYears, 1);
  const normalLoan = calcLoanDetails(loanAmount, normalRate, 30, holdingYears, 0);
  const hopeProfit = gain - shareAmount - hopeLoan.totalInterest;
  const normalProfit = gain - normalLoan.totalInterest;
  const diff = hopeProfit - normalProfit;

  updatePurchasePrice(basePurchasePrice, balconyPrice, optionPrice, purchasePrice);
  updateHints(purchasePrice, loanAmount, sellPrice, holdingYears, ltv, bucket);
  updateActiveLtvButton(ltvPurchasePrice);
  updateResults({
    bucket,
    diff,
    gain,
    holdingYears,
    hopeLoan,
    hopeProfit,
    normalLoan,
    normalProfit,
    shareAmount,
    shareRate,
  });
  renderSettlementTable(bucket || 30, holdingYears, children);
}

function updatePurchasePrice(basePurchasePrice, balconyPrice, optionPrice, purchasePrice) {
  purchasePriceDisplay.textContent = formatWon(purchasePrice);
  purchasePriceHint.textContent = `선택 주택가격 ${formatWon(basePurchasePrice)} · 발코니 ${formatWon(balconyPrice)} · 옵션 ${formatWon(optionPrice)}`;
}

function updateHints(purchasePrice, loanAmount, sellPrice, holdingYears, ltv, bucket) {
  if (loanAmount > LOAN_LIMIT) {
    ltvHint.textContent = `대출한도 400,000,000원을 초과했습니다. 현재 LTV ${ltv.toFixed(1)}% (발코니 포함, 옵션 가격 제외)`;
    ltvHint.classList.add("is-warning");
  } else if (bucket) {
    ltvHint.textContent = `LTV ${ltv.toFixed(1)}%, 정산표 ${bucket}% 구간 (발코니 포함, 옵션 가격 제외)`;
    ltvHint.classList.remove("is-warning");
  } else {
    ltvHint.textContent = "LTV 30% 미만은 환수율 0%로 계산합니다. (발코니 포함, 옵션 가격 제외)";
    ltvHint.classList.remove("is-warning");
  }

  if (sellPrice > 0) {
    const growthRate = (Math.pow(sellPrice / purchasePrice, 1 / holdingYears) - 1) * 100;
    growthHint.textContent = `연평균 상승률 ${growthRate.toFixed(2)}%`;
  } else {
    growthHint.textContent = "";
  }
}

function updateActiveLtvButton(ltvPurchasePrice) {
  ltvButtons.forEach((button) => {
    const targetLoan = Math.min(ltvPurchasePrice * (Number(button.dataset.ltv) / 100), LOAN_LIMIT);
    const currentLoan = parseMoneyInput(loanAmountInput.value);
    button.classList.toggle("is-active", Math.abs(currentLoan - targetLoan) <= 1);
  });
}

function getBasePurchasePrice() {
  const optionType = optionTypeInput.checked ? "마이너스옵션" : "기본형";
  return HOUSING_PRICES[housingTypeInput.value][floorTypeInput.value][optionType];
}

function getBalconyPrice() {
  if (!balconyExpansionInput.checked) return 0;

  const prices = optionTypeInput.checked
    ? MINUS_OPTION_BALCONY_PRICES
    : BALCONY_PRICES;
  return prices[housingTypeInput.value];
}

function getLtvPurchasePrice() {
  return getBasePurchasePrice() + getBalconyPrice();
}

function updateResults(result) {
  document.querySelector("#gainResult").textContent = formatWon(result.gain);
  document.querySelector("#shareRateResult").textContent = `${result.shareRate}%`;
  document.querySelector("#shareAmountResult").textContent = formatWon(result.shareAmount);
  document.querySelector("#holdingResult").textContent = `${result.holdingYears}년`;
  document.querySelector("#hopeInterestResult").textContent = formatWon(result.hopeLoan.totalInterest);
  document.querySelector("#normalInterestResult").textContent = formatWon(result.normalLoan.totalInterest);
  document.querySelector("#hopeProfitResult").textContent = formatWon(result.hopeProfit);
  document.querySelector("#normalProfitResult").textContent = formatWon(result.normalProfit);
  document.querySelector("#hopeGracePayment").textContent = formatWon(result.hopeLoan.monthlyInterestOnly);
  document.querySelector("#hopeFullPayment").textContent = formatWon(result.hopeLoan.monthlyFull);
  document.querySelector("#normalPaymentResult").textContent = formatWon(result.normalLoan.monthlyFull);

  const verdict = document.querySelector("#verdict");
  verdict.classList.toggle("is-warning", result.diff < 0);

  if (result.diff > 0) {
    verdict.textContent = `신희타가 일반대출보다 약 ${formatWon(result.diff)} 유리합니다.`;
  } else if (result.diff < 0) {
    verdict.textContent = `일반대출이 신희타보다 약 ${formatWon(Math.abs(result.diff))} 유리합니다.`;
  } else {
    verdict.textContent = "두 방식의 최종 수익이 같습니다.";
  }
}

function renderSettlementTable(bucket, selectedYear, selectedChildren) {
  tableCaption.textContent = `${bucket}% 구간`;
  settlementTableBody.textContent = "";

  for (let year = 1; year <= 30; year += 1) {
    const row = document.createElement("tr");
    row.classList.toggle("is-selected", year === selectedYear);

    const yearCell = document.createElement("td");
    yearCell.textContent = `${year}년`;
    row.append(yearCell);

    settlementTable[bucket][year].forEach((rate, index) => {
      const cell = document.createElement("td");
      cell.textContent = `${rate}%`;
      if (year === selectedYear && index === selectedChildren) {
        cell.setAttribute("aria-current", "true");
      }
      row.append(cell);
    });

    settlementTableBody.append(row);
  }
}

function getLtvBucket(ltv) {
  if (ltv < 30) return null;
  return Math.min(70, Math.max(30, Math.ceil(ltv / 10) * 10));
}

function calcLoanDetails(principal, annualRate, totalYears, holdYears, graceYears) {
  if (principal <= 0 || annualRate < 0) {
    return { totalInterest: 0, monthlyInterestOnly: 0, monthlyFull: 0 };
  }

  const monthlyRate = annualRate / 12;
  const totalMonths = totalYears * 12;
  const graceMonths = graceYears * 12;
  const holdMonths = holdYears * 12;
  const repayMonths = totalMonths - graceMonths;
  const monthlyInterestOnly = principal * monthlyRate;
  const monthlyFull = monthlyRate === 0
    ? principal / repayMonths
    : principal * (monthlyRate * Math.pow(1 + monthlyRate, repayMonths)) / (Math.pow(1 + monthlyRate, repayMonths) - 1);

  let totalInterest = 0;
  let balance = principal;

  for (let month = 1; month <= holdMonths; month += 1) {
    const interest = balance * monthlyRate;
    totalInterest += interest;

    if (month > graceMonths) {
      balance -= monthlyFull - interest;
      if (balance <= 0) break;
    }
  }

  return { totalInterest, monthlyInterestOnly, monthlyFull };
}

function formatSaleDate(yearOffset) {
  const date = new Date(START_YEAR, START_MONTH - 1 + yearOffset * 12, 1);
  return `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(2, "0")}월`;
}

function parseMoneyInput(value) {
  return Number(String(value).replace(/[^\d]/g, "")) || 0;
}

function formatWon(value) {
  return `${formatNumber(Math.round(value))}원`;
}

function formatNumber(value) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
