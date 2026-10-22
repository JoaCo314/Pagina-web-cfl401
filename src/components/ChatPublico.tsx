"use client";

import { usePathname } from "next/navigation";
import ChatAsistente from "./ChatAsistente";

export default function ChatPublico() {
  const pathname = usePathname();
  if (pathname === "/panel" || pathname.startsWith("/panel/") || pathname === "/login") return null;
  return <ChatAsistente />;
}
