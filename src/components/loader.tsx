import { Loader2 } from "lucide-react";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

export function Loader({ size = "md", fullScreen = false }: LoaderProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const loaderContent = (
    <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
}
