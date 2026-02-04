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
            <p className="font-semibold text-lg">{durationDays} days</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Days Worked</p>
            <p className="font-semibold text-lg">{totalDaysWorked} days</p>
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
        </div>
      </CardContent>
    </Card>
  );
}
