/*
 * Casa: a home dashboard panel for Home Assistant (energy, heating, thermostats, bills, devices).
 * Every entity comes from panel.config (the integration's options); nothing is hard-coded here.
 * Author: Bogdan Damian. SPDX-License-Identifier: MIT
 */
(() => {
const VERSION = '0.18.1';
const CAR_CONTROLS = false;

const CSS = `
/* VOICE  calm household instrument: read at a glance from a phone or a PC, nothing to decode
   IDEA   the house itself is the panel: its photo on top, the rooms and the boiler room below
   PICTURE the house photo with the live power flow over it, then an animated energy flow
   COLOUR charcoal ground, terracotta (the roof) for heat, sun yellow for solar, green battery, blue grid
   TYPE   Manrope 400/600/700, figures large and tabular
   LAYOUT hero across, then a 12-column grid that collapses to one column under 760px */
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap');
:host{--bg:#111315;--card:#1a1d21;--card2:#22262b;--line:#2c3137;--ink:#eef0f2;--mut:#98a2ad;
  --sun:#f5b82e;--heat:#e2623d;--bat:#3dcf8e;--grid:#6aa6ff;--home:#c9d2dc;--bad:#ff6b6b;
  display:block;min-height:100vh;background:var(--bg);color:var(--ink);
  font:15px/1.5 Manrope,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
:host([light]){--bg:#eef0f2;--card:#fff;--card2:#f4f5f7;--line:#e1e4e8;--ink:#15181b;--mut:#5f6a75;--home:#4b5563}
*{box-sizing:border-box;min-width:0}
.wrap{max-width:1280px;margin:0 auto;padding:0 clamp(12px,2.4vw,28px) 40px}
.num{font-variant-numeric:tabular-nums}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;text-align:inherit}
button:focus-visible{outline:2px solid var(--grid);outline-offset:2px;border-radius:12px}

/* hero */
.head{position:relative;margin:0 calc(-1 * clamp(12px,2.4vw,28px))}
.hero{position:relative;height:clamp(200px,30vw,360px);overflow:hidden;background:#2a2f35}
.hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%}
.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,12,14,.55) 0%,rgba(10,12,14,0) 38%,rgba(10,12,14,0) 55%,rgba(10,12,14,.78) 100%)}
.top{position:absolute;z-index:2;left:clamp(14px,2.6vw,32px);right:clamp(14px,2.6vw,32px);top:clamp(10px,1.6vw,20px);display:flex;align-items:flex-start;gap:12px;color:#fff}
.menu{width:40px;height:40px;border-radius:12px;display:none;place-items:center;background:rgba(0,0,0,.28);backdrop-filter:blur(6px)}
:host([narrow]) .menu{display:grid}
.menu svg{width:22px;height:22px}
.title{min-width:0}
.title h1{margin:0;font-size:clamp(24px,3.2vw,36px);line-height:1.05;font-weight:800;letter-spacing:-.01em}
.title p{margin:2px 0 0;font-size:14px;opacity:.9}
.lang{margin-left:auto;display:flex;flex:none;padding:3px;border-radius:12px;background:rgba(0,0,0,.28);backdrop-filter:blur(6px)}
.lang button{min-width:36px;height:30px;border-radius:9px;font-size:12.5px;font-weight:800;color:#fff;opacity:.75;text-align:center}
.lang button.on{background:rgba(255,255,255,.22);opacity:1}
.wx{flex:none;display:flex;align-items:center;gap:8px;padding:6px 12px 6px 8px;border-radius:14px;background:rgba(0,0,0,.28);backdrop-filter:blur(6px);font-size:14px;white-space:nowrap}
.wx b{font-size:20px;font-weight:700}
.wx svg{width:26px;height:26px}
.chips{--home:#c9d2dc;position:absolute;z-index:2;left:0;right:0;bottom:clamp(10px,1.6vw,18px);padding:0 clamp(14px,2.6vw,32px);display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.chip{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:16px;background:rgba(17,19,21,.62);backdrop-filter:blur(10px);color:#fff;border:1px solid rgba(255,255,255,.08)}
.chip i{flex:none;width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:color-mix(in srgb,var(--c) 22%,transparent);color:var(--c)}
.chip i svg{width:22px;height:22px}
.chip span{display:block;font-size:12.5px;opacity:.82;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chip b{display:block;font-size:clamp(17px,1.8vw,22px);font-weight:700;line-height:1.15;white-space:nowrap}

/* grid of cards */
.grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px;margin-top:18px;
  grid-template-areas:"flow flow flow flow flow flow bill bill bill bill bill bill" "flow flow flow flow flow flow dev dev dev dev dev dev" "cl cl cl cl cl cl cr cr cr cr cr cr" "gr gr gr gr gr gr gr gr gr gr gr gr"}
.card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:18px}
.card h2{margin:0 0 14px;font-size:17px;font-weight:700;display:flex;align-items:center;gap:8px}
.card h2 svg{width:21px;height:21px;flex:none;color:var(--mut)}
.card h2 small{margin-left:auto;font-size:13px;font-weight:600;color:var(--mut)}
.col{display:flex;flex-direction:column;gap:16px;min-width:0}.cl{grid-area:cl}.cr{grid-area:cr}.col>.card{align-self:stretch}
.heat{grid-area:heat}.prog{grid-area:prog;align-self:start}.prog[hidden]{display:none}.car{grid-area:car}.car[hidden]{display:none}.cc[hidden]{display:none}.flow{grid-area:flow}.room{grid-area:room}.bill{grid-area:bill}.dev{grid-area:dev}

/* thermostats */
.ths{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.th{display:block;width:100%;padding:14px;border-radius:16px;background:var(--card2);border:1px solid transparent;transition:border-color .3s,background .3s}
.th.on{border-color:color-mix(in srgb,var(--heat) 55%,transparent);background:color-mix(in srgb,var(--heat) 10%,var(--card2))}
.th.na{opacity:.55}
.th .n{display:flex;align-items:center;gap:6px;font-weight:600;font-size:14.5px}
.th .n em{margin-left:auto;font-style:normal;font-size:12px;font-weight:700;padding:2px 9px;border-radius:99px;background:var(--line);color:var(--mut);white-space:nowrap}
.th.on .n em{background:var(--heat);color:#fff}
.th .t{font-size:clamp(30px,3.6vw,40px);font-weight:800;line-height:1.1;margin-top:6px;letter-spacing:-.02em}
.th .t sup{font-size:.45em;font-weight:700;margin-left:2px;vertical-align:.9em}
.th .s{font-size:13px;color:var(--mut)}
.scale{position:relative;height:6px;border-radius:9px;margin:12px 0 4px;background:linear-gradient(90deg,#4f8cff,#9ad0a9 45%,var(--heat))}
.scale .cur{position:absolute;top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:var(--ink);border:3px solid var(--card2);transition:left .6s}
.scale .tgt{position:absolute;top:-4px;width:2px;height:14px;margin-left:-1px;background:var(--ink);opacity:.7;transition:left .6s}

/* energy flow */
.fsvg{width:100%;height:auto;display:block;max-height:300px}
.fsvg .ln{fill:none;stroke:var(--line);stroke-width:3}
.fsvg .fl{fill:none;stroke-width:3;stroke-linecap:round;stroke-dasharray:2 10;opacity:0}
.fsvg .fl.go{opacity:1;animation:run 1.1s linear infinite}
.fsvg .fl.go.rev{animation-direction:reverse}
@keyframes run{to{stroke-dashoffset:-24}}
.fsvg .nd{fill:var(--card2);stroke-width:2.5}
.fsvg text{fill:var(--ink);font:700 15px Manrope,system-ui,sans-serif}
.fsvg text.l{fill:var(--mut);font-size:12px;font-weight:600}
.fsvg .hub{fill:var(--line)}
.legend{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 16px;margin-top:10px;font-size:13.5px}
.legend div{display:flex;justify-content:space-between;gap:8px;border-top:1px solid var(--line);padding-top:8px}
.legend span{color:var(--mut)}

/* boiler room */
.rm{display:grid;grid-template-columns:150px minmax(0,1fr);gap:18px;align-items:stretch}
.tanks{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:10px}
.rm.two{grid-template-columns:220px minmax(0,1fr)}
.rm.two .tank .vs{width:52px}.rm.two .tank b{font-size:26px}
.tank{position:relative;border-radius:18px;background:var(--card2);padding:14px 12px;display:flex;flex-direction:column;align-items:center;text-align:center}
.tank .vs{position:relative;width:64px;flex:1;min-height:120px;border-radius:32px;border:3px solid var(--line);overflow:hidden;margin:6px 0 10px;background:var(--bg)}
.tank .lv{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(0deg,#4f8cff,#f2a03d 60%,var(--heat));transition:height .8s}
.tank b{font-size:30px;font-weight:800;line-height:1}
.tank span{font-size:13px;color:var(--mut)}
.meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:12px}
.meta>div{padding:10px 12px;border-radius:14px;background:var(--card2)}
.meta span{display:block;font-size:12.5px;color:var(--mut)}
.meta b{display:block;font-size:17px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.meta small{display:block;font-size:12px;color:var(--mut);margin-top:2px;line-height:1.35}
.meta .mode{display:block;width:100%;padding:10px 12px;border-radius:14px;background:var(--card2);border:1px solid transparent;min-height:48px}
.meta .mode b::after{content:" ▾";font-size:12px;color:var(--mut);font-weight:600}
.meta .mode.man{background:color-mix(in srgb,var(--heat) 13%,var(--card2));border-color:color-mix(in srgb,var(--heat) 45%,transparent)}
.meta .mode.man b{color:var(--heat)}
.opts{grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap}.opts[hidden]{display:none}
.opts button{flex:1 1 0;min-height:44px;padding:8px 10px;border-radius:12px;background:var(--card2);border:1px solid var(--line);font-weight:700;font-size:14px;text-align:center;line-height:1.2}
.opts button.on{background:var(--grid);border-color:var(--grid);color:#fff}
.opts p{flex-basis:100%;margin:0;font-size:12.5px;color:var(--bad)}
.eq{display:grid;gap:8px}
.eq>div{display:flex;align-items:center;gap:12px;width:100%;padding:9px 12px;border-radius:14px;background:var(--card2);min-height:48px}
.eq i{flex:none;width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:var(--line);color:var(--mut);transition:.3s}
.eq i svg{width:19px;height:19px}
.eq .on i{background:color-mix(in srgb,var(--bat) 22%,transparent);color:var(--bat)}
.eq .on.al i{background:color-mix(in srgb,var(--heat) 24%,transparent);color:var(--heat)}
.eq span{min-width:0}.eq .why{color:var(--ink);opacity:.8;margin-top:1px}
.eq .eqm{margin-left:auto;flex:none;padding:5px 10px;border-radius:10px;background:var(--line);font-size:12.5px;font-weight:700;color:var(--ink);white-space:nowrap}
.eq .eqm::after{content:" ▾";color:var(--mut);font-size:11px}
.eq .eqm.man{background:color-mix(in srgb,var(--heat) 18%,var(--card2));color:var(--heat);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--heat) 45%,transparent)}
.eq .eqm+em{margin-left:6px}
.eq em{margin-left:auto;font-style:normal;font-size:13px;font-weight:700;color:var(--mut)}
.eq .on em{color:var(--bat)}.eq .on.al em{color:var(--heat)}.eq .na em{color:var(--bad)}

/* bill and devices */
.bills{display:grid;gap:14px}.b1+.b1{border-top:1px solid var(--line);padding-top:14px}
.bh{display:flex;align-items:baseline;gap:8px;margin-bottom:4px}.bh b{font-size:15px}.bh span{margin-left:auto;font-size:12.5px;color:var(--mut)}
.big{font-size:clamp(24px,2.6vw,30px);font-weight:800;line-height:1.1}
.ok{color:var(--bat)}.due{color:var(--heat)}
.kv{display:grid;grid-template-columns:auto minmax(0,1fr);gap:6px 14px;margin-top:12px;font-size:14px}
.kv span{color:var(--mut)}.kv b{font-weight:600;text-align:right}
.gr{grid-area:gr}.gcs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.gcs .wide{grid-column:1/-1}
.gc{padding:12px 12px 8px;border-radius:16px;background:var(--card2);min-width:0}
.gc .gh{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px}.gc .gh b{font-size:14px}
.gc .gl{display:flex;gap:4px;flex-wrap:wrap;margin-left:auto}
.gc .gl button{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:8px;font-size:12px;color:var(--mut);background:transparent}
.gc .gl button i{width:10px;height:10px;border-radius:3px;background:var(--c)}.gc .gl button.off{opacity:.4;text-decoration:line-through}
.gb{position:relative;margin-left:38px}.gb svg{display:block;width:100%;height:100%;overflow:visible}
.gb .gy{position:absolute;left:-40px;width:34px;text-align:right;font-size:11px;color:var(--mut);transform:translateY(-50%)}
.gb .gx{position:absolute;top:100%;margin-top:4px;font-size:11px;color:var(--mut);transform:translateX(-50%);white-space:nowrap}
.gb .gx.e{transform:translateX(-100%)}
.gb .gg{stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke}.gb .gz{stroke:var(--mut);stroke-width:1;opacity:.6;vector-effect:non-scaling-stroke}
.gb .gs{fill:none;stroke:var(--c);stroke-width:1.8;vector-effect:non-scaling-stroke;stroke-linejoin:round}.gb .gs.d{stroke-dasharray:5 4;stroke-width:1.4;opacity:.85}
.gb .ga{fill:var(--c);opacity:.18}.gb .gband{fill:var(--heat);opacity:.12}
.gb .cur{position:absolute;top:0;bottom:0;width:1px;background:var(--mut);opacity:.7;pointer-events:none}
.gb .tip{position:absolute;top:4px;z-index:2;pointer-events:none;background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:7px 10px;font-size:12px;min-width:120px;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.gb .tip div{display:flex;align-items:center;gap:6px;white-space:nowrap}.gb .tip div b{margin-left:auto;padding-left:10px}.gb .tip i{width:9px;height:9px;border-radius:2px;background:var(--c)}
.gb .tip .tt{color:var(--mut);margin-bottom:3px}
.gb .hit{position:absolute;inset:0;touch-action:pan-y;cursor:crosshair}
.gtl{margin:24px 0 0 38px;display:grid;gap:4px}.gtl div{position:relative;height:18px;border-radius:5px;background:var(--bg);overflow:hidden}
.gtl div span{position:absolute;top:0;bottom:0;border-radius:4px;background:var(--c);opacity:.85}
.gtl div em{position:absolute;left:6px;top:0;z-index:1;font-style:normal;font-size:11px;font-weight:600;line-height:18px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.8);white-space:nowrap}
@media (max-width:1000px){.gcs{grid-template-columns:minmax(0,1fr)}}
.acs{grid-area:acs}.acs .cmsg:empty{display:none}.acs[hidden]{display:none}
.acu{padding:12px;border-radius:16px;background:var(--card2);display:grid;gap:10px}.acu+.acu{margin-top:10px}
.acu .hd{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}.acu .hd b{font-size:15px}.acu .hd em{font-style:normal;font-weight:800;font-size:17px}
.acu .hd span{color:var(--mut);font-size:13px}.acu.on .hd em{color:var(--grid)}.acu.on.heat .hd em{color:var(--heat)}
.acu .tt{display:flex;align-items:center;gap:8px}.acu .tt button{width:38px;height:38px;border-radius:12px;background:var(--bg);font-size:20px;font-weight:700}
.acu .tt strong{min-width:64px;text-align:center;font-size:24px;font-weight:800}.acu .tt.dim strong{opacity:.45}
.acu .row{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.acu .row>small{width:100%;color:var(--mut);font-size:12px}
.acu .row button{flex:1 1 auto;text-align:center;justify-content:center;min-width:64px;min-height:34px;padding:0 10px;border-radius:10px;background:var(--bg);border:1px solid var(--line);font-size:13px;font-weight:700}
.acu .row button.on{background:var(--grid);border-color:var(--grid);color:#fff}.acu .row button.on.heat{background:var(--heat);border-color:var(--heat)}
.acu .row button.on.off{background:var(--line);border-color:var(--mut);color:var(--ink)}
.lit{grid-area:lit;align-self:start}.lit[hidden]{display:none}.lts{display:grid;gap:8px}
.lts button{display:flex;align-items:center;gap:12px;width:100%;padding:9px 12px;border-radius:14px;background:var(--card2);min-height:52px;text-align:left}
.lts i{flex:none;width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:var(--line);color:var(--mut);transition:.3s}
.lts i svg{width:19px;height:19px}
.lts span{min-width:0;font-weight:600}.lts small{display:block;font-size:12px;color:var(--mut);font-weight:500}
.lts .sw{margin-left:auto;flex:none;width:44px;height:26px;border-radius:13px;background:var(--line);position:relative;transition:.25s}
.lts .sw::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:var(--ink);opacity:.75;transition:.25s}
.lts .on .sw{background:var(--sun)}.lts .on .sw::after{left:21px;background:#fff;opacity:1}
.lts .on i{background:color-mix(in srgb,var(--sun) 24%,transparent);color:var(--sun)}
.lts .au.on .sw{background:var(--grid)}.lts .au.on i{background:color-mix(in srgb,var(--grid) 22%,transparent);color:var(--grid)}
.lts .na{opacity:.55}.lts .na small{color:var(--bad)}
.devs{display:flex;flex-wrap:wrap;gap:8px}
.devs button{display:flex;align-items:center;gap:7px;padding:7px 11px;border-radius:99px;background:var(--card2);font-size:13.5px;font-weight:600}
.devs i{width:8px;height:8px;border-radius:50%;background:var(--bat)}
.devs .bad i{background:var(--bad)}.devs .wait i{background:var(--sun)}.devs .bad{color:var(--bad)}
.note{font-size:13px;color:var(--mut);margin:10px 0 0}
.empty{color:var(--mut);font-size:14px}
/* alerts, forecast, charts, today */
.alerts{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.alerts:empty{display:none}
.al{display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:14px;font-weight:600;font-size:14px;min-height:44px;
  background:color-mix(in srgb,var(--heat) 14%,var(--card));border:1px solid color-mix(in srgb,var(--heat) 42%,transparent)}
.al.bad{background:color-mix(in srgb,var(--bad) 14%,var(--card));border-color:color-mix(in srgb,var(--bad) 48%,transparent)}
.al svg{width:18px;height:18px;flex:none;color:var(--heat)}.al.bad svg{color:var(--bad)}
.wn{display:flex;align-items:center;gap:8px}
.wx .fc{display:flex;gap:12px;margin-left:4px;padding-left:12px;border-left:1px solid rgba(255,255,255,.25)}
.fc div{text-align:center;font-size:12px;line-height:1.25}.fc svg{width:18px;height:18px;display:block;margin:2px auto}
.fc b{font-size:13px;font-weight:700}.fc small{opacity:.75;margin-left:3px}
.spark{display:block;width:100%;height:26px;margin-top:6px;overflow:visible}
.spark path{fill:none;stroke:var(--mut);stroke-width:1.6;opacity:.7;vector-effect:non-scaling-stroke}
.th.on .spark path{stroke:var(--heat);opacity:.9}
.pch{margin-top:16px;padding:12px 14px;border-radius:16px;background:var(--card2)}
.pch .ph{display:flex;justify-content:space-between;gap:10px;font-size:13px;color:var(--mut)}.pch .ph b{color:var(--ink);font-weight:600}
.pch svg{display:block;width:100%;height:72px;margin:8px 0 4px}
.pch .ln2{fill:none;stroke:var(--heat);stroke-width:2;vector-effect:non-scaling-stroke}
.pch .ln3{fill:none;stroke:var(--sun);stroke-width:2;vector-effect:non-scaling-stroke}
.pch .lg{display:inline-flex;align-items:center;gap:5px;margin-left:10px;white-space:nowrap}.pch .lg i{width:9px;height:9px;border-radius:50%}
.pch .ax{display:flex;justify-content:space-between;font-size:12px;color:var(--mut)}
.eq span small{display:block;font-size:12px;color:var(--mut);font-weight:500}.eq span small b{color:var(--ink);font-weight:700}
.sub{margin:16px 0 0;font-size:13px;font-weight:700;color:var(--mut)}
/* fixed programs (Shelly) */
.pl{display:grid;gap:8px;cursor:pointer;border-radius:14px}
.pl[hidden],.hint[hidden]{display:none}
.pl:focus-visible{outline:2px solid var(--grid);outline-offset:3px}
.pr{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:14px;background:var(--card2);min-height:52px}
.pr b{display:block;font-size:14.5px}.pr span{display:block;font-size:12.5px;color:var(--mut)}
.pr em{margin-left:auto;font-style:normal;font-size:12px;font-weight:700;padding:3px 10px;border-radius:99px;background:var(--line);color:var(--mut);white-space:nowrap}
.pr.en em{background:color-mix(in srgb,var(--bat) 20%,transparent);color:var(--bat)}
.pr.run{background:color-mix(in srgb,var(--heat) 12%,var(--card2));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--heat) 45%,transparent)}
.pr.run em{background:var(--heat);color:#fff}
.pr.off{opacity:.7}
.hint{margin:10px 0 0;font-size:12.5px;color:var(--mut);text-align:center}
.pe{display:grid;gap:10px}.pe[hidden]{display:none}
.pe1{padding:12px;border-radius:14px;background:var(--card2)}
.pt{display:flex;align-items:center;gap:10px}.pt b{font-size:15px}.pt span{font-size:12.5px;color:var(--mut)}
.tg{position:relative;width:48px;height:28px;flex:none;margin-left:auto}
.tg input{position:absolute;inset:0;margin:0;opacity:0;cursor:pointer;z-index:1}
.tg i{position:absolute;inset:0;border-radius:99px;background:var(--line);transition:background .2s}
.tg i::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:transform .2s}
.tg input:checked+i{background:var(--bat)}.tg input:checked+i::after{transform:translateX(20px)}
.tg input:focus-visible+i{outline:2px solid var(--grid);outline-offset:2px}.tg input:disabled+i{opacity:.5}
.tm{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px}
.tm label span{display:block;font-size:12.5px;color:var(--mut);margin-bottom:4px}
.tm input{width:100%;min-height:44px;padding:8px 10px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:inherit;font-size:16px;font-variant-numeric:tabular-nums}
.tm input:focus-visible{outline:2px solid var(--grid);outline-offset:1px}
.perr{margin:8px 0 0;font-size:12.5px;color:var(--bad)}.perr:empty{display:none}
.done{justify-self:end;min-height:44px;padding:0 22px;border-radius:12px;background:var(--grid);color:#fff;font-weight:700}
/* car (OverDrive) */
.cg{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr);gap:16px}
.cb{padding:14px;border-radius:16px;background:var(--card2)}
.cb .big{color:var(--bat)}.cb .big.low{color:var(--heat)}
.bar{position:relative;height:10px;border-radius:9px;background:var(--line);margin:10px 0 6px;overflow:visible}
.bar i{position:absolute;left:0;top:0;bottom:0;border-radius:9px;background:var(--bat);transition:width .6s}
.bar.fuel i{background:var(--sun)}
.bar b{position:absolute;top:-4px;width:2px;height:18px;margin-left:-1px;background:var(--ink);opacity:.75}
.rg{display:flex;justify-content:space-between;gap:10px;font-size:13px;color:var(--mut)}.rg b{color:var(--ink);font-weight:700}
.pills{display:flex;flex-wrap:wrap;gap:8px}
.pill{display:flex;align-items:center;gap:7px;padding:8px 12px;border-radius:99px;background:var(--card2);font-size:13.5px;font-weight:600;min-height:40px}
.pill i{width:8px;height:8px;border-radius:50%;background:var(--bat)}.pill.warn i{background:var(--heat)}.pill.warn{color:var(--heat)}.pill.mut i{background:var(--mut)}
.pill.chg{background:color-mix(in srgb,var(--bat) 16%,var(--card2));color:var(--bat)}
.tyres{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.ty{padding:9px 10px;border-radius:12px;background:var(--card2);text-align:center}
.ty span{display:block;font-size:12px;color:var(--mut)}.ty b{font-size:17px}.ty.low{box-shadow:inset 0 0 0 1px var(--bad)}.ty.low b{color:var(--bad)}
.cf{margin:12px 0 0;font-size:13px;color:var(--mut)}.cf b{color:var(--ink);font-weight:600}
/* car climate controls */
.cc{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.6fr);gap:16px;margin-top:16px}
.cc h3{margin:0 0 10px;font-size:14px;font-weight:700;color:var(--mut)}
.ccl{display:grid;gap:10px;align-content:start}
.clim .ch{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}.clim .ch h3{margin:0}.clim .ch b{font-size:17px;font-weight:800}.clim .ch span{color:var(--mut);font-size:13px}
.clim .tt{flex-wrap:wrap;gap:8px}.clim .tt button{width:38px;height:38px;font-size:18px}.clim .tt b{min-width:48px;font-size:18px}
.clim .tt .act{height:38px;min-height:38px;min-width:0;flex:1 1 90px;font-size:14px;padding:0 10px}.clim .tt .act.pre{flex-basis:110px}
.clim .tt .act.pre:not(.arm){background:var(--line);color:var(--ink)}
.clim .ch.lk{align-items:center}.clim .ch.lk .act{margin-left:auto;min-height:36px;padding:0 16px;font-size:14px}
.clim .tb .act{min-height:38px;font-size:14px}.clim .tb{display:grid;grid-template-columns:1fr 1fr auto;gap:8px}.clim .tb .z{background:var(--card);color:var(--ink);padding-inline:18px}.clim .tb .dim{opacity:.55}
.clim{padding:10px 12px;border-radius:14px;background:var(--card2);display:grid;gap:8px;align-content:start}
.clim .st{display:flex;align-items:center;gap:10px}.clim .st b{font-size:24px;font-weight:800}.clim .st span{color:var(--mut);font-size:13.5px}
.tt{display:flex;align-items:center;gap:10px}
.tt button{width:44px;height:44px;border-radius:12px;background:var(--bg);border:1px solid var(--line);font-size:20px;font-weight:700;text-align:center}
.tt b{min-width:64px;text-align:center;font-size:20px}
.tt .act{width:auto;flex:1;height:44px;font-size:15px;background:var(--grid);border:0;color:#fff}.tt .act.off{background:var(--line);color:var(--ink)}
.act{min-height:46px;padding:0 16px;border-radius:12px;background:var(--grid);color:#fff;font-weight:700;text-align:center}
.act.off{background:var(--line);color:var(--ink)}.act.arm{background:var(--heat)}
.seats{display:grid;gap:5px}
.seat{display:grid;grid-template-columns:minmax(0,9em) minmax(0,1fr);align-items:center;gap:8px;padding:4px 6px 4px 10px;border-radius:12px;background:var(--card2)}
.seat>span{font-size:13px;font-weight:600;line-height:1.2}
.lv{display:flex;gap:5px}
.lv button{flex:1;min-height:32px;border-radius:9px;background:var(--bg);border:1px solid var(--line);font-weight:700;font-size:13.5px;text-align:center}
.lv button.on{background:var(--heat);border-color:var(--heat);color:#fff}
.lv button.on.z{background:var(--line);border-color:var(--mut);color:var(--ink)}
.lv.vent button.on:not(.z){background:var(--grid);border-color:var(--grid)}
.cmsg{margin:8px 0 0;font-size:12.5px;color:var(--mut);min-height:1em}.cmsg.err{color:var(--bad)}
@media (max-width:900px){.cc{grid-template-columns:minmax(0,1fr)}}
@media (max-width:420px){.seat{grid-template-columns:minmax(0,6.6em) minmax(0,1fr);gap:6px}.seat>span{font-size:12.5px}}
.car{container-type:inline-size}
@container (max-width:860px){.cg{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.cg>.cb{grid-column:1/-1}}
@container (max-width:440px){.cg{grid-template-columns:minmax(0,1fr)}}
footer{margin-top:22px;text-align:center;font-size:12.5px;color:var(--mut)}

@media (max-width:1000px){.rm{grid-template-columns:120px minmax(0,1fr)}.rm.two{grid-template-columns:190px minmax(0,1fr)}}
@media (max-width:760px){
  .grid{grid-template-columns:minmax(0,1fr);grid-template-areas:"flow" "bill" "heat" "room" "prog" "lit" "acs" "car" "dev";gap:12px}.col{display:contents}
  .hero{height:190px}
  .chips{--home:inherit;position:static;grid-template-columns:repeat(2,minmax(0,1fr));padding:0 clamp(12px,2.4vw,28px);margin-top:12px;gap:8px}
  .chip{background:var(--card);color:var(--ink);border-color:var(--line);backdrop-filter:none}
  .card{padding:14px;border-radius:18px}
  /* phone: tiles; a card opens as a sheet from the bottom */
  .grid{display:block}
  .mts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  .mb{display:flex;flex-direction:column;align-items:stretch;gap:2px;min-height:96px;padding:11px 12px;border-radius:18px;background:var(--card);border:1px solid var(--line);text-align:left;color:var(--ink);--t:var(--mut)}
  .mb[hidden]{display:none}
  .mb .mh{display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:12.5px;color:var(--t);font-weight:600}
  .mb .mh i{display:grid;place-items:center;width:26px;height:26px;border-radius:9px;background:var(--card2);color:var(--t)}.mb .mh i svg{width:16px;height:16px}
  .mb b{font-size:21px;font-weight:800;line-height:1.15;margin-top:auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .mb small{font-size:12px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .mb.s-hot{--t:var(--heat);background:color-mix(in srgb,var(--heat) 13%,var(--card));border-color:color-mix(in srgb,var(--heat) 45%,var(--line))}
  .mb.s-lit{--t:var(--sun);background:color-mix(in srgb,var(--sun) 13%,var(--card));border-color:color-mix(in srgb,var(--sun) 45%,var(--line))}
  .mb.s-cool{--t:var(--grid);background:color-mix(in srgb,var(--grid) 13%,var(--card));border-color:color-mix(in srgb,var(--grid) 45%,var(--line))}
  .mb.s-good{--t:var(--bat)}
  .mb.s-bad{--t:var(--bad);background:color-mix(in srgb,var(--bad) 12%,var(--card));border-color:color-mix(in srgb,var(--bad) 45%,var(--line))}
  .mb.s-hot b,.mb.s-lit b,.mb.s-cool b,.mb.s-bad b,.mb.s-good b{color:var(--t)}
  .grid .card{display:none}
  .grid .card.mo{display:block;position:fixed;left:0;right:0;bottom:0;z-index:20;max-height:86vh;overflow-y:auto;overscroll-behavior:contain;border-radius:22px 22px 0 0;padding:6px 14px calc(18px + env(safe-area-inset-bottom));animation:up .24s ease-out;transition:transform .2s}
  .grid .card.mo::before{content:"";display:block;width:38px;height:5px;border-radius:3px;background:var(--line);margin:4px auto 6px}
  .grid .card.mo>h2{position:sticky;top:-6px;z-index:3;background:var(--card);margin:0 -14px 10px;padding:8px 14px}
  .mx{display:grid;place-items:center;margin-left:8px;width:32px;height:32px;border-radius:50%;background:var(--card2);color:var(--ink);font-size:18px;line-height:1;flex:none}
  .scrim{position:fixed;inset:0;z-index:19;background:rgba(0,0,0,.55);animation:fade .2s}
  .scrim[hidden]{display:none}
}
@keyframes up{from{transform:translateY(100%)}to{transform:none}}@keyframes fade{from{opacity:0}}
@media (min-width:761px){.mts,.scrim,.mx{display:none}}
@media (max-width:600px){.lang button{min-width:32px;height:28px}.wx{flex-direction:column;align-items:flex-end;gap:6px;padding:6px 10px}.wx .fc{border:0;margin:0;padding:0;gap:10px}.wn b{font-size:17px}}
@media (max-width:480px){.legend{grid-template-columns:minmax(0,1fr)}}
@media (max-width:420px){.ths,.meta{gap:8px}.th{padding:12px}.rm,.rm.two{grid-template-columns:minmax(0,1fr)}.tank{flex-direction:row;gap:14px;text-align:left}.tank .vs{width:46px;min-height:96px;flex:none;margin:0}
  .rm.two .tank{flex-direction:column;text-align:center;gap:0;padding:12px 8px}.rm.two .tank .vs{width:44px;min-height:110px;flex:1;margin:6px 0 8px}.rm.two .tank b{font-size:24px}}
@media (prefers-reduced-motion:reduce){.fsvg .fl.go{animation:none;stroke-dasharray:none}}
`;

/* simple line icons, 24x24 */
/* ---------- languages: RO / EN, switched in the page and remembered per device */
let L = 'ro';
const LOC = () => (L === 'ro' ? 'ro-RO' : 'en-GB');
const T = {
  ro: {
    home: 'Acasă', menu: 'Meniu', solar: 'Solar', load: 'Casa consumă', battery: 'Baterie', grid: 'Rețea',
    gridImport: 'Rețea · import', gridExport: 'Rețea · export', charging: (w) => `Se încarcă · ${w}`, discharging: (w) => `Se descarcă · ${w}`,
    thermostats: 'Termostate', energyNow: 'Energie acum', boilerRoom: 'Camera tehnică', bill: 'Factura de curent', devices: 'Dispozitive', close: 'Închide', down: (n) => (n === 1 ? '1 căzut' : `${n} căzute`), lights: 'Lumini exterior', charts: 'Grafice', last24: 'ultimele 24 h', gEnergy: 'Energie', gCons: 'Consum', gGrid: 'Rețea', gSolar: 'Solar', gBat: 'Baterie', gSoc: 'Baterie (SOC)', gVolt: 'Tensiune rețea', gLimit: 'prag 253 V',
    gTanks: 'Puffer și ACM', gTemp: 'Temperatură', gSet: 'Setat', gHeatOn: 'încălzește', gEquip: 'Echipamente', tChartsSub: 'energie, temperaturi', tAll: 'Achitat', tAllSub: 'toate facturile', tActive: 'active', tIdle: 'Repaus', tRuns: 'Rulează', acTitle: 'Aer condiționat', acRoom: (t) => `în cameră ${t}`, acMode: 'Mod', acFan: 'Ventilator', acOn: (n) => n ? `${n} pornit${n > 1 ? 'e' : ''}` : 'oprit',
    hv: { off: 'Oprit', cool: 'Răcire', heat: 'Încălzire', auto: 'Auto', heat_cool: 'Auto', dry: 'Uscare', fan_only: 'Ventilație' },
    fanM: { auto: 'Auto', low: 'Mic', medium: 'Mediu', middle: 'Mediu', high: 'Mare', quiet: 'Silențios', turbo: 'Turbo' }, lAuto: 'Automat', lAutoOff: 'Automat oprit', lOnAt: (t) => `aprindere ${t}`, lOffAt: (t) => `stingere ${t}`, lAutoHint: 'apus / răsărit', lOn: (n, m) => `${n} din ${m} aprinse`, lToday: 'azi', lTomorrow: 'mâine',
    pickThermostats: 'Alege termostatele în opțiunile integrării.', pickEquipment: 'Alege echipamentele în opțiuni.',
    pickContracts: 'Scrie contractele în opțiuni.', pickDevices: 'Alege dispozitivele urmărite în opțiuni.',
    noBillData: 'Integrarea Hidroelectrica nu are date pentru acest contract acum.',
    puffer: 'Puffer', puffer24: 'Puffer · ultimele 24 h', acm: 'ACM', acm24: 'ACM · ultimele 24 h', temps24: 'Temperaturi · ultimele 24 h', ago24: 'acum 24 h', ago12: 'acum 12 h', now: 'acum',
    heatMode: 'Mod încălzire', heatDemand: 'Cerere căldură', modeError: (e) => `Nu am putut schimba modul: ${e}`,
    flow: 'Fluxul de energie', fSolar: 'solar', fHouse: 'casa', fBattery: 'baterie', fGrid: 'rețea', import: 'import', export: 'export', idleBat: 'în repaus',
    selfNow: (x) => `${x} % din surse proprii`, gridV: 'Tensiune rețea', today: 'Azi',
    produced: 'Produs', used: 'Consumat', imported: 'Import', exported: 'Export', selfToday: 'Din surse proprii',
    fcRest: 'Prognoză rest azi', fcTomorrow: 'Prognoză mâine',
    rest: 'repaus', chargingW: 'încărcare', dischargingW: 'descărcare', full: 'plină', fullIn: (d) => `plină în ~${d}`, atReserve: 'la rezervă', lasts: (d) => `ține ~${d}`,
    unavailable: 'Indisponibil', on: 'Pornit', off: 'Oprit', setTo: (x) => `Setat la ${x}°`, noTarget: 'Fără temperatură setată', humidity: (x) => `umiditate ${x} %`,
    zonesHeating: (n) => (n === 0 ? 'nicio zonă nu încălzește' : n === 1 ? '1 zonă încălzește' : `${n} zone încălzesc`),
    hot: 'cald', warm: 'călduț', cold: 'rece', unavail: 'indisponibil', noHistory: 'fără istoric', loading: 'se încarcă…',
    ranToday: (d) => `a mers ${d} azi`, notToday: 'nu a mers azi', running: (a, b) => `${a} din ${b} pornite`,
    lastBill: 'Ultima factură', due: 'Scadență', unpaid: 'Neachitat',
    devOff: (n) => (n === 1 ? '1 indisponibil' : `${n} indisponibile`), allOnline: (n) => `toate ${n} online`,
    aDevOff: (x) => `${x} indisponibil`, aDevsOff: (n, x) => `${n} dispozitive indisponibile: ${x}`,
    aOverdue: (w, s) => `Factura ${w} e restantă · ${s}`, aDue: (w, d, s) => `Factura ${w}: scadență ${d === 0 ? 'azi' : d === 1 ? 'mâine' : `în ${d} zile`} · ${s}`,
    aBattery: (x) => `Baterie ${x} %`, aPuffer: (x) => `Puffer rece: ${x}°`, aRunning: (n, d) => `${n} · pornit de ${d}`,
    days: (n) => `${n} zile`, notConfigured: 'Casa nu e configurată',
    carDef: 'Mașina', atHome: 'acasă', away: 'plecată', offline: 'fără conexiune', lastSeen: (h) => `ultima actualizare ${h}`,
    target: (x) => `țintă ${x} %`, ev: 'Electric', fuel: 'Benzină', locked: 'Încuiată', unlocked: 'Descuiată', doorsShut: 'Uși închise', doorOpen: 'Ușă deschisă',
    chargingKw: (x) => `Se încarcă · ${x}`, notCharging: 'Nu se încarcă', online: 'Conectată', tyres: 'Pneuri', fl: 'Față st.', fr: 'Față dr.', rl: 'Spate st.', rr: 'Spate dr.',
    odo: 'Kilometraj', cons: 'Consum', outside: 'Afară',
    aTyre: (w, x) => `Presiune scăzută: ${w} ${x} bar`, aTyreLeak: (w) => `Pierdere de aer: ${w}`, aUnlocked: (n) => `${n} e descuiată`, aCarLow: (n, x) => `${n} are ${x} % și nu e la încărcat`,
    climate: 'Climatizare', climOn: 'Pornită', climOff: 'Oprită', turnOn: 'Pornește', turnOff: 'Oprește', preheat: 'Preîncălzire', preheatArm: 'Atinge din nou ca să pornești',
    preheatHint: 'climă, scaun șofer și volan', seats: 'Scaune și volan', drvHeat: 'Șofer · încălzire', drvVent: 'Șofer · ventilație', psgHeat: 'Pasager · încălzire', psgVent: 'Pasager · ventilație',
    inside: 'în mașină', wheel: 'Volan · încălzire', lockTitle: 'Încuietoare', tailTitle: 'Hayon', tOpen: 'Deschis', tClosed: 'Închis', tOpening: 'Se deschide…', tClosing: 'Se închide…', tDoOpen: 'Deschide', tArm: 'Atinge din nou ca să deschizi', tDoClose: 'Închide', tStop: 'Stop', doLock: 'Încuie', lkArm: 'Atinge din nou', doUnlock: 'Descuie', sent: 'Trimis, aștept confirmarea mașinii…', noConfirm: 'Nicio confirmare într-un minut. Verifică în aplicația BYD; poate mașina nu are semnal.', cmdErr: (e) => `Comanda nu a mers: ${e}`, lvOff: 'Oprit',
    programs: 'Programe Wilo', weekdays: 'Luni–vineri', daily: 'Zilnic', pRunning: 'Rulează', pEnabled: 'Activat', pDisabled: 'Dezactivat',
    tapToEdit: 'Atinge pentru a modifica programele', start: 'Început', end: 'Sfârșit', done: 'Gata',
    runningNow: (n) => `rulează: ${n}`, nextAt: (n, d, h) => `următorul: ${n}, ${d} la ${h}`, noneEnabled: 'niciun program activat',
    todayW: 'azi', tomorrowW: 'mâine', badTime: 'Scrie ora ca 05:45 (de la 00:00 la 23:59).', sameTime: 'Începutul și sfârșitul nu pot fi la aceeași oră.', saveErr: (e) => `Nu am putut salva: ${e}`,
    wx: { 'clear-night': 'Senin', cloudy: 'Înnorat', fog: 'Ceață', hail: 'Grindină', lightning: 'Furtună', 'lightning-rainy': 'Furtună', partlycloudy: 'Parțial noros',
      pouring: 'Ploaie torențială', rainy: 'Ploaie', snowy: 'Ninsoare', 'snowy-rainy': 'Lapoviță', sunny: 'Însorit', windy: 'Vânt', 'windy-variant': 'Vânt', exceptional: 'Vreme extremă' },
    action: { heating: 'Încălzește', idle: 'În așteptare', off: 'Oprit', cooling: 'Răcește', fan: 'Ventilează', drying: 'Usucă' },
    mode: { heat: 'Încălzire', off: 'Oprit', auto: 'Automat', cool: 'Răcire', heat_cool: 'Automat', fan_only: 'Ventilație', dry: 'Uscare' },
  },
  en: {
    home: 'Home', menu: 'Menu', solar: 'Solar', load: 'House load', battery: 'Battery', grid: 'Grid',
    gridImport: 'Grid · import', gridExport: 'Grid · export', charging: (w) => `Charging · ${w}`, discharging: (w) => `Discharging · ${w}`,
    thermostats: 'Thermostats', energyNow: 'Energy now', boilerRoom: 'Boiler room', bill: 'Electricity bill', devices: 'Devices', close: 'Close', down: (n) => `${n} down`, lights: 'Outdoor lights', charts: 'Charts', last24: 'last 24 h', gEnergy: 'Energy', gCons: 'Load', gGrid: 'Grid', gSolar: 'Solar', gBat: 'Battery', gSoc: 'Battery (SOC)', gVolt: 'Grid voltage', gLimit: '253 V limit',
    gTanks: 'Buffer and DHW', gTemp: 'Temperature', gSet: 'Set', gHeatOn: 'heating', gEquip: 'Equipment', tChartsSub: 'energy, temperatures', tAll: 'Paid', tAllSub: 'all bills', tActive: 'active', tIdle: 'Idle', tRuns: 'Running', acTitle: 'Air conditioning', acRoom: (t) => `room ${t}`, acMode: 'Mode', acFan: 'Fan', acOn: (n) => n ? `${n} on` : 'off',
    hv: { off: 'Off', cool: 'Cool', heat: 'Heat', auto: 'Auto', heat_cool: 'Auto', dry: 'Dry', fan_only: 'Fan' },
    fanM: { auto: 'Auto', low: 'Low', medium: 'Medium', middle: 'Medium', high: 'High', quiet: 'Quiet', turbo: 'Turbo' }, lAuto: 'Automatic', lAutoOff: 'Automatic off', lOnAt: (t) => `on ${t}`, lOffAt: (t) => `off ${t}`, lAutoHint: 'sunset / sunrise', lOn: (n, m) => `${n} of ${m} on`, lToday: 'today', lTomorrow: 'tomorrow',
    pickThermostats: 'Choose the thermostats in the integration options.', pickEquipment: 'Choose the equipment in the options.',
    pickContracts: 'Enter the contracts in the options.', pickDevices: 'Choose the watched devices in the options.',
    noBillData: 'The Hidroelectrica integration has no data for this contract right now.',
    puffer: 'Buffer tank', puffer24: 'Buffer tank · last 24 h', acm: 'Hot water', acm24: 'Hot water · last 24 h', temps24: 'Temperatures · last 24 h', ago24: '24 h ago', ago12: '12 h ago', now: 'now',
    heatMode: 'Heating mode', heatDemand: 'Heat demand', modeError: (e) => `Could not change the mode: ${e}`,
    flow: 'Energy flow', fSolar: 'solar', fHouse: 'house', fBattery: 'battery', fGrid: 'grid', import: 'import', export: 'export', idleBat: 'idle',
    selfNow: (x) => `${x} % self-supplied`, gridV: 'Grid voltage', today: 'Today',
    produced: 'Produced', used: 'Used', imported: 'Imported', exported: 'Exported', selfToday: 'Self-supplied',
    fcRest: 'Forecast rest of today', fcTomorrow: 'Forecast tomorrow',
    rest: 'idle', chargingW: 'charging', dischargingW: 'discharging', full: 'full', fullIn: (d) => `full in ~${d}`, atReserve: 'at reserve', lasts: (d) => `lasts ~${d}`,
    unavailable: 'Unavailable', on: 'On', off: 'Off', setTo: (x) => `Set to ${x}°`, noTarget: 'No target temperature', humidity: (x) => `humidity ${x} %`,
    zonesHeating: (n) => (n === 0 ? 'no zone is heating' : n === 1 ? '1 zone heating' : `${n} zones heating`),
    hot: 'hot', warm: 'warm', cold: 'cold', unavail: 'unavailable', noHistory: 'no history', loading: 'loading…',
    ranToday: (d) => `ran ${d} today`, notToday: 'did not run today', running: (a, b) => `${a} of ${b} on`,
    lastBill: 'Last bill', due: 'Due date', unpaid: 'Overdue',
    devOff: (n) => `${n} unavailable`, allOnline: (n) => `all ${n} online`,
    aDevOff: (x) => `${x} unavailable`, aDevsOff: (n, x) => `${n} devices unavailable: ${x}`,
    aOverdue: (w, s) => `${w} bill is overdue · ${s}`, aDue: (w, d, s) => `${w} bill due ${d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`} · ${s}`,
    aBattery: (x) => `Battery ${x} %`, aPuffer: (x) => `Buffer tank cold: ${x}°`, aRunning: (n, d) => `${n} · on for ${d}`,
    days: (n) => `${n} days`, notConfigured: 'Casa is not set up',
    carDef: 'Car', atHome: 'home', away: 'away', offline: 'offline', lastSeen: (h) => `last update ${h}`,
    target: (x) => `target ${x} %`, ev: 'Electric', fuel: 'Fuel', locked: 'Locked', unlocked: 'Unlocked', doorsShut: 'Doors closed', doorOpen: 'Door open',
    chargingKw: (x) => `Charging · ${x}`, notCharging: 'Not charging', online: 'Connected', tyres: 'Tyres', fl: 'Front L', fr: 'Front R', rl: 'Rear L', rr: 'Rear R',
    odo: 'Odometer', cons: 'Consumption', outside: 'Outside',
    aTyre: (w, x) => `Low tyre pressure: ${w} ${x} bar`, aTyreLeak: (w) => `Tyre leak: ${w}`, aUnlocked: (n) => `${n} is unlocked`, aCarLow: (n, x) => `${n} is at ${x} % and not charging`,
    climate: 'Climate', climOn: 'On', climOff: 'Off', turnOn: 'Turn on', turnOff: 'Turn off', preheat: 'Pre-heat', preheatArm: 'Tap again to start',
    preheatHint: 'climate, driver seat and wheel', seats: 'Seats and wheel', drvHeat: 'Driver · heating', drvVent: 'Driver · ventilation', psgHeat: 'Passenger · heating', psgVent: 'Passenger · ventilation',
    inside: 'inside', wheel: 'Wheel · heating', lockTitle: 'Lock', tailTitle: 'Tailgate', tOpen: 'Open', tClosed: 'Closed', tOpening: 'Opening…', tClosing: 'Closing…', tDoOpen: 'Open', tArm: 'Tap again to open', tDoClose: 'Close', tStop: 'Stop', doLock: 'Lock', lkArm: 'Tap again', doUnlock: 'Unlock', sent: 'Sent, waiting for the car…', noConfirm: 'No confirmation within a minute. Check the BYD app; the car may have no signal.', cmdErr: (e) => `Command failed: ${e}`, lvOff: 'Off',
    programs: 'Wilo programs', weekdays: 'Mon–Fri', daily: 'Daily', pRunning: 'Running', pEnabled: 'Enabled', pDisabled: 'Disabled',
    tapToEdit: 'Tap to change the programs', start: 'Start', end: 'End', done: 'Done',
    runningNow: (n) => `running: ${n}`, nextAt: (n, d, h) => `next: ${n}, ${d} at ${h}`, noneEnabled: 'no program enabled',
    todayW: 'today', tomorrowW: 'tomorrow', badTime: 'Write the time as 05:45 (00:00 to 23:59).', sameTime: 'Start and end cannot be the same time.', saveErr: (e) => `Could not save: ${e}`,
    wx: { 'clear-night': 'Clear', cloudy: 'Cloudy', fog: 'Fog', hail: 'Hail', lightning: 'Thunderstorm', 'lightning-rainy': 'Thunderstorm', partlycloudy: 'Partly cloudy',
      pouring: 'Heavy rain', rainy: 'Rain', snowy: 'Snow', 'snowy-rainy': 'Sleet', sunny: 'Sunny', windy: 'Windy', 'windy-variant': 'Windy', exceptional: 'Extreme weather' },
    action: { heating: 'Heating', idle: 'Idle', off: 'Off', cooling: 'Cooling', fan: 'Fan', drying: 'Drying' },
    mode: { heat: 'Heat', off: 'Off', auto: 'Auto', cool: 'Cool', heat_cool: 'Auto', fan_only: 'Fan only', dry: 'Dry' },
  },
};
// phone menu: one button per card, in this order; the card opens right under its button
const MNAV = [['flow', 'bolt', 'energyNow'], ['bill', 'bill', 'bill'], ['heat', 'thermo', 'thermostats'], ['room', 'flame', 'boilerRoom'],
  ['prog', 'clock', 'programs'], ['lit', 'bulb', 'lights'], ['acs', 'ac', 'acTitle'], ['car', 'car', 'carDef'], ['dev', 'dev', 'devices'], ['gr', 'chart', 'charts']];
const tr = (k, ...a) => { const v = T[L][k] ?? T.ro[k] ?? k; return typeof v === 'function' ? v(...a) : v; };

const P = {
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
  home: '<path d="M3.5 11 12 4l8.5 7"/><path d="M5.8 9.5V20h12.4V9.5"/><path d="M10 20v-5.5h4V20"/>',
  bat: '<rect x="6.5" y="4.5" width="11" height="16" rx="2.2"/><path d="M10 2.8h4"/><path d="M9.2 14.5h5.6M9.2 11h5.6" />',
  grid: '<path d="M12 2.5 7 21.5M12 2.5l5 19M5 8h14M6 13h12M8.5 21.5h7"/>',
  flame: '<path d="M12 21c-3.6 0-6-2.5-6-5.8 0-3.4 2.6-5 3.4-8.2.9 1.6 1.9 2.4 2.9 2.7-.2-2.4.6-5 2.6-6.7.2 3.3 3.1 5.4 3.1 9.9C18 18.4 15.6 21 12 21Z"/>',
  pump: '<circle cx="12" cy="12" r="7.5"/><path d="M12 4.5v7.5l5.3 5.3M12 12l-5.3 5.3"/>',
  boiler: '<rect x="5.5" y="3" width="13" height="18" rx="2.5"/><path d="M9 17h6"/><circle cx="12" cy="10" r="3"/>',
  hp: '<rect x="3" y="5" width="18" height="12" rx="2.2"/><circle cx="9" cy="11" r="3.3"/><path d="M15 9h3M15 12h3M7 20h10"/>',
  bolt: '<path d="M13 2.5 5 13.5h6l-1 8 8-11h-6l1-8Z"/>',
  ac: '<rect x="3" y="5" width="18" height="8" rx="2"/><path d="M7 10h10M8 17c0 1.5-1 2-1 3M12 17v3M16 17c0 1.5 1 2 1 3"/>',
  chart: '<path d="M4 19h16M5 15l4-5 4 3 6-7"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3Z"/>',
  dev: '<rect x="4" y="4" width="16" height="12" rx="2"/><path d="M9 20h6M12 16v4"/>',
  bill: '<path d="M6 2.5h12v19l-3-2-3 2-3-2-3 2v-19Z"/><path d="M9 7.5h6M9 11h6M9 14.5h4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  car: '<path d="M4 16.5v-4l2-5h12l2 5v4"/><path d="M3 16.5h18v2.5H3z"/><circle cx="7.5" cy="16.5" r="1.6"/><circle cx="16.5" cy="16.5" r="1.6"/>',
  menu: '<path d="M4 6.5h16M4 12h16M4 17.5h16"/>',
  thermo: '<path d="M10 14.2V5a2 2 0 1 1 4 0v9.2a4 4 0 1 1-4 0Z"/><path d="M12 9v7"/>',
  cloud: '<path d="M7 18.5h10.5a3.8 3.8 0 0 0 .4-7.6A5.6 5.6 0 0 0 7.2 9.4 4.6 4.6 0 0 0 7 18.5Z"/>',
  rain: '<path d="M7 15.5h10.5a3.8 3.8 0 0 0 .4-7.6A5.6 5.6 0 0 0 7.2 6.4 4.6 4.6 0 0 0 7 15.5Z"/><path d="M9 18.5l-1 2.5M13 18.5l-1 2.5M17 18.5l-1 2.5"/>',
  snow: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/>',
  moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z"/>',
};
const ic = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${P[k] || P.dev}</svg>`;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const fmt = (v, d = 0) => (isNum(v) ? v.toLocaleString(LOC(), { minimumFractionDigits: d, maximumFractionDigits: d }) : '–');
const fmtW = (w) => (!isNum(w) ? '–' : Math.abs(w) >= 1000 ? `${fmt(w / 1000, Math.abs(w) >= 10000 ? 1 : 2)} kW` : `${fmt(w)} W`);
const dur = (ms) => { if (!isNum(ms)) return ''; const m = Math.round(ms / 60000); if (m < 60) return `${m} min`; const h = Math.floor(m / 60), r = m % 60; return h >= 48 ? tr('days', Math.round(h / 24)) : r ? `${h} h ${r} min` : `${h} h`; };
const money = (t) => { let c = String(t ?? '').replace(/[^\d,.-]/g, ''); if (c.includes(',')) c = c.replace(/\./g, '').replace(',', '.'); const v = parseFloat(c); return isNum(v) ? v : NaN; };
const WX = { 'clear-night': 'moon', cloudy: 'cloud', fog: 'cloud', hail: 'rain', lightning: 'rain', 'lightning-rainy': 'rain', partlycloudy: 'cloud',
  pouring: 'rain', rainy: 'rain', snowy: 'snow', 'snowy-rainy': 'snow', sunny: 'sun', windy: 'cloud', 'windy-variant': 'cloud', exceptional: 'cloud' };

class CasaPanel extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  set panel(p) { const c = (p && p.config) || {}; if (c === this._cfg) return; this._cfg = c; if (this._hass) this._render(); }
  set narrow(n) { this.toggleAttribute('narrow', !!n); }
  set hass(h) {
    const first = !this._hass; this._hass = h;
    if (first) {
      let saved = null; try { saved = localStorage.getItem('casa_lang'); } catch (e) { /* storage off */ }
      L = saved === 'ro' || saved === 'en' ? saved : /^ro/i.test(h.language || (h.locale && h.locale.language) || 'ro') ? 'ro' : 'en';
    }
    const dark = h.themes && typeof h.themes.darkMode === 'boolean' ? h.themes.darkMode : !matchMedia('(prefers-color-scheme: light)').matches;
    this.toggleAttribute('light', !dark);
    if (first || !this._built) this._render(); else this._update();
    if (first) this._loadHist();
    this._subFc();
  }
  connectedCallback() {
    this._clock = setInterval(() => this._time(), 15000);
    this._histT = setInterval(() => this._loadHist(), 300000);     // history: every 5 minutes
  }
  disconnectedCallback() {
    clearInterval(this._clock); clearInterval(this._histT);
    if (this._fcUnsub) { this._fcUnsub.then((u) => u && u()).catch(() => {}); this._fcUnsub = null; }
  }

  /* ---------- history (last 24 h): runtimes, the buffer tank chart, thermostat lines */
  async _loadHist() {
    if (!this._hass || !this._hass.callWS || this._histBusy) return;
    this._histBusy = true;
    const c = this._cfg, h = c.heating || {}, end = new Date(), start = new Date(end.getTime() - 864e5);
    const base = { type: 'history/history_during_period', start_time: start.toISOString(), end_time: end.toISOString(), significant_changes_only: false };
    const e = c.energy || {};
    const simple = [...new Set([h.puffer, h.acm, ...(h.equipment || []).map((x) => x.entity), e.pv, e.pv1, e.pv2, e.load, e.grid, e.battery, e.soc, e.grid_v,
      ...(c.thermostats || []).map((t) => t.heat)].filter(Boolean))];
    const clim = (c.thermostats || []).map((t) => t.entity).filter(Boolean);
    const out = {};
    try {
      if (simple.length) Object.assign(out, await this._hass.callWS({ ...base, entity_ids: simple, minimal_response: true, no_attributes: true }) || {});
      if (clim.length) Object.assign(out, await this._hass.callWS({ ...base, entity_ids: clim }) || {});   // climate: the temperature is an attribute
    } catch (e) { console.warn('Casa: history', e); }
    this._histBusy = false; this._hist = out; this._update(); this._charts();
  }
  /* [[ms, state, attributes]] of an entity, oldest first, ending with the live state */
  rows(id) {
    const r = ((this._hist || {})[id] || []).map((x) => [1000 * (x.lu ?? x.lc ?? 0), x.s, x.a]).filter((x) => x[0] > 0);
    const live = this.st(id);
    if (live) { const t = Date.parse(live.last_changed || live.last_updated || 0); if (!r.length || t > r[r.length - 1][0] || r[r.length - 1][1] !== live.state) r.push([Math.max(t, r.length ? r[r.length - 1][0] : t), live.state, live.attributes]); }
    return r;
  }
  /* milliseconds an entity was "on" since midnight */
  onToday(id) {
    const r = this.rows(id), d0 = new Date(); d0.setHours(0, 0, 0, 0);
    const now = Date.now(); let ms = 0;
    r.forEach(([t, st], i) => { const a = Math.max(t, d0.getTime()), b = i + 1 < r.length ? r[i + 1][0] : now; if (st === 'on' && b > a) ms += b - a; });
    return this._hist ? ms : NaN;
  }
  series(id, pick) {
    const t0 = Date.now() - 864e5;
    return this.rows(id).map(([t, st, a]) => [Math.max(t, t0), pick(st, a)]).filter((p) => isNum(p[1]));
  }
  /* svg path of a series in a W x H box (time on x from 24 h ago to now) */
  path(pts, W, H, lo, hi, area) {
    if (pts.length < 2) return '';
    const t0 = Date.now() - 864e5, X = (t) => ((t - t0) / 864e5 * W).toFixed(1), Y = (v) => (H - (v - lo) / ((hi - lo) || 1) * H).toFixed(1);
    let d = ''; pts.forEach(([t, v], i) => { d += (i ? `H${X(t)}V${Y(v)}` : `M${X(t)} ${Y(v)}`); });   // steps: a value holds until the next one
    d += `H${W}`;
    return area ? `${d}V${H}H${X(pts[0][0])}Z` : d;
  }

  /* ---------- charts (last 24 h). Each chart: series of [ms, value] on a 2-minute grid, drawn in a 600-wide
     SVG stretched to the box; labels and the touch / mouse tooltip are HTML on top. */
  grid24(id, conv, mean) {
    const r = this.rows(id); if (!r.length) return [];
    const now = Date.now(), t0 = now - 864e5, B = 12e4, n = Math.ceil(864e5 / B), out = [];
    let k = 0, last = NaN;
    while (k < r.length && r[k][0] <= t0) { const v = conv(r[k][1]); if (isNum(v)) last = v; k++; }
    for (let b = 0; b < n; b++) {
      const a = t0 + b * B, z = Math.min(now, a + B); let sum = 0, cnt = 0, w = 0;
      while (k < r.length && r[k][0] < z) { const v = conv(r[k][1]); if (isNum(v)) { if (mean) { sum += v; cnt++; } last = v; } k++; }
      w = mean && cnt ? sum / cnt : last;
      if (isNum(w)) out.push([a + B / 2, w]);
    }
    return out;
  }
  unitK(id) { const u = (this.st(id)?.attributes?.unit_of_measurement || '').toLowerCase(); return u === 'kw' ? 1000 : u === 'mw' ? 1e6 : 1; }
  bands(id, isOn) {
    const r = this.rows(id), t0 = Date.now() - 864e5, out = [];
    r.forEach(([t, st, a], i) => { const b = i + 1 < r.length ? r[i + 1][0] : Date.now(); if (b > t0 && isOn(st, a)) out.push([Math.max(t, t0), b]); });
    return out;
  }
  _charts() {
    const box = this.$('#gcs'); if (!box || !this._hist) return;
    const c = this._cfg, e = c.energy || {}, h = c.heating || {}, W = (id) => (st) => parseFloat(st) * this.unitK(id), N = (st) => parseFloat(st);
    const C = { load: 'var(--home)', grid: 'var(--grid)', pv: 'var(--sun)', bat: 'var(--bat)', heat: 'var(--heat)', acm: 'var(--sun)', mut: 'var(--mut)', bad: 'var(--bad)' };
    const charts = [];
    // energy: load, grid (signed), solar (filled), battery (off by default)
    let pv = e.pv ? this.grid24(e.pv, W(e.pv), true) : [];
    if (!pv.length && (e.pv1 || e.pv2)) {
      const a = e.pv1 ? this.grid24(e.pv1, W(e.pv1), true) : [], b = e.pv2 ? this.grid24(e.pv2, W(e.pv2), true) : [], m = new Map();
      [...a, ...b].forEach(([t, v]) => m.set(t, (m.get(t) || 0) + v)); pv = [...m.entries()].sort((x, y) => x[0] - y[0]);
    }
    const en = [
      e.load && { n: tr('gCons'), c: C.load, pts: this.grid24(e.load, W(e.load), true) },
      e.grid && { n: tr('gGrid'), c: C.grid, pts: this.grid24(e.grid, W(e.grid), true) },
      pv.length && { n: tr('gSolar'), c: C.pv, pts: pv, area: true },
      e.battery && { n: tr('gBat'), c: C.bat, pts: this.grid24(e.battery, (st) => parseFloat(st) * this.unitK(e.battery) * (e.battery_invert ? -1 : 1), true), hide: true },
    ].filter((x) => x && x.pts.length);
    if (en.length) charts.push({ k: 'en', title: tr('gEnergy'), wide: true, H: 200, unit: 'W', zero: true, ser: en });
    if (e.soc) charts.push({ k: 'soc', title: tr('gSoc'), H: 120, unit: '%', lo: 0, hi: 100, ser: [{ n: tr('gBat'), c: C.bat, pts: this.grid24(e.soc, N), area: true }] });
    if (e.grid_v) charts.push({ k: 'v', title: tr('gVolt'), H: 120, unit: 'V', lines: [[253, C.bad, tr('gLimit')]], ser: [{ n: tr('gVolt'), c: C.grid, pts: this.grid24(e.grid_v, N, true) }] });
    // tanks + when the equipment ran
    const tk = [h.puffer && { n: tr('puffer'), c: C.heat, pts: this.grid24(h.puffer, N) }, h.acm && { n: tr('acm'), c: C.acm, pts: this.grid24(h.acm, N) }].filter((x) => x && x.pts.length);
    if (tk.length) charts.push({ k: 'tk', title: tr('gTanks'), wide: true, H: 150, unit: '°', ser: tk,
      tl: (h.equipment || []).map((x, i) => ({ n: x.name, c: ['var(--grid)', 'var(--heat)', 'var(--bat)', 'var(--sun)'][i % 4], b: this.bands(x.entity, (st) => st === 'on') })) });
    // every thermostat: temperature, set point (dashed) and the hours it heated (shaded)
    (c.thermostats || []).forEach((t, i) => {
      const temp = this.series(t.entity, (st, a) => parseFloat(a && a.current_temperature)), set = this.series(t.entity, (st, a) => (st === 'off' ? NaN : parseFloat(a && a.temperature)));
      const heatOn = t.heat ? this.bands(t.heat, (st) => /^(on|true|1|pornit|heating|da|yes)$/i.test(st)) : this.bands(t.entity, (st, a) => a && a.hvac_action === 'heating');
      if (!temp.length) return;
      charts.push({ k: 'th' + i, title: t.name || this.st(t.entity)?.attributes?.friendly_name || t.entity, H: 110, unit: '°', step: true, band: heatOn,
        ser: [{ n: tr('gTemp'), c: C.heat, pts: temp }, set.length && { n: tr('gSet'), c: C.mut, pts: set, dash: true }].filter(Boolean) });
    });
    this._gd = Object.fromEntries(charts.map((x) => [x.k, x]));
    this._gOff = this._gOff || { en3: true };
    box.innerHTML = charts.length ? charts.map((x) => this._chartHtml(x)).join('') : `<p class="empty">${tr('noHistory')}</p>`;
  }
  _chartHtml(g) {
    const W = 600, H = g.H, t0 = Date.now() - 864e5, X = (t) => ((t - t0) / 864e5) * W;
    const vis = g.ser.filter((x, i) => !this._gOff[g.k + i] && !(this._gOff[g.k + i] === undefined && x.hide));
    g.ser.forEach((x, i) => { if (this._gOff[g.k + i] === undefined && x.hide) this._gOff[g.k + i] = true; });
    const vals = vis.flatMap((x) => x.pts.map((p) => p[1])).concat((g.lines || []).map((l) => l[0]));
    let lo = g.lo ?? Math.min(...vals), hi = g.hi ?? Math.max(...vals);
    if (g.zero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
    if (!isFinite(lo) || !isFinite(hi)) { lo = 0; hi = 1; }
    if (g.lo == null && g.hi == null) { const pad = (hi - lo) * 0.08 || 1; lo -= pad; hi += pad; }
    const raw = (hi - lo) / 4, mag = Math.pow(10, Math.floor(Math.log10(raw || 1))), step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((m) => m >= raw) || raw;
    if (g.lo == null) lo = Math.floor(lo / step) * step; if (g.hi == null) hi = Math.ceil(hi / step) * step;
    const Y = (v) => H - ((v - lo) / ((hi - lo) || 1)) * H;
    g.geo = { lo, hi, H, t0 };
    const yl = (v) => g.unit === 'W' ? (Math.abs(v) >= 1000 ? `${fmt(v / 1000, Math.abs(v) % 1000 ? 1 : 0)}k` : fmt(v)) : `${fmt(v, step < 1 ? 1 : 0)}${g.unit === '%' ? '' : g.unit === '°' ? '°' : ''}`;
    let grid = '', ylab = '';
    for (let v = lo; v <= hi + step / 2; v += step) { const y = Y(v); grid += `<line class="gg" x1="0" x2="${W}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/>`; ylab += `<span class="gy" style="top:${(y / H * 100).toFixed(2)}%">${yl(v)}</span>`; }
    if (g.zero && lo < 0) grid += `<line class="gz" x1="0" x2="${W}" y1="${Y(0).toFixed(1)}" y2="${Y(0).toFixed(1)}"/>`;
    (g.lines || []).forEach(([v, col]) => { grid += `<line class="gs d" style="--c:${col}" x1="0" x2="${W}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/>`; });
    const bands = (g.band || []).map(([a, b]) => `<rect class="gband" x="${X(a).toFixed(1)}" y="0" width="${Math.max(1, X(b) - X(a)).toFixed(1)}" height="${H}"/>`).join('');
    const path = (pts, step) => pts.map(([t, v], i) => (i ? (step ? `H${X(t).toFixed(1)}V${Y(v).toFixed(1)}` : `L${X(t).toFixed(1)} ${Y(v).toFixed(1)}`) : `M${X(t).toFixed(1)} ${Y(v).toFixed(1)}`)).join('') + (step ? `H${W}` : '');
    const lines = vis.map((x) => {
      if (x.pts.length < 2) return '';
      const d = path(x.pts, g.step), base = Y(Math.max(lo, Math.min(hi, 0)));
      const area = x.area ? `<path class="ga" style="--c:${x.c}" d="${d}V${base.toFixed(1)}H${X(x.pts[0][0]).toFixed(1)}Z"/>` : '';
      return `${area}<path class="gs ${x.dash ? 'd' : ''}" style="--c:${x.c}" d="${d}"/>`;
    }).join('');
    // x labels every 3 hours on the clock
    const d = new Date(t0); d.setMinutes(0, 0, 0); d.setHours(Math.ceil((d.getHours() + (t0 > d.getTime() ? 1 : 0)) / 3) * 3);
    let xl = ''; for (let t = d.getTime(); t < Date.now() - 1.6 * 36e5; t += 3 * 36e5) { const nd = new Date(t); xl += `<span class="gx" style="left:${(X(t) / W * 100).toFixed(2)}%">${String(nd.getHours()).padStart(2, '0')}:00</span>`; }
    xl += `<span class="gx e" style="left:100%">${tr('now')}</span>`;
    const leg = g.ser.map((x, i) => `<button class="${this._gOff[g.k + i] ? 'off' : ''}" style="--c:${x.c}" data-gs="${g.k}|${i}"><i></i>${esc(x.n)}</button>`).join('')
      + (g.band && g.band.length ? `<button style="--c:color-mix(in srgb,var(--heat) 35%,transparent)" disabled><i></i>${tr('gHeatOn')}</button>` : '');
    const tl = g.tl && g.tl.length ? `<div class="gtl">${g.tl.map((r) => `<div><em>${esc(r.n)}</em>${r.b.map(([a, b]) => `<span style="--c:${r.c};left:${(X(a) / W * 100).toFixed(2)}%;width:${Math.max(0.3, (X(b) - X(a)) / W * 100).toFixed(2)}%"></span>`).join('')}</div>`).join('')}</div>` : '';
    return `<div class="gc ${g.wide ? 'wide' : ''}" data-gc="${g.k}"><div class="gh"><b>${esc(g.title)}</b><span class="gl">${leg}</span></div>
      <div class="gb" style="height:${H}px"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${bands}${grid}${lines}</svg>${ylab}${xl}
      <div class="cur" hidden></div><div class="tip" hidden></div><div class="hit" data-hit="${g.k}"></div></div>${tl}</div>`;
  }
  _tip(ev, k, leave) {
    const g = this._gd && this._gd[k], el = ev.target.closest('.gb'); if (!g || !el) return;
    const cur = el.querySelector('.cur'), tip = el.querySelector('.tip');
    if (leave) { cur.hidden = true; tip.hidden = true; return; }
    const r = el.getBoundingClientRect(), f = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)), t = g.geo.t0 + f * 864e5;
    const at = (pts) => { let v = NaN; for (const p of pts) { if (p[0] - 6e4 > t) break; v = p[1]; } return v; };
    const fv = (v) => !isNum(v) ? '–' : g.unit === 'W' ? (Math.abs(v) >= 1000 ? `${fmt(v / 1000, 2)} kW` : `${fmt(v)} W`) : g.unit === '%' ? `${fmt(v)} %` : g.unit === 'V' ? `${fmt(v, 1)} V` : `${fmt(v, 1)}°`;
    const rows = g.ser.map((x, i) => this._gOff[g.k + i] ? '' : `<div style="--c:${x.c}"><i></i>${esc(x.n)}<b class="num">${fv(at(x.pts))}</b></div>`).join('');
    const tm = new Date(t);
    tip.innerHTML = `<div class="tt">${String(tm.getHours()).padStart(2, '0')}:${String(tm.getMinutes()).padStart(2, '0')}</div>${rows}`;
    cur.hidden = false; tip.hidden = false; cur.style.left = `${f * 100}%`;
    const w = tip.offsetWidth; tip.style.left = `${Math.min(r.width - w, Math.max(0, f * r.width + (f > 0.5 ? -w - 10 : 10)))}px`;
  }
  /* ---------- weather forecast (daily), pushed by Home Assistant */
  _subFc() {
    const id = this._cfg && this._cfg.weather, conn = this._hass && this._hass.connection;
    if (!id || !conn || !conn.subscribeMessage || this._fcUnsub) return;
    this._fcUnsub = conn.subscribeMessage((ev) => { this._fc = (ev && ev.forecast) || []; this._update(); },
      { type: 'weather/subscribe_forecast', forecast_type: 'daily', entity_id: id });
    this._fcUnsub.catch((e) => { console.warn('Casa: forecast', e); });
  }

  /* ---------- values */
  st(id) { const s = id && this._hass && this._hass.states[id]; return s || null; }
  ok(id) { const s = this.st(id); return s && s.state !== 'unavailable' && s.state !== 'unknown' ? s : null; }
  num(id) { const s = this.ok(id); const v = s ? parseFloat(s.state) : NaN; return isNum(v) ? v : NaN; }
  /* power in W whatever the sensor's unit */
  pw(id) { const v = this.num(id), u = (this.st(id)?.attributes?.unit_of_measurement || '').toLowerCase(); return u === 'kw' ? v * 1000 : u === 'mw' ? v * 1e6 : v; }
  get e() { return this._cfg.energy || {}; }
  live() {
    const e = this.e;
    const pv = e.pv ? this.pw(e.pv) : (isNum(this.pw(e.pv1)) || isNum(this.pw(e.pv2)) ? (this.pw(e.pv1) || 0) + (this.pw(e.pv2) || 0) : NaN);
    let bat = this.pw(e.battery); if (e.battery_invert) bat = -bat;     // + charging
    return { pv, pv1: this.pw(e.pv1), pv2: this.pw(e.pv2), load: this.pw(e.load), bat, soc: this.num(e.soc), grid: this.pw(e.grid), gv: this.num(e.grid_v) };
  }
  more(id) { if (id) this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true })); }
  $(s) { return this.shadowRoot.querySelector(s); }
  set(id, html) { const el = this.$('#' + id); if (el && el.innerHTML !== html) el.innerHTML = html; }

  /* ---------- skeleton (built once; _update only changes values, so the page never jumps) */
  _render() {
    const c = this._cfg, ths = c.thermostats || [], h = c.heating || {}, eq = h.equipment || [];
    this.shadowRoot.innerHTML = `<style>${CSS}</style>
      <div class="wrap">
        <div class="head"><header class="hero">${c.image ? `<img src="${esc(c.image)}" alt="">` : ''}
          <div class="top"><button class="menu" id="menu" aria-label="${tr('menu')}">${ic('menu')}</button>
            <div class="title"><h1>${esc(c.title || tr('home'))}</h1><p id="date"></p></div>
            <div class="lang" role="group" aria-label="Limba / Language">${['ro', 'en'].map((x) => `<button data-lang="${x}" class="${L === x ? 'on' : ''}" aria-pressed="${L === x}">${x.toUpperCase()}</button>`).join('')}</div>
            ${c.weather ? `<button class="wx" data-id="${esc(c.weather)}" id="wx"></button>` : ''}</div>
        </header>
          <div class="chips">
            ${this._chip('sun', tr('solar'), 'c_pv', '--c:var(--sun)', this.e.pv || this.e.pv1)}
            ${this._chip('home', tr('load'), 'c_load', '--c:var(--home)', this.e.load)}
            ${this._chip('bat', tr('battery'), 'c_bat', '--c:var(--bat)', this.e.soc)}
            ${this._chip('grid', tr('grid'), 'c_grid', '--c:var(--grid)', this.e.grid)}
          </div>
        </div>
        <div class="alerts" id="alerts"></div>
        <div class="grid">
          <div class="mts">${MNAV.map(([k, i, t]) => `<button class="mb" data-mb="${k}" aria-haspopup="dialog"><span class="mh">${k === 'car' ? esc((c.car && c.car.name) || tr(t)) : tr(t)}<i>${ic(i)}</i></span><b id="mv_${k}">–</b><small id="mb_${k}"></small></button>`).join('')}</div>
          <div class="scrim" data-mclose hidden></div>
          <section class="card flow"><h2>${ic('bolt')} ${tr('energyNow')} <small id="f_state"></small></h2>${this._flowSvg()}
            <div class="legend" id="f_leg"></div><div id="f_today"></div></section>
          <section class="card gr" id="gr"><h2>${ic('chart')} ${tr('charts')} <small>${tr('last24')}</small></h2><div class="gcs" id="gcs"><p class="empty">${tr('loading')}</p></div></section>
          <section class="card bill"><h2>${ic('bill')} ${tr('bill')} <small>Hidroelectrica</small></h2><div id="bill"></div></section>
          <section class="card dev"><h2>${ic('dev')} ${tr('devices')} <small id="d_sum"></small></h2><div id="devs"></div></section>
          <div class="col cl">
          <section class="card heat"><h2>${ic('thermo')} ${tr('thermostats')} <small id="h_sum"></small></h2>
            ${ths.length ? `<div class="ths">${ths.map((t, k) => `<button class="th" id="th${k}" data-id="${esc(t.entity)}"></button>`).join('')}</div>`
              : `<p class="empty">${tr('pickThermostats')}</p>`}</section>
          <section class="card prog" id="prog" ${(c.heating || {}).programs && c.heating.programs.length ? '' : 'hidden'}>
            <h2>${ic('clock')} ${tr('programs')} <small id="pg_sum"></small></h2>
            <div class="pl" id="pg_list" role="button" tabindex="0" aria-expanded="false"></div>
            <p class="hint" id="pg_hint">${tr('tapToEdit')}</p>
            <div class="pe" id="pg_edit" hidden></div>
          </section>
          <section class="card lit" id="lit" ${(c.lights || []).length ? '' : 'hidden'}><h2>${ic('bulb')} ${tr('lights')} <small id="l_sum"></small></h2><div id="lits"></div></section>
          <section class="card acs" id="acs" ${(c.ac || []).length ? '' : 'hidden'}><h2>${ic('ac')} ${tr('acTitle')} <small id="ac_sum"></small></h2><div id="ac_list"></div><p class="cmsg" id="ac_msg"></p></section>
          </div>
          <div class="col cr">
          <section class="card room"><h2>${ic('flame')} ${tr('boilerRoom')} <small id="r_sum"></small></h2>
            <div class="rm">
              ${h.puffer || h.acm ? `<div class="tanks">${[['t', h.puffer, tr('puffer')], ['a', h.acm, tr('acm')]].filter((x) => x[1]).map(([k, , n]) => `<div class="tank"><span>${n}</span><div class="vs"><div class="lv" id="${k}_lv"></div></div><div><b class="num" id="${k}_v">–</b><br><span id="${k}_s"></span></div></div>`).join('')}</div>` : '<div></div>'}
              <div>
                <div class="meta">
                  ${h.mode ? (/^(input_)?select\./.test(h.mode)
                    ? `<button class="mode" id="m_btn" aria-expanded="false"><span>${tr('heatMode')}</span><b id="m_mode">–</b><small id="m_why"></small></button>`
                    : `<div><span>${tr('heatMode')}</span><b id="m_mode">–</b><small id="m_why"></small></div>`) : ''}
                  ${h.demand ? `<div><span>${tr('heatDemand')}</span><b id="m_dem">–</b></div>` : ''}
                  ${h.mode ? '<div class="opts" id="m_opts" hidden></div>' : ''}
                </div>
                <div class="eq">${eq.map((x, k) => `<div id="eq${k}"></div>${x.mode ? `<div class="opts" id="eqo${k}" hidden></div>` : ''}`).join('') || `<p class="empty">${tr('pickEquipment')}</p>`}</div>
              </div>
            </div></section>
          <section class="card car" id="car" ${c.car && c.car.prefix ? '' : 'hidden'}>
            <h2>${ic('car')} ${esc((c.car && c.car.name) || tr('carDef'))} <small id="car_sum"></small></h2>
            <div class="cg">
              <div class="cb" data-id="${esc(c.car && c.car.prefix ? `sensor.${c.car.prefix}_state_of_charge` : '')}"><div id="car_bat"></div></div>
              <div><div class="pills" id="car_pills"></div><p class="cf" id="car_foot"></p></div>
              <div><div class="tyres" id="car_ty"></div></div>
            </div>
            <div class="cc" id="car_cc" hidden></div>
            <p class="cmsg" id="car_msg"></p>
          </section>
          </div>
        </div>
        <footer>Casa ${VERSION}</footer>
      </div>`;
    const hit = (ev, leave) => { const h = ev.target.closest && ev.target.closest('[data-hit]'); if (h) this._tip(ev, h.dataset.hit, leave); };
    this.shadowRoot.addEventListener('pointermove', (ev) => hit(ev));
    this.shadowRoot.addEventListener('pointerdown', (ev) => hit(ev));
    this.shadowRoot.addEventListener('pointerout', (ev) => hit(ev, true));
    let sy = null, sc = null;
    this.shadowRoot.addEventListener('touchstart', (ev) => { const c = ev.target.closest('.card.mo'); if (c && (c.scrollTop <= 0 || ev.target.closest('h2'))) { sy = ev.touches[0].clientY; sc = c; } }, { passive: true });
    this.shadowRoot.addEventListener('touchmove', (ev) => { if (sc == null) return; const dy = ev.touches[0].clientY - sy; if (dy > 0 && sc.scrollTop <= 0) sc.style.transform = `translateY(${dy}px)`; }, { passive: true });
    this.shadowRoot.addEventListener('touchend', (ev) => { if (sc == null) return; const dy = (ev.changedTouches[0]?.clientY ?? sy) - sy;
      if (dy > 90 && sc.scrollTop <= 0) { this._mo = ''; this._mnav(); } else sc.style.transform = ''; sy = null; sc = null; }, { passive: true });
    this.shadowRoot.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && this._mo) { this._mo = ''; this._mnav(); } });
    this.shadowRoot.addEventListener('click', (ev) => {
      const cb = ev.target.closest('[data-car]'); if (cb) { this._carCmd(cb.dataset.car, cb.dataset.v); return; }
      if (ev.target.closest('#pg_list')) { this._progOpen = true; this._progBuilt = false; this._programs(); return; }
      if (ev.target.closest('#pg_done')) { this._progOpen = false; this._programs(); return; }
      if (ev.target.closest('#pg_edit')) return;                         // the editor's own controls
      const lg = ev.target.closest('[data-lang]');
      if (lg) { L = lg.dataset.lang; try { localStorage.setItem('casa_lang', L); } catch (e) { /* storage off */ } this._render(); return; }
      if (ev.target.closest('#m_btn')) { this._modeOpen = !this._modeOpen; this._modeErr = ''; this._opts(); return; }
      const gs = ev.target.closest('[data-gs]');
      if (gs) { const [k, i] = gs.dataset.gs.split('|'); this._gOff[k + i] = !this._gOff[k + i]; const g = this._gd[k];
        const old = this.$(`[data-gc="${k}"]`); if (g && old) old.outerHTML = this._chartHtml(g); return; }
      const mb = ev.target.closest('[data-mb]');
      if (mb) { this._mo = mb.dataset.mb; this._mnav(); return; }
      if (ev.target.closest('[data-mclose]')) { this._mo = ''; this._mnav(); return; }
      const ab = ev.target.closest('[data-ac]');
      if (ab) { this._acAct(+ab.dataset.ac, ab.dataset.act, ab.dataset.v); return; }
      const lt = ev.target.closest('[data-lt]');
      if (lt) { const id = lt.dataset.lt; this._hass.callService(id.split('.')[0], 'toggle', { entity_id: id }).catch(() => {}); return; }
      const em = ev.target.closest('[data-eqmode]');
      if (em) { const k = +em.dataset.eqmode; this._eqOpen = this._eqOpen === k ? null : k; this._eqErr = ''; this._eqOpts(); return; }
      const eo = ev.target.closest('[data-eqopt]'); if (eo) { this._eqChoose(+eo.dataset.k, eo.dataset.eqopt); return; }
      const o = ev.target.closest('[data-opt]'); if (o) { this._choose(o.dataset.opt); return; }
      const b = ev.target.closest('[data-id]'); if (b) this.more(b.dataset.id);
      if (ev.target.closest('#menu')) this.dispatchEvent(new Event('hass-toggle-menu', { bubbles: true, composed: true }));
    });
    this.shadowRoot.addEventListener('change', (ev) => this._progChange(ev.target));
    this.shadowRoot.addEventListener('keydown', (ev) => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.id === 'pg_list') { ev.preventDefault(); this._progOpen = true; this._progBuilt = false; this._programs(); } });
    this._progBuilt = false;
    this._built = true; this._time(); this._update();
  }
  _chip(icon, label, id, style, ent) {
    return `<button class="chip" style="${style}" ${ent ? `data-id="${esc(ent)}"` : ''}><i>${ic(icon)}</i><div><span id="${id}_l">${label}</span><b class="num" id="${id}">–</b></div></button>`;
  }
  _flowSvg() {
    // hub in the middle; solar above, grid left, house right, battery below
    const node = (id, x, y, icon, col) => `<g><circle class="nd" cx="${x}" cy="${y}" r="26" style="stroke:${col}"/><g transform="translate(${x - 13},${y - 13}) scale(1.08)" style="color:${col}">${ic(icon).replace('<svg ', '<svg width="24" height="24" ')}</g></g>`;
    const path = (id, d, col) => `<path class="ln" d="${d}"/><path class="fl" id="${id}" d="${d}" style="stroke:${col}"/>`;
    return `<svg class="fsvg" viewBox="0 0 360 250" role="img" aria-label="${tr('flow')}">
      ${path('l_pv', 'M180 58 V112', 'var(--sun)')}${path('l_grid', 'M76 125 H170', 'var(--grid)')}
      ${path('l_load', 'M190 125 H284', 'var(--home)')}${path('l_bat', 'M180 138 V192', 'var(--bat)')}
      <circle class="hub" cx="180" cy="125" r="9"/>
      ${node('n_pv', 180, 32, 'sun', 'var(--sun)')}${node('n_grid', 50, 125, 'grid', 'var(--grid)')}
      ${node('n_load', 310, 125, 'home', 'var(--home)')}${node('n_bat', 180, 218, 'bat', 'var(--bat)')}
      <text x="214" y="30" id="v_pv">–</text><text class="l" x="214" y="46">${tr('fSolar')}</text>
      <text x="50" y="172" text-anchor="middle" id="v_grid">–</text><text class="l" x="50" y="188" text-anchor="middle" id="v_gridl">${tr('fGrid')}</text>
      <text x="310" y="172" text-anchor="middle" id="v_load">–</text><text class="l" x="310" y="188" text-anchor="middle">${tr('fHouse')}</text>
      <text x="214" y="216" id="v_bat">–</text><text class="l" x="214" y="232" id="v_batl">${tr('fBattery')}</text>
    </svg>`;
  }
  _spark(id) {
    const pts = this.series(id, (st, a) => parseFloat(a && a.current_temperature));
    if (pts.length < 2) return '';
    const vs = pts.map((p) => p[1]), lo = Math.min(...vs) - 0.3, hi = Math.max(...vs) + 0.3;
    return `<svg class="spark" viewBox="0 0 200 26" preserveAspectRatio="none" aria-hidden="true"><path d="${this.path(pts, 200, 26, lo, hi)}"/></svg>`;
  }
  /* heating mode: tap the tile, then one of its options (the rest of the boiler room is display only) */
  _opts() {
    const box = this.$('#m_opts'), btn = this.$('#m_btn'), id = (this._cfg.heating || {}).mode;
    if (!box) return;
    const s = this.ok(id), list = (s && s.attributes.options) || [];
    box.hidden = !this._modeOpen || !list.length;
    btn?.setAttribute('aria-expanded', String(!box.hidden));
    const html = list.map((x) => `<button data-opt="${esc(x)}" class="${s.state === x ? 'on' : ''}">${esc(x)}</button>`).join('') + (this._modeErr ? `<p>${esc(this._modeErr)}</p>` : '');
    if (box.innerHTML !== html) box.innerHTML = html;
    clearTimeout(this._modeT);
    if (this._modeOpen) this._modeT = setTimeout(() => { this._modeOpen = false; this._opts(); }, 15000);
  }
  /* the mode of one equipment row (e.g. Baxi Auto / Manual): same behaviour as the heating mode tile */
  _eqOpts() {
    const eq = (this._cfg.heating || {}).equipment || [];
    eq.forEach((x, k) => {
      const box = this.$('#eqo' + k); if (!box) return;
      const s = this.ok(x.mode), list = (s && s.attributes.options) || [], open = this._eqOpen === k && list.length > 0;
      box.hidden = !open;
      this.$(`#eq${k} [data-eqmode]`)?.setAttribute('aria-expanded', String(open));
      const html = open ? list.map((o) => `<button data-k="${k}" data-eqopt="${esc(o)}" class="${s.state === o ? 'on' : ''}">${esc(o)}</button>`).join('') + (this._eqErr ? `<p>${esc(this._eqErr)}</p>` : '') : '';
      if (box.innerHTML !== html) box.innerHTML = html;
    });
    clearTimeout(this._eqT);
    if (this._eqOpen != null) this._eqT = setTimeout(() => { this._eqOpen = null; this._eqOpts(); }, 15000);
  }
  async _eqChoose(k, option) {
    const x = ((this._cfg.heating || {}).equipment || [])[k]; if (!x || !x.mode) return;
    try {
      await this._hass.callService(x.mode.split('.')[0], 'select_option', { entity_id: x.mode, option });
      this._eqOpen = null; this._eqErr = '';
    } catch (e) { this._eqErr = tr('modeError', e && e.message ? e.message : e); }
    this._eqOpts();
  }
  async _choose(option) {
    const id = (this._cfg.heating || {}).mode, domain = id.split('.')[0];
    try {
      await this._hass.callService(domain, 'select_option', { entity_id: id, option });
      this._modeOpen = false; this._modeErr = '';
    } catch (e) { this._modeErr = tr('modeError', e && e.message ? e.message : e); }
    this._opts();
  }
  /* ---------- car (OverDrive over MQTT): sensor.<prefix>_..., binary_sensor.<prefix>_..., device_tracker.<prefix>_location */
  carE(kind, key) { const p = (this._cfg.car || {}).prefix; return p ? `${kind}.${p}_${key}` : ''; }
  carInfo() {
    if (!(this._cfg.car || {}).prefix) return null;
    const n = (k) => this.num(this.carE('sensor', k)), b = (k) => { const s = this.ok(this.carE('binary_sensor', k)); return s ? s.state === 'on' : null; };
    const loc = this.st(this.carE('device_tracker', 'location'));
    const tyres = ['fl', 'fr', 'rl', 'rr'].map((k) => ({ k, kpa: n(`tyre_pressure_${k}`), leak: n(`tyre_leak_${k}`) }));
    const ok = tyres.filter((x) => isNum(x.kpa)).map((x) => x.kpa), hi = ok.length ? Math.max(...ok) : NaN;
    tyres.forEach((x) => { x.low = isNum(x.kpa) && (x.kpa < 220 || hi - x.kpa >= 25); x.leaking = isNum(x.leak) && x.leak !== 0; });
    return { name: this._cfg.car.name || tr('carDef'), soc: n('state_of_charge'), target: n('target_soc'), ev: n('ev_range'), fuel: n('fuel_level'), fr: n('fuel_range'),
      charging: b('charging'), kw: n('charge_power'), unlocked: b('lock'), doorOpen: b('doors'), parked: b('parked'), online: b('connection'),
      home: loc ? loc.state === 'home' : null, zone: loc ? loc.state : '', odo: n('odometer'), cons: n('consumption_50km'), out: n('outside_temperature'), tyres,
      seen: this.st(this.carE('sensor', 'state_of_charge'))?.last_updated };
  }
  _car() {
    const x = this.carInfo(); if (!x) return;
    const zone = x.home ? tr('atHome') : x.zone === 'not_home' || !x.zone ? tr('away') : (this._hass.states[`zone.${x.zone}`]?.attributes?.friendly_name || x.zone);
    this.set('car_sum', [zone, x.online === false ? `${tr('offline')} · ${tr('lastSeen', x.seen ? new Date(x.seen).toLocaleTimeString(LOC(), { hour: '2-digit', minute: '2-digit' }) : '–')}` : ''].filter(Boolean).join(' · '));
    const pct = (v) => `${Math.max(0, Math.min(100, v))}%`;
    this.set('car_bat', `<div class="big num ${isNum(x.soc) && x.soc < 30 ? 'low' : ''}">${isNum(x.soc) ? fmt(x.soc) : '–'} %</div>
      <div class="bar"><i style="width:${isNum(x.soc) ? pct(x.soc) : 0}"></i>${isNum(x.target) ? `<b style="left:${pct(x.target)}"></b>` : ''}</div>
      <div class="rg"><span>${tr('ev')} <b class="num">${isNum(x.ev) ? fmt(x.ev) : '–'} km</b></span><span>${isNum(x.target) ? tr('target', fmt(x.target)) : ''}</span></div>
      ${isNum(x.fuel) || isNum(x.fr) ? `<div class="bar fuel"><i style="width:${isNum(x.fuel) ? pct(x.fuel) : 0}"></i></div>
      <div class="rg"><span>${tr('fuel')} <b class="num">${isNum(x.fr) ? fmt(x.fr) : '–'} km</b></span><span class="num">${isNum(x.fuel) ? fmt(x.fuel) + ' %' : ''}</span></div>` : ''}`);
    const pill = (cls, text, id) => `<span class="pill ${cls}" ${id ? `data-id="${esc(id)}"` : ''}><i></i>${text}</span>`;
    this.set('car_pills', [
      x.charging ? pill('chg', tr('chargingKw', fmtW(isNum(x.kw) ? x.kw * 1000 : NaN)), this.carE('binary_sensor', 'charging')) : x.charging === false ? pill('mut', tr('notCharging'), this.carE('binary_sensor', 'charging')) : '',
      x.unlocked === null ? '' : pill(x.unlocked ? 'warn' : '', x.unlocked ? tr('unlocked') : tr('locked'), this.carE('binary_sensor', 'lock')),
      x.doorOpen === null ? '' : pill(x.doorOpen ? 'warn' : '', x.doorOpen ? tr('doorOpen') : tr('doorsShut'), this.carE('binary_sensor', 'doors')),
      x.online ? pill('', tr('online'), this.carE('binary_sensor', 'connection')) : '',
    ].join(''));
    this.set('car_foot', [isNum(x.odo) ? `${tr('odo')} <b class="num">${fmt(x.odo)} km</b>` : '', isNum(x.cons) ? `${tr('cons')} <b class="num">${fmt(x.cons, 1)} kWh/100 km</b>` : '',
      isNum(x.out) ? `${tr('outside')} <b class="num">${fmt(x.out)}°</b>` : ''].filter(Boolean).join(' · '));
    this.set('car_ty', x.tyres.map((y) => `<div class="ty ${y.low || y.leaking ? 'low' : ''}" data-id="${esc(this.carE('sensor', `tyre_pressure_${y.k}`))}"><span>${tr(y.k)}</span><b class="num">${isNum(y.kpa) ? fmt(y.kpa / 100, 2) : '–'}</b> <small>bar</small></div>`).join(''));
  }
  /* car controls: found by domain and words in the entity id, so a renamed control still works */
  /* controls come from the BYD cloud integration (hass-byd-vehicle: lock.<car>_lock, climate.<car>_climate ...),
     which works with the car off; OverDrive keeps the read-only data. Its prefix is the lock entity minus "_lock". */
  ctlPrefix() {
    const c = this._cfg.car || {}; if (c.ctl) return c.ctl;
    const od = c.prefix || '';
    const id = Object.keys(this._hass.states).find((x) => /^lock\..+_lock$/.test(x) && !(od && x.startsWith(`lock.${od}`)));
    return id ? id.slice(5, -5) : '';
  }
  carFind(domain, ...words) {
    const p = this._ctl; if (!p) return '';
    return Object.keys(this._hass.states).find((id) => id.startsWith(`${domain}.${p}`) && words.every((w) => id.includes(w))) || '';
  }
  /* tailgate: OverDrive's `tailgate` key (OPEN / CLOSE / STOP) shows up as a cover; buttons as a fallback */
  carTail() {
    for (const w of ['tailgate', 'trunk', 'boot', 'hayon']) { const id = this.carFind('cover', w); if (id) return { cover: id }; }
    const b = (w) => ['tailgate', 'trunk', 'boot'].map((x) => this.carFind('button', x, w)).find(Boolean) || '';
    const open = b('open'), close = b('close');
    return open || close ? { open, close, stop: b('stop'), sensor: ['tailgate', 'trunk', 'boot'].map((x) => this.carFind('binary_sensor', x)).find(Boolean) || '' } : null;
  }
  carCtl() {
    return { climate: this.carFind('climate', 'climate'), wheel: this.carFind('switch', 'steering_wheel'), lock: this.carFind('lock'), tail: this.carTail(),
      seats: [['drvHeat', 'driver_seat_heating'], ['drvVent', 'driver_seat_ventilation'], ['psgHeat', 'passenger_seat_heating'], ['psgVent', 'passenger_seat_ventilation']]
        .map(([k, w]) => ({ k, id: this.carFind('select', w), vent: w.includes('vent') })).filter((x) => x.id) };
  }
  /* seat level label: off / low / medium / high -> Oprit, 1, 2, 3 (anything else as the car names it) */
  lvLabel(o) { const x = String(o).toLowerCase(); return /^(off|0|none|oprit)$/.test(x) ? tr('lvOff') : /low|^1$/.test(x) ? '1' : /med|mid|^2$/.test(x) ? '2' : /high|^3$/.test(x) ? '3' : o; }
  _carControls() {
    const box = this.$('#car_cc'); if (!box || !(this._cfg.car || {}).prefix) return;
    // no controls through OverDrive: they only work while the car is on and changes made in the car are not
    // reported back. They appear only when the BYD cloud integration is installed.
    this._ctl = CAR_CONTROLS ? this.ctlPrefix() : '';
    if (!this._ctl) { box.hidden = true; return; }
    const c = this.carCtl(); box.hidden = !c.climate && !c.seats.length && !c.wheel && !c.lock && !c.tail; if (box.hidden) return;
    const cl = this.st(c.climate), a = (cl && cl.attributes) || {}, on = !!cl && !['off', 'unavailable', 'unknown'].includes(cl.state);
    if (!isNum(this._carT)) this._carT = isNum(+a.temperature) ? +a.temperature : 22;
    const step = +a.target_temp_step || 1, lo = +a.min_temp || 17, hi = +a.max_temp || 33;
    this._carT = Math.max(lo, Math.min(hi, this._carT));
    const clim = c.climate ? `<div class="clim"><div class="ch"><h3>${tr('climate')}</h3><b>${on ? tr('climOn') : tr('climOff')}</b><span class="num">${[on && isNum(+a.temperature) ? tr('setTo', fmt(+a.temperature)) : '', isNum(+a.current_temperature) ? `${tr('inside')} ${fmt(+a.current_temperature)}°` : ''].filter(Boolean).join(' · ')}</span></div>
        <div class="tt"><button data-car="temp" data-v="${-step}" aria-label="−">−</button><b class="num">${fmt(this._carT, step < 1 ? 1 : 0)}°</b><button data-car="temp" data-v="${step}" aria-label="+">+</button>
          <button class="act ${on ? 'off' : ''}" data-car="clim" data-v="${on ? 'off' : 'on'}">${on ? tr('turnOff') : tr('turnOn')}</button>
          <button class="act pre ${this._preArm ? 'arm' : ''}" data-car="preheat" title="${tr('preheat')}: ${tr('preheatHint')}">${this._preArm ? tr('preheatArm') : tr('preheat')}</button></div></div>` : '';
    // the BYD seats have two levels: OverDrive also offers "Medium", which the car does not have, so it is left out
    const seat = (x) => { const s = this.st(x.id), opts = ((s && s.attributes.options) || []).filter((o) => !/med|mid/i.test(o)); let n = 0;
      const label = (o) => (this.lvLabel(o) === tr('lvOff') ? tr('lvOff') : String(++n));
      return `<div class="seat"><span>${tr(x.k)}</span><div class="lv ${x.vent ? 'vent' : ''}">${opts.map((o) => `<button data-car="sel:${esc(x.id)}" data-v="${esc(o)}" class="${s && s.state === o ? 'on' : ''} ${this.lvLabel(o) === tr('lvOff') ? 'z' : ''}">${esc(label(o))}</button>`).join('')}</div></div>`; };
    const w = this.st(c.wheel), wOn = !!w && w.state === 'on';
    const seats = c.seats.length || c.wheel ? `<div><h3>${tr('seats')}</h3><div class="seats">${c.seats.map(seat).join('')}
        ${c.wheel ? `<div class="seat"><span>${tr('wheel')}</span><div class="lv"><button data-car="wheel" data-v="off" class="${w && !wOn ? 'on' : ''} z">${tr('lvOff')}</button><button data-car="wheel" data-v="on" class="${wOn ? 'on' : ''}">${tr('on')}</button></div></div>` : ''}</div></div>` : '';
    // lock / unlock: only when the car exposes a lock entity; two taps, like pre-heat
    const lk = this.st(c.lock), locked = !!lk && lk.state === 'locked';
    const lock = c.lock ? `<div class="clim"><div class="ch lk"><h3>${tr('lockTitle')}</h3><b>${lk ? (locked ? tr('locked') : tr('unlocked')) : '–'}</b>
        <button class="act ${this._lockArm ? 'arm' : locked ? '' : 'off'}" data-car="lock" data-v="${locked ? 'unlock' : 'lock'}">${this._lockArm ? tr('lkArm') : locked ? tr('doUnlock') : tr('doLock')}</button></div></div>` : '';
    // tailgate: open needs two taps (it can't be undone from afar), close and stop go at once
    let tail = '';
    if (c.tail) {
      const ts = this.st(c.tail.cover || c.tail.sensor), v = ts ? ts.state : '';
      const word = { open: tr('tOpen'), on: tr('tOpen'), closed: tr('tClosed'), off: tr('tClosed'), opening: tr('tOpening'), closing: tr('tClosing') }[v] || '–';
      const moving = v === 'opening' || v === 'closing', canStop = c.tail.cover || c.tail.stop;
      tail = `<div class="clim tail"><div class="ch"><h3>${tr('tailTitle')}</h3><b>${word}</b></div>
        <div class="tb"><button class="act ${this._tailArm ? 'arm' : ''}" data-car="tail" data-v="open">${this._tailArm ? tr('tArm') : tr('tDoOpen')}</button>
        <button class="act off" data-car="tail" data-v="close">${tr('tDoClose')}</button>
        ${canStop ? `<button class="act z ${moving ? '' : 'dim'}" data-car="tail" data-v="stop">${tr('tStop')}</button>` : ''}</div></div>`;
    }
    const left = lock + clim + tail, html = (left ? `<div class="ccl">${left}</div>` : '') + seats; if (box.innerHTML !== html) box.innerHTML = html;
  }
  async _carCmd(kind, v) {
    const c = this.carCtl(), msg = (t, err) => { const m = this.$('#car_msg'); if (m) { m.textContent = t || ''; m.classList.toggle('err', !!err); } };
    const call = (d, s, data) => this._hass.callService(d, s, data);
    // wait for the car to report the new state; a sleeping head unit never does
    const confirm = (id, test) => { clearTimeout(this._carW); const t0 = Date.now();
      const tick = () => { const s = this.st(id); if (s && test(s)) { msg(''); return; } if (Date.now() - t0 > 60000) { msg(tr('noConfirm'), true); return; } this._carW = setTimeout(tick, 1000); }; tick(); };
    try {
      if (kind === 'temp') { this._carT = (+this._carT || 22) + +v; this._carControls(); return; }
      if (kind === 'clim') {
        msg(tr('sent'));
        if (v === 'off') { await call('climate', 'turn_off', { entity_id: c.climate }); confirm(c.climate, (s) => s.state === 'off'); return; }
        await this._climOn(c); confirm(c.climate, (s) => s.state !== 'off'); return;
      }
      if (kind === 'preheat') {      // two taps: the first one arms it for 5 seconds
        if (!this._preArm) { this._preArm = true; this._carControls(); clearTimeout(this._preT); this._preT = setTimeout(() => { this._preArm = false; this._carControls(); }, 5000); return; }
        this._preArm = false; clearTimeout(this._preT); msg(tr('sent'));
        await this._climOn(c);
        const drv = c.seats.find((x) => x.k === 'drvHeat');
        if (drv) { const opts = this.st(drv.id)?.attributes?.options || []; const top = opts.find((o) => /high|^3$/i.test(o)) || opts[opts.length - 1]; if (top) await call('select', 'select_option', { entity_id: drv.id, option: top }); }
        if (c.wheel) await call('switch', 'turn_on', { entity_id: c.wheel });
        this._carControls(); confirm(c.climate, (s) => s.state !== 'off'); return;
      }
      if (kind === 'lock') {
        if (!this._lockArm) { this._lockArm = true; this._carControls(); clearTimeout(this._lockT); this._lockT = setTimeout(() => { this._lockArm = false; this._carControls(); }, 5000); return; }
        this._lockArm = false; clearTimeout(this._lockT); msg(tr('sent'));
        await call('lock', v, { entity_id: c.lock }); this._carControls(); confirm(c.lock, (s) => s.state === (v === 'lock' ? 'locked' : 'unlocked')); return;
      }
      if (kind === 'tail') {
        const t = c.tail; if (!t) return;
        if (v === 'open' && !this._tailArm) { this._tailArm = true; this._carControls(); clearTimeout(this._tailT); this._tailT = setTimeout(() => { this._tailArm = false; this._carControls(); }, 5000); return; }
        this._tailArm = false; clearTimeout(this._tailT); msg(tr('sent'));
        if (t.cover) await call('cover', { open: 'open_cover', close: 'close_cover', stop: 'stop_cover' }[v], { entity_id: t.cover });
        else if (t[v]) await call('button', 'press', { entity_id: t[v] });
        this._carControls();
        const id = t.cover || t.sensor;
        if (id && v !== 'stop') confirm(id, (s) => (v === 'open' ? ['open', 'opening', 'on'] : ['closed', 'closing', 'off']).includes(s.state)); else msg('');
        return;
      }
      if (kind === 'wheel') { msg(tr('sent')); await call('switch', v === 'on' ? 'turn_on' : 'turn_off', { entity_id: c.wheel }); confirm(c.wheel, (s) => s.state === v); return; }
      if (kind.startsWith('sel:')) { const id = kind.slice(4); msg(tr('sent')); await call('select', 'select_option', { entity_id: id, option: v }); confirm(id, (s) => s.state === v); }
    } catch (e) { msg(tr('cmdErr', e && e.message ? e.message : e), true); }
  }
  async _climOn(c) {
    const a = this.st(c.climate)?.attributes || {}, modes = a.hvac_modes || [];
    const mode = ['auto', 'heat_cool', 'heat'].find((m) => modes.includes(m)) || modes.find((m) => m !== 'off');
    // temperature first, then the start: through the cloud each call is a separate command to the car
    await this._hass.callService('climate', 'set_temperature', { entity_id: c.climate, temperature: this._carT });
    if (mode) await this._hass.callService('climate', 'set_hvac_mode', { entity_id: c.climate, hvac_mode: mode });
    else await this._hass.callService('climate', 'turn_on', { entity_id: c.climate });
  }
  /* ---------- fixed programs kept on a Shelly: HHMM numbers (545 = 05:45) and an on/off component */
  hhmm(id) { const v = this.num(id); if (!isNum(v) || v < 0 || v > 2359 || v % 100 > 59) return null; return Math.floor(v / 100) * 60 + (Math.round(v) % 100); }
  clock(min) { return min === null ? '–' : `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`; }
  progState(p, d = new Date()) {
    const en = this.ok(p.enabled), on = !!en && en.state === 'on', s = this.hhmm(p.start), e = this.hhmm(p.stop);
    const now = d.getHours() * 60 + d.getMinutes(), dow = d.getDay(), dayOk = !p.weekdays || (dow >= 1 && dow <= 5);
    const inside = s !== null && e !== null && s !== e && (s < e ? now >= s && now < e : now >= s || now < e);   // same rule as the script
    return { on, na: !en, s, e, run: on && dayOk && inside };
  }
  _programs() {
    const list = ((this._cfg.heating || {}).programs) || [], box = this.$('#pg_list'); if (!box || !list.length) return;
    const st = list.map((p) => this.progState(p));
    // summary
    this.set('pg_list', list.map((p, k) => { const x = st[k];
      return `<div class="pr ${x.run ? 'run' : x.on ? 'en' : 'off'}"><div><b>${esc(p.name || `Program ${k + 1}`)}</b><span class="num">${p.weekdays ? tr('weekdays') : tr('daily')} · ${this.clock(x.s)}–${this.clock(x.e)}</span></div><em>${x.na ? tr('unavailable') : x.run ? tr('pRunning') : x.on ? tr('pEnabled') : tr('pDisabled')}</em></div>`; }).join(''));
    const run = list.filter((p, k) => st[k].run);
    this._progRun = run.length;
    let sum = run.length ? tr('runningNow', run.map((p) => esc(p.name)).join(', ')) : '';
    if (!sum) {   // the next start among the enabled programs
      let best = null; const now = new Date();
      list.forEach((p, k) => { if (!st[k].on || st[k].s === null) return;
        for (let dd = 0; dd < 8; dd++) { const d = new Date(now); d.setDate(d.getDate() + dd); d.setHours(Math.floor(st[k].s / 60), st[k].s % 60, 0, 0);
          if (p.weekdays && (d.getDay() === 0 || d.getDay() === 6)) continue; if (d > now) { if (!best || d < best.d) best = { d, p }; break; } } });
      sum = best ? tr('nextAt', esc(best.p.name), best.d.toDateString() === now.toDateString() ? tr('todayW') : new Date(now.getTime() + 864e5).toDateString() === best.d.toDateString() ? tr('tomorrowW') : best.d.toLocaleDateString(LOC(), { weekday: 'long' }), this.clock(st[list.indexOf(best.p)].s)) : tr('noneEnabled');
    }
    this.set('pg_sum', sum);
    // editor
    const ed = this.$('#pg_edit'), open = !!this._progOpen;
    ed.hidden = !open; box.hidden = open; this.$('#pg_hint').hidden = open; box.setAttribute('aria-expanded', String(open));
    if (!open) return;
    const writable = (id, kind) => (kind === 'toggle' ? /^(switch|input_boolean)\./ : /^(number|input_number)\./).test(id || '');
    if (!this._progBuilt) {
      ed.innerHTML = list.map((p, k) => `<div class="pe1"><div class="pt"><div><b>${esc(p.name || `Program ${k + 1}`)}</b><br><span>${p.weekdays ? tr('weekdays') : tr('daily')}</span></div>
          <label class="tg" aria-label="${esc(p.name)}"><input type="checkbox" id="pe${k}_on" ${writable(p.enabled, 'toggle') ? '' : 'disabled'}><i></i></label></div>
        <div class="tm"><label><span>${tr('start')}</span><input type="text" inputmode="numeric" maxlength="5" placeholder="hh:mm" autocomplete="off" id="pe${k}_s" ${writable(p.start) ? '' : 'disabled'}></label>
          <label><span>${tr('end')}</span><input type="text" inputmode="numeric" maxlength="5" placeholder="hh:mm" autocomplete="off" id="pe${k}_e" ${writable(p.stop) ? '' : 'disabled'}></label></div>
        <p class="perr" id="pe${k}_err"></p></div>`).join('') + `<button class="done" id="pg_done">${tr('done')}</button>`;
      this._progBuilt = true;
    }
    const focus = this.shadowRoot.activeElement;
    list.forEach((p, k) => {    // fresh values, but never under the user's fingers
      const cb = this.$(`#pe${k}_on`), a = this.$(`#pe${k}_s`), b = this.$(`#pe${k}_e`);
      if (cb && cb !== focus) cb.checked = st[k].on;
      if (a && a !== focus && st[k].s !== null) a.value = this.clock(st[k].s);
      if (b && b !== focus && st[k].e !== null) b.value = this.clock(st[k].e);
    });
  }
  async _progChange(el) {
    const m = /^pe(\d+)_(on|s|e)$/.exec(el && el.id || ''); if (!m) return;
    const k = +m[1], p = (((this._cfg.heating || {}).programs) || [])[k]; if (!p) return;
    const err = (x) => { const e = this.$(`#pe${k}_err`); if (e) e.textContent = x || ''; };
    try {
      if (m[2] === 'on') {
        const dom = p.enabled.split('.')[0];
        await this._hass.callService(dom, el.checked ? 'turn_on' : 'turn_off', { entity_id: p.enabled });
      } else {
        // 24 h text: "05:45", "5:45", "5.45" or "545"
        const t24 = (x) => { const q = /^\s*(\d{1,2})[:.]?(\d{2})\s*$/.exec(String(x || '')); if (!q) return null; const h = +q[1], mi = +q[2]; return h <= 23 && mi <= 59 ? h * 60 + mi : null; };
        const mins = t24(el.value); if (mins === null) { err(tr('badTime')); return; }
        el.value = this.clock(mins);
        const h = Math.floor(mins / 60), mi = mins % 60;
        if (t24(this.$(`#pe${k}_${m[2] === 's' ? 'e' : 's'}`).value) === mins) { err(tr('sameTime')); return; }
        const id = m[2] === 's' ? p.start : p.stop;
        await this._hass.callService(id.split('.')[0], 'set_value', { entity_id: id, value: h * 100 + mi });   // HHMM, as the script reads it
      }
      err('');
    } catch (e) { err(tr('saveErr', e && e.message ? e.message : e)); }
  }
  _time() {
    const d = new Date(); const narrow = (this.offsetWidth || 1000) < 600;   // phones: "Mie, 18 nov." instead of the full date
    const s = d.toLocaleDateString(LOC(), narrow ? { weekday: 'short', day: 'numeric', month: 'short' } : { weekday: 'long', day: 'numeric', month: 'long' });
    this.set('date', esc(s.charAt(0).toUpperCase() + s.slice(1)) + ' · ' + d.toLocaleTimeString(LOC(), { hour: '2-digit', minute: '2-digit' }));
  }

  /* ---------- values into the skeleton */
  _update() {
    if (!this._built) return;
    const c = this._cfg, v = this.live();
    // weather
    const w = this.ok(c.weather);
    if (w) {
      const lbl = T[L].wx[w.state] || w.state, i = WX[w.state] || 'cloud';
      const day = (d, k) => { if (k === 0 && new Date(d).toDateString() === new Date().toDateString()) return tr('today'); const s = new Date(d).toLocaleDateString(LOC(), { weekday: 'short' }).replace('.', ''); return s.charAt(0).toUpperCase() + s.slice(1); };
      const fc = (this._fc || []).slice(0, 3).map((d, k) => `<div><span>${esc(day(d.datetime, k))}</span>${ic(WX[d.condition] || 'cloud')}<b class="num">${fmt(d.temperature)}°</b><small class="num">${fmt(d.templow)}°</small></div>`).join('');
      this.set('wx', `<span class="wn">${ic(i)}<div><b class="num">${fmt(w.attributes.temperature, 0)}°</b> ${esc(lbl)}</div></span>${fc ? `<div class="fc">${fc}</div>` : ''}`);
    }
    // chips
    this.set('c_pv', fmtW(v.pv));
    this.set('c_load', fmtW(v.load));
    this.set('c_bat', isNum(v.soc) ? `${fmt(v.soc)} %` : fmtW(v.bat));
    this.set('c_bat_l', !isNum(v.bat) || Math.abs(v.bat) < 30 ? tr('battery') : v.bat > 0 ? tr('charging', fmtW(v.bat)) : tr('discharging', fmtW(-v.bat)));
    this.set('c_grid', isNum(v.grid) ? fmtW(Math.abs(v.grid)) : '–');
    this.set('c_grid_l', !isNum(v.grid) || Math.abs(v.grid) < 30 ? tr('grid') : v.grid > 0 ? tr('gridImport') : tr('gridExport'));
    // flow
    const go = (id, on, rev) => { const p = this.$('#' + id); if (p) { p.classList.toggle('go', !!on); p.classList.toggle('rev', !!rev); } };
    go('l_pv', v.pv > 30, false);
    go('l_load', v.load > 30, false);
    go('l_grid', Math.abs(v.grid) > 30, v.grid < 0);          // import: grid -> hub; export: reverse
    go('l_bat', Math.abs(v.bat) > 30, v.bat < 0);            // charging: hub -> battery; discharging: reverse
    this.set('v_pv', fmtW(v.pv)); this.set('v_load', fmtW(v.load));
    this.set('v_grid', isNum(v.grid) ? fmtW(Math.abs(v.grid)) : '–'); this.set('v_gridl', v.grid > 30 ? tr('import') : v.grid < -30 ? tr('export') : tr('fGrid'));
    this.set('v_bat', isNum(v.soc) ? `${fmt(v.soc)} %` : '–'); this.set('v_batl', v.bat > 30 ? `+${fmtW(v.bat)}` : v.bat < -30 ? `−${fmtW(-v.bat)}` : tr('idleBat'));
    const self = isNum(v.load) && v.load > 0 && isNum(v.grid) ? Math.max(0, Math.min(100, 100 * (1 - Math.max(0, v.grid) / v.load))) : NaN;
    this.set('f_state', isNum(self) ? tr('selfNow', fmt(self)) : '');
    this.set('f_leg', [
      this.e.pv1 ? `<div><span>MPPT 1</span><b class="num">${fmtW(v.pv1)}</b></div>` : '',
      this.e.pv2 ? `<div><span>MPPT 2</span><b class="num">${fmtW(v.pv2)}</b></div>` : '',
      this.e.grid_v ? `<div><span>${tr('gridV')}</span><b class="num">${fmt(v.gv)} V</b></div>` : '',
      `<div><span>${tr('battery')}</span><b class="num">${this.batTime(v)}</b></div>`,
    ].join(''));
    this._today();
    // thermostats
    let heating = 0;
    (c.thermostats || []).forEach((t, k) => {
      const s = this.ok(t.entity), a = (s && s.attributes) || {};
      const cur = parseFloat(a.current_temperature), tgt = parseFloat(a.temperature);
      // a thermostat that does not report hvac_action can name the entity that shows its heat demand (a relay)
      const hs = t.heat ? this.ok(t.heat) : null;
      const act = s && s.state === 'off' ? 'off' : hs ? (/^(on|true|1|pornit|heating|da|yes)$/i.test(hs.state) ? 'heating' : 'idle') : a.hvac_action;
      const on = act === 'heating'; if (on) heating++;
      const chip = !s ? tr('unavailable') : act ? (T[L].action[act] || act) : (T[L].mode[s.state] || s.state);
      const pos = (x) => `${Math.max(0, Math.min(100, (x - 14) / 14 * 100))}%`;   // scale 14–28 °C
      const el = this.$('#th' + k); if (!el) return;
      el.classList.toggle('on', on); el.classList.toggle('na', !s);
      const html = `<div class="n">${esc(t.name || a.friendly_name || t.entity)}<em>${esc(chip)}</em></div>
        <div class="t num">${isNum(cur) ? fmt(cur, 1) : '–'}<sup>°C</sup></div>
        <div class="scale">${isNum(tgt) ? `<span class="tgt" style="left:${pos(tgt)}"></span>` : ''}${isNum(cur) ? `<span class="cur" style="left:${pos(cur)}"></span>` : ''}</div>
        <div class="s num">${isNum(tgt) ? tr('setTo', fmt(tgt, 1)) : tr('noTarget')}${isNum(parseFloat(a.current_humidity)) ? ` · ${tr('humidity', fmt(parseFloat(a.current_humidity)))}` : ''}</div>`;
      if (el.innerHTML !== html) el.innerHTML = html;
    });
    this._heating = heating;
    this.set('h_sum', (c.thermostats || []).length ? tr('zonesHeating', heating) : '');
    // boiler room
    const h = c.heating || {};
    const pt = this.num(h.puffer), at = this.num(h.acm);
    this.$('.rm')?.classList.toggle('two', !!(h.puffer && h.acm));
    // tanks: level on a 20–80 °C scale; hot water feels hot sooner than the buffer tank
    const tank = (k, v, hot, warm) => {
      const lv = this.$(`#${k}_lv`); if (lv) lv.style.height = isNum(v) ? `${Math.max(4, Math.min(100, (v - 20) / 60 * 100))}%` : '0';
      this.set(`${k}_v`, isNum(v) ? `${fmt(v, 1)}°` : '–');
      this.set(`${k}_s`, !isNum(v) ? tr('unavail') : v >= hot ? tr('hot') : v >= warm ? tr('warm') : tr('cold'));
    };
    if (h.puffer) tank('t', pt, 55, 40);
    if (h.acm) tank('a', at, 50, 40);
    if (h.puffer || h.acm) {   // one chart, one scale, a line for each tank
      const ser = [[h.puffer, '#p_line', '--heat', tr('puffer')], [h.acm, '#a_line', '--sun', tr('acm')]].filter((x) => x[0])
        .map(([id, sel, col, n]) => ({ sel, col, n, pts: this.series(id, (st) => parseFloat(st)) }));
      const all = ser.flatMap((x) => x.pts.map((p) => p[1]));
      if (all.length > 1) {
        const lo = Math.floor(Math.min(...all) - 2), hi = Math.ceil(Math.max(...all) + 2);
        for (const x of ser) this.$(x.sel)?.setAttribute('d', x.pts.length > 1 ? this.path(x.pts, 600, 96, lo, hi) : '');
        const pp = ser.find((x) => x.sel === '#p_line');
        this.$('#p_area')?.setAttribute('d', pp && pp.pts.length > 1 ? this.path(pp.pts, 600, 96, lo, hi, true) : '');
        this.set('p_mm', ser.filter((x) => x.pts.length > 1).map((x) => { const v = x.pts.map((p) => p[1]);
          return `<span class="lg">${ser.length > 1 ? `<i style="background:var(${x.col})"></i>${esc(x.n)} ` : 'min '}<b class="num">${fmt(Math.min(...v), 1)}°</b>${ser.length > 1 ? '–' : ' · max '}<b class="num">${fmt(Math.max(...v), 1)}°</b></span>`; }).join(''));
      } else this.set('p_mm', this._hist ? tr('noHistory') : tr('loading'));
    }
    const txt = (id) => { const s = this.ok(id); if (!s) return '–'; const u = s.attributes.unit_of_measurement; return esc(s.state + (u ? ' ' + u : '')); };
    if (h.mode) {
      this.set('m_mode', txt(h.mode));
      const ms = this.ok(h.mode);
      this.$('#m_btn')?.classList.toggle('man', !!ms && !/^auto/i.test(ms.state));   // a manual mode stands out
      this.set('m_why', h.reason && this.ok(h.reason) ? esc(this.ok(h.reason).state) : '');
      if (this._modeOpen) this._opts();
    }
    if (h.demand) this.set('m_dem', txt(h.demand));
    let running = 0;
    (h.equipment || []).forEach((x, k) => {
      const s = this.st(x.entity), na = !s || s.state === 'unavailable' || s.state === 'unknown', on = !na && s.state === 'on';
      if (on) running++;
      const el = this.$('#eq' + k); if (!el) return;
      el.className = `${on ? 'on' : ''} ${on && x.alert ? 'al' : ''} ${na ? 'na' : ''}`;
      const ms = this.onToday(x.entity);
      // an optional sensor on the row (e.g. the hot water tank temperature), before the runtime
      const vs = x.value ? this.ok(x.value) : null, vn = vs ? parseFloat(vs.state) : NaN;
      const val = vs ? `${x.label ? esc(x.label) + ' ' : ''}<b class="num">${isNum(vn) ? fmt(vn, Math.abs(vn) < 100 ? 1 : 0) : esc(vs.state)}${vs.attributes.unit_of_measurement ? ' ' + esc(vs.attributes.unit_of_measurement) : ''}</b>` : '';
      const sub = [val, isNum(ms) ? (ms >= 60000 ? tr('ranToday', dur(ms)) : tr('notToday')) : ''].filter(Boolean).join(' · ');
      const why = x.reason && this.ok(x.reason) ? this.ok(x.reason).state : '';
      const md = x.mode ? this.ok(x.mode) : null;
      const html = `<i>${ic(x.icon || 'dev')}</i><span>${esc(x.name || s?.attributes?.friendly_name || x.entity)}${sub ? `<small>${sub}</small>` : ''}${why ? `<small class="why">${esc(why)}</small>` : ''}</span>`
        + (md ? `<button class="eqm ${/^auto/i.test(md.state) ? '' : 'man'}" data-eqmode="${k}" aria-expanded="${this._eqOpen === k}">${esc(md.state)}</button>` : '')
        + `<em>${na ? tr('unavailable') : on ? tr('on') : tr('off')}</em>`;
      if (el.innerHTML !== html) el.innerHTML = html;
    });
    if (this._eqOpen != null) this._eqOpts();
    this.set('r_sum', (h.equipment || []).length ? tr('running', running, (h.equipment || []).length) : '');
    this._bill(); this._devices(); this._lights(); this._acs(); this._car(); this._carControls(); this._alerts(v, pt); this._programs(); this._mnav();
  }
  /* the strip under the photo: only what needs attention, empty (hidden) when all is well */
  _alerts(v, pt) {
    const c = this._cfg, lim = c.alerts || {}, out = [], now = Date.now();
    const add = (bad, icon, text, id) => out.push(`<${id ? `button data-id="${esc(id)}"` : 'div'} class="al ${bad ? 'bad' : ''}">${ic(icon)}<span>${text}</span></${id ? 'button' : 'div'}>`);
    const off = (c.devices || []).filter((d) => { const s = this.st(d.entity); return !s || ((s.state === 'unavailable' || s.state === 'unknown') && now - Date.parse(s.last_changed || 0) > 300000); });
    if (off.length === 1) add(true, 'dev', tr('aDevOff', esc(off[0].name || off[0].entity)), off[0].entity);
    else if (off.length > 1) add(true, 'dev', tr('aDevsOff', off.length, esc(off.map((d) => d.name || d.entity).join(', '))));
    for (const k of c.hidro || []) {
      const x = this.billInfo(k); if (!x || x.paid || !isNum(x.days)) continue;
      const who = esc(k.name || k.id), sum = esc(x.s || x.open || '');
      if (x.days < 0) add(true, 'bill', tr('aOverdue', who, sum));
      else if (x.days <= 3) add(false, 'bill', tr('aDue', who, x.days, sum));
    }
    if (isNum(v.soc) && v.soc < (lim.soc ?? 20) && !(v.bat > 30)) add(v.soc <= (+this.e.battery_reserve || 0) + 2, 'bat', tr('aBattery', fmt(v.soc)), this.e.soc);
    if (isNum(pt) && pt < (lim.puffer ?? 35)) add(false, 'thermo', tr('aPuffer', fmt(pt, 1)));
    for (const x of (c.heating || {}).equipment || []) {
      const s = this.ok(x.entity); if (!x.alert || !s || s.state !== 'on') continue;
      add(false, x.icon || 'flame', tr('aRunning', esc(x.name || s.attributes.friendly_name || x.entity), dur(now - Date.parse(s.last_changed || now))));
    }
    const car = this.carInfo();
    if (car) {
      for (const y of car.tyres) {
        if (y.leaking) add(true, 'car', tr('aTyreLeak', tr(y.k)), this.carE('sensor', `tyre_pressure_${y.k}`));
        else if (y.low) add(true, 'car', tr('aTyre', tr(y.k), fmt(y.kpa / 100, 2)), this.carE('sensor', `tyre_pressure_${y.k}`));
      }
      if (car.unlocked && car.parked) add(false, 'car', tr('aUnlocked', esc(car.name)), this.carE('binary_sensor', 'lock'));
      const hr = new Date().getHours();
      if (car.home && car.charging === false && isNum(car.soc) && car.soc < 30 && (hr >= 19 || hr < 7)) add(false, 'car', tr('aCarLow', esc(car.name), fmt(car.soc)), this.carE('sensor', 'state_of_charge'));
    }
    this.set('alerts', out.join(''));
  }
  /* attribute by its name, whatever the diacritics, case or separators the integration uses */
  attr(attrs, ...words) {
    const norm = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const want = words.map(norm);
    for (const w of want) { const k = Object.keys(attrs || {}).find((x) => norm(x) === w); if (k) return attrs[k]; }
    for (const w of want) { const k = Object.keys(attrs || {}).find((x) => norm(x).includes(w)); if (k) return attrs[k]; }
    return undefined;
  }
  /* one contract's bill: sold, status, last bill, due date, unpaid, days to the due date */
  billInfo(c) {
    const a = (suffix) => this.st(`sensor.hidroelectrica_${c.id}_${suffix}`)?.attributes || {};
    const sold = a('sold_factura'), fr = a('factura_restanta');
    if (!Object.keys(sold).length && !Object.keys(fr).length) return null;
    const s = this.attr(sold, 'sold'), st = this.attr(sold, 'status') || '';
    const due = this.attr(fr, 'scadenta') ?? this.attr(sold, 'data scadentei');
    const open = this.attr(fr, 'total neachitat');
    // "Total neachitat" is only what is past due; whether the bill is paid comes from the balance
    const paid = money(s) === 0 || (!isNum(money(s)) && /achitat/i.test(st) && !/neachitat/i.test(st));
    const m = /(\d{1,2})[./-](\d{1,2})[./-](\d{4})/.exec(String(due || ''));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = m ? Math.round((new Date(+m[3], +m[2] - 1, +m[1]).getTime() - today.getTime()) / 864e5) : NaN;
    return { s, st, due, open, paid, days, last: this.attr(fr, 'ultima factura emisa', 'ultima factura') ?? this.attr(sold, 'suma ultimei facturi') };
  }
  /* "plină în 2 h 10 min" / "ține ~14 h" from the capacity, the charge and the battery power */
  batTime(v) {
    if (!isNum(v.bat) || Math.abs(v.bat) < 30) return isNum(v.bat) ? tr('rest') : '–';
    const kwh = +this.e.battery_kwh || 0, res = +this.e.battery_reserve || 0;
    if (!(kwh > 0) || !isNum(v.soc)) return v.bat > 0 ? tr('chargingW') : tr('dischargingW');
    if (v.bat > 0) return v.soc >= 99.5 ? tr('full') : tr('fullIn', dur(kwh * (100 - v.soc) / 100 * 1000 / v.bat * 3600e3));
    return v.soc <= res ? tr('atReserve') : tr('lasts', dur(kwh * (v.soc - res) / 100 * 1000 / -v.bat * 3600e3));
  }
  /* energy of today and the solar forecast, in kWh */
  kwh(id) { const v = this.num(id), u = (this.st(id)?.attributes?.unit_of_measurement || '').toLowerCase(); return u === 'wh' ? v / 1000 : u === 'mwh' ? v * 1000 : v; }
  _today() {
    const t = this._cfg.today || {}, k = (key) => (t[key] ? this.kwh(t[key]) : NaN), f = (x) => `${fmt(x, x >= 100 ? 0 : 1)} kWh`;
    const rows = [[tr('produced'), k('pv_today')], [tr('used'), k('load_today')], [tr('imported'), k('import_today')], [tr('exported'), k('export_today')]].filter(([, x]) => isNum(x));
    const load = k('load_today'), imp = k('import_today');
    if (isNum(load) && load > 0 && isNum(imp)) rows.push([tr('selfToday'), `${fmt(Math.max(0, Math.min(100, (1 - imp / load) * 100)))} %`]);
    const fcRows = [[tr('fcRest'), k('forecast_rest')], [tr('fcTomorrow'), k('forecast_tomorrow')]].filter(([, x]) => isNum(x));
    const cell = ([l, x]) => `<div><span>${l}</span><b class="num">${typeof x === 'string' ? x : f(x)}</b></div>`;
    this.set('f_today', rows.length || fcRows.length ? `<p class="sub">${tr('today')}</p><div class="legend">${rows.concat(fcRows).map(cell).join('')}</div>` : '');
  }
  _bill() {
    const list = this._cfg.hidro || [];
    if (!list.length) { this.set('bill', `<p class="empty">${tr('pickContracts')}</p>`); return; }
    this.set('bill', `<div class="bills">${list.map((c) => {
      const head = `<div class="bh"><b>${esc(c.name || c.id)}</b><span>${esc(c.id)}</span></div>`;
      const x = this.billInfo(c);
      if (!x) return `<div class="b1">${head}<p class="empty">${tr('noBillData')}</p></div>`;
      return `<div class="b1">${head}<div class="big num ${x.paid ? 'ok' : 'due'}">${esc(x.s ?? '–')}</div><div class="note" style="margin-top:2px">${esc(x.st)}</div>
        <div class="kv"><span>${tr('lastBill')}</span><b>${esc(x.last ?? '–')}</b><span>${tr('due')}</span><b>${esc(x.due ?? '–')}</b><span>${tr('unpaid')}</span><b>${esc(x.open ?? '–')}</b></div></div>`;
    }).join('')}</div>`);
  }
  /* phone: one tile per card with its key value and a colour for its state; tapping opens the card as a sheet */
  _mtile(k) {
    const c = this._cfg, h = c.heating || {}, v = this.live(), txt = (id) => (this.$('#' + id)?.textContent || '').trim();
    const deg = (x) => isNum(x) ? `${fmt(x, 1)}°` : '–';
    switch (k) {
      case 'flow': return [fmtW(v.load), `${tr('solar').toLowerCase()} ${fmtW(v.pv)} · ${isNum(v.soc) ? fmt(v.soc) + ' %' : '–'}`, v.bat > 30 || v.pv > 300 ? 'good' : ''];
      case 'bill': {
        const due = (c.hidro || []).map((x) => [x, this.billInfo(x)]).filter(([, b]) => b && !b.paid);
        // red when a bill is past its due date (or something is left unpaid after it), yellow while still in term
        due.sort((x, y) => (isNum(x[1].days) ? x[1].days : 1e9) - (isNum(y[1].days) ? y[1].days : 1e9));
        const late = due.some(([, b]) => (isNum(b.days) && b.days < 0) || money(b.open) > 0);
        return due.length ? [due[0][1].s ?? '–', `${due[0][0].name || due[0][0].id} · ${tr('due').toLowerCase()} ${due[0][1].due ?? '–'}`, late ? 'bad' : 'lit'] : [tr('tAll'), tr('tAllSub'), 'good'];
      }
      case 'heat': {
        return [this._heating ? tr('zonesHeating', this._heating).split(' ').slice(0, 2).join(' ') : tr('tIdle'), txt('h_sum'), this._heating ? 'hot' : ''];
      }
      case 'room': {
        const on = (h.equipment || []).some((x) => x.alert && this.ok(x.entity)?.state === 'on');
        return [[h.puffer && deg(this.num(h.puffer)), h.acm && deg(this.num(h.acm))].filter(Boolean).join(' / ') || '–', txt('r_sum'), on ? 'hot' : ''];
      }
      case 'prog': { const pg = h.programs || [], n = pg.filter((x) => this.ok(x.enabled)?.state === 'on').length; return [this._progRun ? tr('tRuns') : `${n}/${pg.length}`, txt('pg_sum'), this._progRun ? 'lit' : ''] ; }
      case 'lit': { const l = c.lights || [], n = l.filter((x) => this.ok(x.entity)?.state === 'on').length; return [`${n} / ${l.length}`, this._litNext || txt('l_sum'), n ? 'lit' : '']; }
      case 'acs': {
        const a = (c.ac || [])[0], s = a && this.ok(a.entity); if (!s) return ['–', tr('unavailable'), 'bad'];
        const m = s.state, on = m !== 'off', t = s.attributes.temperature;
        return [`${T[L].hv[m] || m}${on && t != null ? ' ' + fmt(t) + '°' : ''}`, s.attributes.current_temperature != null ? tr('acRoom', `${fmt(s.attributes.current_temperature)}°`) : '', !on ? '' : m === 'heat' ? 'hot' : 'cool'];
      }
      case 'car': { const x = this.carInfo(); return x ? [isNum(x.soc) ? `${fmt(x.soc)} %` : '–', txt('car_sum'), isNum(x.soc) && x.soc < 30 ? 'bad' : 'good'] : ['–', '', '']; }
      case 'dev': { const d = c.devices || [], down = d.filter((x) => !this.ok(x.entity)).length; return [down ? tr('down', down) : `${d.length}/${d.length}`, txt('d_sum'), down ? 'bad' : '']; }
      case 'gr': return ['24 h', tr('tChartsSub'), ''];
      default: return ['–', '', ''];
    }
  }
  _mnav() {
    let any = false;
    for (const [k] of MNAV) {
      const b = this.$(`[data-mb="${k}"]`), c = this.$(`.grid section.${k}`); if (!b || !c) continue;
      b.hidden = c.hidden;
      if (!c.hidden && !b.hidden) {
        const [val, sub, cls] = this._mtile(k);
        const mv = this.$('#mv_' + k), ms = this.$('#mb_' + k);
        if (mv && mv.textContent !== String(val)) mv.textContent = val;
        if (ms && ms.textContent !== String(sub)) ms.textContent = sub;
        b.className = `mb${cls ? ' s-' + cls : ''}`;
      }
      const h2 = c.querySelector('h2');
      if (h2 && !h2.querySelector('.mx')) h2.insertAdjacentHTML('beforeend', `<button class="mx" data-mclose aria-label="${tr('close')}">×</button>`);
      const open = this._mo === k && !c.hidden; if (open) any = true;
      c.classList.toggle('mo', open);
      if (open) { c.setAttribute('role', 'dialog'); c.setAttribute('aria-modal', 'true'); } else { c.removeAttribute('role'); c.removeAttribute('aria-modal'); c.style.transform = ''; }
    }
    const sc = this.$('.scrim'); if (sc) sc.hidden = !any;
    if (this._mo === 'gr' && any && !this._grDrawn) { this._grDrawn = true; this._charts(); }
  }
  /* air conditioners (climate entities, e.g. Tuya IR): mode, target temperature and fan. Temperature taps are
     collected for a second and sent as one command, so the IR blaster doesn't beep at every step. */
  _acs() {
    const list = this._cfg.ac || []; if (!list.length) return;
    this._acT = this._acT || {};
    let on = 0;
    const html = list.map((d, k) => {
      const s = this.ok(d.entity);
      if (!s) return `<div class="acu"><div class="hd"><b>${esc(d.name || d.entity)}</b><span>${tr('unavailable')}</span></div></div>`;
      const a = s.attributes, mode = s.state, isOn = mode !== 'off'; if (isOn) on++;
      const t = this._acT[k] != null ? this._acT[k] : a.temperature;
      const cur = a.current_temperature != null ? tr('acRoom', `${fmt(a.current_temperature)}°`) : '';
      const modes = (a.hvac_modes || []).slice().sort((x, y) => (x === 'off' ? -1 : y === 'off' ? 1 : 0));
      const fans = a.fan_modes || [];
      const hvn = (m) => (T[L].hv[m] || m), fn = (m) => (T[L].fanM[String(m).toLowerCase()] || m);
      return `<div class="acu ${isOn ? 'on' : ''} ${mode === 'heat' ? 'heat' : ''}">
        <div class="hd"><b>${esc(d.name || a.friendly_name || d.entity)}</b><em>${esc(hvn(mode))}${isOn && t != null ? ` · ${fmt(t)}°` : ''}</em><span>${cur}</span></div>
        <div class="tt ${isOn ? '' : 'dim'}"><button data-ac="${k}" data-act="t" data-v="-1" aria-label="−">−</button><strong>${t != null ? fmt(t) + '°' : '–'}</strong><button data-ac="${k}" data-act="t" data-v="1" aria-label="+">+</button></div>
        <div class="row"><small>${tr('acMode')}</small>${modes.map((m) => `<button class="${m === mode ? 'on' : ''} ${m === 'heat' ? 'heat' : ''} ${m === 'off' ? 'off' : ''}" data-ac="${k}" data-act="mode" data-v="${esc(m)}">${esc(hvn(m))}</button>`).join('')}</div>
        ${fans.length ? `<div class="row"><small>${tr('acFan')}</small>${fans.map((m) => `<button class="${m === a.fan_mode ? 'on' : ''}" data-ac="${k}" data-act="fan" data-v="${esc(m)}">${esc(fn(m))}</button>`).join('')}</div>` : ''}
      </div>`;
    }).join('');
    this.set('ac_list', html);
    this.set('ac_sum', tr('acOn', on));
  }
  async _acAct(k, act, v) {
    const d = (this._cfg.ac || [])[k], s = d && this.ok(d.entity); if (!s) return;
    const a = s.attributes, call = (svc, data) => this._hass.callService('climate', svc, { entity_id: d.entity, ...data });
    const msg = (x, err) => { const m = this.$('#ac_msg'); if (m) { m.textContent = x; m.classList.toggle('err', !!err); } };
    try {
      if (act === 't') {
        const step = a.target_temp_step || 1, lo = a.min_temp ?? 16, hi = a.max_temp ?? 30;
        const base = this._acT[k] != null ? this._acT[k] : (a.temperature ?? 22);
        this._acT[k] = Math.min(hi, Math.max(lo, Math.round((base + step * +v) / step) * step));
        this._acs();
        clearTimeout(this._acTimer);
        this._acTimer = setTimeout(async () => {
          const t = this._acT[k];
          try { await call('set_temperature', { temperature: t }); msg(''); } catch (e) { msg(tr('modeError', e && e.message ? e.message : e), true); }
          delete this._acT[k]; this._acs();
        }, 1000);
        return;
      }
      if (act === 'mode') await call('set_hvac_mode', { hvac_mode: v });
      if (act === 'fan') await call('set_fan_mode', { fan_mode: v });
      msg('');
    } catch (e) { msg(tr('modeError', e && e.message ? e.message : e), true); }
  }
  /* outdoor lights: tap a row to switch it; the automatic row turns the sunset / sunrise automation on or off */
  _lights() {
    const list = this._cfg.lights || []; if (!list.length) return;
    const AUTO = 'input_boolean.lumini_automat', DARK = 'binary_sensor.lumini_exterior_intuneric';
    let on = 0;
    const rows = list.map((d) => {
      const s = this.st(d.entity), na = !s || s.state === 'unavailable' || s.state === 'unknown', o = !na && s.state === 'on';
      if (o) on++;
      return `<button class="${o ? 'on' : ''} ${na ? 'na' : ''}" data-lt="${esc(d.entity)}" aria-pressed="${o}"><i>${ic('bulb')}</i><span>${esc(d.name || s?.attributes?.friendly_name || d.entity)}${na ? `<small>${tr('unavailable')}</small>` : ''}</span><b class="sw"></b></button>`;
    });
    const au = this.ok(AUTO);
    if (au) {
      const a = au.state === 'on', dk = this.ok(DARK), at = (iso) => { const d = new Date(iso); if (isNaN(d)) return '';
        const day = d.toDateString() === new Date().toDateString() ? '' : ` ${tr('lTomorrow')}`;
        return d.toLocaleTimeString(LOC(), { hour: '2-digit', minute: '2-digit', hour12: false }) + day; };
      const next = dk ? (dk.state === 'on' ? tr('lOffAt', at(dk.attributes.stingere)) : tr('lOnAt', at(dk.attributes.aprindere))) : '';
      this._litNext = a ? next : '';
      rows.push(`<button class="au ${a ? 'on' : ''}" data-lt="${AUTO}" aria-pressed="${a}"><i>${ic('clock')}</i><span>${a ? tr('lAuto') : tr('lAutoOff')}<small>${a && next ? next : tr('lAutoHint')}</small></span><b class="sw"></b></button>`);
    }
    this.set('lits', `<div class="lts">${rows.join('')}</div>`);
    this.set('l_sum', tr('lOn', on, list.length));
  }
  _devices() {
    const list = this._cfg.devices || [];
    if (!list.length) { this.set('devs', `<p class="empty">${tr('pickDevices')}</p>`); this.set('d_sum', ''); return; }
    let bad = 0;
    const now = Date.now();
    const html = list.map((d) => {
      const s = this.st(d.entity), na = !s || s.state === 'unavailable' || s.state === 'unknown';
      const long = na && (!s || now - Date.parse(s.last_changed || 0) > 300000);   // 5 minutes: as on PV Project
      if (na) bad++;
      return `<button class="${na ? (long ? 'bad' : 'wait') : ''}" data-id="${esc(d.entity)}"><i></i>${esc(d.name || s?.attributes?.friendly_name || d.entity)}</button>`;
    }).join('');
    this.set('devs', `<div class="devs">${html}</div>`);
    this.set('d_sum', bad ? tr('devOff', bad) : tr('allOnline', list.length));
  }
}
if (!customElements.get('casa-panel')) customElements.define('casa-panel', CasaPanel);

/* The same panel as a Lovelace card (type: custom:casa-card), so it can live in a dashboard that
   Home Assistant lets you pick as the default one. Its settings come from the Casa integration. */
class CasaCard extends HTMLElement {
  setConfig(config) { this._config = config || {}; }
  set hass(h) {
    if (!this._p) { this._p = document.createElement('casa-panel'); this.appendChild(this._p); }
    const p = h.panels && h.panels[this._config.panel || 'casa'];
    if (p) this._p.panel = p;
    else if (!this._warned) { this._warned = true; this._p.panel = { config: { title: tr('notConfigured') } }; }
    this._p.hass = h;
  }
  getCardSize() { return 30; }
  getGridOptions() { return { columns: 'full', rows: 'auto' }; }
  static getStubConfig() { return {}; }
}
if (!customElements.get('casa-card')) customElements.define('casa-card', CasaCard);
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === 'casa-card')) window.customCards.push({ type: 'casa-card', name: 'Casa', description: 'Casa dashboard (energy, heating, bills, devices)' });
})();
