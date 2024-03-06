# Report data server issues to CONTACT

# Use "...&parameters=" for all parameters
curl "SERVER/info?id=DATASET&parameters=PARAMETERS" > meta.json

# min start = STARTMIN
# max stop = STOPMAX
curl "SERVER/data?id=DATASET&parameters=PARAMETERS&time.min=START&time.max=STOP" > data.csv
