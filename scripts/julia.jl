# Report Julia software bugs/issues/feature requests at
# https://github.com/JuliaSpacePhysics/HAPIClient.jl/issues
# See https://juliaspacephysics.github.io/HAPIClient.jl for documentation.
# Report data server issues to CONTACT

# Pkg.add("HAPIClient") only needs to be executed once. Can remove after execution.
using Pkg
if !("HAPIClient" in [ p.name for p in values(Pkg.dependencies()) ])
  Pkg.add("HAPIClient")
end

using HAPIClient

server     = 'SERVER'
dataset    = 'DATASET'
# Notes:
# 1. Use parameters='' to request all parameters from DATASET.
# 2. Multiple parameters can be requested using a comma-separated
#    listCSV_EXAMPLE
parameters = 'PARAMETERS'
start      = 'START' # min STARTMIN
stop       = 'STOP' # max STOPMAX

data = hapi(server, dataset, parameters, start, stop)

print(data)
