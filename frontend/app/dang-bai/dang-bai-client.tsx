"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, PackagePlus, RotateCw } from "lucide-react";
import { ItemForm } from "@/components/items/item-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCategories, Category } from "@/lib/categories";
import { createItem, CreateItemPayload, UpdateItemPayload } from "@/lib/items";

interface DangBaiClientProps {
  user: {
    id: string | number;
    name: string;
  };
}

export default function DangBaiClient({}: DangBaiClientProps) {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCat, setLoadingCat] = useState(true);
  const [catError, setCatError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = () => {
    setLoadingCat(true);
    setCatError(null);
    fetchCategories()
      .then((cats) => setCategories(cats))
      .catch((err: Error) => setCatError(err.message || "Không thể tải danh mục"))
      .finally(() => setLoadingCat(false));
  };

  useEffect(() => {
    let isCancelled = false;
    fetchCategories()
      .then((cats) => {
        if (!isCancelled) {
          setCategories(cats);
          setCatError(null);
        }
      })
      .catch((err: Error) => {
        if (!isCancelled) setCatError(err.message || "Không thể tải danh mục");
      })
      .finally(() => {
        if (!isCancelled) setLoadingCat(false);
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleSubmit = async (payload: CreateItemPayload | UpdateItemPayload) => {
    setSubmitting(true);
    try {
      const created = await createItem(payload as CreateItemPayload);
      router.push(`/items/${created.item_id}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCat) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-40 mb-6" />
        <Card className="p-6">
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-10 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/profile" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="mr-2 size-4" /> Quay lại Hồ sơ
        </Link>
      </div>

      <Card className="shadow-none">
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <PackagePlus className="size-5 text-primary" /> Đăng vật phẩm mới
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {catError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Không thể tải danh mục</AlertTitle>
              <AlertDescription className="flex items-center justify-between gap-4 mt-2">
                <span>{catError}</span>
                <Button variant="outline" size="sm" onClick={loadCategories} className="gap-1.5 shrink-0">
                  <RotateCw className="size-3.5" /> Thử lại
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <ItemForm
            categories={categories}
            onSubmit={handleSubmit}
            isSubmitting={submitting}
            onCancel={() => router.push("/profile")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
