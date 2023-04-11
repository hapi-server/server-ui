# Report hapiclient software bugs/issues/feature requests at
#   https://github.com/hapi-server/client-python/issues
# Report kamodo_ccmc software bugs/issues/feature requests at
#   https://nasa.github.io/Kamodo/issues
# Report data server issues to CONTACT

# Install latest hapiclient package from https://pypi.org/project/hapiclient/
# Only needs to be executed once.
import os; print(os.popen('pip install hapiclient --upgrade').read())

from hapiclient import hapi, hapitime2datetime

server     = 'SERVER'
dataset    = 'DATASET'
# Notes:
# 1. Use parameters='' to request all parameters from DATASET.
# 2. Multiple parameters can be requested using a comma-separated
#    listCSV_EXAMPLE
parameters = 'PARAMETERS'
start      = 'START' # min STARTMIN
stop       = 'STOP'  # max STOPMAX

data, meta = hapi(server, dataset, parameters, start, stop)

# To install kamodo-ccmc, see
#  https://nasa.github.io/Kamodo/notebooks/QuickStart.html
#
# Related examples: https://nasa.github.io/Kamodo/notebooks/FunctionalizeHAPI.html

from kamodo_ccmc.tools.functionalize_hapi import functionalize_hapi
kamodo_object = functionalize_hapi(data, meta)

# If run from notebook print, the LaTeX representation of all variables in data
kamodo_object

# Extract a list of parameter names
from kamodo_ccmc.tools.functionalize_hapi import varlist
var_list = varlist(meta) 

# Plot the first parameter. (Replace the var_list[0] with any parameter name
# in var_list. The colors and scales of the plot can easily be changed.
# See https://nasa.github.io/Kamodo/notebooks/FunctionalizeHAPI.html
kamodo_object.plot(var_list[0])

# To interpolate between time values, create one or more POSIX timestamps
# and imitate the syntax on the last line below. The variable sample_timestamp
# can be one timestamp or an array of timestamps, but the times must be between
# the start and stop times from above or NaNs will be returned.
from numpy import mean
start_ts = hapitime2datetime(start)[0].timestamp() # convert to POSIX timestamp
stop_ts = hapitime2datetime(stop)[0].timestamp()

# Use mean of start_ts and stop_ts as interpolation timestamp.
sample_timestamp = mean([start_ts, stop_ts])
kamodo_object[var_list[0]](UTC_time=sample_timestamp)  # interpolate
# Users can also define their own custom interpolation methods.
