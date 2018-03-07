#!/usr/bin/env python3

import logging
from segservice import app

logger = logging.getLogger('segservice')
console_log_printer = logging.StreamHandler()

try:
    import colorlog
except ImportError:
    pass
else:
    class OutputFormatter(colorlog.ColoredFormatter):
        def format(self, record):
            """Override to reset colorization after first line"""
            result = super().format(record)
            
            try:
                second_line = result.index('\n') + 1
            except ValueError:
                pass
            else:
                result = result[:second_line] + \
                    colorlog.escape_codes['reset'] + result[second_line:]
            
            return result
    
    log_colors = dict(
        colorlog.default_log_colors,
        DEBUG='cyan',
        ERROR='bold_red',
        CRITICAL='bold_red,bg_white',
    )
    rainbow_formatter = OutputFormatter(
        "%(log_color)s%(levelname)-8s%(reset)s %(message_log_color)s%(message)s",
        reset=True,
        log_colors=log_colors,
        secondary_log_colors=dict(
            message={
                'DEBUG': 'reset',
                'WARNING': log_colors['WARNING'],
                'ERROR': 'bold_white',
                'CRITICAL': log_colors['CRITICAL'],
            }
        )
    )
    console_log_printer.setFormatter(rainbow_formatter)

logger.addHandler(console_log_printer)
logger.setLevel(logging.DEBUG)

logging.getLogger('segservice').debug('Logging "segservice" at DEBUG level...')
app.run(host='0.0.0.0', debug=True)
