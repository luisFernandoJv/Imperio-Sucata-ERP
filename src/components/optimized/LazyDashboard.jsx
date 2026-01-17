import { lazy, Suspense } from "react"
import { LoadingCard } from "../ui/loading"

const Dashboard = lazy(() => import("../Dashboard"))

export default function LazyDashboard(props) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 p-6">
          <LoadingCard />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </div>
        </div>
      }
    >
      <Dashboard {...props} />
    </Suspense>
  )
}
