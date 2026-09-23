# Kế hoạch giao Gemini: đăng vật phẩm và trang duyệt S2S

## Mục tiêu

Triển khai trọn luồng người dùng: đăng vật phẩm để **bán** hoặc **cho mượn**, xem/sửa/xóa bài của mình, duyệt và lọc vật phẩm của cộng đồng. Tạo trang duyệt với bộ lọc bên trái, danh sách sản phẩm bên phải ở màn hình rộng; tạo trang đăng bài và đặt nút dẫn đến trang đó trong `/profile`. Hoàn thành code, không dừng ở mockup hoặc chỉ viết API.

## Đọc code hiện tại trước khi sửa

- Backend: `backend/prisma/schema.prisma`, `backend/src/category/*`, `backend/src/auth.ts`, `backend/src/auth-database.ts`, `backend/src/app.module.ts`, `backend/src/main.ts`.
- Frontend: `frontend/AGENTS.md` và tài liệu Next trong `frontend/node_modules/next/dist/docs/` theo chỉ dẫn đó; `frontend/app/globals.css`, `frontend/app/layout.tsx`, `frontend/app/page.tsx`, `frontend/app/profile/*`, `frontend/components/layout/user-navbar.tsx`, `frontend/components/admin/category-manager.tsx`, `frontend/next.config.ts`, `frontend/components.json` và `frontend/components/ui/*`.
- Code hiện tại dùng Next.js 16 App Router, NestJS 12, Prisma 6, Better Auth, Tailwind 4, shadcn kiểu `base-nova` dựa trên `@base-ui/react`. Lấy code làm chuẩn nếu README khác code. Tránh đưa mẫu Radix hoặc API của phiên bản Next cũ vào dự án.

## Quyết định dữ liệu và giới hạn phạm vi

1. `Item` đã có `item_id`, `owner_id`, `category_id`, `title`, `description`, `type`, `status`, `location`, `image_url`, thời gian tạo/cập nhật. Trường giá hiện tại là `karma_value` và **phải được thay bằng `price_vnd`** trong schema, API và UI. `Category` và quan hệ đã có. Hiện chỉ có **một** `image_url`, chưa có bảng `ItemImage`, upload hay cấu hình storage.
2. Chuẩn hóa `type` thành `SELL` (Bán) và `LEND` (Cho mượn); cả hai đều có giá niêm yết bằng VND trong `price_vnd`. Giá cho mượn được hiểu là giá của một lần mượn; không tự ghi "/ngày" khi chưa có trường thời hạn/đơn vị giá. Không thêm đặt cọc hoặc luồng thanh toán vào CRUD này.
3. Giữ `status` theo vòng đời hiện có: `AVAILABLE`, `LOCKED`, `EXCHANGED`, `DELETED`. Khi người dùng xóa bài, chuyển sang `DELETED` để không phá lịch sử `BorrowRequest`/`Transaction`; bài đã `LOCKED`/`EXCHANGED` không cho sửa hoặc xóa qua CRUD thông thường. Chỉ `AVAILABLE` xuất hiện ở trang duyệt công khai. Đừng triển khai tạo yêu cầu mượn, escrow hay QR trong phạm vi này.
4. Bản đầu nhận một URL ảnh HTTPS hợp lệ vào `image_url` (hoặc để trống và hiển thị placeholder theo theme). Nếu cần upload file từ máy, bổ sung storage/endpoint riêng và xác nhận quy ước lưu trữ với chủ dự án; không giả vờ upload bằng cách lưu blob/base64 vào DB. Không giả định README đã được triển khai.
5. Dự án đang chuyển sang VND. Rà soát các trường và luồng tiền cũ trong schema (`User.karma_balance`, `Transaction.karma_amount`, `EscrowLog.locked_karma`, `Level` và các phần liên quan) để báo rõ phụ thuộc cho nhóm. Trong phạm vi item, không để dữ liệu, bộ lọc, nhãn hoặc contract API cũ còn sót. Không tự sửa giao dịch/escrow do thành viên khác phụ trách khi chưa thống nhất migration chung.

## Thứ tự thực hiện

### 0. Chuyển dữ liệu item sang VND

- Sửa `Item.karma_value` thành `Item.price_vnd` bằng Prisma migration; dùng số nguyên VND không âm, quy định mức tối đa hợp lý và kiểm tra overflow. Nếu DB đã có item thật, **không** đổi tên cột để ngầm coi số cũ là VND và **không** tự chọn tỷ giá. Tạo cách backfill rõ ràng/đánh dấu dữ liệu cần nhập lại, báo chủ dự án trước bước xóa cột cũ. Nếu DB trống, migration trực tiếp có thể dùng sau khi xác nhận.
- Cập nhật Prisma Client và toàn bộ chỗ tham chiếu đến giá item trong code/test. Không đổi các trường tiền của `Payments` vốn đã là VND. Ghi lại những phần tiền cũ ngoài item cần nhóm xử lý tiếp; tuyệt đối không âm thầm xóa dữ liệu giao dịch lịch sử.

### 1. API item trong NestJS

- Tạo `backend/src/item/` gồm module, controller, service, DTO và test phù hợp; đăng ký `ItemModule` trong `AppModule`.
- API đề xuất:

| Method | Route | Quyền | Hành vi |
| --- | --- | --- | --- |
| `GET` | `/api/items` | Công khai | Chỉ `AVAILABLE`; lọc `q`, `categoryId`, `type`, `minPriceVnd`, `maxPriceVnd`, `sort`, `page`, `limit`; trả `{ data, page, limit, total, totalPages }`. |
| `GET` | `/api/items/mine` | Đăng nhập | Bài của chủ tài khoản, gồm trạng thái; phân trang. Khai báo route trước `:id`. |
| `GET` | `/api/items/:id` | Công khai | Chi tiết bài khả dụng; chủ bài có thể xem bài của mình ở trạng thái khác, người khác không xem được bài `DELETED`. |
| `POST` | `/api/items` | Đăng nhập | Tạo bài với `type`, `title`, `description`, `category_id`, `price_vnd`, `location`, `image_url`; `owner_id` lấy ở server, `status=AVAILABLE`. |
| `PATCH` | `/api/items/:id` | Chủ bài | Sửa trường được phép khi bài `AVAILABLE`; không nhận `owner_id`, `status`, `created_at` từ client. |
| `DELETE` | `/api/items/:id` | Chủ bài | Soft delete `AVAILABLE` thành `DELETED`, trả `204`; trường hợp có giao dịch đang diễn ra trả `409`. |

- Tích hợp Better Auth theo cơ chế đúng của `@thallesp/nestjs-better-auth` đang cài. API công khai đánh dấu anonymous theo mẫu category, API ghi và `/mine` bắt buộc session thật từ cookie. Từ `session.user.id` tìm `prisma.user` bằng `auth_user_id`, rồi dùng `user_id` dạng số làm `owner_id`. Không tin `owner_id` do client gửi, không dùng guard admin cho người dùng. Nếu thiếu domain user, trả lỗi có kiểm soát.
- DTO dùng `class-validator` và `ValidationPipe` hiện có: trim tiêu đề, giới hạn độ dài hợp lý, `price_vnd` là số nguyên VND không âm, category ID hợp lệ, `type` chỉ `SELL|LEND`, ảnh URL hợp lệ hoặc rỗng. Xác thực category tồn tại, trả `404` cho item không tồn tại, `401` nếu chưa đăng nhập, `403` nếu khác chủ, `409` cho trạng thái không cho sửa/xóa. Không trả dữ liệu nhạy cảm của chủ bài.
- Lọc/sort/pagination tại Prisma, không tải hết dữ liệu rồi lọc ở frontend. Search trên tiêu đề/mô tả, order mặc định mới nhất và có tie-breaker `item_id`; giới hạn `limit` tối đa để tránh truy vấn quá lớn. Tổng số và data phải dùng cùng điều kiện lọc. Cân nhắc index nếu query thực tế cần; migration chỉ khi schema thay đổi.
- Không đổi endpoint category hiện có. Nếu số lượng item trên category nên loại `DELETED`, điều chỉnh riêng và cập nhật test tương ứng.

### 2. Kết nối API ở Next.js

- Thêm rewrite `/api/items/:path*` vào `frontend/next.config.ts` theo đúng mẫu `/api/categories/:path*`. Browser gọi đường dẫn tương đối `/api/items...` với `credentials: "include"`; không trỏ trực tiếp NestJS từ browser.
- Tạo kiểu dữ liệu và hàm gọi API dùng lại cho browse, chi tiết, form, `/mine`; xử lý `204`, lỗi JSON và lỗi mạng. Không thêm Axios/TanStack Query chỉ vì README có nhắc; dùng `fetch` theo code hiện tại trừ khi thật sự cần.
- Các trang cần session (`/dang-bai`, `/profile/bai-dang` hoặc tên route thống nhất) xác thực ở server như `/profile/page.tsx`. Có thể thêm kiểm tra sớm vào `frontend/proxy.ts`, nhưng bảo mật cuối cùng vẫn ở backend.

### 3. Trang duyệt vật phẩm

- Route đề xuất `/items`; có liên kết "Duyệt vật phẩm" từ navbar desktop/mobile để người dùng tìm thấy trang.
- Màn hình `lg+`: container `max-w-7xl` theo trang chủ, bố cục ngang `grid` với sidebar bộ lọc bên trái khoảng 240–280px và vùng kết quả bên phải. Sidebar gồm ô tìm từ khóa, danh mục lấy từ API category, loại Bán/Cho mượn, khoảng giá VND và nút Xóa lọc. Vùng phải gồm tiêu đề, số kết quả, sắp xếp, lưới card và phân trang.
- Mobile: bộ lọc nằm trong `Sheet` hoặc vùng có thể mở, danh sách một cột; tablet có thể hai cột. Đồng bộ filter/sort/page với URL query để tải lại, quay lại và chia sẻ link không mất trạng thái. Khi đổi filter, reset page về 1.
- Card chỉ hiển thị dữ liệu thật: ảnh hoặc placeholder, tiêu đề, category, loại, giá VND định dạng `vi-VN` và địa điểm nếu có; dẫn đến `/items/[id]` để xem chi tiết. Có loading, rỗng và lỗi, không dùng dữ liệu demo cố định. Không thêm nút "Mượn/Mua" giả nếu chưa có transaction API.

### 4. Trang đăng bài và quản lý bài của tôi

- Route đề xuất `/dang-bai`; đặt nút "Đăng vật phẩm" nổi bật trong phần đầu trang `/profile`, dùng `Link` và `buttonVariants` có sẵn. Có thể đặt thêm nút "Bài đăng của tôi" dẫn tới `/profile/bai-dang` để người dùng thực sự sử dụng được sửa/xóa. Sau khi tạo thành công, điều hướng tới chi tiết hoặc danh sách bài của tôi và hiển thị trạng thái thành công.
- Form: chọn Bán/Cho mượn, tiêu đề, mô tả, danh mục thật, giá VND, địa điểm, một URL ảnh nếu có. Validation client khớp DTO; gửi số nguyên VND, hiển thị lỗi theo trường và lỗi API; chống gửi lặp, có nút hủy. Dùng cùng form cho sửa bài qua route như `/profile/bai-dang/[id]/chinh-sua`.
- Danh sách "Bài đăng của tôi": trạng thái, chỉnh sửa, xóa có xác nhận bằng `AlertDialog`; ẩn hoặc khóa thao tác không hợp lệ theo trạng thái nhưng vẫn dựa vào kiểm tra quyền ở server.

### 5. Giao diện và component

- Giữ nguyên theme trong `frontend/app/globals.css`: `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`, border, spacing, typography và dark mode hiện có. Dùng `Card`, `Button`, `Badge`, `Input`, `Label`, `Sheet`, `Alert`, `Skeleton`, `AlertDialog` và Lucide đã có; tham khảo trang chủ/profile/category manager. Không tạo bảng màu, font, hệ thống card hoặc design system mới.
- Nếu thiếu Select, Textarea, Pagination hoặc component shadcn khác: kiểm tra `frontend/components/ui` trước, rồi xem tài liệu/registry shadcn tương ứng với cấu hình `base-nova` và cài bằng CLI từ thư mục `frontend`, hoặc báo rõ tên component cần chủ dự án thêm nếu không thể cài. Không tự dựng bản sao shadcn không nhất quán.
- Giữ text UI bằng tiếng Việt, nhãn có liên kết với input, thao tác bàn phím được, trạng thái lỗi/thành công rõ ràng và layout responsive.

## Tiêu chí nghiệm thu

1. Người chưa đăng nhập duyệt/lọc/xem bài `AVAILABLE` được nhưng không tạo/sửa/xóa được; truy cập trang đăng bài được chuyển đến `/dang-nhap`.
2. Người A tạo bài `SELL` và `LEND` thuộc tài khoản A; người B không thể sửa hoặc xóa bài A dù gọi API trực tiếp.
3. Danh mục không tồn tại, dữ liệu sai, page/limit sai, bài không tồn tại và trạng thái không hợp lệ trả HTTP status phù hợp; không có lỗi 500 không kiểm soát.
4. Tìm kiếm, lọc, sắp xếp, phân trang hoạt động với dữ liệu DB, query URL phản ánh trạng thái UI; `DELETED` không xuất hiện công khai.
5. Tạo, xem bài của tôi, sửa và xóa mềm chạy hết luồng trên desktop/mobile; sau mutation danh sách/chi tiết cập nhật đúng.
6. Giá VND hiển thị nhất quán trên danh sách/chi tiết/form, lọc theo VND và API không còn nhận hay trả trường giá cũ của item. Migration không tự quy đổi giá cũ khi chưa có quy tắc được chốt.
7. Chạy `backend`: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`; `frontend`: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`. Viết test có giá trị cho auth/ownership, validation và filter/pagination; không cần test chỉ lặp lại markup.
8. Khi hoàn thành, Gemini **phải báo cáo theo từng mục 0–5 của kế hoạch**: mục nào đã làm xong, file/endpoint tương ứng, migration và cách xử lý dữ liệu cũ, phần chưa làm/lý do, kết quả từng lệnh kiểm tra và màn hình đã xem. Kèm checklist đối chiếu từng tiêu chí nghiệm thu (đạt/chưa đạt) để chủ dự án gửi báo cáo và diff cho Codex kiểm tra lại. Không chỉ báo "đã hoàn thành" chung chung.

## Điểm cần chốt nếu yêu cầu thay đổi

Schema hiện tại chỉ hỗ trợ một `image_url`; nếu cần nhiều ảnh hoặc upload trực tiếp, hoặc nếu phải có duyệt bài trước khi hiển thị công khai, hãy báo chủ dự án và đề xuất migration/API cụ thể trước khi mở rộng. Nếu giá cho mượn cần tính theo ngày/tuần, cần thống nhất đơn vị và thêm dữ liệu tương ứng; không tự gắn đơn vị vào `price_vnd`.
