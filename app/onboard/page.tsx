"use client";

import React, { useEffect } from "react";
import { ButtonComp } from "../components/button/onboard_button";
import { useRouter } from "next/navigation";
// MOBILE FIRST ALWAYS
const onboard = () => {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="mx-auto max-w-[390px] min-h-screen flex flex-col justify-around">
        <div>
          <header className="px-4 font-bold text-2xl">iAyos</header>
          <header className="px-4 text-sm">May sira? May iAyos.</header>
        </div>
        <img src="/onboard_stockimg.svg" alt="" />
        <div>
          <header className="p-4 text-center space-y-2">
            <h1 className="font-light text-[18px] text-sm/snug">
              What are you looking for?
            </h1>
          </header>
          <main className="p-4 text-black space-y-4">
            <ButtonComp
              label="I'm looking for a worker"
              variant="primary"
              link="/onboard/workers"
            />
            <ButtonComp
              label="I'm looking for a job"
              variant="secondary"
              link="/"
            />
          </main>
        </div>
      </div>
    </div>
  );
};

export default onboard;
