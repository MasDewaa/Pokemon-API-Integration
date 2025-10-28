import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PokemonSkeletonGridProps {
  count?: number;
}

export function PokemonSkeletonGrid({ count = 6 }: PokemonSkeletonGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} className="border-border/40 bg-card/80 shadow-sm">
          <CardHeader className="space-y-4 pb-2">
            <Skeleton className="h-6 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="mx-auto h-32 w-32 rounded-full" />
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
