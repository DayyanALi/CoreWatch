import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MetricChart } from './MetricChart';
import { MetricStat } from './MetricStat';
import { ConnectionStatus } from './ConnectionStatus';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Settings, Activity } from 'lucide-react';

export function MetricsDashboard() {
  const [host, setHost] = useState('localhost');
  const [inputHost, setInputHost] = useState('localhost');
  
  const {
    bytesSentBuffer,
    bytesRecvBuffer,
    bytesWriteBuffer,
    bytesReadBuffer,
    connectionStatus,
    totalBytesSent,
    totalBytesRecv,
    totalBytesWritten,
    totalBytesRead,
    currentSendRate,
    currentRecvRate,
    currentWriteRate,
    currentReadRate,
  } = useWebSocket(host);

  const handleHostChange = () => {
    setHost(inputHost);
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">System Metrics Dashboard</h1>
        </div>
        <ConnectionStatus status={connectionStatus} />
      </div>

      {/* Host Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Connection Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 max-w-md">
            <div className="flex-1">
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                value={inputHost}
                onChange={(e) => setInputHost(e.target.value)}
                placeholder="localhost"
                className="mt-1"
              />
            </div>
            <Button onClick={handleHostChange} disabled={connectionStatus === 'connecting'}>
              Connect
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            WebSocket endpoint: ws://{host}:8000/ws/metrics
          </p>
        </CardContent>
      </Card>

      {/* Network Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Network Traffic</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bytes Received */}
            <div className="space-y-4">
              <MetricChart
                data={bytesRecvBuffer}
                title="Bytes Received"
                color="hsl(var(--metrics-receive))"
              />
              <MetricStat
                label="Receiving"
                currentRate={currentRecvRate}
                total={totalBytesRecv}
              />
            </div>

            {/* Bytes Sent */}
            <div className="space-y-4">
              <MetricChart
                data={bytesSentBuffer}
                title="Bytes Sent"
                color="hsl(var(--metrics-send))"
              />
              <MetricStat
                label="Sending"
                currentRate={currentSendRate}
                total={totalBytesSent}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disk I/O Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Disk I/O</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bytes Read */}
            <div className="space-y-4">
              <MetricChart
                data={bytesReadBuffer}
                title="Bytes Read"
                color="hsl(var(--metrics-receive))"
              />
              <MetricStat
                label="Reading"
                currentRate={currentReadRate}
                total={totalBytesRead}
              />
            </div>

            {/* Bytes Written */}
            <div className="space-y-4">
              <MetricChart
                data={bytesWriteBuffer}
                title="Bytes Written"
                color="hsl(var(--metrics-send))"
              />
              <MetricStat
                label="Writing"
                currentRate={currentWriteRate}
                total={totalBytesWritten}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-muted-foreground text-sm">
        Live metrics • Shows last 60 seconds • Updates every second
      </div>
    </div>
  );
}