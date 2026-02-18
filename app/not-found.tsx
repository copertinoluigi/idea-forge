import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50 text-center px-4">
      <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <FileQuestion className="h-10 w-10 text-gray-400" />
      </div>
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Page Not Found</h2>
      <p className="text-gray-500 mb-8 max-w-md">
        Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
      </p>
      <Link href="/dashboard">
        <Button size="lg" className="shadow-lg shadow-primary/20">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  )
}
