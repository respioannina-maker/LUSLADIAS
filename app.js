// app.js — LUS PROTOCOL Web UI
(function () {
  const $ = (id) => document.getElementById(id);

  const el = {
    operator: $("operator"),
    nps: $("nps"),
    firstName: $("firstName"),
    lastName: $("lastName"),
    admDate: $("admDate"),
    day: $("day"),
    lus: $("lus"),
    submitBtn: $("submitBtn"),
    clearBtn: $("clearBtn"),
    toast: $("toast"),
  };

  const DAY_VALID = ["D1","D2","D3","D4","D5","D6","D7","Exit"];

  function showToast(msg, type = "ok", ms = 2600) {
    el.toast.textContent = msg;
    el.toast.className = "toast " + (type === "ok" ? "ok" : "err");
    el.toast.style.display = "block";
    setTimeout(() => (el.toast.style.display = "none"), ms);
  }

  function disableUI(disabled) {
    el.submitBtn.disabled = disabled;
    el.clearBtn.disabled = disabled;
    el.submitBtn.style.opacity = disabled ? 0.7 : 1;
  }

  function getFormData() {
    return {
      operator: (el.operator.value || "").trim(),
      nps: (el.nps.value || "").trim(),
      firstName: (el.firstName.value || "").trim(),
      lastName: (el.lastName.value || "").trim(),
      admDate: el.admDate.value || "", // yyyy-mm-dd or ""
      day: el.day.value,
      lus: el.lus.value !== "" ? Number(el.lus.value) : NaN,
    };
  }

  function validateForm(d) {
    if (!d.operator) return "Δώσε χειριστή (Operator).";
    if (!d.nps) return "Δώσε NPS (Patient ID).";
    if (!DAY_VALID.includes(d.day)) return "Επίλεξε έγκυρη Ημέρα (D1–D7/Exit).";
    if (!Number.isFinite(d.lus) || d.lus < 0 || d.lus > 36) return "Το LUS score πρέπει να είναι ακέραιος 0–36.";
    return null;
  }

  function clearForm() {
    el.nps.value = "";
    el.firstName.value = "";
    el.lastName.value = "";
    el.admDate.value = "";
    el.day.value = "";
    el.lus.value = "";
    el.nps.focus();
  }

  async function submit() {
    const d = getFormData();
    const err = validateForm(d);
    if (err) {
      showToast(err, "err");
      return;
    }
    disableUI(true);

    // GAS call: logDailyLUS(operator, nps, firstName, lastName, admDate, dayLabel, lusScore)
    try {
      google.script.run
        .withSuccessHandler(() => {
          showToast("✅ Καταχωρήθηκε επιτυχώς!");
          clearForm();
          disableUI(false);
        })
        .withFailureHandler((e) => {
          const msg = (e && e.message) ? e.message : "Σφάλμα καταχώρισης.";
          showToast("❌ " + msg, "err", 3800);
          disableUI(false);
        })
        .logDailyLUS(d.operator, d.nps, d.firstName, d.lastName, d.admDate, d.day, d.lus);
    } catch (e) {
      // Αν τρέχεις το index τοπικά (χωρίς GAS), δεν υπάρχει google.script.run
      console.error(e);
      showToast("❌ Η φόρμα πρέπει να τρέχει ως Apps Script Web App.", "err", 4200);
      disableUI(false);
    }
  }

  // Listeners
  el.submitBtn.addEventListener("click", submit);
  el.clearBtn.addEventListener("click", clearForm);

  // Enter -> submit σε μερικά πεδία
  ["nps","lus"].forEach((id) => {
    $(id).addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });
  });
})();
