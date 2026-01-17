import { lazy, Suspense } from "react"
import { LoadingCard } from "../ui/loading"

const Inventory = lazy(() => import("../Inventory"))

export default function LazyInventory(props) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 p-6">
          <LoadingCard />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </div>
        </div>
      }
    >
      <Inventory {...props} />
    </Suspense>
  )
}
