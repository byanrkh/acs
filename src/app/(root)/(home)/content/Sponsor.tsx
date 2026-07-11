import React from "react";
import Marquee from "react-fast-marquee";

export default function Sponsor() {
  return (
    <Marquee
      autoFill
      gradient={true}
      gradientColor="black"
      gradientWidth={40}
      speed={100}
      pauseOnHover
      className="bg-black text-amber-400 py-4 overflow-y-hidden"
    >
      <ul className="flex gap-5">
        <li className="px-20">Sponsor & Media Partner Goes Here</li>
      </ul>
    </Marquee>
  );
}
