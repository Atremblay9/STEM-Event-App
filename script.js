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
const status = {
  BA: [false, false, false],
  DEV: [false, false, false],
  QA: [false, false, false],
};

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
const progressBar = document.getElementById("progress");

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

function getProgress() {
  const total = 9;
  let completed = 0;
  sectionNames.forEach((sec) => {
    completed += status[sec].filter(Boolean).length;
  });
  return (completed / total) * 100;
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
      if (status[section][idx]) {
        button.classList.add("completed");
      } else if (section === getCurrentSection() && idx === currentEnvelopeIndex) {
        button.classList.add("active");
      } else if (isEnvelopeUnlocked(section, idx)) {
        button.classList.add("unlocked");
      } else {
        button.disabled = true;
        button.classList.add("locked");
      }

      button.addEventListener("click", () => {
        if (!isEnvelopeUnlocked(section, idx)) return;
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

function isEnvelopeUnlocked(section, idx) {
  if (status[section][idx]) return true;

  const sectionIndex = sectionNames.indexOf(section);

  if (sectionIndex < currentSectionIndex) return true;
  if (sectionIndex > currentSectionIndex) return false;

  return idx <= currentEnvelopeIndex;
}

function renderTarget() {
  const section = getCurrentSection();
  const env = currentEnvelopeIndex + 1;
  targetLabel.textContent = `Current: ${section} Envelope ${env}`;
  updateScreen();
  updateInputPreview();
  progressBar.style.width = `${getProgress()}%`;
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

let lastMessageType = ""; // Track the last message type
let pendingFacilitatorSection = null; // Track which section needs facilitator approval

function setMessage(text, type = "") {
  const modal = document.getElementById("message-modal");
  const messageText = document.getElementById("modal-message-text");
  const content = modal.querySelector(".message-modal-content");
  
  messageText.textContent = text;
  lastMessageType = type;
  
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

function moveNext() {
  if (currentEnvelopeIndex < envelopes[getCurrentSection()].length - 1) {
    currentEnvelopeIndex += 1;
  } else if (currentSectionIndex < sectionNames.length - 1) {
    currentSectionIndex += 1;
    currentEnvelopeIndex = 0;
  }
  clearInput();
  renderTarget();
  updateOverview();
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
    status[getCurrentSection()][currentEnvelopeIndex] = true;
    
    // Check if this is a final envelope that requires facilitator approval
    const isFinalEnvelope = currentEnvelopeIndex === envelopes[getCurrentSection()].length - 1;
    
    if (isFinalEnvelope) {
      // Show facilitator password prompt
      pendingFacilitatorSection = getCurrentSection();
      showFacilitatorModal();
      return;
    }
    
    // Determine which message to show for regular envelopes
    let messageText = `Correct! ${getCurrentSection()} Envelope ${currentEnvelopeIndex + 1} unlocked.`;
    setMessage(messageText, "success");

    if (getProgress() >= 100) {
      screen.textContent = "DONE";
      targetLabel.textContent = "All envelopes completed!";
      updateOverview();
      return;
    }
  } else {
    setMessage("Wrong code. Try again.", "error");
  }
}

function showFacilitatorModal() {
  const facilitatorModal = document.getElementById("facilitator-modal");
  const facilitatorMessage = document.getElementById("facilitator-message");
  const section = getCurrentSection();
  
  facilitatorMessage.textContent = `Complete discussion Envelop for ${section} section completion.`;
  facilitatorModal.classList.add("show");
  document.getElementById("facilitator-password").value = "";
  document.getElementById("facilitator-password").focus();
}

// Facilitator modal submit button handler
document.getElementById("facilitator-submit").addEventListener("click", () => {
  const password = document.getElementById("facilitator-password").value;
  const section = pendingFacilitatorSection;
  
  if (password === facilitatorPasswords[section]) {
    // Correct password - show success message and proceed
    document.getElementById("facilitator-modal").classList.remove("show");
    
    let messageText = "";
    if (section === "BA") {
      messageText = "✓ FINAL EXIT ENVELOPE: BUSINESS RECOMMENDATION complete!";
    } else if (section === "DEV") {
      messageText = "✓ FINAL EXIT: DEPLOYMENT APPROVAL complete!";
    } else if (section === "QA") {
      messageText = "✓ 🏁 FINAL APPROVAL MOMENT complete!";
    }
    
    setMessage(messageText, "success");
    pendingFacilitatorSection = null;
    
    // Check if all sections are complete
    if (getProgress() >= 100) {
      setTimeout(() => {
        const modal = document.getElementById("message-modal");
        modal.classList.remove("show");
        document.getElementById("modal-message-text").textContent = "";
        screen.textContent = "DONE";
        targetLabel.textContent = "All envelopes completed!";
        updateOverview();
      }, 3000);
    } else {
      setTimeout(() => {
        const modal = document.getElementById("message-modal");
        modal.classList.remove("show");
        document.getElementById("modal-message-text").textContent = "";
        moveNext();
      }, 3000);
    }
  } else {
    // Incorrect password
    setMessage("Incorrect facilitator password. Please try again.", "error");
    document.getElementById("facilitator-modal").classList.remove("show");
    document.getElementById("facilitator-password").value = "";
  }
});

// Facilitator modal cancel button handler
document.getElementById("facilitator-cancel").addEventListener("click", () => {
  const facilitatorModal = document.getElementById("facilitator-modal");
  facilitatorModal.classList.remove("show");
  document.getElementById("facilitator-password").value = "";
  pendingFacilitatorSection = null;
  
  // Revert the completion status since facilitator didn't approve
  if (pendingFacilitatorSection) {
    status[pendingFacilitatorSection][currentEnvelopeIndex] = false;
  }
});

// Allow Enter key to submit facilitator password
document.getElementById("facilitator-password").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    document.getElementById("facilitator-submit").click();
  }
});

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
  
  // Handle next action based on message type
  if (lastMessageType === "success") {
    moveNext();
  } else if (lastMessageType === "error") {
    clearInput();
  }
});

updateOverview();
renderTarget();
