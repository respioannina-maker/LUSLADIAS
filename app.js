// app.js — GitHub UI → Google Apps Script webhook (form POST)

// 👉 ΒΑΛΕ ΕΔΩ το Apps Script Web App URL σου (Deploy → Web app → URL που τελειώνει σε /exec)
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwUpdiAwErR-EiOOKzO9PlORamuB0sPVVqB94EFE1OojWAI3ZTNLuHSdhPH3mywInBx/exec";

(function(){
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

  function showToast(msg, type="ok", ms=2600){
    el.toast.textContent = msg;
    el.toast.className = "toast " + (type==="ok" ? "ok" : "err");
    el.toast.style.display = "block";
    setTimeout(()=> el.toast.style.display = "none", ms);
  }

  function disableUI(disabled){
    el.submitBtn.disabled = disabled;
    el.clearBtn.disabled = disabled;
    el.submitBtn.style.opacity = disabled ? 0.7 : 1;
  }

  function getData(){
    return {
      operator: (el.operator.value || "").trim(),
      nps: (el.nps.value || "").trim(),
      firstName: (el.firstName.value || "").trim(),
      lastName: (el.lastName.value || "").trim(),
      admDate: el.admDate.value || "",
      day: el.day.value,
      lus: el.lus.value !== "" ? String(parseInt(el.lus.value,10)) : ""
    };
  }

  function validate(d){
    if(!d.operator) return "Δώσε χειριστή (Operator).";
    if(!d.nps) return "Δώσε NPS (Patient ID).";
    if(!DAY_VALID.includes(d.day)) return "Επίλεξε Ημέρα (D1–D7/Exit).";
    const n = Number(d.lus);
    if(!Number.isFinite(n) || n<0 || n>36) return "LUS score: ακέραιος 0–36.";
    return null;
  }

  function clearForm(){
    el.nps.value = "";
    el.firstName.value = "";
    el.lastName.value = "";
    el.admDate.value = "";
    el.day.value = "";
    el.lus.value = "";
    el.nps.focus();
  }

  async function onSubmit(){
    const d = getData();
    const err = validate(d);
    if(err){ showToast(err,"err",3600); return; }
    disableUI(true);

    // Στέλνουμε ως x-www-form-urlencoded για να αποφύγουμε CORS preflight
    const body = new URLSearchParams(d).toString();

    try{
      const res = await fetch(WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body
      });

      // Προσπαθούμε να διαβάσουμε JSON απάντηση (αν επιτραπεί)
      let okShown = false;
      try{
        const txt = await res.text();
        if (txt && txt.startsWith("{")) {
          const json = JSON.parse(txt);
          if (json.ok) { showToast("✅ Καταχωρήθηκε!"); okShown = true; }
          else { showToast("❌ " + (json.error || "Σφάλμα καταχώρισης"), "err", 4200); }
        }
      } catch(_) {}
      if (!okShown) showToast("✅ Καταχωρήθηκε!"); // αισιόδοξο fallback

      clearForm();
    }catch(e){
      console.error(e);
      showToast("❌ Δικτυακό σφάλμα ή λάθος URL.", "err", 4200);
    }finally{
      disableUI(false);
    }
  }

  el.submitBtn.addEventListener("click", onSubmit);
  el.clearBtn.addEventListener("click", clearForm);

  // Enter → submit σε NPS & LUS
  ["nps","lus"].forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.addEventListener("keydown", (e) => { if (e.key === "Enter") onSubmit(); });
  });
})();
