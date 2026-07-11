import React from "react";

export default function Container({
  children,
}: {
  children?: React.ReactNode;
}) {
  return <section className="px-6 max-w-6xl mx-auto">{children}</section>;
}
