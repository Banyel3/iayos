"use client";
import React, { useState } from "react";
import { Search } from "lucide-react";
import { ButtonComp } from "@/components/ui/button/onboard_button";

const TempWorkers = () => {
  const [Query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  async function handleSearch(value: string) {
    setQuery(value);

    if (value.length < 2) {
      setResults([]);
      return;
    }

    const res = await fetch(`/api/search?q=${value}`);
    const data = await res.json();
    setResults(data.results);
  }

  return (
    <div className="flex items-center justify-center min-h-screen mt-45 ">
      <div className="w-[390px] min-h-screen flex flex-col justify-start ">
        <div className="flex flex-col text-center w-full ">
          <p>What help are you looking for?</p>
          <div className="relative w-full mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              className="bg-gray-100 border rounded-2xl w-full pl-10 pr-4 py-1 text-sm placeholder:text-sm"
              type="search"
              name=""
              id=""
              placeholder="cleaner, seamstress, etc"
              value={Query}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <br />
          <br />

          {Query && (
            <p>
              {results.length} results found under "{Query}"
            </p>
          )}

          <div className="flex justify-center gap-2">
            <div className="self-center w-20 h-20 border border-solid border-gray-200 rounded-xl bg-sky-100 flex items-center justify-center">
              <img
                src="/worker1.jpg"
                alt=""
                className="w-16 h-16 rounded-full object-cover"
              />
            </div>
            <div className="flex self-center w-20 h-20 border border-solid border-gray-200 rounded-xl bg-sky-100 items-center justify-center">
              <img
                src="/worker2.jpg"
                alt=""
                className="w-16 h-16 rounded-full object-cover"
              />
            </div>
            <div className="self-center w-20 h-20 border border-solid border-gray-200 rounded-xl bg-sky-100 flex items-center justify-center">
              <img
                src="/worker3.jpg"
                alt=""
                className="w-16 h-16 rounded-full object-cover"
              />
            </div>
          </div>
          <br />
          <br />
          <ButtonComp
            label="Create an account to hire now"
            variant="black"
            link="/auth/register"
            role="worker"
          ></ButtonComp>
        </div>
      </div>
    </div>
  );
};

export default TempWorkers;
