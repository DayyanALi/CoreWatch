interface MetricStatProps {
  label: string;
  currentRate: number;
  total: number;
  unit?: string;
  totalUnit?: string;
}

const formatBytes = (bytes: number): { value: number; unit: string } => {
  const units = ['bytes', 'KiB', 'MiB', 'GiB', 'TiB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return { value, unit: units[unitIndex] };
};

export function MetricStat({ 
  label, 
  currentRate, 
  total, 
  unit = "KiB/s",
  totalUnit 
}: MetricStatProps) {
  const formattedTotal = formatBytes(total);
  const displayTotalUnit = totalUnit || formattedTotal.unit;

  return (
    <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border/50">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">
          {currentRate.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
        </p>
      </div>
      <div className="text-right space-y-1">
        <p className="text-sm text-muted-foreground">Total</p>
        <p className="text-lg font-semibold text-foreground">
          {formattedTotal.value.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">{displayTotalUnit}</span>
        </p>
      </div>
    </div>
  );
}