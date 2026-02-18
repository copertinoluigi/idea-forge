import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

export default function ExpenseTracker({ subs }: { subs: any[] }) {
  const total = subs.reduce((acc, sub) => acc + Number(sub.cost), 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Monthly Burn</CardTitle>
        <span className="text-2xl font-bold">{formatCurrency(total)}</span>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mt-2">
          {subs.slice(0, 3).map((sub) => (
            <div key={sub.id} className="flex justify-between text-sm">
              <span>{sub.title}</span>
              <span className="font-mono">{formatCurrency(sub.cost)}</span>
            </div>
          ))}
          {subs.length > 3 && <div className="text-xs text-muted-foreground pt-1">+{subs.length - 3} more</div>}
        </div>
      </CardContent>
    </Card>
  )
}
