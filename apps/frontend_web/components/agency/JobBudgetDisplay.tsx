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
    if (typeof dailyRate !== 'number' || typeof durationDays !== 'number') {
      return <span className={className}>Daily rate unavailable</span>;
    }

    const rate = dailyRate;
    const days = durationDays;
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
