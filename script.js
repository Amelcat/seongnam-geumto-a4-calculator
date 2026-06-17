const PURCHASE_PRICE = 63000;
const START_YEAR = 2026;
const START_MONTH = 11;
const HOPE_RATE = 0.013;
const LOAN_LIMIT = 40000;
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
const loanAmountInput = document.querySelector("#loanAmount");
const sellPriceInput = document.querySelector("#sellPrice");
const childrenInput = document.querySelector("#children");
const holdingYearsInput = document.querySelector("#holdingYears");
const normalRateInput = document.querySelector("#normalRate");
const loanTermInput = document.querySelector("#loanTerm");
const ltvHint = document.querySelector("#ltvHint");
const growthHint = document.querySelector("#growthHint");
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
      const loanAmount = Math.min(PURCHASE_PRICE * (ltv / 100), LOAN_LIMIT);
      loanAmountInput.value = formatWonInputFromManwon(loanAmount);
      updateHoldingYearOptions();
      calculate();
    });
  });

  calculate();
}

function updateHoldingYearOptions() {
  const selectedYear = holdingYearsInput.value || "10";
  const children = Number(childrenInput.value);
  const loanAmount = parseWonToManwon(loanAmountInput.value);
  const ltv = loanAmount > 0 ? (loanAmount / PURCHASE_PRICE) * 100 : 0;
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
  const loanAmount = parseWonToManwon(loanAmountInput.value);
  const sellPrice = parseWonToManwon(sellPriceInput.value);
  const children = Number(childrenInput.value);
  const holdingYears = Number(holdingYearsInput.value);
  const normalRate = Number(normalRateInput.value) / 100;
  const loanTerm = Number(loanTermInput.value);
  const gain = sellPrice - PURCHASE_PRICE;
  const ltv = loanAmount > 0 ? (loanAmount / PURCHASE_PRICE) * 100 : 0;
  const bucket = getLtvBucket(ltv);
  const shareRate = gain > 0 && bucket ? settlementTable[bucket][holdingYears][children] : 0;
  const shareAmount = gain > 0 ? gain * (shareRate / 100) : 0;
  const hopeLoan = calcLoanDetails(loanAmount, HOPE_RATE, loanTerm, holdingYears, 1);
  const normalLoan = calcLoanDetails(loanAmount, normalRate, 30, holdingYears, 0);
  const hopeProfit = gain - shareAmount - hopeLoan.totalInterest;
  const normalProfit = gain - normalLoan.totalInterest;
  const diff = hopeProfit - normalProfit;

  updateHints(loanAmount, sellPrice, holdingYears, ltv, bucket);
  updateActiveLtvButton(ltv);
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

function updateHints(loanAmount, sellPrice, holdingYears, ltv, bucket) {
  if (loanAmount > LOAN_LIMIT) {
    ltvHint.textContent = `대출한도 4억원을 초과했습니다. 현재 LTV ${ltv.toFixed(1)}%`;
    ltvHint.classList.add("is-warning");
  } else if (bucket) {
    ltvHint.textContent = `LTV ${ltv.toFixed(1)}%, 정산표 ${bucket}% 구간`;
    ltvHint.classList.remove("is-warning");
  } else {
    ltvHint.textContent = "LTV 30% 미만은 환수율 0%로 계산합니다.";
    ltvHint.classList.remove("is-warning");
  }

  if (sellPrice > 0) {
    const growthRate = (Math.pow(sellPrice / PURCHASE_PRICE, 1 / holdingYears) - 1) * 100;
    growthHint.textContent = `연평균 상승률 ${growthRate.toFixed(2)}%`;
  } else {
    growthHint.textContent = "";
  }
}

function updateActiveLtvButton(ltv) {
  ltvButtons.forEach((button) => {
    const targetLoan = Math.min(PURCHASE_PRICE * (Number(button.dataset.ltv) / 100), LOAN_LIMIT);
    const currentLoan = parseWonToManwon(loanAmountInput.value);
    button.classList.toggle("is-active", Math.abs(currentLoan - targetLoan) <= 1);
  });
}

function updateResults(result) {
  document.querySelector("#gainResult").textContent = formatWonFromManwon(result.gain);
  document.querySelector("#shareRateResult").textContent = `${result.shareRate}%`;
  document.querySelector("#shareAmountResult").textContent = formatWonFromManwon(result.shareAmount);
  document.querySelector("#holdingResult").textContent = `${result.holdingYears}년`;
  document.querySelector("#hopeInterestResult").textContent = formatWonFromManwon(result.hopeLoan.totalInterest);
  document.querySelector("#normalInterestResult").textContent = formatWonFromManwon(result.normalLoan.totalInterest);
  document.querySelector("#hopeProfitResult").textContent = formatWonFromManwon(result.hopeProfit);
  document.querySelector("#normalProfitResult").textContent = formatWonFromManwon(result.normalProfit);
  document.querySelector("#hopeGracePayment").textContent = `${formatNumber(Math.round(result.hopeLoan.monthlyInterestOnly * 10000))}원`;
  document.querySelector("#hopeFullPayment").textContent = `${formatNumber(Math.round(result.hopeLoan.monthlyFull * 10000))}원`;
  document.querySelector("#normalPaymentResult").textContent = `${formatNumber(Math.round(result.normalLoan.monthlyFull * 10000))}원`;

  const verdict = document.querySelector("#verdict");
  verdict.classList.toggle("is-warning", result.diff < 0);

  if (result.diff > 0) {
    verdict.textContent = `신희타가 일반대출보다 약 ${formatWonFromManwon(result.diff)} 유리합니다.`;
  } else if (result.diff < 0) {
    verdict.textContent = `일반대출이 신희타보다 약 ${formatWonFromManwon(Math.abs(result.diff))} 유리합니다.`;
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

function parseWonToManwon(value) {
  return parseMoneyInput(value) / 10000;
}

function formatWonInputFromManwon(value) {
  return formatNumber(Math.round(value * 10000));
}

function formatWonFromManwon(value) {
  return `${formatWonInputFromManwon(value)}원`;
}

function formatNumber(value) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
