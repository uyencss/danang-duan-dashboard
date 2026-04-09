import { Skeleton } from "@/components/ui/skeleton";

export default function UsersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-[500px] w-full rounded-xl" />
    </div>
  );
}
