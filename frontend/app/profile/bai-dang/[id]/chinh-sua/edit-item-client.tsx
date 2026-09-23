"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit3 } from "lucide-react";
import { ItemForm } from "@/components/items/item-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Category } from "@/lib/categories";
import { Item, updateItem, UpdateItemPayload } from "@/lib/items";

interface EditItemClientProps {
  item: Item;
  categories: Category[];
}

export default function EditItemClient({ item, categories }: EditItemClientProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (payload: UpdateItemPayload) => {
    setSubmitting(true);
    try {
      await updateItem(item.item_id, payload);
      router.push("/profile/bai-dang");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/profile/bai-dang"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="mr-2 size-4" /> Quay lại Bài đăng của tôi
        </Link>
      </div>

      <Card className="shadow-none">
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Edit3 className="size-5 text-primary" /> Chỉnh sửa bài đăng
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ItemForm
            initialData={item}
            categories={categories}
            onSubmit={handleSubmit}
            isSubmitting={submitting}
            onCancel={() => router.push("/profile/bai-dang")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
