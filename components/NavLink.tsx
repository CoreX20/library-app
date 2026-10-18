"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NavLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      className={cn(
        "text-base capitalize",
        pathname === href
          ? "font-semibold text-light-200"
          : "text-light-100 hover:text-light-200",
      )}
    >
      {children}
    </Link>
  );
};

export default NavLink;