import React from 'react';
import { cn } from '../../lib/utils';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-white/[0.06] border border-white/[0.04]",
        className
      )}
    />
  );
};

export const CardSkeleton: React.FC<{ className?: string; height?: string }> = ({ 
  className, 
  height = "h-48" 
}) => {
  return (
    <div className={cn("surface-card p-6 flex flex-col justify-between", height, className)}>
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-3 w-full" />
      </div>
      <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
};

export const CharityCardSkeleton: React.FC = () => {
  return (
    <div className="surface-card overflow-hidden flex flex-col justify-between h-[360px] rounded-2xl">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-6 space-y-3 flex-grow">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="p-6 pt-0 border-t border-white/[0.06] flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
};

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 5 }) => {
  return (
    <tr className="border-b border-white/[0.06]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-4 px-6">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
};
