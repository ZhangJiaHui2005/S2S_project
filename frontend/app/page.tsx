import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, HandHeart, PackageCheck, QrCode, Recycle, Search, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const categories = [
  { label: "Giáo trình", icon: BookOpen },
  { label: "Đồ học tập", icon: PackageCheck },
  { label: "Đồ sinh hoạt", icon: HandHeart },
];

const steps = [
  { number: "01", title: "Tìm món đồ bạn cần", description: "Khám phá vật phẩm trong cộng đồng và chọn món phù hợp với nhu cầu.", icon: Search },
  { number: "02", title: "Gửi yêu cầu mượn", description: "Trao đổi thời gian, địa điểm và điều kiện nhận đồ ngay trên nền tảng.", icon: HandHeart },
  { number: "03", title: "Xác nhận bằng QR", description: "Hai bên xác nhận giao nhận rõ ràng để mỗi lượt chia sẻ đều minh bạch.", icon: QrCode },
];

const benefits = [
  "Tiết kiệm chi phí mua sắm ngắn hạn",
  "Tận dụng đồ dùng đang để trống",
  "Giảm rác thải và kéo dài vòng đời sản phẩm",
  "Xây dựng cộng đồng sinh viên biết sẻ chia",
];

export default function Home() {
  return (
    <main className="flex-1">
      <section id="gioi-thieu" className="border-b">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-28">
          <div className="space-y-7">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1"><Sparkles /> Nền tảng chia sẻ dành cho sinh viên</Badge>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Đồ bạn ít dùng có thể là thứ người khác đang cần.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                S2S giúp sinh viên cho mượn, mượn và trao đổi giáo trình, đồ học tập cùng đồ sinh hoạt theo cách đơn giản, minh bạch và có trách nhiệm.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className={buttonVariants({ size: "lg" })} href="/dang-ky">Bắt đầu chia sẻ <ArrowRight /></Link>
              <Link className={buttonVariants({ variant: "outline", size: "lg" })} href="#cach-hoat-dong">Xem cách hoạt động</Link>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Đăng ký miễn phí</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Xác nhận giao nhận rõ ràng</span>
            </div>
          </div>

          <Card className="overflow-hidden border-primary/20 bg-muted/40 shadow-none">
            <CardHeader className="border-b bg-card">
              <div className="flex items-center justify-between gap-4">
                <div><CardTitle className="text-lg">Một cộng đồng, nhiều lựa chọn</CardTitle><CardDescription>Đồ dùng thiết thực quanh khuôn viên của bạn.</CardDescription></div>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Recycle className="size-5" /></span>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 p-5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {categories.map(({ label, icon: Icon }) => (
                <div key={label} className="rounded-lg border bg-card p-4 text-center"><Icon className="mx-auto mb-3 size-5 text-primary" /><p className="text-sm font-medium">{label}</p></div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-b bg-muted/30">
        <div className="mx-auto grid max-w-7xl divide-y px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-8">
          <Feature icon={UsersRound} title="Cộng đồng sinh viên" description="Kết nối từ nhu cầu thật" />
          <Feature icon={ShieldCheck} title="Giao dịch minh bạch" description="Theo dõi từng bước giao nhận" />
          <Feature icon={Recycle} title="Tiêu dùng bền vững" description="Cho đồ dùng thêm một vòng đời" />
        </div>
      </section>

      <section id="cach-hoat-dong" className="scroll-mt-24 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl space-y-3 text-center">
            <Badge variant="outline">Cách hoạt động</Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Mượn đồ chỉ trong ba bước</h2>
            <p className="text-muted-foreground">Một quy trình dễ hiểu giúp cả người cho mượn và người mượn cùng an tâm.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {steps.map(({ number, title, description, icon: Icon }) => (
              <Card key={number} className="shadow-none">
                <CardHeader>
                  <div className="mb-4 flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></span><span className="text-sm font-medium text-muted-foreground">{number}</span></div>
                  <CardTitle className="text-lg">{title}</CardTitle>
                  <CardDescription className="leading-6">{description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="an-toan" className="scroll-mt-24 border-y bg-muted/30 py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div className="space-y-5">
            <Badge variant="outline">Chia sẻ có trách nhiệm</Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Tốt cho ví tiền, tốt cho cộng đồng.</h2>
            <p className="max-w-xl leading-7 text-muted-foreground">Mỗi món đồ được dùng lại là một khoản chi phí được tiết kiệm và một sản phẩm chưa cần trở thành rác thải.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {benefits.map((benefit) => <div key={benefit} className="flex gap-3 rounded-lg border bg-card p-4 text-sm"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" /><span>{benefit}</span></div>)}
            </div>
          </div>
          <Card className="shadow-none">
            <CardHeader>
              <span className="mb-2 flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground"><ShieldCheck className="size-5" /></span>
              <CardTitle>An toàn trong từng lượt trao đổi</CardTitle>
              <CardDescription className="leading-6">Hệ thống lưu trạng thái yêu cầu, xác nhận giao nhận bằng QR và sử dụng điểm Karma để khuyến khích hành vi đáng tin cậy.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator />
              <div className="grid gap-4 text-sm sm:grid-cols-3">
                <div><p className="font-medium">Rõ người</p><p className="mt-1 text-muted-foreground">Tài khoản có hồ sơ</p></div>
                <div><p className="font-medium">Rõ trạng thái</p><p className="mt-1 text-muted-foreground">Theo dõi yêu cầu</p></div>
                <div><p className="font-medium">Rõ giao nhận</p><p className="mt-1 text-muted-foreground">Xác nhận bằng QR</p></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Card className="border-primary/20 bg-primary text-primary-foreground shadow-none">
            <CardContent className="flex flex-col items-center justify-between gap-6 p-8 text-center md:flex-row md:p-10 md:text-left">
              <div className="space-y-2"><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Sẵn sàng chia sẻ món đồ đầu tiên?</h2><p className="text-primary-foreground/80">Tham gia S2S và biến những món đồ nhàn rỗi thành giá trị cho cộng đồng.</p></div>
              <Link className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "shrink-0")} href="/dang-ky">Tạo tài khoản <ArrowRight /></Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-medium text-foreground"><Recycle className="size-4 text-primary" /> S2S — Share to Sustain</div>
          <p>Chia sẻ hôm nay, bền vững ngày mai.</p>
        </div>
      </footer>
    </main>
  );
}

function Feature({ icon: Icon, title, description }: { icon: typeof Recycle; title: string; description: string }) {
  return <div className="flex items-center gap-4 py-7 md:px-8 md:first:pl-0 md:last:pr-0"><Icon className="size-6 text-primary" /><div><p className="font-medium">{title}</p><p className="text-sm text-muted-foreground">{description}</p></div></div>;
}
