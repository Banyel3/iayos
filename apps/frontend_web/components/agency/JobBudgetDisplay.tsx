interface JobBudgetDisplayProps {
  budget?: number;
  paymentModel?: 'PROJECT' | 'DAILY';
  dailyRate?: number;
  durationDays?: number;
  className?: string;
}

export function JobBudgetDisplay({
  budget,
  paymentModel = 'PROJECT',
  dailyRate,
  durationDays,
  className = '',
}: JobBudgetDisplayProps) {
  if (paymentModel === 'DAILY') {
    const rate = dailyRate || 0;
    const days = durationDays || 0;
    return (
      <span className={className}>
        ₱{rate.toLocaleString()}/day × {days} day{days !== 1 ? 's' : ''}
      </span>
    );
  }

  return (
    <span className={className}>
      ₱{(budget || 0).toLocaleString()}
    </span>
  );
}
