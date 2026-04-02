// app.js — Composant React principal

const { useState, useMemo } = React;

function parseArticleRefs(str) {
  if (!str) return [];
  const refs = new Set();
  // Split by comma, semicolons
  const parts = str.split(/[,;]/).map(s => s.trim()).filter(Boolean);
  for (const part of parts) {
    // Handle ranges like "R. 626-52 à R. 626-65" or "R. 645-1 à R. 645-12"
    const rangeMatch = part.match(/([LRD])\.\s*(\d[\d-]*\S*)\s+à\s+[LRD]\.\s*(\d[\d-]*\S*)/i);
    if (rangeMatch) {
      const prefix = rangeMatch[1];
      const start = rangeMatch[2].replace(/\s/g, "");
      const end = rangeMatch[3].replace(/\s/g, "");
      refs.add(prefix + start);
      refs.add(prefix + end);
      continue;
    }
    // Handle CPC: "art. 582-583 CPC" or "art. 514-3 CPC"
    const cpcMatch = part.match(/art\.?\s*([\d][\d-]*)\s*CPC/i);
    if (cpcMatch) { refs.add("CPC " + cpcMatch[1]); continue; }
    // Handle "art. 1343-5 C. civ." - skip (not in our DB)
    if (/C\.\s*civ|CMF|CPCE|COJ/i.test(part) && !/[LRD]\.\s*\d/.test(part)) continue;
    // Handle "L. 622-21" / "R. 611-35" / "D. 612-5" patterns (but NOT "al. 5")
    const artMatches = part.matchAll(/(?<![a-z])([LRD])\.\s*([\d][\d]*(?:-[\d]+(?:-\d+)?)?)/gi);
    for (const m of artMatches) {
      refs.add(m[1] + m[2]);
    }
  }
  return [...refs];
}

function VoiesDeRecours() {
  const [tab, setTab] = useState("recours");
  const [selectedRole, setSelectedRole] = useState("Tous");
  const [search, setSearch] = useState("");
  const [selectedProc, setSelectedProc] = useState("Toutes");
  const [selectedVoie, setSelectedVoie] = useState("Toutes");
  const [selectedCat, setSelectedCat] = useState("Toutes");
  const [expandedRow, setExpandedRow] = useState(null);
  const [showArticle, setShowArticle] = useState(null);

  const filtered = useMemo(() => {
    return RECOURS_DATA.filter(r => {
      const mp = selectedProc === "Toutes" || r.procedure === selectedProc;
      const mv = selectedVoie === "Toutes" || r.voie === selectedVoie;
      const ms = search === "" || Object.values(r).some(v => typeof v === "string" && v.toLowerCase().includes(search.toLowerCase()));
      return mp && mv && ms;
    });
  }, [search, selectedProc, selectedVoie]);

  const filteredStrategies = useMemo(() => {
    return STRATEGIES_DATA.filter(r => {
      const mr = selectedRole === "Tous" || r.role === selectedRole;
      const mp = selectedProc === "Toutes" || r.procedure === selectedProc || r.procedure === "Toutes";
      const mc = selectedCat === "Toutes" || r.categorie === selectedCat;
      const ms = search === "" || Object.values(r).some(v => typeof v === "string" && v.toLowerCase().includes(search.toLowerCase()));
      return mr && mp && mc && ms;
    });
  }, [search, selectedProc, selectedRole, selectedCat]);

  const filteredOutils = useMemo(() => {
    return OUTILS_DATA.filter(r => {
      const mp = selectedProc === "Toutes" || r.procedure === selectedProc;
      const mc = selectedCat === "Toutes" || r.categorie === selectedCat;
      const ms = search === "" || Object.values(r).some(v => typeof v === "string" && v.toLowerCase().includes(search.toLowerCase()));
      return mp && mc && ms;
    });
  }, [search, selectedProc, selectedCat]);

  const effetLabel = (e) => {
    if (!e || e === "—") return null;
    const isSusp = e.toLowerCase().includes("suspensif") && !e.toLowerCase().includes("non suspensif");
    return { text: e, susp: isSusp };
  };

  return (
    <div style={{ minHeight:"100vh", background:"#FAF9F6", color:"#2C2C2B", fontFamily:"'Source Serif 4', 'Georgia', serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,300;8..60,400;8..60,500;8..60,600&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>

      {/* Article modal */}
      {showArticle && ARTICLE_TEXTS[showArticle] && (
        <div onClick={() => setShowArticle(null)} style={{ position:"fixed", inset:0, background:"rgba(44,44,43,0.5)", backdropFilter:"blur(6px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"#FFFFFE", borderRadius:16, padding:"32px 36px", maxWidth:640, maxHeight:"75vh", overflow:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.15)", border:"1px solid #E8E5DE" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:20 }}>
              <div>
                <div style={{ fontFamily:"'DM Sans', sans-serif", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"1.2px", color:"#9B6B3D", marginBottom:4 }}>{showArticle.startsWith("CPC") ? "Code de procédure civile" : "Code de commerce"}</div>
                <h3 style={{ margin:0, fontSize:22, fontWeight:500, color:"#2C2C2B" }}>Article {showArticle}</h3>
              </div>
              <button onClick={() => setShowArticle(null)} style={{ background:"#F0EFEC", border:"none", width:32, height:32, borderRadius:8, fontSize:16, cursor:"pointer", color:"#888", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
            </div>
            <div style={{ fontSize:15, lineHeight:1.85, color:"#3D3D3B", borderTop:"1px solid #E8E5DE", paddingTop:20 }}>
              {ARTICLE_TEXTS[showArticle]}
            </div>
            <div style={{ marginTop:16, fontSize:11, color:"#B0AA9F", fontFamily:"'DM Sans', sans-serif" }}>
              Source : API Légifrance (PISTE) — texte en vigueur récupéré le 02/04/2026
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ borderBottom:"1px solid #E8E5DE", padding:"36px 32px 28px", background:"#FFFFFE", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:960, margin:"0 auto" }}>
          <div style={{ marginBottom:6 }}>
            <h1 style={{ fontSize:28, fontWeight:500, margin:0, color:"#2C2C2B", letterSpacing:"-0.3px" }}>Procédures collectives</h1>
            <p style={{ fontSize:15, color:"#8A857C", margin:"6px 0 0", fontWeight:300 }}>
              Livre VI du Code de commerce — Voies de recours & Outils du débiteur
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:0, marginTop:8, marginBottom:16, borderBottom:"1px solid #E8E5DE" }}>
            {[{id:"recours", label:"Voies de recours", count: filtered.length}, {id:"outils", label:"Outils du débiteur", count: filteredOutils.length}, {id:"strategies", label:"Stratégies offensives", count: filteredStrategies.length}].map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setExpandedRow(null); }}
                style={{ fontFamily:"'DM Sans', sans-serif", fontSize:13, fontWeight: tab === t.id ? 600 : 400, padding:"10px 20px", background:"none", border:"none", borderBottom: tab === t.id ? "2px solid #9B6B3D" : "2px solid transparent", color: tab === t.id ? "#9B6B3D" : "#8A857C", cursor:"pointer", transition:"all 0.15s", marginBottom:"-1px" }}>
                {t.label} <span style={{ fontSize:11, opacity:0.7, marginLeft:4 }}>{t.count}</span>
              </button>
            ))}
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
            <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:10, fontWeight:600, padding:"3px 10px", borderRadius:20, background:"#E8F4EE", color:"#2D7A5F", textTransform:"uppercase", letterSpacing:"0.8px" }}>API Légifrance</span>
            <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:11, color:"#B0AA9F" }}>46 articles en vigueur · Données PISTE Production</span>
          </div>

          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={tab === "recours" ? "Rechercher un article, une décision, un délai…" : "Rechercher un outil, un article…"}
              style={{ flex:"1 1 260px", padding:"11px 16px", borderRadius:10, border:"1px solid #DDD9D0", background:"#FAF9F6", color:"#2C2C2B", fontSize:14, fontFamily:"'DM Sans', sans-serif", outline:"none", transition:"border 0.2s" }}
              onFocus={e => e.target.style.borderColor="#9B6B3D"}
              onBlur={e => e.target.style.borderColor="#DDD9D0"}
            />
            <select value={selectedProc} onChange={e => setSelectedProc(e.target.value)}
              style={{ padding:"11px 14px", borderRadius:10, border:"1px solid #DDD9D0", background:"#FAF9F6", color:"#2C2C2B", fontSize:13, fontFamily:"'DM Sans', sans-serif", cursor:"pointer" }}>
              <option value="Toutes">Toutes les procédures</option>
              {(tab === "recours" ? PROCEDURES : tab === "outils" ? OUTILS_PROCEDURES : [...new Set(STRATEGIES_DATA.map(r => r.procedure))]).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {tab === "recours" ? (
              <select value={selectedVoie} onChange={e => setSelectedVoie(e.target.value)}
                style={{ padding:"11px 14px", borderRadius:10, border:"1px solid #DDD9D0", background:"#FAF9F6", color:"#2C2C2B", fontSize:13, fontFamily:"'DM Sans', sans-serif", cursor:"pointer" }}>
                <option value="Toutes">Toutes les voies</option>
                {VOIES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            ) : tab === "outils" ? (
              <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)}
                style={{ padding:"11px 14px", borderRadius:10, border:"1px solid #DDD9D0", background:"#FAF9F6", color:"#2C2C2B", fontSize:13, fontFamily:"'DM Sans', sans-serif", cursor:"pointer" }}>
                <option value="Toutes">Toutes catégories</option>
                {OUTILS_CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c] || ""} {c}</option>)}
              </select>
            ) : (
              <>
                <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}
                  style={{ padding:"11px 14px", borderRadius:10, border:"1px solid #DDD9D0", background:"#FAF9F6", color:"#2C2C2B", fontSize:13, fontFamily:"'DM Sans', sans-serif", cursor:"pointer" }}>
                  <option value="Tous">Tous les rôles</option>
                  {STRATEGIES_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)}
                  style={{ padding:"11px 14px", borderRadius:10, border:"1px solid #DDD9D0", background:"#FAF9F6", color:"#2C2C2B", fontSize:13, fontFamily:"'DM Sans', sans-serif", cursor:"pointer" }}>
                  <option value="Toutes">Toutes catégories</option>
                  {STRATEGIES_CATEGORIES.map(c => <option key={c} value={c}>{STRAT_CAT_ICONS[c] || ""} {c}</option>)}
                </select>
              </>
            )}
          </div>
          <div style={{ marginTop:12, fontFamily:"'DM Sans', sans-serif", fontSize:12, color:"#B0AA9F" }}>
            {tab === "recours" ? filtered.length : tab === "outils" ? filteredOutils.length : filteredStrategies.length} résultat{(tab === "recours" ? filtered.length : tab === "outils" ? filteredOutils.length : filteredStrategies.length) !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:960, margin:"0 auto", padding:"24px 32px 60px" }}>


        {/* ── Stratégies offensives ── */}
        {tab === "strategies" && (
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {filteredStrategies.map((r, i) => {
              const roleColors = {"Créancier":{color:"#A63D40",bg:"#FCE8E8"},"Associé / Actionnaire":{color:"#7B3F7B",bg:"#F3E8F3"},"Caution / Garant":{color:"#3D6B9B",bg:"#E3EDF5"}}[r.role] || {color:"#6B6B6B",bg:"#F0EFEC"};
              const isOpen = expandedRow === i;
              return (
                <div key={i} onClick={() => setExpandedRow(isOpen ? null : i)}
                  style={{ background: isOpen ? "#FFFFFE" : "transparent", borderRadius:12, border: isOpen ? "1px solid #E8E5DE" : "1px solid transparent", borderBottom: isOpen ? "1px solid #E8E5DE" : "1px solid #ECEAE4", marginBottom: isOpen ? 8 : 0, cursor:"pointer", transition:"all 0.15s ease", boxShadow: isOpen ? "0 2px 12px rgba(0,0,0,0.04)" : "none" }}>
                  <div style={{ padding:"14px 20px", display:"flex", alignItems:"center", gap:14 }}>
                    <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:10, fontWeight:600, padding:"4px 10px", borderRadius:6, background:roleColors.bg, color:roleColors.color, whiteSpace:"nowrap", letterSpacing:"0.3px", flexShrink:0 }}>{r.role}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:15, fontWeight:400, color:"#2C2C2B", lineHeight:1.35, display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:14 }}>{STRAT_CAT_ICONS[r.categorie] || "·"}</span> {r.strategie}
                      </div>
                      <div style={{ fontFamily:"'DM Sans', sans-serif", fontSize:12, color:"#A09A90", marginTop:3 }}>
                        <span style={{ color:roleColors.color }}>{r.articles}</span> <span style={{ color:"#D0CBBD" }}>·</span> {r.procedure} <span style={{ color:"#D0CBBD" }}>·</span> {r.categorie}
                      </div>
                    </div>
                    {r.timing && (
                      <div style={{ fontFamily:"'DM Sans', sans-serif", fontSize:11, padding:"3px 10px", borderRadius:5, background:"#FFF5E1", color:"#B8860B", whiteSpace:"nowrap", fontWeight:500, flexShrink:0 }}>{r.timing.length > 30 ? "⏱️ Délai" : r.timing}</div>
                    )}
                    <span style={{ fontSize:11, color:"#CCC8C0", transform: isOpen ? "rotate(180deg)" : "", transition:"transform 0.15s", display:"inline-block" }}>▾</span>
                  </div>
                  {isOpen && (
                    <div style={{ padding:"0 20px 20px", borderTop:"1px solid #F0EFEC", paddingTop:14 }}>
                      <div style={{ fontSize:14, color:"#4A4A47", lineHeight:1.7, marginBottom:12 }}>{r.description}</div>
                      {r.timing && (
                        <div style={{ fontFamily:"'DM Sans', sans-serif", fontSize:12, padding:"8px 12px", borderRadius:8, background:"#FFF5E1", color:"#8B6914", marginBottom:12, lineHeight:1.5 }}>
                          <strong>Timing :</strong> {r.timing}
                        </div>
                      )}
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        {parseArticleRefs(r.articles).map(ref => (
                          ARTICLE_TEXTS[ref] ? (
                            <button key={ref} onClick={e => { e.stopPropagation(); setShowArticle(ref); }}
                              style={{ fontFamily:"'DM Sans', sans-serif", background:"#FAF9F6", border:"1px solid #DDD9D0", borderRadius:6, padding:"5px 12px", color:"#9B6B3D", fontSize:12, cursor:"pointer", fontWeight:500, transition:"all 0.15s" }}
                              onMouseEnter={e => { e.target.style.background="#F0EDE6"; e.target.style.borderColor="#9B6B3D"; }}
                              onMouseLeave={e => { e.target.style.background="#FAF9F6"; e.target.style.borderColor="#DDD9D0"; }}>
                              {ref} →
                            </button>
                          ) : null
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredStrategies.length === 0 && (
              <div style={{ textAlign:"center", padding:"50px", color:"#B0AA9F" }}>
                <div style={{ fontSize:32, marginBottom:12 }}>∅</div>
                <p style={{ fontSize:15, fontWeight:300 }}>Aucun résultat.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Outils du débiteur ── */}
        {tab === "outils" && (
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {filteredOutils.map((r, i) => {
              const tag = PROC_TAGS[r.procedure] || PROC_TAGS["Dispositions communes"];
              const isOpen = expandedRow === i;
              return (
                <div key={i} onClick={() => setExpandedRow(isOpen ? null : i)}
                  style={{ background: isOpen ? "#FFFFFE" : "transparent", borderRadius:12, border: isOpen ? "1px solid #E8E5DE" : "1px solid transparent", borderBottom: isOpen ? "1px solid #E8E5DE" : "1px solid #ECEAE4", marginBottom: isOpen ? 8 : 0, cursor:"pointer", transition:"all 0.15s ease", boxShadow: isOpen ? "0 2px 12px rgba(0,0,0,0.04)" : "none" }}>
                  <div style={{ padding:"14px 20px", display:"flex", alignItems:"center", gap:14 }}>
                    <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:10, fontWeight:600, padding:"4px 10px", borderRadius:6, background:tag.bg, color:tag.color, whiteSpace:"nowrap", letterSpacing:"0.3px", flexShrink:0 }}>{r.procedure}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:15, fontWeight:400, color:"#2C2C2B", lineHeight:1.35, display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:14 }}>{CAT_ICONS[r.categorie] || "·"}</span> {r.outil}
                      </div>
                      <div style={{ fontFamily:"'DM Sans', sans-serif", fontSize:12, color:"#A09A90", marginTop:3 }}>
                        <span style={{ color:tag.color }}>{r.articles}</span> <span style={{ color:"#D0CBBD" }}>·</span> {r.categorie}
                      </div>
                    </div>
                    <span style={{ fontSize:11, color:"#CCC8C0", transform: isOpen ? "rotate(180deg)" : "", transition:"transform 0.15s", display:"inline-block" }}>▾</span>
                  </div>
                  {isOpen && (
                    <div style={{ padding:"0 20px 20px", borderTop:"1px solid #F0EFEC", paddingTop:14 }}>
                      <div style={{ fontSize:14, color:"#4A4A47", lineHeight:1.7, marginBottom:12 }}>{r.description}</div>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        {parseArticleRefs(r.articles).map(ref => (
                          ARTICLE_TEXTS[ref] ? (
                            <button key={ref} onClick={e => { e.stopPropagation(); setShowArticle(ref); }}
                              style={{ fontFamily:"'DM Sans', sans-serif", background:"#FAF9F6", border:"1px solid #DDD9D0", borderRadius:6, padding:"5px 12px", color:"#9B6B3D", fontSize:12, cursor:"pointer", fontWeight:500, transition:"all 0.15s" }}
                              onMouseEnter={e => { e.target.style.background="#F0EDE6"; e.target.style.borderColor="#9B6B3D"; }}
                              onMouseLeave={e => { e.target.style.background="#FAF9F6"; e.target.style.borderColor="#DDD9D0"; }}>
                              {ref} →
                            </button>
                          ) : null
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredOutils.length === 0 && (
              <div style={{ textAlign:"center", padding:"50px", color:"#B0AA9F" }}>
                <div style={{ fontSize:32, marginBottom:12 }}>∅</div>
                <p style={{ fontSize:15, fontWeight:300 }}>Aucun résultat.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Voies de recours ── */}
        {tab === "recours" && (<div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {filtered.map((r, i) => {
          const tag = PROC_TAGS[r.procedure] || PROC_TAGS["Dispositions communes"];
          const isOpen = expandedRow === i;
          const ef = effetLabel(r.effet);
          return (
            <div key={i} onClick={() => setExpandedRow(isOpen ? null : i)}
              style={{ background: isOpen ? "#FFFFFE" : "transparent", borderRadius:12, border: isOpen ? "1px solid #E8E5DE" : "1px solid transparent", borderBottom: isOpen ? "1px solid #E8E5DE" : "1px solid #ECEAE4", marginBottom: isOpen ? 8 : 0, cursor:"pointer", transition:"all 0.15s ease", boxShadow: isOpen ? "0 2px 12px rgba(0,0,0,0.04)" : "none" }}>

              <div style={{ padding:"14px 20px", display:"flex", alignItems:"center", gap:16 }}>
                <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:10, fontWeight:600, padding:"4px 10px", borderRadius:6, background:tag.bg, color:tag.color, whiteSpace:"nowrap", letterSpacing:"0.3px", flexShrink:0 }}>{r.procedure}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:15, fontWeight:400, color:"#2C2C2B", lineHeight:1.35 }}>{r.decision}</div>
                  <div style={{ fontFamily:"'DM Sans', sans-serif", fontSize:12, color:"#A09A90", marginTop:3 }}>
                    {r.voie} <span style={{ color:"#D0CBBD" }}>·</span> <span style={{ color:tag.color }}>{r.articles}</span>
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0, display:"flex", alignItems:"center", gap:12 }}>
                  {r.delai !== "—" && r.delai !== "Cf. sauvegarde" && r.delai !== "Identique" && r.delai !== "Dès l'appel" && (
                    <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:12, fontWeight:500, padding:"4px 12px", borderRadius:6, background:"#F5F3EF", color:"#6B6560" }}>{r.delai}</span>
                  )}
                  <span style={{ fontSize:11, color:"#CCC8C0", transform: isOpen ? "rotate(180deg)" : "", transition:"transform 0.15s", display:"inline-block" }}>▾</span>
                </div>
              </div>

              {isOpen && (
                <div style={{ padding:"0 20px 20px", borderTop:"1px solid #F0EFEC" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px 28px", paddingTop:16 }}>
                    <DetailField label="Titulaire(s) du recours" value={r.titulaires} />
                    <div>
                      <div style={{ fontFamily:"'DM Sans', sans-serif", fontSize:10, textTransform:"uppercase", letterSpacing:"1px", color:"#9B6B3D", marginBottom:6, fontWeight:600 }}>Article(s) — texte officiel</div>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        {(r.articleRefs || []).map(ref => (
                          ARTICLE_TEXTS[ref] ?
                            <button key={ref} onClick={e => { e.stopPropagation(); setShowArticle(ref); }}
                              style={{ fontFamily:"'DM Sans', sans-serif", background:"#FAF9F6", border:"1px solid #DDD9D0", borderRadius:6, padding:"5px 12px", color:"#9B6B3D", fontSize:12, cursor:"pointer", fontWeight:500, transition:"all 0.15s" }}
                              onMouseEnter={e => { e.target.style.background="#F0EDE6"; e.target.style.borderColor="#9B6B3D"; }}
                              onMouseLeave={e => { e.target.style.background="#FAF9F6"; e.target.style.borderColor="#DDD9D0"; }}>
                              {ref} →
                            </button>
                          : <span key={ref} style={{ fontFamily:"'DM Sans', sans-serif", fontSize:12, color:"#A09A90" }}>{ref}</span>
                        ))}
                        {(!r.articleRefs || r.articleRefs.length === 0) && <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:13, color:"#6B6560" }}>{r.articles}</span>}
                      </div>
                    </div>
                    <DetailField label="Délai" value={r.delai} />
                    <DetailField label="Point de départ du délai" value={r.pointDepart} />
                    <div style={{ gridColumn:"1 / -1" }}>
                      <div style={{ fontFamily:"'DM Sans', sans-serif", fontSize:10, textTransform:"uppercase", letterSpacing:"1px", color:"#9B6B3D", marginBottom:6, fontWeight:600 }}>Effet du recours</div>
                      {ef ? (
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ width:8, height:8, borderRadius:"50%", background: ef.susp ? "#A63D40" : "#2D7A5F", flexShrink:0 }} />
                          <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:13, color:"#4A4A47" }}>{ef.text}</span>
                        </div>
                      ) : <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:13, color:"#A09A90" }}>—</span>}
                    </div>
                    <div style={{ gridColumn:"1 / -1", background:"#FAF9F6", borderRadius:8, padding:"12px 16px" }}>
                      <div style={{ fontFamily:"'DM Sans', sans-serif", fontSize:10, textTransform:"uppercase", letterSpacing:"1px", color:"#9B6B3D", marginBottom:6, fontWeight:600 }}>Observations</div>
                      <div style={{ fontSize:14, color:"#4A4A47", lineHeight:1.65 }}>{r.observations}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 20px", color:"#B0AA9F" }}>
            <div style={{ fontSize:32, marginBottom:12 }}>∅</div>
            <p style={{ fontSize:15, fontWeight:300 }}>Aucun résultat ne correspond à vos critères.</p>
          </div>
        )}
        </div>)}

        <div style={{ marginTop:40, padding:"20px 24px", borderRadius:12, border:"1px solid #E8E5DE", fontSize:13, color:"#8A857C", lineHeight:1.7 }}>
          <strong style={{ color:"#9B6B3D" }}>Avertissement</strong> — Cet outil est une aide à la compréhension. Il ne se substitue pas à l'analyse juridique au cas par cas ni à la consultation des textes officiels sur <a href="https://www.legifrance.gouv.fr" target="_blank" rel="noopener" style={{ color:"#9B6B3D", textDecoration:"underline", textUnderlineOffset:"2px" }}>Légifrance</a>. Textes récupérés via l'API PISTE le 02/04/2026.
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div>
      <div style={{ fontFamily:"'DM Sans', sans-serif", fontSize:10, textTransform:"uppercase", letterSpacing:"1px", color:"#9B6B3D", marginBottom:6, fontWeight:600 }}>{label}</div>
      <div style={{ fontFamily:"'DM Sans', sans-serif", fontSize:13, color:"#4A4A47", lineHeight:1.55 }}>{value}</div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(VoiesDeRecours));
