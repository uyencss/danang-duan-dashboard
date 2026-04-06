"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ" }),
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
      await authClient.signIn.email({
        email: values.email.trim().toLowerCase(),
        password: values.password.trim(),
        callbackURL: "/",
      }, {
        onSuccess: () => {
          toast.success("Đăng nhập thành công!");
          router.refresh();
          router.push("/");
          // Fallback if router fails
          setTimeout(() => {
            if (window.location.pathname === "/login") {
              window.location.href = "/";
            }
          }, 100);
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Sai mật khẩu hoặc email.");
        },
        onResponse: () => {
          setLoading(false);
        }
      });
  };

  return (
    <Card className="shadow-lg border-primary/20">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-md ring-1 ring-primary/20">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center text-primary font-bold">
          MobiFone Project Tracker
        </CardTitle>
        <CardDescription className="text-center">
          Dành cho Trung tâm Giải pháp số Đà Nẵng
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@mobifone.vn"
              disabled={loading}
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mật khẩu</Label>
            </div>
            <Input
              id="password"
              type="password"
              disabled={loading}
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={loading}
          >
            {loading ? "Đang xủ lý..." : "Đăng nhập"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
