; Report software bugs/issues/feature requests at
; https://github.com/hapi-server/client-idl/issues
; Report data server issues to CONTACT

; First, install an IDL HAPI client - see
; https://github.com/hapi-server/client-idl

server     = 'SERVER';
dataset    = 'DATASET';

parameters = 'PARAMETERS';
# DATASET_NOTES
; start min = STARTMIN, stop max = STOPMAX
start      = 'START';
stop       = 'STOP';

d = hapi(server, dataset, parameters, start, stop);

help, d, /str

help, d.data, d.meta, d.info, /str