"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import logoPng from "../../../../public/logo.png";
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
  const [showPassword, setShowPassword] = useState(false);

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
            <Image src={logoPng} alt="Logo" className="w-full h-full object-contain" priority />
          </div>
        </div>
        <CardTitle className="text-2xl text-center text-primary font-bold">
          MobiFone DNA  GPS
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
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                disabled={loading}
                {...form.register("password")}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">Hiện/ẩn mật khẩu</span>
              </Button>
            </div>
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
