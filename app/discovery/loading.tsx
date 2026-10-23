export default function DiscoveryLoading() {
  return (
    <>
      <div className="wrap py-8">
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
          <div className="h-4 w-96 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
          <div className="h-4 w-64 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border bg-white p-4 dark:bg-gray-800">
              <div className="h-48 w-full rounded bg-gray-300 dark:bg-gray-600"></div>
              <div className="mt-3 space-y-2">
                <div className="h-4 w-3/4 rounded bg-gray-300 dark:bg-gray-600"></div>
                <div className="h-4 w-1/2 rounded bg-gray-300 dark:bg-gray-600"></div>
                <div className="h-6 w-1/4 rounded bg-gray-300 dark:bg-gray-600"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
