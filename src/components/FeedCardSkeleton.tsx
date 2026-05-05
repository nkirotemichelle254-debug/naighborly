import { Skeleton } from "@/components/ui/skeleton";

export function FeedCardSkeleton() {
  return (
    <div className="rounded-[22px] border border-border bg-card overflow-hidden">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-4 grid gap-2">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex justify-between mt-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}
