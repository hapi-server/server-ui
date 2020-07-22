; Report software bugs/issues/feature requests at
; https://github.com/hapi-server/client-matlab/issues
; Report data server issues to CONTACT

server     = 'SERVER';
dataset    = 'DATASET';
parameters = PARAMETERS;
; Use parameters=[''] to request all data. Multiple parameters
; can be requested using a comma-separated listCSV_EXAMPLE
start      = 'START';
stop       = 'STOP';

d = hapi(server, dataset, parameters, start, stop);

help, d, /str

help, d.data, d.meta, d.info, /str