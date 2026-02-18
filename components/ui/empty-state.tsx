import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LucideIcon, Plus } from "lucide-react"

interface EmptyStateProps {
  title: string
  description: string
  icon: LucideIcon
  actionLabel?: string
  actionHref?: string
  color?: "blue" | "green" | "purple" | "orange" | "gray"
}

export default function EmptyState({ title, description, icon: Icon, actionLabel, actionHref, color = "gray" }: EmptyStateProps) {
  
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    gray: "bg-gray-50 text-gray-500 border-gray-200",
  }

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border-2 border-dashed ${colors[color].split(' ')[2]} bg-white/50 animate-in fade-in zoom-in-95 duration-500`}>
      <div className={`h-20 w-20 rounded-full flex items-center justify-center mb-6 shadow-sm ${colors[color]}`}>
        <Icon className="h-10 w-10" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button size="lg" className="rounded-full shadow-lg hover:scale-105 transition-transform">
            <Plus className="mr-2 h-4 w-4" /> {actionLabel}
          </Button>
        </Link>
      )}
    </div>
  )
}
