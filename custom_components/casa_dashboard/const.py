"""Constants for Casa."""

DOMAIN = "casa_dashboard"
VERSION = "0.18.1"
PANEL_URL = "casa"
STATIC_URL = "/casa_static"
PANEL_ELEMENT = "casa-panel"
DEFAULT_IMAGE = f"{STATIC_URL}/casa.jpg"

# general
CONF_TITLE = "title"
CONF_IMAGE = "image"
CONF_WEATHER = "weather"
CONF_ADMIN_ONLY = "admin_only"
# energy (entity ids)
ENERGY_KEYS = ["pv", "pv1", "pv2", "load", "battery", "soc", "grid", "grid_v"]
CONF_BATTERY_INVERT = "battery_invert"
CONF_BATTERY_KWH = "battery_kwh"         # usable capacity; 0 = no time left / time to full
CONF_BATTERY_RESERVE = "battery_reserve" # % the inverter keeps (time left counts down to it)
# energy of today (kWh) and the solar forecast
TODAY_KEYS = ["pv_today", "load_today", "import_today", "export_today", "forecast_rest", "forecast_tomorrow"]
# alerts
CONF_ALERT_SOC = "alert_soc"
CONF_ALERT_PUFFER = "alert_puffer"
NUM_DEFAULTS = {CONF_BATTERY_KWH: 0, CONF_BATTERY_RESERVE: 10, CONF_ALERT_SOC: 20, CONF_ALERT_PUFFER: 35}
# heating
CONF_THERMOSTATS = "thermostats"     # "Name = climate.x", one per line
CONF_MODE = "mode"
CONF_MODE_REASON = "mode_reason"   # text entity with the last decision of the automation
CONF_PUFFER = "puffer"
CONF_ACM = "acm"                     # hot water tank temperature
CONF_DEMAND = "demand"
CONF_EQUIPMENT = "equipment"         # "Name = switch.x [= alerta]", one per line
CONF_PROGRAMS = "programs"           # "Name = L-V = switch.on = number.start = number.stop", one per line
# bill and devices
CONF_HIDRO = "hidro"                 # "Name = contract number", one per line
CONF_DEVICES = "devices"             # "Name = entity", one per line
CONF_LIGHTS = "lights"               # outdoor lights, "Name = switch", one per line
CONF_AC = "ac"                       # air conditioners, "Name = climate", one per line
CONF_CAR = "car"                     # OverDrive device id, e.g. overdrive_123456 (entities sensor.<id>_...)
CONF_CAR_NAME = "car_name"
