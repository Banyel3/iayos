"use client";

import React from "react";
import Link from "next/link";
import { Contact } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { email, z } from "zod";
import { Button } from "@/components/ui/form_button";
import { useEffect } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
const formSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
});

function onSubmit(values: z.infer<typeof formSchema>) {
  console.log("GOOD");
  console.log(values);
}

const Login = () => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hasSeenOnboard", "true");
    }
  }, []);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });
  return (
    <>
      <div className="flex justify-center items-center min-h-screen">
        <div className="mx-8 my-15 w-[390px] min-h-screen flex flex-col items-center">
          <h3 className="font-[Inter] text-xl font-[400]">Create an account</h3>
          <br />
          <br />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Email Address<span className="text-red-600 ">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Email Address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Password<span className="text-red-600 ">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password" // <-- this masks the input
                        placeholder="Password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="self-center">
                Create an account to hire now →
              </Button>
            </form>
          </Form>
          <p>
            <Link href="/auth/register" className="text-blue-500">
              Register an Account Now
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;
