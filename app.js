// ====== CONFIG ======
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxEmHL8PER0K4W-01VvaivqUKcWdClBA3gitb_HLVJqXu0gOMP2f_l50d6X-xRcXe-2pw/exec"; // <-- βάλε το δικό σου

// ====== helpers ======
const $ = id => document.getElementById(id);
function toast(msg, ok=true, ms=2600){
  const t = $("toast");
  t.textContent = msg; t.className = "toast" + (ok?"":" err");
  t.style.display = "block"; setTimeout(()=>t.style.display="none", ms);
}
async function postForm(data){
  const res = await fetch(WEB_APP_URL, {
    method:"POST", headers:{ "Content-Type":"application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams(data).toString()
  });
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return { ok:false, error:"Invalid JSON", raw:txt }; }
}

// ====== Tabs ======
const tabCombined = $("tab-combined");
const tabLUS = $("tab-lus");
const viewCombined = $("view-combined");
const viewLUS = $("view-lus");
function switchView(v){
  [viewCombined,viewLUS].forEach(e=>e.classList.add("hidden"));
  [tabCombined,tabLUS].forEach(b=>b.classList.remove("active"));
  if (v==="lus"){ viewLUS.classList.remove("hidden"); tabLUS.classList.add("active"); }
  else { viewCombined.classList.remove("hidden"); tabCombined.classList.add("active"); }
}
tabCombined.onclick = ()=>switchView("combined");
tabLUS.onclick = ()=>switchView("lus");
switchView("combined");

// ====== Calculators (S/F, P/F, Balik) ======
function calcSF(spo2Id, fio2Id, outId){
  const s = Number($(spo2Id).value), f = Number($(fio2Id).value);
  $(outId).value = (Number.isFinite(s) && Number.isFinite(f) && f>=0.21 && f<=1 && s>0) ? Math.round(s/f) : "";
}
function calcPF(pao2Id, fio2Id, outId){
  const p = Number($(pao2Id).value), f = Number($(fio2Id).value);
  $(outId).value = (Number.isFinite(p) && Number.isFinite(f) && f>=0.21 && f<=1 && p>0) ? Math.round(p/f) : "";
}
function calcBalik(ipdId, outId){
  const d = Number($(ipdId).value);
  $(outId).value = Number.isFinite(d) && d>=0 ? Math.round(20*d) : "";
}

// Bind calculators
["cmb_spo2_d1","cmb_fio2_d1"].forEach(id=> $(id).addEventListener("input", ()=>calcSF("cmb_spo2_d1","cmb_fio2_d1","cmb_sf_d1")));
["cmb_pao2","cmb_fio2_d1"].forEach(id=> $(id).addEventListener("input", ()=>calcPF("cmb_pao2","cmb_fio2_d1","cmb_pf")));
$("cmb_ipd").addEventListener("input", ()=>calcBalik("cmb_ipd","cmb_balik"));

["lus_spo2","lus_fio2"].forEach(id=> $(id).addEventListener("input", ()=>calcSF("lus_spo2","lus_fio2","lus_sf")));
["lus_pao2","lus_fio2"].forEach(id=> $(id).addEventListener("input", ()=>calcPF("lus_pao2","lus_fio2","lus_pf")));
$("lus_ipd").addEventListener("input", ()=>calcBalik("lus_ipd","lus_balik"));

// ====== Submit: Combined (CRF + optional D1) ======
$("cmb_submit").onclick = async ()=>{
  // 1) CRF
  const crf = {
    action:"crf",
    operator:$("cmb_operator").value, nps:$("cmb_nps").value, admDate:$("cmb_adm").value,
    firstName:$("cmb_first").value, lastName:$("cmb_last").value, sex:$("cmb_sex").value,
    age:$("cmb_age").value, bmi:$("cmb_bmi").value, smoking:$("cmb_smoking").value,
    copd:$("cmb_copd").value, asthma:$("cmb_asthma").value, hf:$("cmb_hf").value, cad:$("cmb_cad").value,
    af:$("cmb_af").value, dm:$("cmb_dm").value, hlp:$("cmb_hlp").value, htn:$("cmb_htn").value,
    dx:$("cmb_dx").value,
    crp:$("cmb_crp").value, pct:$("cmb_pct").value, ddimer:$("cmb_dd").value, wbc:$("cmb_wbc").value,
    neut:$("cmb_neut").value, lymph:$("cmb_lymph").value, eos:$("cmb_eos").value, mono:$("cmb_mono").value,
    crea:$("cmb_crea").value, urea:$("cmb_urea").value, alt:$("cmb_alt").value, ast:$("cmb_ast").value,
    na:$("cmb_na").value, k:$("cmb_k").value, spo2_adm:$("cmb_spo2_adm").value, fio2_adm:$("cmb_fio2_adm").value
  };
  const crfRes = await postForm(crf);
  if (!crfRes.ok){ toast("❌ CRF: " + (crfRes.error||"σφάλμα"), false, 4200); return; }

  // 2) D1 LUS (αν δοθεί score)
  const lusScore = $("cmb_lus_d1").value;
  if (lusScore!==""){
    const lus = {
      operator:$("cmb_operator").value, nps:$("cmb_nps").value, day:"D1", lus:lusScore,
      firstName:$("cmb_first").value, lastName:$("cmb_last").value, admDate:$("cmb_adm").value,
      position:$("cmb_position").value, device:$("cmb_device").value, flow:$("cmb_flow").value, ipap:$("cmb_ipap").value, epap:$("cmb_epap").value,
      spo2:$("cmb_spo2_d1").value, fio2:$("cmb_fio2_d1").value, sf:$("cmb_sf_d1").value,
      ph:$("cmb_ph").value, pao2:$("cmb_pao2").value, paco2:$("cmb_paco2").value,
      pleural:$("cmb_pleural").value, side:$("cmb_side").value, ipd:$("cmb_ipd").value, balik:$("cmb_balik").value, cons:$("cmb_cons").value, pneumo:$("cmb_pneumo").value,
      crp_extra:$("cmb_crp_d1").value, wbc_extra:$("cmb_wbc_d1").value
    };
    const lusRes = await postForm(lus);
    if (!lusRes.ok){ toast("⚠️ CRF ok, LUS D1 σφάλμα: " + (lusRes.error||""); false, 5000); return; }
    toast("✅ Αποθηκεύτηκαν CRF + D1 LUS");
  } else {
    toast("✅ Αποθηκεύτηκε CRF");
  }
};

// ====== Submit: LUS Daily (D2–D7/Exit) ======
$("lus_submit").onclick = async ()=>{
  const data = {
    operator:$("lus_operator").value, nps:$("lus_nps").value, day:$("lus_day").value, lus:$("lus_score").value,
    position:$("lus_position").value, device:$("lus_device").value, flow:$("lus_flow").value, ipap:$("lus_ipap").value, epap:$("lus_epap").value,
    spo2:$("lus_spo2").value, fio2:$("lus_fio2").value, sf:$("lus_sf").value,
    ph:$("lus_ph").value, pao2:$("lus_pao2").value, paco2:$("lus_paco2").value,
    pleural:$("lus_pleural").value, side:$("lus_side").value, ipd:$("lus_ipd").value, balik:$("lus_balik").value, cons:$("lus_cons").value, pneumo:$("lus_pneumo").value,
    crp_extra:$("lus_crp").value, wbc_extra:$("lus_wbc").value
  };
  const res = await postForm(data);
  toast(res.ok ? "✅ LUS αποθηκεύτηκε" : ("❌ " + (res.error||"σφάλμα")), !!res.ok, 4200);
};

// ====== Submit: Outcomes ======
$("out_submit").onclick = async ()=>{
  const data = {
    action:"outcome",
    operator:$("lus_operator").value, // ή βάλ’ το δικό σου αν θέλεις άλλο πεδίο
    nps:$("out_nps").value,
    o2_stop_date:$("out_o2stop").value,
    escalation:$("out_escalation").value, escalation_date:$("out_escalation_date").value,
    icu:$("out_icu").value, icu_date:$("out_icu_date").value,
    los:$("out_los").value,
    mortality:$("out_mortality").value, mortality_date:$("out_mortality_date").value,
    drain:$("out_drain").value, drain_date:$("out_drain_date").value,
    notes:$("out_notes").value
  };
  const res = await postForm(data);
  toast(res.ok ? "✅ Εκβάσεις αποθηκεύτηκαν" : ("❌ " + (res.error||"σφάλμα")), !!res.ok, 4200);
};
