"use client";

import { cn } from "@/libs/cn";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function VaulDrawer() {
  const pathname = usePathname();
  const Links = [
    {
      label: "Home",
      path: "/",
    },
    {
      label: "Information",
      path: "/information",
    },
    {
      label: "Documentation",
      path: "/documentation",
    },
    {
      label: "Contact",
      path: "/contact",
    },
  ];

  return (
    <>
      <nav className="py-5">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-6">
          <Image
            src={
              "https://cdn.quatrolympic.com/41028044-a720-48f0-b91c-74e271968c6e.png"
            }
            alt="Logo ACS"
            width={60}
            height={60}
          />
          <ul className="sm:flex gap-5 hidden">
            {Links.map((l) => {
              return (
                <li key={l.label}>
                  <Link
                    href={l.path}
                    className={cn(
                      "text-md",
                      pathname === l.path ? "text-amber-600" : "",
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </>
  );
}
