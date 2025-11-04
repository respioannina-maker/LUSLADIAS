// === ΡΥΘΜΙΣΗ URL ΤΟΥ WEB APP ===
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx5aOJkBrIlgwMgVZzJoZkIMGzokSqDmOjZYJV_UQTQ6CRwVtLChSWAd6MUn7ngtGt_OA/exec"; // <-- βάλε εδώ το δικό σου URL

// === SWITCH BETWEEN CRF & LUS ===
const tabLUS = document.getElementById("tab-lus");
const tabCRF = document.getElementById("tab-crf");
const viewLUS = document.getElementById("view-lus");
const viewCRF = document.getElementById("view-crf");

function switchView(v){
  if(v==="crf"){
    viewLUS.classList.add("hidden"); viewCRF.classList.remove("hidden");
    tabLUS.classList.remove("active"); tabCRF.classList.add("active");
  } else {
    viewCRF.classList.add("hidden"); viewLUS.classList.remove("hidden");
    tabCRF.classList.remove("active"); tabLUS.classList.add("active");
  }
}
tabLUS.onclick = ()=>switchView("lus");
tabCRF.onclick = ()=>switchView("crf");

// === CRF Submit ===
document.getElementById("crf_submit").onclick = async ()=>{
  const data = {
    action:"crf",
    operator:document.getElementById("crf_operator").value,
    nps:document.getElementById("crf_nps").value,
    admDate:document.getElementById("crf_adm").value,
    firstName:document.getElementById("crf_first").value,
    lastName:document.getElementById("crf_last").value,
    sex:document.getElementById("crf_sex").value,
    age:document.getElementById("crf_age").value,
    bmi:document.getElementById("crf_bmi").value,
    smoking:document.getElementById("crf_smoking").value,
    dx:document.getElementById("crf_dx").value,
    crp:document.getElementById("crf_crp").value,
    wbc:document.getElementById("crf_wbc").value,
    ddimer:document.getElementById("crf_dd").value,
    pct:document.getElementById("crf_pct").value,
    na:document.getElementById("crf_na").value,
    k:document.getElementById("crf_k").value
  };
  const res = await fetch(WEB_APP_URL, {
    method:"POST",
    headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams(data).toString()
  });
  const j = await res.json();
  alert(j.ok ? "✅ CRF αποθηκεύτηκε" : "❌ " + j.error);
};

// === LUS Submit ===
document.getElementById("lus_submit").onclick = async ()=>{
  const data = {
    operator:document.getElementById("lus_operator").value,
    nps:document.getElementById("lus_nps").value,
    day:document.getElementById("lus_day").value,
    lus:document.getElementById("lus_score").value,
    spo2:document.getElementById("lus_spo2").value,
    crp_extra:document.getElementById("lus_crp").value,
    wbc_extra:document.getElementById("lus_wbc").value
  };
  const res = await fetch(WEB_APP_URL, {
    method:"POST",
    headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams(data).toString()
  });
  const j = await res.json();
  alert(j.ok ? "✅ LUS αποθηκεύτηκε" : "❌ " + j.error);
};
