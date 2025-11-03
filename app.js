// 👉 ΒΑΛΕ ΕΔΩ το Apps Script Web App URL (Deploy → Web app → /exec)
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxWaqzuHo7c9RFD-HHu4qE-HlLiLbfpwf3SeJZZN_pSFRUaMzZ0TM-LovcwdBh1yKgV9Q/exec";

const $ = (id) => document.getElementById(id);
const el = {
  operator: $("operator"), nps: $("nps"), firstName: $("firstName"), lastName: $("lastName"),
  admDate: $("admDate"), day: $("day"), lus: $("lus"), hourly: $("hourly"),
  position: $("position"),
  pleural: $("pleural"), side: $("side"), ipd: $("ipd"), balik: $("balik"),
  cons: $("cons"), pneumo: $("pneumo"),
  spo2: $("spo2"), fio2: $("fio2"), sf: $("sf"),
  device: $("device"), flow: $("flow"), ipap: $("ipap"), epap: $("epap"),
  crp_extra: $("crp_extra"), wbc_extra: $("wbc_extra"),
  submitBtn: $("submitBtn"), clearBtn: $("clearBtn"),
  pleuralSideWrap: document.getElementById("pleuralSideWrap"),
  ipdWrap: document.getElementById("ipdWrap"),
  flowWrap: document.getElementById("flowWrap"),
  nivWrap: document.getElementById("nivWrap"),
  nivWrap2: document.getElementById("nivWrap2"),
  toast: $("toast")
};

const DAY_VALID = ["D1","D2","D3","D4","D5","D6","D7","Exit"];

// --- UI helpers ---
function showToast(msg, type="ok", ms=2800){
  el.toast.textContent = msg;
  el.toast.className = "toast" + (type==="ok" ? "" : " err");
  el.toast.style.display = "block";
  setTimeout(()=> el.toast.style.display="none", ms);
}
function disableUI(disabled){
  el.submitBtn.disabled = disabled;
  el.clearBtn.disabled = disabled;
  el.submitBtn.style.opacity = disabled ? 0.7 : 1;
}
function normalizeOperator(op){
  const t = (op||"").trim();
  if (t.toLowerCase()==="xronis" || t==="Χρόνης") return "Παπανικολάου";
  return t;
}

// --- Υπολογισμοί ---
function calcSF(){
  const spo2 = Number(el.spo2.value);
  const fio2 = Number(el.fio2.value);
  el.sf.textContent = (Number.isFinite(spo2) && Number.isFinite(fio2) && fio2>=0.21 && fio2<=1 && spo2>0)
    ? Math.round(spo2 / fio2) : "—";
}
function calcBalik(){
  const dmm = Number(el.ipd.value);
  el.balik.textContent = (Number.isFinite(dmm) && dmm>=0) ? Math.round(20*dmm) : "—";
}
function onPleuralChange(){
  const show = (el.pleural.value === "Ναι");
  el.pleuralSideWrap.style.display = show ? "" : "none";
  el.ipdWrap.style.display = show ? "" : "none";
}
function onDeviceChange(){
  const v = el.device.value;
  el.flowWrap.style.display = (v==="HFNO"||v==="NC"||v==="Mask"||v==="Venturi") ? "" : "none";
  const isNIV = (v==="NIV");
  el.nivWrap.style.display = isNIV ? "" : "none";
  el.nivWrap2.style.display = isNIV ? "" : "none";
}

// --- Payload ---
function getPayload(){
  const core = {
    operator: normalizeOperator((el.operator.value||"").trim()),
    nps:      (el.nps.value||"").trim(),
    firstName:(el.firstName.value||"").trim(),
    lastName: (el.lastName.value||"").trim(),
    admDate:  el.admDate.value || "",
    day:      el.day.value,
    lus:      el.lus.value!=="" ? String(parseInt(el.lus.value,10)) : ""
  };
  const extras = {
    hourly:   el.hourly.checked ? "Ναι" : "Όχι",
    position: el.position.value,
    pleural:  el.pleural.value, side: el.side.value, ipd: el.ipd.value,
    balik:    (el.balik && el.balik.textContent && el.balik.textContent!=="—") ? el.balik.textContent : "",
    cons:     el.cons.value, pneumo: el.pneumo.value,
    spo2:     el.spo2.value, fio2: el.fio2.value,
    sf:       (el.sf && el.sf.textContent && el.sf.textContent!=="—") ? el.sf.textContent : "",
    device:   el.device.value, flow: el.flow.value, ipap: el.ipap.value, epap: el.epap.value,
    crp_extra: el.crp_extra.value, wbc_extra: el.wbc_extra.value
  };
  return new URLSearchParams({...core, ...extras}).toString();
}
function validate(){
  if(!el.operator.value) return "Δώσε χειριστή (Operator).";
  if(!el.nps.value) return "Δώσε NPS (Patient ID).";
  if(!DAY_VALID.includes(el.day.value)) return "Επίλεξε Ημέρα (D1–D7/Exit).";
  const n = Number(el.lus.value);
  if(!Number.isFinite(n) || n<0 || n>36) return "LUS score: ακέραιος 0–36.";
  return null;
}

// --- CRF Master: Labs (εισαγωγή) --- //
async function fetchCRFByNPS(nps){
  if (!nps) return null;
  const body = new URLSearchParams({ action:"get_crf", nps:String(nps) }).toString();
  try{
    const res = await fetch(WEB_APP_URL, {
      method:"POST", headers:{ "Content-Type":"application/x-www-form-urlencoded;charset=UTF-8" }, body
    });
    const txt = await res.text();
    try { return JSON.parse(txt); } catch(_){ return null; }
  }catch(_){ return null; }
}
function renderLabs(labsRes){
  const box = document.getElementById("labsBox");
  box.innerHTML = "";
  if (!labsRes || !labsRes.ok || !labsRes.found) {
    box.innerHTML = `<div class="muted">Δεν βρέθηκαν εργαστηριακά για αυτό το NPS.</div>`;
    return;
  }
  const L = labsRes.labs || {};
  const entries = [
    ["CRP", L.CRP], ["PCT", L.PCT], ["D-dimer", L.D_dimer], ["WBC", L.WBC],
    ["Ουδετερόφιλα %", L.Neut_pct], ["Λεμφοκύτταρα %", L.Lymph_pct],
    ["Ηωσινόφιλα %", L.Eos_pct], ["Μονοκύτταρα %", L.Mono_pct],
    ["Κρεατινίνη", L.Creatinine], ["Ουρία", L.Urea],
    ["ALT", L.ALT], ["AST", L.AST], ["Na", L.Na], ["K", L.K],
    ["SpO₂", L.SpO2], ["FiO₂", L.FiO2]
  ];
  entries.forEach(([k,v])=>{
    const div = document.createElement("div");
    div.innerHTML = `<label style="font-size:12px;color:#a9b6d9">${k}</label><div>${(v!==undefined && v!=="")? v : "—"}</div>`;
    box.appendChild(div);
  });
}

// --- Submit/Clear ---
async function submit(){
  const err = validate();
  if(err){ showToast(err,"err",3600); return; }
  disableUI(true);
  try{
    const res = await fetch(WEB_APP_URL, {
      method:"POST",
      headers:{ "Content-Type":"application/x-www-form-urlencoded;charset=UTF-8" },
      body:getPayload()
    });
    let okShown=false;
    try{
      const txt = await res.text();
      if (txt && txt.startsWith("{")) {
        const j = JSON.parse(txt);
        if (j.ok) { showToast("✅ Καταχωρήθηκε επιτυχώς!"); okShown=true; }
        else { showToast("❌ " + (j.error||"Σφάλμα καταχώρισης"), "err", 4200); }
      }
    }catch(_){}
    if(!okShown) showToast("✅ Καταχωρήθηκε επιτυχώς!");
    clearForm();
  }catch(_){
    showToast("❌ Δικτυακό σφάλμα ή λάθος URL.","err",4200);
  }finally{
    disableUI(false);
  }
}
function clearForm(){
  ["nps","firstName","lastName","admDate","lus","ipd","cons","spo2","fio2","flow","ipap","epap","crp_extra","wbc_extra"].forEach(id=>{
    const n=document.getElementById(id); if(n) n.value="";
  });
  ["day","position","pleural","side","pneumo","device"].forEach(id=>{
    const n=document.getElementById(id); if(n) n.value="";
  });
  el.hourly.checked=false; el.sf.textContent="—"; if (el.balik) el.balik.textContent="—";
  el.pleuralSideWrap.style.display="none"; el.ipdWrap.style.display="none"; el.flowWrap.style.display="none"; el.nivWrap.style.display="none"; el.nivWrap2.style.display="none";
  el.nps.focus();
}

// --- Listeners ---
el.fio2.addEventListener("input", calcSF);
el.spo2.addEventListener("input", calcSF);
el.ipd.addEventListener("input", calcBalik);
el.pleural.addEventListener("change", onPleuralChange);
el.device.addEventListener("change", onDeviceChange);
el.submitBtn.addEventListener("click", submit);
el.clearBtn.addEventListener("click", clearForm);
["nps","lus"].forEach(id=>{
  const n=document.getElementById(id);
  if(n) n.addEventListener("keydown",(e)=>{ if(e.key==="Enter") submit(); });
});
// NPS → φέρε labs εισαγωγής από CRF_Master
el.nps.addEventListener("change", async ()=>{ const r=await fetchCRFByNPS(el.nps.value); renderLabs(r); });
/* === CRF Master submit === */

// elements
const CRF = {
  operator: document.getElementById("crf_operator"),
  nps:      document.getElementById("crf_nps"),
  adm:      document.getElementById("crf_adm"),
  first:    document.getElementById("crf_first"),
  last:     document.getElementById("crf_last"),
  sex:      document.getElementById("crf_sex"),
  age:      document.getElementById("crf_age"),
  bmi:      document.getElementById("crf_bmi"),
  smoking:  document.getElementById("crf_smoking"),
  dx:       document.getElementById("crf_dx"),
  crp:      document.getElementById("crf_crp"),
  pct:      document.getElementById("crf_pct"),
  dd:       document.getElementById("crf_dd"),
  wbc:      document.getElementById("crf_wbc"),
  neut:     document.getElementById("crf_neut"),
  lymph:    document.getElementById("crf_lymph"),
  eos:      document.getElementById("crf_eos"),
  mono:     document.getElementById("crf_mono"),
  crea:     document.getElementById("crf_crea"),
  urea:     document.getElementById("crf_urea"),
  alt:      document.getElementById("crf_alt"),
  ast:      document.getElementById("crf_ast"),
  na:       document.getElementById("crf_na"),
  k:        document.getElementById("crf_k"),
  submit:   document.getElementById("crf_submit"),
  clear:    document.getElementById("crf_clear"),
};

// map σε “αγγλικά keys” που ήδη χαρτογραφούνται στο backend → ελληνικά headers
function crfPayload() {
  const p = {
    action: "crf",
    operator: (CRF.operator?.value || "").trim(),
    nps: (CRF.nps?.value || "").trim(),
    admDate: CRF.adm?.value || "",
    firstName: (CRF.first?.value || "").trim(),
    lastName: (CRF.last?.value || "").trim(),
    sex: CRF.sex?.value || "",
    age: CRF.age?.value || "",
    bmi: CRF.bmi?.value || "",
    smoking: CRF.smoking?.value || "",
    dx: (CRF.dx?.value || "").trim(),

    crp: CRF.crp?.value || "",
    pct: CRF.pct?.value || "",
    ddimer: CRF.dd?.value || "",
    wbc: CRF.wbc?.value || "",
    neut: CRF.neut?.value || "",
    lymph: CRF.lymph?.value || "",
    eos: CRF.eos?.value || "",
    mono: CRF.mono?.value || "",
    crea: CRF.crea?.value || "",
    urea: CRF.urea?.value || "",
    alt: CRF.alt?.value || "",
    ast: CRF.ast?.value || "",
    na: CRF.na?.value || "",
    k: CRF.k?.value || ""
  };
  return new URLSearchParams(p).toString();
}

function crfValidate() {
  if (!CRF.operator?.value) return "Δώσε χειριστή.";
  if (!CRF.nps?.value) return "Δώσε NPS.";
  if (!CRF.adm?.value) return "Δώσε ημερομηνία εισαγωγής.";
  return null;
}

async function submitCRF() {
  const err = crfValidate();
  if (err) { showToast(err, "err", 3800); return; }
  try{
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type":"application/x-www-form-urlencoded;charset=UTF-8" },
      body: crfPayload()
    });
    const txt = await res.text();
    if (txt && txt.startsWith("{")) {
      const j = JSON.parse(txt);
      if (j.ok) showToast("✅ CRF αποθηκεύτηκε!", "ok");
      else showToast("❌ " + (j.error || "Σφάλμα CRF"), "err", 4200);
    } else {
      showToast("✅ CRF αποθηκεύτηκε!", "ok");
    }
    clearCRF();
  } catch(e){
    showToast("❌ Δικτυακό σφάλμα/URL", "err", 4200);
  }
}

function clearCRF() {
  const ids = ["crf_operator","crf_nps","crf_adm","crf_first","crf_last","crf_sex","crf_age","crf_bmi","crf_smoking","crf_dx",
    "crf_crp","crf_pct","crf_dd","crf_wbc","crf_neut","crf_lymph","crf_eos","crf_mono","crf_crea","crf_urea","crf_alt","crf_ast","crf_na","crf_k"];
  ids.forEach(id => { const n = document.getElementById(id); if (n) { if (n.tagName==="SELECT") n.value=""; else n.value=""; }});
}

CRF.submit?.addEventListener("click", submitCRF);
CRF.clear?.addEventListener("click", clearCRF);
