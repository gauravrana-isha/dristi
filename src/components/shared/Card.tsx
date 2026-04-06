import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  title?: string;
}

export default function Card({ children, className = "", title }: Props) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}
    >
      {title && (
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
