"use client";

import React, { useEffect } from "react";
import { ButtonComp } from "@/components/ui/button/onboard_button";
import { useRouter } from "next/navigation";
// MOBILE FIRST ALWAYS
const onboard = () => {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="mx-auto max-w-[390px] min-h-screen flex flex-col justify-around ">
        <div>
          <header className="px-4 font-bold text-2xl font-[Fredoka]">
            iAyos
          </header>
          <header className="px-4 text-sm font-[Fredoka]">
            May sira? May iAyos.
          </header>
        </div>
        <div>
          <img src="/onboard_stockimg.svg" alt="" />
          <h1 className="p-4 text-[34px] leading-[100%] font-[700] font-[Inter] text-justify">
            Find the right people for the job
          </h1>
          <p className="px-4">
            Connect with skilled workers for all your <br />
            home service needs
          </p>
        </div>
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
              role="worker"
            />
            <ButtonComp
              label="I'm looking for a job"
              variant="secondary"
              link="/"
              role="client"
            />
          </main>
        </div>
      </div>
    </div>
  );
};

export default onboard;
