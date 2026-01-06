import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SentimentStats } from '@/types/sentiment';

interface SentimentChartProps {
  stats: SentimentStats;
}

export function SentimentChart({ stats }: SentimentChartProps) {
  const data = [
    { name: 'Positif', value: stats.positif, color: 'hsl(142, 71%, 45%)' },
    { name: 'Negatif', value: stats.negatif, color: 'hsl(0, 72%, 51%)' },
    { name: 'Netral', value: stats.netral, color: 'hsl(220, 9%, 46%)' },
  ];

  const total = stats.total;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Distribusi Sentimen</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const percent = ((data.value / total) * 100).toFixed(1);
                    return (
                      <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-lg">
                        <p className="text-sm font-medium">{data.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.value.toLocaleString()} ({percent}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={40}
                content={({ payload }) => (
                  <div className="flex justify-center gap-6 pt-4">
                    {payload?.map((entry, index) => (
                      <div key={`legend-${index}`} className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm text-muted-foreground">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
