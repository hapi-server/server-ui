# Python 2.7 and 3 compatible
# Report software bugs/issues/feature requests at
# https://github.com/hapi-server/client-python/issues
# Report data server issues to CONTACT

# Install latest hapiclient package from https://pypi.org/project/hapiclient/
# Only needs to be executed once.
import os; print(os.popen('pip install hapiclient --upgrade').read())

from hapiclient import hapi, hapiplot

server     = 'SERVER';
dataset    = 'DATASET';
# Notes:
# 1. Use parameters='' to request all parameters from DATASET.
# 2. Multiple parameters can be requested using a comma-separated
#    listCSV_EXAMPLE
parameters = 'PARAMETERS'; 
start      = 'START';
stop       = 'STOP';

data, meta = hapi(server, dataset, parameters, start, stop)

hapiplot(data, meta)

# Notes:
# 1. To convert the ISO 8601 strings in data['TIMENAME'] to Python
#    datetimes, use
#      from hapiclient import hapitime2datetime
#      Time = hapitime2datetime(data['TIMENAME'])
# 2. Details about the data and metadata structures `data`
#    and `meta` are given at 
#    https://github.com/hapi-server/client-python-notebooks/blob/master/hapi_demo.ipynb
# 3. Many examples for using `data` and `meta` with other
#    Python libraries (e.g., Pandas, Numpy, Astropy) are given
#    in above-referenced notebook.