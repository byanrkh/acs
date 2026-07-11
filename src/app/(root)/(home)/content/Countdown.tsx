import React from "react";

export default function Countdown() {
  return (
    <section className="bg-[#FF5A1F] border-b-4 border-b-black">
      <div className="flex text-[200px] justify-between px-40 my-10">
        <div className="text-center font-medium text-[#1F4B33] -space-y-12">
          <h1 className="font-bold text-[#1F4B33]">10</h1>
          <p className="text-2xl">Days</p>
        </div>
        <div className="text-center font-medium text-[#1F4B33] -space-y-12">
          <h1 className="font-bold text-[#1F4B33]">12</h1>
          <p className="text-2xl">Hours</p>
        </div>
        <div className="text-center font-medium text-[#1F4B33] -space-y-12">
          <h1 className="font-bold text-[#1F4B33]">56</h1>
          <p className="text-2xl">Minutes</p>
        </div>
        <div className="text-center font-medium text-[#1F4B33] -space-y-12">
          <h1 className="font-bold text-[#1F4B33]">30</h1>
          <p className="text-2xl">Second</p>
        </div>
      </div>
    </section>
  );
}
