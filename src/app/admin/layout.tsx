'use client';

import { ReactNode } from 'react';

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Admin pages don't show Header/Footer - they're already excluded by route structure
  return <>{children}</>;
}

