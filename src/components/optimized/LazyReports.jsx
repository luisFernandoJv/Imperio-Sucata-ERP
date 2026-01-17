import { lazy, Suspense } from "react"
import { LoadingCard } from "../ui/loading"

const Reports = lazy(() => import("../reports/Reports"))

export default function LazyReports(props) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 p-6">
          <LoadingCard />
          <LoadingCard />
        </div>
      }
    >
      <Reports {...props} />
    </Suspense>
  )
}
