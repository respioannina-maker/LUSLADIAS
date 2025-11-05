// === ΒΑΛΕ ΤΟ ΔΙΚΟ ΣΟΥ WEB APP URL ===
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwiTCgKlnzfeotJSkwlRmwq4k-bQyaxLPBSj85bzdLa3uqcdTYueWGRWtI1bF-gVcxSYA/exec";

// Tabs
const tabCombined = document.getElementById("tab-combined");
const tabLUS = document.getElementById("tab-lus");
const viewCombined = document.getElementById("view-combined");
const viewLUS = document.getElementById("view-lus");

function switchView(v){
  [viewCombined,viewLUS].forEach(el=>el.classList.add("hidden"));
  [tabCombined,tabLUS].forEach(b=>b.classList.remove("active"));
  if (v==="lus"){ viewLUS.classList.remove("hidden"); tabLUS.classList.add("active"); }
  else { viewCombined.classList.remove("hidden"); tabCombined.classList.add("active"); }
}
tabCombined.onclick = ()=>switchView("combined");
tabLUS.onclick = ()=>switchView("lus");

// helper
async function postForm(data){
  const res = await fetch(WEB_APP_URL, {
    method:"POST",
    headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},
    body:new URLSearchParams(data).toString()
  });
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return { ok:false, error:"Invalid JSON", raw:txt }; }
}
const v = id => document.getElementById(id).value;

// 1) Combined: CRF + (προαιρετικό) D1 LUS
document.getElementById("cmb_submit").onclick = async ()=>{
  // CRF payload (ΟΛΑ τα πεδία)
  const crf = {
    action:"crf",
    operator:v("cmb_operator"),
    nps:v("cmb_nps"),
    admDate:v("cmb_adm"),
    firstName:v("cmb_first"),
    lastName:v("cmb_last"),
    sex:v("cmb_sex"),
    age:v("cmb_age"),
    bmi:v("cmb_bmi"),
    smoking:v("cmb_smoking"),
    copd:v("cmb_copd"),
    asthma:v("cmb_asthma"),
    hf:v("cmb_hf"),
    cad:v("cmb_cad"),
    af:v("cmb_af"),
    dm:v("cmb_dm"),
    hlp:v("cmb_hlp"),
    htn:v("cmb_htn"),
    dx:v("cmb_dx"),
    crp:v("cmb_crp"),
    pct:v("cmb_pct"),
    ddimer:v("cmb_dd"),
    wbc:v("cmb_wbc"),
    neut:v("cmb_neut"),
    lymph:v("cmb_lymph"),
    eos:v("cmb_eos"),
    mono:v("cmb_mono"),
    crea:v("cmb_crea"),
    urea:v("cmb_urea"),
    alt:v("cmb_alt"),
    ast:v("cmb_ast"),
    na:v("cmb_na"),
    k:v("cmb_k"),
    spo2_adm:v("cmb_spo2_adm"),
    fio2_adm:v("cmb_fio2_adm")
  };

  // Submit CRF
  const crfRes = await postForm(crf);
  if (!crfRes.ok){ alert("❌ CRF: " + (crfRes.error||"σφάλμα")); return; }

  // Αν υπάρχει LUS D1 → καταχώριση D1 στο ίδιο NPS/γραμμή
  const lusScore = v("cmb_lus_d1");
  if (lusScore !== ""){
    const lus = {
      operator:v("cmb_operator"),
      nps:v("cmb_nps"),
      day:"D1",
      lus:lusScore,
      spo2:v("cmb_spo2_d1"),
      crp_extra:v("cmb_crp_d1"),
      wbc_extra:v("cmb_wbc_d1")
    };
    const lusRes = await postForm(lus);
    if (!lusRes.ok){ alert("⚠️ CRF ok, LUS D1 σφάλμα: " + (lusRes.error||"")); return; }
    alert("✅ Αποθηκεύτηκαν CRF + D1 LUS");
  } else {
    alert("✅ Αποθηκεύτηκε CRF");
  }
};

// 2) LUS Daily (D1–D7/Exit)
document.getElementById("lus_submit").onclick = async ()=>{
  const data = {
    operator:v("lus_operator"),
    nps:v("lus_nps"),
    day:v("lus_day"),
    lus:v("lus_score"),
    spo2:v("lus_spo2"),
    crp_extra:v("lus_crp"),
    wbc_extra:v("lus_wbc")
  };
  const res = await postForm(data);
  alert(res.ok ? "✅ LUS αποθηκεύτηκε" : ("❌ " + (res.error||"σφάλμα")));
};

// default
switchView("combined");
