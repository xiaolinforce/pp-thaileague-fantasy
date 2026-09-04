import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section aria-busy="true" aria-live="polite">
      <p>กำลังโหลดเครื่องมือผู้ดูแล</p>
      <Skeleton className="my-6 h-12 w-64" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </section>
  );
}
