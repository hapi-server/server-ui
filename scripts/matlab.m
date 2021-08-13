% Report software bugs/issues/feature requests at
% https://github.com/hapi-server/client-matlab/issues
% Report data server issues to CONTACT

%% Set-up
% Download hapi.m if not found in path.
u = 'https://raw.githubusercontent.com/hapi-server/client-matlab/master';
if exist('hapi','file') ~= 2
    u = sprintf('%s/hapi.m',u);
    urlwrite(u,'hapi.m');
end
% Download hapi_plot.m if not found in path.
if exist('hapi','file') ~= 2
    u = sprintf('%s/hapi_plot.m',u);
    urlwrite(u,'hapi_plot.m');
end

%% Get data and metadata
server     = 'SERVER';
dataset    = 'DATASET'; % UNICODE_NOTE_DATASET
% Use parameters='' to request all data. Multiple parameters
% can be requested using a comma-separated listCSV_EXAMPLE
parameters = 'PARAMETERS'; % UNICODE_NOTE_PARAMETERS
start      = 'START';
stop       = 'STOP';
opts       = struct('logging',1);

[data,meta] = hapi(server,dataset,parameters,start,stop,opts);

%% Display data and metadata
data
meta
fprintf('meta.parameters = ');
meta.parameters{:}

%% Plot data
hapiplot(data,meta)