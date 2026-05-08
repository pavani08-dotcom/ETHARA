import React from 'react';

export const CardSkeleton = () => (
  <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border animate-pulse">
    <div className="flex items-center gap-4">
      <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
      </div>
    </div>
  </div>
);

export const ListSkeleton = ({ count = 3 }) => (
  <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden animate-pulse">
    <div className="p-6 border-b border-border">
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
    </div>
    <div className="divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 flex items-start gap-4">
          <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full shrink-0"></div>
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
