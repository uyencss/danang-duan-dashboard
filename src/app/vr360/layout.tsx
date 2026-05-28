import { ReactNode } from "react";

export const metadata = {
  title: "Hidden Horizons — Khám phá một Đà Nẵng thật khác | MobiFone VR360",
  description: "5 địa điểm số hóa độc đáo tại Đà Nẵng — trải nghiệm thực tế ảo 360° miễn phí ngay trên điện thoại của bạn. Sự kiện đặc biệt mùa DIFF 2026.",
};

export default function VR360Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,900&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" crossOrigin="anonymous" />
      {children}
    </>
  );
}
