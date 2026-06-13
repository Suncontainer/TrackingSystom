import type { ReactNode } from "react";

type AdminPlaceholderProps = {
  children: ReactNode;
};

export function AdminPlaceholder({ children }: AdminPlaceholderProps) {
  return <div className="admin-card admin-placeholder">{children}</div>;
}
