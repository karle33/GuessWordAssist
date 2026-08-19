"use client";

import { useEffect, useMemo, useState } from "react";

const INITIALS = ["∅", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "zh", "ch", "sh", "r", "z", "c", "s", "y", "w"];
const FINALS = ["a", "o", "e", "i", "u", "ü", "ai", "ei", "ao", "ou", "an", "en", "ang", "eng", "ong", "ia", "ie", "iao", "iu", "ian", "in", "iang", "ing", "iong", "ua", "uo", "uai", "ui", "uan", "un", "uang", "ueng", "üe", "üan", "ün", "er"];
const TONES = ["1", "2", "3", "4", "轻"];
type Kind = "initials" | "finals" | "tones";
type Slot = { initials: string; finals: string; tones: string };
type Excluded = Record<Kind, string[]>;
const emptySlots = (): Slot[] => Array.from({ length: 4 }, () => ({ initials: "", finals: "", tones: "" }));

export default function Home() {
  const [excluded, setExcluded] = useState<Excluded>({ initials: [], finals: [], tones: [] });
  const [slots, setSlots] = useState<Slot[]>(emptySlots);
  const [round, setRound] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("caiziyin-state");
      if (saved) {
        const data = JSON.parse(saved);
        if (data.excluded) setExcluded(data.excluded);
        if (data.slots) setSlots(data.slots);
        if (typeof data.round === "number") setRound(data.round);
      }
    } catch { /* ignore invalid local data */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem("caiziyin-state", JSON.stringify({ excluded, slots, round }));
  }, [excluded, slots, round, ready]);

  const options = useMemo(() => ({
    initials: INITIALS.filter((v) => !excluded.initials.includes(v)),
    finals: FINALS.filter((v) => !excluded.finals.includes(v)),
    tones: TONES.filter((v) => !excluded.tones.includes(v)),
  }), [excluded]);

  function toggleExcluded(kind: Kind, value: string) {
    setExcluded((current) => ({ ...current, [kind]: current[kind].includes(value) ? current[kind].filter((item) => item !== value) : [...current[kind], value] }));
  }
  function fixValue(index: number, kind: Kind, value: string) {
    setSlots((current) => current.map((slot, i) => i === index ? { ...slot, [kind]: value } : slot));
  }
  function reset() {
    if (!confirm("确定清空所有排除项、固定项和次数吗？")) return;
    setExcluded({ initials: [], finals: [], tones: [] }); setSlots(emptySlots()); setRound(0);
  }

  const groups: { kind: Kind; label: string; values: string[]; tone?: boolean }[] = [
    { kind: "initials", label: "声母", values: INITIALS }, { kind: "finals", label: "韵母", values: FINALS }, { kind: "tones", label: "声调", values: TONES, tone: true },
  ];

  return <main>
    <header className="topbar">
      <div><p className="eyebrow">四字猜词 · 发音排除助手</p><h1>猜字音</h1><p className="subtitle">排除不可能，锁定已确认。所有进度会保存在这台设备上。</p></div>
      <div className="attempts" aria-label={`已使用 ${round} 次，共 10 次`}>
        <span className="attempt-number">{round}<small>/10</small></span>
        <div className="attempt-dots">{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < round ? "used" : ""} />)}</div>
        <button onClick={() => setRound((v) => Math.min(10, v + 1))} disabled={round === 10}>记录一次猜测</button>
      </div>
    </header>
    <section className="panel exclude-panel">
      <div className="section-heading"><div><span className="step">01</span><h2>全局排除</h2></div><p>点选确定不会出现的发音元素，再点一次撤销</p></div>
      {groups.map((group) => <div className="sound-row" key={group.kind}><strong>{group.label}</strong><div className={`chips ${group.tone ? "tone-chips" : ""}`}>
        {group.values.map((value) => { const off = excluded[group.kind].includes(value); return <button key={value} className={off ? "excluded" : ""} onClick={() => toggleExcluded(group.kind, value)} aria-pressed={off}>{value}</button>; })}
      </div></div>)}
    </section>
    <section className="panel candidate-panel">
      <div className="section-heading"><div><span className="step">02</span><h2>四字候选</h2></div><p>选中即固定；“待定”表示继续保留全部可用候选</p></div>
      <div className="slot-grid">{slots.map((slot, index) => <article className="slot-card" key={index}>
        <div className="slot-title"><span>第</span><b>{["一", "二", "三", "四"][index]}</b><span>字</span></div>
        {groups.map((group) => { const current = slot[group.kind]; const list = options[group.kind]; const fixedButExcluded = current && !list.includes(current); return <label key={group.kind}>
          <span>{group.label}<small>{current ? "已固定" : `${list.length} 个候选`}</small></span>
          <select value={current} onChange={(e) => fixValue(index, group.kind, e.target.value)} className={current ? "fixed" : ""}>
            <option value="">待定（{list.length}）</option>{fixedButExcluded && <option value={current}>{current}（已全局排除）</option>}{list.map((value) => <option value={value} key={value}>{value}</option>)}
          </select>
        </label>; })}
        <div className="syllable" aria-label="当前音节">{slot.initials || "·"}<span>{slot.finals || "·"}</span><sup>{slot.tones || "·"}</sup></div>
      </article>)}</div>
    </section>
    <footer><p><b>小提示</b>　零声母用 ∅ 表示；轻声记作“轻”。固定项若随后被全局排除，会保留并标红提醒。</p><button className="reset" onClick={reset}>清空本局</button></footer>
  </main>;
}
