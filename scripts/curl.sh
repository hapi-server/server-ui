# Report data server issues to CONTACT

curl "SERVER/info?id=DATASET&parameters=PARAMETERS" > meta.json

curl "SERVER/data?id=DATASET&parameters=PARAMETERS&time.min=START&time.max=STOP" > data.csv
