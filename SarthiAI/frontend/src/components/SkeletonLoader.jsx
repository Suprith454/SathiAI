export default function SkeletonLoader() {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        <div className="text-center mb-10 space-y-3">
          <div className="h-14 w-64 animate-shimmer rounded-lg mx-auto" />
          <div className="h-4 w-48 animate-shimmer rounded mx-auto" />
        </div>
        {[1, 2, 3].map((d) => (
          <div key={d} className="bg-white rounded-2xl border border-slate-100 p-5 md:p-6 shadow-sm animate-pulse">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 animate-shimmer" />
              <div className="h-5 w-24 bg-slate-100 animate-shimmer rounded" />
            </div>
            {[1, 2, 3].map((a) => (
              <div key={a} className="flex gap-4 pb-6">
                <div className="w-9 h-9 rounded-lg bg-slate-100 animate-shimmer" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-slate-100 animate-shimmer rounded" />
                  <div className="h-3 w-full bg-slate-100 animate-shimmer rounded" />
                  <div className="h-3 w-1/2 bg-slate-100 animate-shimmer rounded" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
