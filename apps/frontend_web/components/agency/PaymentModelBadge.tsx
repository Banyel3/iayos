import { Badge } from '@/components/ui/badge';

interface PaymentModelBadgeProps {
  paymentModel?: 'PROJECT' | 'DAILY';
  className?: string;
}

export function PaymentModelBadge({ paymentModel = 'PROJECT', className = '' }: PaymentModelBadgeProps) {
  if (paymentModel === 'DAILY') {
    return (
      <Badge className={`bg-blue-100 text-blue-800 ${className}`}>
        📅 Daily Rate
      </Badge>
    );
  }

  return (
    <Badge className={`bg-purple-100 text-purple-800 ${className}`}>
      💼 Project
    </Badge>
  );
}
