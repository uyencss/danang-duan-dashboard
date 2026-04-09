import { Skeleton } from "@/components/ui/skeleton";

export default function DuAnDaXoaLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  );
}
