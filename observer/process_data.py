import re
import pandas as pd
import matplotlib.pyplot as plt

LOG_FILE = "metrics.log"  
PATTERN = re.compile(r'(\d+)\s+(\w+)\{pid="(\d+)"\}\s+([\d\.]+)')

df = pd.DataFrame()

def read_metrics():
    records = []

    with open(LOG_FILE, "r+") as f:
        lines = f.readlines()  
        f.seek(0)
        f.truncate()

    for line in lines:
        m = PATTERN.match(line.strip())
        if not m:
            continue
        ts, metric, pid, val = m.groups()
        records.append({
            'timestamp': pd.to_datetime(int(ts), unit='s'),
            'metric':     metric,
            'pid':        int(pid),
            'value':      float(val),
        })

    return pd.DataFrame(records)


def aggregate(df: pd.DataFrame, metric_name: str) -> list[dict]:
    try:
        filtered = df[df['metric'] == metric_name]

        agg = (
            filtered
            .groupby('timestamp', as_index=False)['value']
            .sum()
        )

        records = []
        for row in agg.itertuples(index=False):
            ts_int = int(row.timestamp.timestamp())
            records.append({
                'timestamp': ts_int,
                'metric':    metric_name,
                'value':     float(row.value),
            })
        return records
    except KeyError:
        return []