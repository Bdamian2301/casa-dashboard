"""Config and options flow for Casa: four short steps, the same for setup and for Configure."""
from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import selector

from .const import (
    CONF_ADMIN_ONLY, CONF_AC, CONF_LIGHTS, CONF_BATTERY_INVERT, CONF_DEMAND, CONF_DEVICES, CONF_EQUIPMENT, CONF_HIDRO, CONF_IMAGE, CONF_PROGRAMS, CONF_ACM, CONF_CAR, CONF_CAR_NAME,
    CONF_MODE, CONF_MODE_REASON, CONF_PUFFER, CONF_THERMOSTATS, CONF_TITLE, CONF_WEATHER, DEFAULT_IMAGE, DOMAIN, ENERGY_KEYS,
    CONF_ALERT_PUFFER, CONF_ALERT_SOC, CONF_BATTERY_KWH, CONF_BATTERY_RESERVE, CONF_PRICE_EXPORT, CONF_PRICE_IMPORT, NUM_DEFAULTS, TODAY_KEYS,
)
from .parse import detect_car, detect_deye, detect_today, thermostat_text

TEXT = selector.TextSelector()
MULTI = selector.TextSelector(selector.TextSelectorConfig(multiline=True))
BOOL = selector.BooleanSelector()


def _num(maximum: float, step: float, unit: str) -> selector.NumberSelector:
    return selector.NumberSelector(selector.NumberSelectorConfig(min=0, max=maximum, step=step, mode="box", unit_of_measurement=unit))


def _ent(domain: str | list[str]) -> selector.EntitySelector:
    return selector.EntitySelector(selector.EntitySelectorConfig(domain=domain))


# step -> [(key, selector, required)]; optional fields keep the user's value or None when emptied
STEPS: dict[str, list[tuple[str, Any, bool]]] = {
    "general": [(CONF_TITLE, TEXT, True), (CONF_IMAGE, TEXT, False), (CONF_WEATHER, _ent("weather"), False),
                (CONF_ADMIN_ONLY, BOOL, True)],
    "energy": [(k, _ent("sensor"), False) for k in ENERGY_KEYS] + [
        (CONF_BATTERY_INVERT, BOOL, True), (CONF_BATTERY_KWH, _num(500, 0.1, "kWh"), True), (CONF_BATTERY_RESERVE, _num(100, 1, "%"), True)],
    "today": [(k, _ent("sensor"), False) for k in TODAY_KEYS] + [
        (CONF_PRICE_IMPORT, _num(10, 0.0001, "lei/kWh"), True), (CONF_PRICE_EXPORT, _num(10, 0.0001, "lei/kWh"), True)],
    "heating": [(CONF_THERMOSTATS, MULTI, False), (CONF_MODE, _ent(["input_select", "select", "sensor"]), False),
                (CONF_MODE_REASON, _ent(["input_text", "sensor"]), False),
                (CONF_PUFFER, _ent("sensor"), False), (CONF_ACM, _ent("sensor"), False), (CONF_DEMAND, _ent("sensor"), False), (CONF_EQUIPMENT, MULTI, False),
                (CONF_PROGRAMS, MULTI, False)],
    "extra": [(CONF_HIDRO, MULTI, False), (CONF_DEVICES, MULTI, False), (CONF_LIGHTS, MULTI, False), (CONF_AC, MULTI, False), (CONF_CAR, TEXT, False), (CONF_CAR_NAME, TEXT, False),
              (CONF_ALERT_SOC, _num(100, 1, "%"), True), (CONF_ALERT_PUFFER, _num(90, 1, "°C"), True)],
}
ORDER = list(STEPS)


def defaults(hass: HomeAssistant) -> dict:
    """First setup: what can be found on its own (Deye sensors, weather, every thermostat)."""
    reg = er.async_get(hass)
    ids = [e.entity_id for e in reg.entities.values() if e.disabled_by is None] + list(hass.states.async_entity_ids())
    ids = list(dict.fromkeys(ids))
    out: dict[str, Any] = {CONF_TITLE: "Acasă", CONF_IMAGE: DEFAULT_IMAGE, CONF_ADMIN_ONLY: False}
    out.update(detect_deye(ids))
    out.update(detect_today(ids))
    car = detect_car(ids)
    if car:
        out[CONF_CAR] = car
        out[CONF_CAR_NAME] = "Mașina"
    out.update(NUM_DEFAULTS)
    out[CONF_BATTERY_INVERT] = bool(out.get("battery") and "deye" in out["battery"])   # Deye: negative while charging
    if "input_text.pdc_motiv" in ids:                       # the PDC automation's last decision
        out[CONF_MODE_REASON] = "input_text.pdc_motiv"
    if "input_select.pdc_mod" in ids:
        out[CONF_MODE] = "input_select.pdc_mod"
    weather = sorted(e for e in ids if e.startswith("weather."))
    if weather:
        out[CONF_WEATHER] = "weather.home" if "weather.home" in weather else weather[0]
    out[CONF_THERMOSTATS] = thermostat_text(
        sorted((s.entity_id, s.attributes.get("friendly_name", "")) for s in hass.states.async_all("climate"))
    )
    return out


def schema(step: str, values: dict) -> vol.Schema:
    fields = {}
    for key, sel, required in STEPS[step]:
        val = values.get(key)
        if isinstance(sel, selector.NumberSelector):
            fields[vol.Required(key, default=float(val if val not in (None, "") else NUM_DEFAULTS.get(key, 0)))] = sel
        elif isinstance(sel, selector.BooleanSelector):
            fields[vol.Required(key, default=bool(val))] = sel
        elif required:
            fields[vol.Required(key, default=val or "")] = sel
        else:
            fields[vol.Optional(key, description={"suggested_value": val} if val not in (None, "") else {})] = sel
    return vol.Schema(fields)


def take(step: str, user_input: dict) -> dict:
    """Every field of the step: an emptied optional field is left out by the form, so it becomes ''."""
    return {key: user_input.get(key, "") for key, _, _ in STEPS[step]}


class _Steps:
    """The four steps, shared by the setup and the options flow."""

    _values: dict

    async def _step(self, step: str, user_input: dict | None) -> ConfigFlowResult:
        if user_input is not None:
            self._values.update(take(step, user_input))
            i = ORDER.index(step)
            if i + 1 < len(ORDER):
                return await getattr(self, f"async_step_{ORDER[i + 1]}")()
            return self._done()
        return self.async_show_form(step_id=step, data_schema=schema(step, self._values), last_step=step == ORDER[-1])

    async def async_step_general(self, user_input=None):
        return await self._step("general", user_input)

    async def async_step_energy(self, user_input=None):
        return await self._step("energy", user_input)

    async def async_step_heating(self, user_input=None):
        return await self._step("heating", user_input)

    async def async_step_today(self, user_input=None):
        return await self._step("today", user_input)

    async def async_step_extra(self, user_input=None):
        return await self._step("extra", user_input)


class CasaConfigFlow(_Steps, ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input: dict | None = None) -> ConfigFlowResult:
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
        self._values = defaults(self.hass)
        return await self.async_step_general()

    def _done(self) -> ConfigFlowResult:
        return self.async_create_entry(title=self._values.get(CONF_TITLE) or "Casa", data=self._values)

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return CasaOptionsFlow()


class CasaOptionsFlow(_Steps, OptionsFlow):
    async def async_step_init(self, user_input: dict | None = None) -> ConfigFlowResult:
        # settings added in a later version start from what can be found on their own
        found = defaults(self.hass)
        stored = {**self.config_entry.data, **self.config_entry.options}
        self._values = {**{k: v for k, v in found.items() if k not in stored}, **stored}
        return await self.async_step_general()

    def _done(self) -> ConfigFlowResult:
        return self.async_create_entry(data=self._values)
