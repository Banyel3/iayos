import React from "react";
import Link from "next/link";

const Login = () => {
  return (
    <>
      <div>Login Page is Here</div>
      <p>
        <Link href="/auth/register">Register an Account Now</Link>
      </p>
    </>
  );
};

export default Login;
