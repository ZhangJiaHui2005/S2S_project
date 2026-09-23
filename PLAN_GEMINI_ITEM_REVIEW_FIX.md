# Plan sửa sau review tính năng Item

Đây là các việc cần Gemini sửa trong code đã triển khai. Không đánh dấu hoàn thành chỉ vì typecheck hoặc unit test qua; phải xác minh luồng thực tế và báo lại bằng chứng cho từng mục.

## P0 — Dữ liệu giá cũ bị hiểu sai thành VND

**Hiện trạng:** `backend/prisma/migrations/3_rename_karma_value_to_price_vnd/migration.sql` chỉ `RENAME COLUMN`. Nếu bảng `Item` có dữ liệu, số điểm cũ lập tức thành giá VND. Điều này trái với `PLAN_GEMINI_ITEM.md` và có thể hiển thị giá sai cho người dùng.

**Cần sửa:** Kiểm tra trạng thái migration và số bản ghi item trên môi trường đích mà không in dữ liệu nhạy cảm. Nếu migration **chưa áp dụng**, thay bằng lộ trình thêm `price_vnd` mới, backfill bằng giá VND được xác nhận, rồi mới ràng buộc `NOT NULL`/bỏ cột cũ. Nếu migration **đã áp dụng**, không sửa file migration lịch sử đang dùng chung; tạo migration tiếp theo và phương án phục hồi dựa trên backup/giá được xác nhận. Không dùng tỉ lệ quy đổi tự đoán, không reset DB khi chưa được chủ dự án cho phép. Báo rõ tình trạng dữ liệu cũ và bước còn chờ quyết định.

**Nghiệm thu:** Có kịch bản DB rỗng và DB đã có item; không item cũ nào bị công khai với giá VND giả.

## P1 — Route cần đăng nhập và quyền chủ bài

1. `frontend/app/profile/bai-dang/page.tsx`: `loading` khởi tạo `true`, nhưng `loadData()` chỉ chạy khi có session. Khách chưa đăng nhập sẽ thấy skeleton vô thời hạn và không tới `/dang-nhap`. Chuyển route này và route sửa bài sang server guard theo mẫu `frontend/app/profile/page.tsx`; xác thực session trước khi tải dữ liệu. Không gọi `router.push()` trong render.
2. `frontend/app/dang-bai/page.tsx`: hiện hiển thị card yêu cầu đăng nhập thay vì redirect như tiêu chí nghiệm thu. Áp dụng cùng server guard và redirect tới `/dang-nhap`; nếu muốn giữ điểm quay lại, truyền return URL an toàn.
3. `frontend/app/profile/bai-dang/[id]/chinh-sua/page.tsx`: chỉ kiểm tra bài `AVAILABLE`, chưa kiểm tra người đăng là chủ bài trước khi hiện form. Đừng dùng `owner_id` từ session Better Auth dạng chuỗi; lấy domain user ở backend hoặc endpoint riêng trả quyền sửa. Người khác không được thấy form chỉnh sửa bài của A. API `PATCH` vẫn phải kiểm tra quyền độc lập.
4. `frontend/app/items/[id]/page.tsx`: nút “Quản lý bài đăng” đang hiện cho mọi người trên mọi bài. Chỉ hiện với chủ bài; với người xem khác chỉ hiện thông tin người đăng, không dẫn tới trang quản lý của chính họ.

**Nghiệm thu:** Khách vào `/dang-bai`, `/profile/bai-dang`, route sửa bài đều chuyển `/dang-nhap`; người B mở link sửa bài A không thấy form và API vẫn trả `403`.

## P1 — Trang “Bài đăng của tôi” bị giới hạn 12 bài

`frontend/app/profile/bai-dang/page.tsx` gọi `fetchMyItems()` không truyền trang và không có điều khiển phân trang, nên bài thứ 13 trở đi không thể quản lý. Thêm phân trang/URL `page` (hoặc cơ chế tải thêm) dựa trên `totalPages`, cập nhật đúng trang sau khi xóa; xử lý trường hợp trang cuối không còn item.

**Nghiệm thu:** Tài khoản có ít nhất 13 bài xem/sửa/xóa được bài ở trang sau.

## P1 — Validation và cập nhật trạng thái ở backend

1. `backend/src/item/dto/create-item.dto.ts`: chuỗi tiêu đề chỉ chứa khoảng trắng qua `@MinLength(2)`, sau đó `trim()` trong service lưu tiêu đề rỗng. Chuẩn hóa trước validation rồi kiểm tra độ dài sau trim; test `"   "` trả `400`. Kiểm tra `category_id > 0` và thống nhất lỗi category không tồn tại (`404` hoặc `400` theo contract, test đúng status).
2. `frontend/components/items/item-form.tsx`: giá thập phân bị `Math.floor()` âm thầm thay đổi. Bắt buộc số nguyên trước khi gửi; URL ảnh client phải kiểm tra đúng `https:` như nhãn, backend chỉ chấp nhận HTTPS nếu đây là contract. Đồng bộ giới hạn độ dài mô tả/địa điểm và thông báo lỗi.
3. `backend/src/item/item.service.ts`: `update()`/`remove()` đọc `AVAILABLE` rồi `update()` theo `item_id` không kèm điều kiện trạng thái. Nếu trạng thái đổi giữa hai bước, bài đã khóa vẫn có thể bị sửa/xóa. Dùng cập nhật có điều kiện hoặc transaction để kiểm tra trạng thái tại thời điểm ghi; trả `409` khi điều kiện không còn đúng. Kiểm tra thêm `BorrowRequest` đang chờ nếu quy trình mượn xem đó là yêu cầu đang hoạt động; thống nhất với trạng thái transaction thực tế thay vì đoán chuỗi trạng thái.
4. Query filter: kiểm tra `minPriceVnd <= maxPriceVnd`, giới hạn số phù hợp kiểu `Int` của DB và từ chối query không hợp lệ bằng `400`, tránh lỗi Prisma `500`. Dùng kiểu Prisma thay `any` cho `where/orderBy` nếu có thể.

**Nghiệm thu:** Test request thật qua NestJS cho validation và 401/403/409; test cạnh tranh trạng thái ở mức service/integration phù hợp.

## P2 — Lỗi trải nghiệm và nhất quán giao diện

1. `frontend/lib/categories.ts` nuốt lỗi mạng/API và trả `[]`, khiến form đăng bài giống như không có danh mục. Hiện lỗi có nút thử lại; khóa submit khi không có danh mục khả dụng. Trang lọc cũng cần báo rõ khi danh mục không tải được.
2. `frontend/app/items/page.tsx` không bật trạng thái loading khi áp dụng/xóa bộ lọc nên kết quả cũ vẫn hiện trong lúc URL đã đổi. Đồng bộ loading, xử lý URL query không hợp lệ và nhãn số trang khi trang ngoài phạm vi.
3. `frontend/components/items/item-card.tsx` ghi đè màu badge bằng `bg-emerald-600`, lệch theme `globals.css`/dark mode. Dùng variant/token đang có. Bổ sung `aria-label` cho nút xóa chỉ có icon ở trang bài của tôi; thay `alert()` lỗi xóa bằng `Alert` nhất quán.
4. Xem lại bố cục mobile/desktop bằng browser: sidebar bên trái, grid bên phải, Sheet lọc, ảnh/placeholder, empty/loading/error, dark mode và nút trên profile. Chụp màn hình hoặc mô tả kết quả kiểm tra; hiện review này mới xác minh code và build, chưa xác nhận trực quan.

## Kiểm chứng và báo cáo cần gửi lại

- Chạy backend `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`; frontend `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`. Tăng test cho route item thực tế: guest, A/B ownership, input rỗng, min/max giá, locked/deleted, pagination hơn 12 bài. Các unit test hiện tại chủ yếu mock service/controller và chưa chứng minh luồng HTTP + session hoạt động.
- Nếu `next build` bằng Turbopack lỗi do môi trường tạo process/bind port, thử `next build --webpack` theo tài liệu Next trong repo và báo rõ lệnh nào qua/lệnh nào không. Không ghi “build pass” cho Turbopack nếu lệnh mặc định chưa qua.
- Báo cáo dạng bảng: **mục P0/P1/P2**, file đã sửa, cách tái hiện trước/sau, test tương ứng, tình trạng migration ở DB, lệnh kiểm tra và kết quả. Ghi riêng việc chưa làm hoặc cần chủ dự án chốt. Gửi diff/commit cùng báo cáo để Codex kiểm tra lại.
