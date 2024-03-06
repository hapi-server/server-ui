# Report data server issues to CONTACT

# Use "...&parameters=" for all parameters
wget -O "meta.json" "SERVER/info?id=DATASET&parameters=PARAMETERS"

# min start = STARTMIN
# max stop = STOPMAX
wget -O "data.csv"  "SERVER/data?id=DATASET&parameters=PARAMETERS&time.min=START&time.max=STOP"
