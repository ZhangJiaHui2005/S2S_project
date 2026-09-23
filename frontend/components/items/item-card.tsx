import Link from "next/link";
import { MapPin, Package, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatVND, Item } from "@/lib/items";

interface ItemCardProps {
  item: Item;
  showStatus?: boolean;
}

export function ItemCard({ item, showStatus = false }: ItemCardProps) {
  const isSell = item.type === "SELL";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <Badge variant="default">Khả dụng</Badge>;
      case "LOCKED":
        return <Badge variant="secondary">Đang giao dịch</Badge>;
      case "EXCHANGED":
        return <Badge variant="outline">Đã trao đổi</Badge>;
      case "DELETED":
        return <Badge variant="destructive">Đã xóa</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Link href={`/items/${item.item_id}`} className="group block h-full focus:outline-none">
      <Card className="h-full flex flex-col justify-between overflow-hidden rounded-xl transition-all duration-200 hover:border-primary/50 hover:shadow-lg">
        <div>
          <div className="relative aspect-[16/11] w-full overflow-hidden bg-muted">
            {item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image_url}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                  const parent = (e.target as HTMLElement).parentElement;
                  if (parent) {
                    const fallback = parent.querySelector(".img-fallback");
                    if (fallback) fallback.classList.remove("hidden");
                  }
                }}
              />
            ) : null}
            <div
              className={`img-fallback flex h-full w-full flex-col items-center justify-center bg-muted/60 text-muted-foreground ${
                item.image_url ? "hidden" : ""
              }`}
            >
              <Package className="size-12 stroke-[1.2]" />
              <span className="mt-2 text-xs font-medium">S2S Item</span>
            </div>

            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              <Badge variant={isSell ? "default" : "secondary"} className="shadow-xs font-semibold px-2.5 py-0.5">
                {isSell ? "Bán" : "Cho mượn"}
              </Badge>
              {item.Category?.name && (
                <Badge variant="outline" className="bg-background/90 backdrop-blur-sm shadow-xs px-2.5 py-0.5">
                  {item.Category.name}
                </Badge>
              )}
            </div>

            {showStatus && (
              <div className="absolute right-3 top-3">
                {getStatusBadge(item.status)}
              </div>
            )}
          </div>

          <CardHeader className="p-5 pb-2">
            <h3 className="line-clamp-2 text-lg font-semibold tracking-tight leading-snug group-hover:text-primary">
              {item.title}
            </h3>
          </CardHeader>

          <CardContent className="px-5 py-0">
            {item.price_confirmed === false ? (
              <span className="inline-flex items-center rounded-md bg-amber-100 px-2.5 py-0.5 text-sm font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                Cần xác nhận giá
              </span>
            ) : (
              <p className="text-xl font-bold text-primary">
                {formatVND(item.price_vnd)}
              </p>
            )}
          </CardContent>
        </div>

        <CardFooter className="mt-4 flex items-center justify-between border-t p-4 text-xs text-muted-foreground">
          {item.location ? (
            <span className="flex items-center gap-1.5 truncate max-w-[160px]" title={item.location}>
              <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{item.location}</span>
            </span>
          ) : (
            <span />
          )}

          {item.User?.full_name && (
            <span className="flex items-center gap-1.5 shrink-0 font-medium">
              <UserRound className="size-3.5 text-muted-foreground" />
              <span>{item.User.full_name}</span>
            </span>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
