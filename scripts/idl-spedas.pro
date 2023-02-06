; Report software bugs/issues/feature requests at
; https://github.com/spedas/bleeding_edge/issues
; Report data server issues to CONTACT

; To install IDL SPEDAS, download it from:
; http://themis.ssl.berkeley.edu/socware/bleeding_edge/spdsw_latest.zip
; (or an earlier version from spedas.org)
; then unzip and add to your paths.

server     = 'SERVER';
dataset    = 'DATASET';
parameters = 'PARAMETERS';
; Use parameters=[''] to request all data. Multiple parameters
; can be requested using a comma-separated listCSV_EXAMPLE
start      = 'START';  min STARTMIN
stop       = 'STOP'; max STOPMAX

hapi_load_data, trange=[start, end], dataset=‘dataset name’, server=’server name’, parameters=‘parameter’

;d = hapi(server, dataset, parameters, start, stop);

;help, d, /str

;help, d.data, d.meta, d.info, /str