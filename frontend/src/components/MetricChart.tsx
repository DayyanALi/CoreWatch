import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SeriesBuffer } from '@/hooks/useWebSocket';

interface MetricChartProps {
  data: SeriesBuffer;
  title: string;
  color: string;
  className?: string;
}

const formatTime = (time: Date): string => {
  return time.toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatValue = (value: number): string => {
  return `${value.toFixed(1)} KiB`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const time = new Date(label);
    const value = payload[0].value;
    
    return (
      <div className="bg-metrics-tooltip border border-border rounded-md p-3 shadow-lg">
        <p className="text-foreground font-medium">{formatTime(time)}</p>
        <p className="text-sm" style={{ color: payload[0].color }}>
          {formatValue(value)}
        </p>
      </div>
    );
  }
  return null;
};

const formatXAxisTick = (time: any): string => {
  const date = new Date(time);
  return date.toLocaleTimeString('en-US', { 
    hour12: false,
    minute: '2-digit',
    second: '2-digit'
  });
};

// export function MetricChart({ data, title, color, className = "" }: MetricChartProps) {
//   // Transform data for recharts
//   const chartData = data.map(point => ({
//     time: point.time.getTime(),
//     value: point.value,
//     formattedTime: formatTime(point.time)
//   }));

//   return (
//     <div className={`space-y-3 ${className}`}>
//       <h3 className="text-lg font-semibold text-foreground">{title}</h3>
//       <div className="h-64 w-full">
//         <ResponsiveContainer width="100%" height="100%">
//           <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
//             <CartesianGrid 
//               strokeDasharray="3 3" 
//               stroke="hsl(var(--metrics-grid))"
//               opacity={0.3}
//             />
//             <XAxis 
//               dataKey="time"
//               type="number"
//               scale="time"
//               domain={['dataMin', 'dataMax']}
//               tickFormatter={formatXAxisTick}
//               tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
//               axisLine={{ stroke: 'hsl(var(--border))' }}
//               tickLine={{ stroke: 'hsl(var(--border))' }}
//             />
//             <YAxis 
//               domain={[0, 'dataMax']}
//               tickFormatter={(value) => `${value.toFixed(0)}`}
//               tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
//               axisLine={{ stroke: 'hsl(var(--border))' }}
//               tickLine={{ stroke: 'hsl(var(--border))' }}
//               label={{ 
//                 value: 'KiB/s', 
//                 angle: -90, 
//                 position: 'insideLeft',
//                 style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' }
//               }}
//             />
//             <Tooltip content={<CustomTooltip />} />
//             <Line 
//               type="monotone" 
//               dataKey="value" 
//               stroke={color}
//               strokeWidth={2}
//               dot={false}
//               activeDot={{ 
//                 r: 4, 
//                 fill: color,
//                 stroke: 'hsl(var(--background))',
//                 strokeWidth: 2
//               }}
//               connectNulls={false}
//             />
//           </LineChart>
//         </ResponsiveContainer>
//       </div>
//     </div>
//   );
// }


// export function MetricChart({ data, title, color }: MetricChartProps) {
//   const now = Date.now();
//   const windowStart = now - 60_000;

//   const chartData = data.map(pt => ({
//     time: pt.time.getTime(),
//     value: pt.value
//   }));

//   return (
//     <div className="h-64 w-full">
//       <ResponsiveContainer>
//         <LineChart data={chartData}>
//           <CartesianGrid strokeDasharray="3 3" />
//           <XAxis 
//             dataKey="time"
//             type="number"
//             scale="time"
//             domain={[windowStart, now]}
//             tickFormatter={formatXAxisTick}
//             tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
//             axisLine={false}
//             tickLine={false}
//           />
//           <YAxis 
//             domain={[0, 'dataMax']}
//             tickFormatter={(value) => `${value.toFixed(0)}`}
//             tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
//             // axisLine={{ stroke: 'hsl(var(--border))' }}
//             // tickLine={{ stroke: 'hsl(var(--border))' }}
//             label={{ 
//               value: 'KiB/s', 
//               angle: -90, 
//               position: 'insideLeft',
//               style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' }
//             }}
//             axisLine={false}
//             tickLine={false}
//           />
//           <Tooltip content={<CustomTooltip />} />
//           <Line
//             type="monotone"
//             dataKey="value"
//             stroke={color}
//             strokeWidth={2}
//             dot={false}
//             isAnimationActive={true}
//             animationDuration={500}
//             connectNulls={false}
//           />
//         </LineChart>
//       </ResponsiveContainer>
//     </div>
//   );
// }


// export function MetricChart({ data, title, color }: MetricChartProps) {
//   const nowMs = Date.now();

//   const chartData = data.map(pt => {
//     const deltaMs = nowMs - pt.time.getTime();
//     const secondsAgo = Math.min(Math.max(deltaMs / 1000, 0), 60);
//     return { secondsAgo, value: pt.value };
//   });

//   return (
//     <div className="h-64 w-full">
//       <h3 className="text-lg font-semibold">{title}</h3>
//       <ResponsiveContainer>
//         <LineChart data={chartData}>
//           <CartesianGrid strokeDasharray="3 3" vertical={false} />
//           <XAxis
//             dataKey="secondsAgo"
//             type="number"
//             domain={[60, 0]}
//             allowDataOverflow={true} 
//             tickFormatter={(s) => `${s.toFixed(0)}s`}
//             tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
//             axisLine={false}
//             tickLine={false}
//           />
//           <YAxis
//             domain={[0, 'dataMax']}
//             tickFormatter={(v) => `${v.toFixed(0)}`}
//             tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
//             axisLine={false}
//             tickLine={false}
//             label={{
//               value: 'KiB/s',
//               angle: -90,
//               position: 'insideLeft',
//               style: { textAnchor: 'middle' }
//             }}
//           />
//           <Tooltip
//             labelFormatter={(sAgo) => `${sAgo.toFixed(0)}s ago`}
//             formatter={(value) => [`${value.toFixed(1)} KiB`, title]}
//           />
//           <Line
//             dataKey="value"
//             stroke={color}
//             strokeWidth={2}
//             dot={false}
//             isAnimationActive={true}
//             animationDuration={500}
//           />
//         </LineChart>
//       </ResponsiveContainer>
//     </div>
//   );
// }






export function MetricChart({ data, title, color }: MetricChartProps) {
  const nowMs = Date.now();

  // 1) Build a base array: one point per second, 60 → 0, all zeroed out
  const baseData = Array.from({ length: 61 }, (_, idx) => ({
    secondsAgo: 60 - idx,
    value:      0 as number,
  }));

  // 2) Overlay your actual data onto that base
  //    We map each incoming pt into secondsAgo and then assign value into a Map
  const overlay = new Map<number, number>();
  data.forEach(pt => {
    const deltaMs = nowMs - pt.time.getTime();
    const secAgo  = Math.floor(Math.min(Math.max(deltaMs / 1000, 0), 60));
    overlay.set(secAgo, pt.value);
  });

  // 3) Merge: if overlay has a real value for this second, use it
  const chartData = baseData.map(d => ({
    secondsAgo: d.secondsAgo,
    value:      overlay.has(d.secondsAgo) ? overlay.get(d.secondsAgo)! : 0,
  }));

  return (
    <div className="h-64 w-full">
      <h3 className="text-lg font-semibold">{title}</h3>
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="secondsAgo"
            type="number"
            domain={[60, 0]}
            allowDataOverflow
            tickFormatter={s => `${s}s`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            // domain={[0, 'dataMax']} 
            // axisLine={false} 
            // tickLine={false}
            domain={[0, 'dataMax']}
            tickFormatter={(v) => `${v.toFixed(0)}`}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            label={{
              value: 'KiB/s',
              angle: -90,
              position: 'insideLeft',
              style: { textAnchor: 'middle' }
            }}
             />
          <Tooltip
            labelFormatter={s => `${s}s ago`}
            formatter={v => `${v} KiB`}
          />
          <Line
            dataKey="value"
            stroke={color}
            dot={false}
            isAnimationActive
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
