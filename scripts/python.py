# Python 2.7 and 3 compatible
# Report software bugs/issues/feature requests at
# https://github.com/hapi-server/client-python/issues
# Report data server issues to CONTACT

# Install hapiclient package from https://pypi.org/project/hapiclient/
import os; print(os.popen('pip install hapiclient --upgrade').read())

from hapiclient import hapi, hapiplot

server     = 'SERVER';
dataset    = 'DATASET';
# Use parameters='' to request all data. Multiple parameters
# can be requested using a comma-separated listCSV_EXAMPLE
parameters = 'PARAMETERS'; 
start      = 'START';
stop       = 'STOP';

help(hapi)
data, meta = hapi(server, dataset, parameters, start, stop)
print(data)
print(meta)

hapiplot(data, meta)