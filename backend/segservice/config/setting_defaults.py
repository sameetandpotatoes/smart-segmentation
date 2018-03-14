# Override settings in this file by creating a "local_config.py" file in the
# same directory as this file.  If the settings from this file are desired for
# computation of the local values, use the following line in "local_config.py":
#
#     from segservice.config.setting_defaults import *

# See http://flask.pocoo.org/docs/0.12/config/#builtin-configuration-values
# for Flask configuration values.

# This names the default log location
LOGFILE = '/var/log/segservice/service.log'

# This may be set to a dict for an incremental logging configuration
# adjustment as documented for logging.config.configDict.  It is not necessary
# to provide the `"incremental": True` entry; that entry will be enforced by
# the application.
LOGGING_ADJUSTMENTS = None

# This setting must be a string name of a timezone recognized by pytz
TIMEZONE = 'UTC'