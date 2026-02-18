import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "lucide-react" 
// Simplified badge for this example
const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    planning: "bg-blue-100 text-blue-800",
    idea: "bg-yellow-100 text-yellow-800",
  }
  return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || "bg-gray-100"}`}>{status}</span>
}

export default function ProjectList({ projects }: { projects: any[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Active Projects</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.length === 0 ? <p className="text-muted-foreground">No active projects.</p> : 
           projects.map((project) => (
            <div key={project.id} className="flex items-center justify-between border-b pb-2 last:border-0">
              <div>
                <p className="font-medium">{project.title}</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 w-24">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                </div>
              </div>
              <StatusBadge status={project.status} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
