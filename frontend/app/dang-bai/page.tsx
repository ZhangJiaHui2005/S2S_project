import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import DangBaiClient from "./dang-bai-client";

export default async function DangBaiPage() {
  const session = await getCurrentSession();

  if (!session || !session.user) {
    redirect("/dang-nhap?returnUrl=/dang-bai");
  }

  return <DangBaiClient user={session.user} />;
}
