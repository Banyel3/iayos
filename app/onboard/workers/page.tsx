import React from "react";
import { Search } from "lucide-react";

const TempWorkers = () => {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-[390px] min-h-screen flex flex-col justify-around">
        <div className="flex flex-col justify-center text-center w-full">
          <h1 className="text-3xl">iAyos</h1>
          <br />
          <br />
          <p>What help are you looking for?</p>

          <div className="relative w-full mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              className="bg-gray-100 border rounded-2xl w-full pl-10 pr-4 py-1 text-sm placeholder:text-sm"
              type="search"
              name=""
              id=""
              placeholder="cleaner, seamstress, etc"
            />
          </div>
          <br />
          <div className="self-center w-70 h-45 border border-solid border-gray-200"></div>
        </div>
      </div>
    </div>
  );
};

export default TempWorkers;
