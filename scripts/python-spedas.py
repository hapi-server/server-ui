# Report software bugs/issues/feature requests at
# https://github.com/spedas/pyspedas/issues
# Report data server issues to CONTACT

# Install latest pyspedas package from https://pypi.org/project/pyspedas/
# Only needs to be executed once.
# Version 1.3+ has HAPI server support.
import os; print(os.popen('pip install pyspedas --upgrade').read())

from pyspedas.hapi.hapi import hapi

server     = 'SERVER'
dataset    = 'DATASET'
# Notes:
# 1. Use parameters='' to request all parameters from DATASET.
# 2. Multiple parameters can be requested using a comma-separated
#    listCSV_EXAMPLE
parameters = 'PARAMETERS';
start      = 'START' # min STARTMIN
stop       = 'STOP' # max STOPMAX

param_list = hapi(trange=[start, stop], server=server, dataset=dataset, parameters=parameters)

print(os.popen('pip install pytplot --upgrade').read())
from pytplot import tplot
tplot(param_list)