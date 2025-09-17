"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";

const TempDashboard = () => {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading session...</p>;
  if (!session) return <p>You are not logged in.</p>;

  return (
    <div>
      <h1>Temporary Dashboard</h1>
      <p>Email: {session.user?.email}</p>
      <p>Name: {session.user?.name}</p>
      {session.user?.image && (
        <img src={session.user.image} alt="Profile" width={50} />
      )}
      <button onClick={() => signOut({ callbackUrl: "/onboard" })}>
        Sign Out
      </button>
    </div>
  );
};

const TempDashboardWrapper = () => (
  <SessionProvider>
    <TempDashboard />
  </SessionProvider>
);

export default TempDashboardWrapper;
