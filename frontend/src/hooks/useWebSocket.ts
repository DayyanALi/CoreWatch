import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useState } from 'react';

const WINDOW_MS = 60 * 1000;  // 60 seconds
export interface MetricMessage {
  timestamp: number;
  metric: 'bytes_sent' | 'bytes_recv' | 'bytes_written' | 'bytes_read';
  pid: number;
  value: number;
}

export interface MetricPoint {
  time: Date;
  value: number;
}

export type SeriesBuffer = MetricPoint[];

interface UseWebSocketReturn {
  bytesSentBuffer: SeriesBuffer;
  bytesRecvBuffer: SeriesBuffer;
  bytesWriteBuffer: SeriesBuffer;
  bytesReadBuffer: SeriesBuffer;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  totalBytesSent: number;
  totalBytesRecv: number;
  totalBytesWritten: number;
  totalBytesRead: number;
  currentSendRate: number;
  currentRecvRate: number;
  currentWriteRate: number;
  currentReadRate: number;
}

const BUFFER_SIZE = 60;
const DEFAULT_HOST = 'localhost';

export function useWebSocket(host: string = DEFAULT_HOST): UseWebSocketReturn {
  const [buffers, setBuffers] = useState({
    bytesSentBuffer: [] as SeriesBuffer,
    bytesRecvBuffer: [] as SeriesBuffer,
    bytesWriteBuffer: [] as SeriesBuffer,
    bytesReadBuffer: [] as SeriesBuffer,
  });

  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  const [totals, setTotals] = useState({
    totalBytesSent: 0,
    totalBytesRecv: 0,
    totalBytesWritten: 0,
    totalBytesRead: 0,
  });

  const [currentRates, setCurrentRates] = useState({
    currentSendRate: 0,
    currentRecvRate: 0,
    currentWriteRate: 0,
    currentReadRate: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addToBuffer = (metric: string, timestamp: number, valueInBytes: number) => {
    const nowMs = Date.now();
    const time = new Date(timestamp * 1000);
    const valueInKiB = valueInBytes / 1024;
    const point: MetricPoint = { time, value: valueInKiB };

    setBuffers(prev => {
      // pick the right buffer and append the new point
      let updated: SeriesBuffer;
      switch (metric) {
        case 'bytes_sent':
          updated = [...prev.bytesSentBuffer, point];
          return {
            ...prev,
            bytesSentBuffer: updated.filter(p => nowMs - p.time.getTime() <= WINDOW_MS),
          };
        case 'bytes_recv':
          updated = [...prev.bytesRecvBuffer, point];
          return {
            ...prev,
            bytesRecvBuffer: updated.filter(p => nowMs - p.time.getTime() <= WINDOW_MS),
          };
        case 'bytes_written':
          updated = [...prev.bytesWriteBuffer, point];
          return {
            ...prev,
            bytesWriteBuffer: updated.filter(p => nowMs - p.time.getTime() <= WINDOW_MS),
          };
        case 'bytes_read':
          updated = [...prev.bytesReadBuffer, point];
          return {
            ...prev,
            bytesReadBuffer: updated.filter(p => nowMs - p.time.getTime() <= WINDOW_MS),
          };
        default:
          return prev;
      }
   });

    //   return newBuffers;
    // });

    // Update totals
    setTotals(prev => ({
      ...prev,
      [`total${metric.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join('').replace('Recv', 'Recv')}`]: 
        prev[`total${metric.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join('').replace('Recv', 'Recv')}` as keyof typeof prev] + valueInBytes
    }));

    // Update current rates
    setCurrentRates(prev => {
      // pick the right buffer out of state
      const buf: SeriesBuffer = metric === 'bytes_sent'
        ? buffers.bytesSentBuffer
        : buffers.bytesRecvBuffer;
    
      // Option A: average over the last 60 s (divide by 60s)
      const sumKi = buf.reduce((acc, pt) => acc + pt.value, 0);
      const rateKiPerSec = sumKi / 60;   // KiB/s averaged over last 60s
    
      // Option B: average per “point” if you trust 1-point == 1-second spacing:
      // const rateKiPerSec = buf.length
      //   ? buf.reduce((acc, pt) => acc + pt.value, 0) / buf.length
      //   : 0;
    
      const field = metric === 'bytes_sent'
        ? 'currentSendRate'
        : 'currentRecvRate';
    
      return {
        ...prev,
        [field]: rateKiPerSec,
      };
    });
    
  };

  let socket: Socket | null = null;

  const connect = () => {
    if (socket && socket.connected) return;

    setConnectionStatus("connecting");
    console.log(`conneciting http://${host}:5000`)
    try {
      // initialize / re-use the socket
      socket = io(`http://${host}:5000`, {
        transports: ["websocket"],    // force WebSocket (optional)
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
      });

      socket.on("connect", () => {
        setConnectionStatus("connected");
        console.log("Socket.IO connected:", socket!.id);
      });

      // socket.on("metrics", (msg: MetricMessage) => {
      socket.on("metrics", (msg: Array<{timestamp:number,metric:string,value:number}>) => {
        msg.forEach((message) => {
          // console.log(message.timestamp, message.metric, message.value);
          addToBuffer(message.metric, message.timestamp, message.value);
        });
        // addToBuffer(msg.metric, msg.timestamp, msg.value);
      });

      socket.on("disconnect", (reason: string) => {
        setConnectionStatus("disconnected");
        console.log("Socket.IO disconnected:", reason);
      });

      socket.on("connect_error", (err: Error) => {
        setConnectionStatus("error");
        console.error("Socket.IO connection error:", err);
      });
    } catch (error) {
      setConnectionStatus("error");
      console.error("Failed to initialize Socket.IO client:", error);
    }
  };

    
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [host]);

  return {
    ...buffers,
    connectionStatus,
    ...totals,
    ...currentRates,
  };
}