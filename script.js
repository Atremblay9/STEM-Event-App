const envelopes = {
  BA: ["20", "5", "USIOP"],
  DEV: ["BDEAC", "20", "1110"],
  QA: ["SPELL", "UHOH", "NOTHX"],
};

// Facilitator passwords for each section
const facilitatorPasswords = {
  BA: "BA2026",
  DEV: "DEV2026",
  QA: "QA2026",
};

const phoneDigits = {
  A: "1", B: "1", C: "1",
  D: "2", E: "2", F: "2",
  G: "3", H: "3", I: "3",
  J: "4", K: "4", L: "4",
  M: "5", N: "5", O: "5",
  P: "6", Q: "6", R: "6", S: "6",
  T: "7", U: "7", V: "7",
  W: "8", X: "8", Y: "8", Z: "8",
};

const sectionNames = ["BA", "DEV", "QA"];

let currentSectionIndex = 0;
let currentEnvelopeIndex = 0;
let currentInput = "";
let timerExpired = false;
let countdownSeconds = 60 * 60; // 60 minutes
let timerInterval = null;

const screen = document.getElementById("screen");
const timerElement = document.getElementById("timer");
const message = document.getElementById("message");
const targetLabel = document.getElementById("target-label");
const overview = document.getElementById("envelope-overview");

function codeToDigits(code) {
  return code
    .toString()
    .toUpperCase()
    .split("")
    .map((char) => {
      if (/^[0-9]$/.test(char)) return char;
      return phoneDigits[char] || "";
    })
    .join("");
}

function getCurrentSection() {
  return sectionNames[currentSectionIndex];
}

function getCurrentCode() {
  const section = getCurrentSection();
  return envelopes[section][currentEnvelopeIndex];
}

function getCurrentCodeDigits() {
  return codeToDigits(getCurrentCode());
}

function updateOverview() {
  overview.innerHTML = "";
  sectionNames.forEach((section) => {
    const sectionBlock = document.createElement("div");
    sectionBlock.className = "section-block";
    const title = document.createElement("h3");
    title.textContent = section;
    sectionBlock.appendChild(title);

    envelopes[section].forEach((code, idx) => {
      const button = document.createElement("button");
      button.className = "envelope-btn";
      button.textContent = `Envelope ${idx + 1}`;
      
      if (section === getCurrentSection() && idx === currentEnvelopeIndex) {
        button.classList.add("active");
      } else {
        button.classList.add("selectable");
      }

      button.addEventListener("click", () => {
        currentSectionIndex = sectionNames.indexOf(section);
        currentEnvelopeIndex = idx;
        clearInput();
        renderTarget();
        updateOverview();
      });

      sectionBlock.appendChild(button);
    });
    overview.appendChild(sectionBlock);
  });
}

function renderTarget() {
  const section = getCurrentSection();
  const env = currentEnvelopeIndex + 1;
  targetLabel.textContent = `Current: ${section} Envelope ${env}`;
  updateScreen();
  updateInputPreview();
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function updateTimer() {
  if (timerExpired) return;

  countdownSeconds -= 1;
  if (countdownSeconds < 0) {
    countdownSeconds = 0;
  }

  timerElement.textContent = `Time left: ${formatTime(countdownSeconds)}`;

  if (countdownSeconds === 0) {
    timerExpired = true;
    clearInterval(timerInterval);
    setMessage("Time is up! Event finished.", "error");
  }
}

function startTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerElement.textContent = `Time left: ${formatTime(countdownSeconds)}`;
  timerInterval = setInterval(updateTimer, 1000);
}

function updateScreen() {
  const maxLen = getCurrentCodeDigits().length;
  if (!currentInput) {
    screen.textContent = "•".repeat(maxLen);
  } else {
    const revealed = "•".repeat(currentInput.length);
    const hidden = "_".repeat(Math.max(0, maxLen - currentInput.length));
    screen.textContent = revealed + hidden;
  }
  updateInputPreview();
}

function updateInputPreview() {
  const inputPreview = document.getElementById("input-preview");
  inputPreview.textContent = currentInput ? `Input: ${currentInput}` : "Input: (none)";
}

function setMessage(text, type = "") {
  const modal = document.getElementById("message-modal");
  const messageText = document.getElementById("modal-message-text");
  const content = modal.querySelector(".message-modal-content");
  
  messageText.textContent = text;
  
  // Reset content classes
  content.className = "message-modal-content";
  if (type) {
    content.classList.add(type);
  }
  
  // Show the modal
  modal.classList.add("show");
}

function addDigit(value) {
  if (timerExpired) return;
  const max = getCurrentCodeDigits().length;
  if (currentInput.length >= max) return;
  if (!/^[0-9]$/.test(value)) return;
  currentInput += value;
  updateScreen();
}

function clearInput() {
  currentInput = "";
  updateScreen();
}

function checkCode() {
  if (timerExpired) {
    setMessage("Timer expired. No more entries accepted.", "error");
    return;
  }

  const expected = getCurrentCodeDigits();
  if (!expected) {
    setMessage("No code for this envelope.", "error");
    return;
  }

  if (currentInput === expected) {
    const section = getCurrentSection();
    const env = currentEnvelopeIndex + 1;
    setMessage(`✓ ${section} Envelope ${env} correct!`, "success");
    clearInput();
  } else {
    setMessage("Wrong code. Try again.", "error");
  }
}

// button hooks
const buttons = document.querySelectorAll(".key[data-key]");
buttons.forEach((btn) => {
  btn.addEventListener("click", () => addDigit(btn.dataset.key));
});

document.getElementById("clear").addEventListener("click", clearInput);

document.getElementById("enter").addEventListener("click", checkCode);

// keyboard support
window.addEventListener("keydown", (e) => {
  if (/^[0-9]$/.test(e.key)) {
    addDigit(e.key);
  } else if (e.key === "Enter") {
    checkCode();
  } else if (e.key === "Backspace") {
    currentInput = currentInput.slice(0, -1);
    updateScreen();
  } else if (e.key.toLowerCase() === "c") {
    clearInput();
  }
});

document.getElementById("start-button").addEventListener("click", () => {
  document.getElementById("title-page").style.display = "none";
  document.getElementById("main-content").classList.remove("hidden");
  startTimer(); // Timer starts only when the START button is clicked
});

let usedHintCount = 0;
const hintButtons = document.querySelectorAll(".hint");
hintButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.classList.contains("used")) return;
    if (usedHintCount >= 2) {
      return;
    }
    btn.classList.add("used");
    usedHintCount += 1;
    if (usedHintCount >= 2) {
      hintButtons.forEach((h) => {
        if (!h.classList.contains("used")) {
          h.disabled = true;
          h.style.opacity = "0.5";
        }
      });
    }
  });
});

// Fullscreen toggle functionality
const fullscreenToggle = document.getElementById("fullscreen-toggle");
fullscreenToggle.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
});

// Modal close button handler
document.getElementById("modal-close-button").addEventListener("click", () => {
  const modal = document.getElementById("message-modal");
  modal.classList.remove("show");
  document.getElementById("modal-message-text").textContent = "";
});

updateOverview();
renderTarget();
