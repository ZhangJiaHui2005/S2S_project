# Review Round 3: việc cần Gemini sửa trước khi nghiệm thu Item

## P0 — Migration 5 chưa phân loại an toàn giá cũ

`backend/prisma/migrations/5_rule_based_legacy_item_price_confirmation/migration.sql` dùng ngưỡng `price_vnd <= 1000` để đoán giá gốc. Quy tắc này không chứng minh được nguồn giá: item cũ có giá trị 2000 sẽ vẫn `price_confirmed=true` và có thể lộ ra công khai; item VND hợp lệ giá 0–1000 lại bị ẩn. Báo cáo “áp dụng cho mọi môi trường” hiện không đúng.

- Migration 5 đã áp dụng trên Neon nên **không sửa file lịch sử**. Thiết kế bước tiếp theo bảo thủ: mọi item tồn tại trước khi chuyển đổi mà không có bằng chứng xác nhận VND phải ở trạng thái chưa xác nhận; chỉ giữ/mở item nào đã được chủ hoặc admin xác minh giá VND thật. Không dùng ID cố định, ngưỡng giá hoặc tỉ lệ quy đổi để suy đoán. Với Neon hiện tại, xác minh và giữ riêng item ID 10 (5.000.000 VND) nếu có bằng chứng nguồn giá; ba item 4/5/11 tiếp tục ẩn.
- Viết test migration trên DB cô lập có: item cũ 30, item cũ 2000, item VND 0/500/5.000.000, rồi kiểm tra cờ xác nhận và API public. Báo rõ cách bảo vệ môi trường DB khác trước khi triển khai.

## P1 — Test E2E đang ghi trực tiếp vào Neon chung

`backend/test/item.e2e-spec.ts` đăng ký hai user, tạo danh mục/item/yêu cầu mượn và xóa dữ liệu trong `afterAll`, nhưng không có guard bắt buộc test schema riêng. Khi `DATABASE_URL` trỏ Neon chung, `npm run test:e2e` sẽ ghi và xóa trên DB đó. Không chạy lại e2e trên DB chung.

- Tạo test schema/DB cô lập và guard từ chối chạy nếu URL không trỏ đúng schema test, theo cách `backend/scripts/test-auth-integration.mjs` bảo vệ test auth. Seed dữ liệu test riêng; cleanup chỉ trong schema test. Sau đó mới chạy 19 test Item và các e2e liên quan.
- Test gọi “Concurrency & Deletion” hiện chỉ tạo request trước rồi xóa tuần tự. `$transaction` quanh count + update không tự chứng minh ngăn request mới được tạo song song. Đặt quy tắc chung với API tạo `BorrowRequest`/`Transaction` (khóa/trạng thái/transaction phù hợp), viết test hai thao tác đồng thời trên DB test, hoặc ghi rõ đây là giới hạn chưa hoàn thành.

## P2 — Bằng chứng build và UI

- Code đã có `lg:grid-cols-3` cho trang duyệt, nhưng báo cáo chưa kèm ảnh hoặc kết quả kiểm tra browser ở desktop/mobile. Chụp trang thật tại viewport desktop và mobile; kiểm tra sidebar, Sheet, card, ảnh fallback, dark mode và các trạng thái lỗi/rỗng.
- Tách rõ build theo môi trường. Trên môi trường Codex hiện tại `npm run build` (Turbopack) vẫn lỗi `creating new process / binding to a port: Operation not permitted`, kể cả ngoài sandbox; `next build --webpack` qua. Nếu máy Gemini chạy Turbopack thành công, cung cấp log kèm môi trường để so sánh. Không xem log từ máy khác là bằng chứng build Turbopack trên môi trường này.

## Báo cáo lại

Gửi: diff/commit, migration mới và chiến lược dữ liệu trước/sau, xác nhận DB test cô lập, kết quả test gồm test migration và test đồng thời thực sự, log hai lệnh build, ảnh desktop/mobile. Hiện Neon có 4 item: 3 chưa xác nhận (4, 5, 11) và 1 xác nhận (10); trạng thái này đã được kiểm tra chỉ đọc.
