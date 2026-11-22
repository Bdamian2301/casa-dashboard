"""Casa: a home dashboard panel (energy, heating, thermostats, bills, devices)."""
from __future__ import annotations

from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
import homeassistant.helpers.config_validation as cv

from .const import CONF_ADMIN_ONLY, DEFAULT_IMAGE, DOMAIN, PANEL_ELEMENT, PANEL_URL, STATIC_URL, VERSION
from .parse import panel_config

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


def settings(entry: ConfigEntry) -> dict:
    """Settings from the entry, options winning over the first setup."""
    return {**entry.data, **entry.options}


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    if not hass.data.get(f"{DOMAIN}_static"):
        await hass.http.async_register_static_paths(
            [StaticPathConfig(STATIC_URL, str(Path(__file__).parent / "frontend"), cache_headers=True)]
        )
        hass.data[f"{DOMAIN}_static"] = True
    s = settings(entry)
    cfg = panel_config(s, DEFAULT_IMAGE)
    # the script is served with cache headers: a changed file must get a new URL
    js = Path(__file__).parent / "frontend" / "casa-panel.js"
    stamp = int(await hass.async_add_executor_job(lambda: js.stat().st_mtime))
    if PANEL_URL in hass.data.get("frontend_panels", {}):
        frontend.async_remove_panel(hass, PANEL_URL)
    url = f"{STATIC_URL}/casa-panel.js?v={VERSION}-{stamp}"
    # the same script on every page, so the Lovelace card custom:casa-card works in any dashboard
    if hass.data.get(f"{DOMAIN}_js") != url:
        if hass.data.get(f"{DOMAIN}_js"):
            frontend.remove_extra_js_url(hass, hass.data[f"{DOMAIN}_js"])
        frontend.add_extra_js_url(hass, url)
        hass.data[f"{DOMAIN}_js"] = url
    await panel_custom.async_register_panel(
        hass,
        webcomponent_name=PANEL_ELEMENT,
        frontend_url_path=PANEL_URL,
        module_url=url,
        sidebar_title=cfg["title"],
        sidebar_icon="mdi:home-variant",
        require_admin=bool(s.get(CONF_ADMIN_ONLY, False)),
        embed_iframe=False,
        config=cfg,
    )
    entry.async_on_unload(entry.add_update_listener(_reload))
    return True


async def _reload(hass: HomeAssistant, entry: ConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    frontend.async_remove_panel(hass, PANEL_URL)
    return True
