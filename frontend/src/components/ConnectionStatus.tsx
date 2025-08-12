import { Badge } from '@/components/ui/badge';

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const statusConfig = {
  connecting: { 
    label: 'Connecting...', 
    variant: 'secondary' as const,
    className: 'animate-pulse'
  },
  connected: { 
    label: 'Connected', 
    variant: 'default' as const,
    className: 'bg-green-600 hover:bg-green-600'
  },
  disconnected: { 
    label: 'Disconnected', 
    variant: 'secondary' as const,
    className: 'bg-yellow-600 hover:bg-yellow-600'
  },
  error: { 
    label: 'Error', 
    variant: 'destructive' as const,
    className: ''
  }
};

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className} text-white font-medium`}
    >
      {config.label}
    </Badge>
  );
}