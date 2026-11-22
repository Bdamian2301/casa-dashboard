"""Option texts -> panel config. No Home Assistant imports, so it can be tested on its own."""
from __future__ import annotations

# icon of an equipment line, from words in its name or entity id
ICONS = (
    (("pompa de caldura", "pompă de căldură", "pdc", "heat pump"), "hp"),
    (("centrala", "centrală", "baxi", "boiler", "cazan"), "boiler"),
    (("wilo", "recirculare", "pompa", "pompă", "pump"), "pump"),
    (("rezistenta", "rezistență", "heater", "boiler electric"), "bolt"),
)
DEYE_SUFFIX = {
    "pv1": "dc_power_pv1",
    "pv2": "dc_power_pv2",
    "load": "ups_load_power",
    "battery": "battery_power",
    "soc": "soc",
    "grid": "total_grid_power",
    "grid_v": "grid_voltage_l1_l2",
}


# daily counters and forecast, by the end of the entity id (first name that exists wins)
TODAY_SUFFIX = {
    "pv_today": ["daily_production", "daily_pv_production", "daily_solar_production", "today_production", "pv_energy_today"],
    "load_today": ["daily_consumption", "daily_load_consumption", "daily_load", "today_load_consumption"],
    "import_today": ["daily_energy_purchased", "daily_grid_purchase", "daily_grid_purchased", "daily_grid_import", "daily_energy_bought", "today_energy_import"],
    "export_today": ["daily_grid_feed_in", "daily_energy_sold", "daily_grid_export", "today_energy_export"],
    "forecast_rest": ["energy_production_today_remaining", "energy_production_remaining_today", "forecast_remaining_today"],
    "forecast_tomorrow": ["energy_production_tomorrow", "forecast_tomorrow"],
}


def lines(text: str | None) -> list[str]:
    return [x.strip() for x in str(text or "").replace("\r", "\n").split("\n") if x.strip()]


def _entity(text: str) -> bool:
    return "." in text and " " not in text and text.split(".", 1)[0].isidentifier()


def named(text: str | None) -> list[dict]:
    """"Parter = climate.x" -> [{"name": "Parter", "entity": "climate.x"}]; a bare entity id gets no name."""
    out = []
    for line in lines(text):
        parts = [p.strip() for p in line.split("=")]
        ent = next((p for p in parts if _entity(p)), None)
        if not ent:
            continue
        i = parts.index(ent)
        out.append({"name": parts[0] if i > 0 else "", "entity": ent, "extra": [p for p in parts[i + 1:] if p]})
    return out


def icon_for(name: str, entity: str) -> str:
    t = f"{name} {entity}".lower()
    for words, icon in ICONS:
        if any(w in t for w in words):
            return icon
    return "dev"


def equipment(text: str | None) -> list[dict]:
    """"Centrala = switch.baxi = alerta": an "alerta" (or "alert") part shows it in orange while it runs.
    "Rezistență = switch.rez = sensor.temp_acm = ACM": a sensor after the switch is shown on its row, with an
    optional label (any other word) before the value.
    "Centrala Baxi = switch.baxi = alerta = input_select.baxi_mod = input_text.baxi_motiv": a select gives the
    row a mode button (tap to change), an input_text shows the automation's reason under the name."""
    out = []
    for x in named(text):
        ents = [e for e in x["extra"] if _entity(e)]
        mode = next((e for e in ents if e.startswith(("input_select.", "select."))), "")
        reason = next((e for e in ents if e.startswith("input_text.")), "")
        value = next((e for e in ents if e not in (mode, reason)), "")
        words = [e for e in x["extra"] if not _entity(e) and not e.lower().startswith("alert")]
        out.append({"name": x["name"], "entity": x["entity"], "icon": icon_for(x["name"], x["entity"]),
                    "alert": any(e.lower().startswith("alert") for e in x["extra"]), "value": value,
                    "label": words[0] if words else "", "mode": mode, "reason": reason})
    return out


def thermostats(text: str | None) -> list[dict]:
    """"Magazin = climate.magazin = sensor.releu": a second entity tells when the zone asks for heat
    (on / off), for thermostats that do not report it themselves."""
    out = []
    for line in lines(text):
        ents = [p.strip() for p in line.split("=") if _entity(p.strip())]
        parts = [p.strip() for p in line.split("=")]
        if not ents:
            continue
        name = parts[0] if parts[0] != ents[0] else ""
        out.append({"name": name, "entity": ents[0], **({"heat": ents[1]} if len(ents) > 1 else {})})
    return out


WEEKDAY_WORDS = ("l-v", "lu-vi", "luni-vineri", "luni - vineri", "mon-fri", "weekdays", "lucratoare", "lucrătoare")
TOGGLE_DOMAINS = ("switch.", "input_boolean.", "binary_sensor.")
NUMBER_DOMAINS = ("number.", "input_number.", "sensor.")


def programs(text: str | None) -> list[dict]:
    """"Program 1 = L-V = switch.p1 = number.p1_start = number.p1_stop": a fixed heating program kept on
    a Shelly (virtual components): its on/off entity and its start and end, written as HHMM (545 = 05:45).
    "L-V" (or "luni-vineri") makes it a weekday program; anything else, or nothing, means every day."""
    out = []
    for line in lines(text):
        parts = [p.strip() for p in line.split("=")]
        toggle = next((p for p in parts if _entity(p) and p.startswith(TOGGLE_DOMAINS)), None)
        nums = [p for p in parts if _entity(p) and p.startswith(NUMBER_DOMAINS)]
        if not toggle or len(nums) < 2:
            continue
        words = [p.lower() for p in parts[1:] if p and not _entity(p)]
        out.append({"name": parts[0] if not _entity(parts[0]) else "", "enabled": toggle, "start": nums[0], "stop": nums[1],
                    "weekdays": any(w.replace(" ", "") in [x.replace(" ", "") for x in WEEKDAY_WORDS] for w in words)})
    return out


def simple(text: str | None) -> list[dict]:
    return [{"name": x["name"], "entity": x["entity"]} for x in named(text)]


def detect_deye(entity_ids: list[str]) -> dict:
    """Deye sensors by the end of their entity id (shortest match wins)."""
    sensors = sorted((e for e in entity_ids if e.startswith("sensor.")), key=len)
    out = {}
    for key, suffix in DEYE_SUFFIX.items():
        hit = next((e for e in sensors if e.endswith("_" + suffix) and "deye" in e), None) \
            or next((e for e in sensors if e.endswith("_" + suffix)), None)
        if hit:
            out[key] = hit
    return out


def contracts(text: str | None) -> list[dict]:
    """"Acasă = 8001234567" -> [{"name": "Acasă", "id": "8001234567"}]; a bare number is named after itself."""
    out = []
    for line in lines(str(text or "").replace(",", "\n")):
        parts = [p.strip() for p in line.split("=")]
        cid = next((p for p in parts if p.isdigit()), None)
        if cid:
            out.append({"name": parts[0] if parts[0] != cid else "", "id": cid})
    return out


def detect_today(entity_ids: list[str]) -> dict:
    sensors = sorted((e for e in entity_ids if e.startswith("sensor.")), key=len)
    out = {}
    for key, suffixes in TODAY_SUFFIX.items():
        for suffix in suffixes:
            hit = next((e for e in sensors if e.endswith("_" + suffix) or e == "sensor." + suffix), None)
            if hit:
                out[key] = hit
                break
    return out


def detect_car(entity_ids: list[str]) -> str:
    """The OverDrive device id (sensor.<id>_state_of_charge), e.g. overdrive_123456; '' when there is none."""
    hits = sorted(e[len("sensor."):-len("_state_of_charge")] for e in entity_ids
                  if e.startswith("sensor.overdrive") and e.endswith("_state_of_charge"))
    return hits[0] if hits else ""


def thermostat_text(states: list[tuple[str, str]]) -> str:
    """Default list: every climate entity with its friendly name."""
    return "\n".join(f"{name} = {eid}" if name else eid for eid, name in states if eid.startswith("climate."))


def panel_config(s: dict, image_default: str) -> dict:
    """The config the panel receives, from the entry's settings."""
    from .const import CONF_ALERT_PUFFER, CONF_ALERT_SOC, CONF_BATTERY_KWH, CONF_BATTERY_RESERVE, NUM_DEFAULTS, TODAY_KEYS  # noqa: PLC0415
    from .const import CONF_ACM, CONF_CAR, CONF_AC, CONF_CAR_NAME, CONF_LIGHTS, CONF_PROGRAMS  # noqa: PLC0415
    from .const import CONF_BATTERY_INVERT, CONF_DEMAND, CONF_DEVICES, CONF_EQUIPMENT, CONF_HIDRO, CONF_IMAGE, \
        CONF_MODE, CONF_MODE_REASON, CONF_PUFFER, CONF_THERMOSTATS, CONF_TITLE, CONF_WEATHER, ENERGY_KEYS  # noqa: PLC0415
    energy = {k: s.get(k) for k in ENERGY_KEYS if s.get(k)}
    energy["battery_invert"] = bool(s.get(CONF_BATTERY_INVERT))
    num = lambda k: float(s.get(k) if s.get(k) not in (None, "") else NUM_DEFAULTS[k])  # noqa: E731
    energy["battery_kwh"] = num(CONF_BATTERY_KWH)
    energy["battery_reserve"] = num(CONF_BATTERY_RESERVE)
    image = s.get(CONF_IMAGE)
    return {
        "title": s.get(CONF_TITLE) or "Acasă",
        "image": image_default if image is None else (image or ""),
        "weather": s.get(CONF_WEATHER) or "",
        "energy": energy,
        "thermostats": thermostats(s.get(CONF_THERMOSTATS)),
        "heating": {
            "mode": s.get(CONF_MODE) or "",
            "reason": s.get(CONF_MODE_REASON) or "",
            "puffer": s.get(CONF_PUFFER) or "",
            "acm": s.get(CONF_ACM) or "",
            "demand": s.get(CONF_DEMAND) or "",
            "equipment": equipment(s.get(CONF_EQUIPMENT)),
            "programs": programs(s.get(CONF_PROGRAMS)),
        },
        "hidro": contracts(s.get(CONF_HIDRO)),
        "devices": simple(s.get(CONF_DEVICES)),
        "lights": simple(s.get(CONF_LIGHTS)),
        "ac": simple(s.get(CONF_AC)),
        "car": {"prefix": str(s.get(CONF_CAR)).strip(), "name": s.get(CONF_CAR_NAME) or ""} if str(s.get(CONF_CAR) or "").strip() else {},
        "today": {k: s.get(k) for k in TODAY_KEYS if s.get(k)},
        "alerts": {"soc": num(CONF_ALERT_SOC), "puffer": num(CONF_ALERT_PUFFER)},
    }
