import React from "react";
import { ButtonComp } from "../components/button/yellow_button";
// MOBILE FIRST ALWAYS
const onboard = () => {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="mx-auto w-[390px] min-h-screen flex flex-col justify-around">
        <img src="/globe.svg" alt="" />
        <div>
          <header className="p-4 text-center space-y-2">
            <h1 className="font-bold text-[22px] text-sm/snug">
              Find the right people for the job
            </h1>
            <p className="text-gray-500 text-[14px] text-sm/relaxed">
              Connect with skilled professionals for all your home service needs
            </p>
          </header>
          <main className="p-4 text-black space-y-4">
            <ButtonComp
              label="Get Started"
              variant="primary"
              link="/auth/login"
            />
            <ButtonComp label="Browse Services" variant="secondary" link="/" />
          </main>
        </div>
      </div>
    </div>
  );
};

export default onboard;
