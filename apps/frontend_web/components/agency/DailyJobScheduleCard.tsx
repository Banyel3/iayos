import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DailyJobScheduleCardProps {
  dailyRate?: number;
  durationDays?: number;
  totalDaysWorked?: number;
  dailyEscrowTotal?: number;
  actualStartDate?: string;
}

export function DailyJobScheduleCard({
  dailyRate = 0,
  durationDays = 0,
  totalDaysWorked = 0,
  dailyEscrowTotal = 0,
  actualStartDate,
}: DailyJobScheduleCardProps) {
  const clampedDuration = Math.max(durationDays || 0, 0);
  const clampedWorked = Math.max(totalDaysWorked || 0, 0);

  const computedEndDate = (() => {
    if (!actualStartDate || clampedDuration <= 0) return null;
    const start = new Date(actualStartDate);
    if (Number.isNaN(start.getTime())) return null;
    const end = new Date(start);
    end.setDate(start.getDate() + clampedDuration - 1);
    return end;
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Daily Rate Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Daily Rate</p>
            <p className="font-semibold text-lg">₱{dailyRate.toLocaleString()}/day</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Expected Duration</p>
            <p className="font-semibold text-lg">{clampedDuration} days</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Days Worked</p>
            <p className="font-semibold text-lg">{clampedWorked} days</p>
            {clampedDuration > 0 && (
              <p className="text-xs text-gray-500">
                Day {Math.min(clampedWorked + 1, clampedDuration)} of {clampedDuration}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Escrowed</p>
            <p className="font-semibold text-lg">₱{dailyEscrowTotal.toLocaleString()}</p>
          </div>
          {actualStartDate && (
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Started On</p>
              <p className="font-semibold">{new Date(actualStartDate).toLocaleDateString()}</p>
            </div>
          )}
          {computedEndDate && (
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Expected End Date</p>
              <p className="font-semibold">{computedEndDate.toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
