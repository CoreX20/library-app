import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

// Reader tanpa chrome (root): full-bleed, tanpa margin Header
const Layout = async ({ children }: { children: ReactNode }) => {
  const session = await auth();
  if (!session) redirect("/sign-in");

  return <main className="h-dvh">{children}</main>;
};

export default Layout;