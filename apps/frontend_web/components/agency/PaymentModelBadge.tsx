import { Badge } from '@/components/ui/badge';

interface PaymentModelBadgeProps {
  paymentModel?: 'PROJECT' | 'DAILY';
  className?: string;
}

export function PaymentModelBadge({ paymentModel = 'PROJECT', className = '' }: PaymentModelBadgeProps) {
  if (paymentModel === 'DAILY') {
    return (
      <Badge className={`bg-blue-100 text-blue-800 font-medium ${className}`}>
        Daily Rate
      </Badge>
    );
  }

  return (
    <Badge className={`bg-[#00BAF1]/10 text-[#00BAF1] border-[#00BAF1]/20 font-medium ${className}`}>
      Project
    </Badge>
  );
}
