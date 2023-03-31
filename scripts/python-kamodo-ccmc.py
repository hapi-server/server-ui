# -*- coding: utf-8 -*-
"""
Created on Thu Mar 30 19:22:55 2023

@author: rringuet
"""

# Python 2.7 and 3 compatible
# Report software bugs/issues/feature requests at
# https://github.com/hapi-server/client-python/issues
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

# See note below to install kamodo-ccmc. kamodo-ccmc requires Python 3.
# The commands below assume the user is in a notebook. Interpolation with
# Kamodo works fine in an interactive Python environment, but the kamodo_object
# and the plots generated below may not display properly unless in a notebook.
from kamodo_ccmc.tools.functionalize_hapi import functionalize_hapi
kamodo_object = functionalize_hapi(data, meta)
kamodo_object  # prints the LaTeX representation of all variables in data

# To plot a variable, retrieve the list of variables names, then plot the first
# variable in the list. You can replace the var_list[0] with any variable name
# from parameters. The colors and scales of the plot can easily be changed.
# See link below.
from kamodo_ccmc.tools.functionalize_hapi import varlist
var_list = varlist(meta)  # retrieve the variable list
kamodo_object.plot(var_list[0])  # plot the first variable

# To interpolate between time values, create one or more utc timestamps
# and imitate the syntax on the last line below. The variable sample_datetime
# can be one timestamp or an array of timestamps, but the times must be between
# the start and stop times from above or NaNs will be returned.
from numpy import mean
start_ts = hapitime2datetime(start)[0].timestamp()  # convert to UTC timestamp
stop_ts = hapitime2datetime(stop)[0].timestamp()
sample_datetime = mean([start_ts, stop_ts])  # pick the mean as an example
kamodo_object[var_list[0]](UTC_time=sample_datetime)  # interpolate
# Users can also define their own custom interpolation methods.

# For more details on what is possible with this function in kamodo-ccmc,
# please visit https://nasa.github.io/Kamodo/notebooks/FunctionalizeHAPI.html

# To install kamodo-ccmc, follow the instructions at 
# https://nasa.github.io/Kamodo/notebooks/QuickStart.html
# If you encounter problems, please contact either Darren De Zeeuw
# https://ccmc.gsfc.nasa.gov/staff/darren-de-zeeuw/
# or Lutz Rastaetter
# https://ccmc.gsfc.nasa.gov/staff/lutz-rastaetter/
