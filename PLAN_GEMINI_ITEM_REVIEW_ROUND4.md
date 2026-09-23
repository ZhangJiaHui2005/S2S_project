# Review Round 4: sửa migration giá Item trước khi triển khai

## Kết luận kiểm tra

Chưa nghiệm thu migration 6 và chưa chạy `prisma migrate deploy` trên Neon. Backend typecheck, lint và 29 unit tests; frontend typecheck, lint đều qua trong lần kiểm tra này. Chưa xác minh được DB Neon bằng `prisma migrate status` vì Prisma schema engine báo lỗi kết nối. Báo cáo Gemini về UI chỉ có HTML mô phỏng, chưa có ảnh của ứng dụng Next.js thật.

## P0 — Migration 6 vẫn phân loại sai dữ liệu

1. `backend/prisma/migrations/5_rule_based_legacy_item_price_confirmation/migration.sql` đã điền `karma_value = price_vnd` cho mọi giá `<= 1000`, kể cả bài VND thật 0 và 500. Migration 6 lại dùng `karma_value IS NOT NULL` để đánh dấu chưa xác nhận, nên hai bài VND này vẫn bị ẩn. Kiểm thử hiện tại tạo bài VND với `karma_value = null`, bỏ qua trạng thái thực tế sau migration 5.
2. Điều kiện `item_id != 10` trong migration 6 là ngoại lệ theo ID của một DB. Nó có thể để lộ giá karma cũ ở môi trường khác có item ID 10. Không dùng ID cố định để suy ra nguồn giá.
3. Mốc thời gian cố định `2026-09-23 14:00:00+00` khi không tìm thấy migration history không có căn cứ cho DB khác. Không được phân loại tự động với fallback này; dừng migration có thông báo rõ hoặc dùng mốc đã được xác minh cho từng môi trường.
4. `started_at` của migration đổi tên cột chỉ chứng minh thời điểm đổi schema, không tự chứng minh thời điểm mọi client đã chuyển sang nhập VND. Xác minh lịch sử triển khai và dữ liệu trước khi dùng mốc đó làm ranh giới nghiệp vụ. Giữ bài không rõ nguồn giá ở trạng thái chưa xác nhận; chỉ xác nhận VND khi có bằng chứng.

Yêu cầu Gemini: thiết kế lại migration mới an toàn trên mọi môi trường, không sửa migration 1–5 đã triển khai. Phân biệt dữ liệu karma thực sự với `karma_value` bị migration 5 điền nhầm. Không tự xác nhận hàng không có bằng chứng. Bảo toàn item 10 của Neon dựa trên chứng cứ nguồn giá hoặc xác nhận riêng có kiểm soát, không ghi ngoại lệ ID 10 vào migration chung. Cung cấp truy vấn audit chỉ đọc, số bản ghi từng nhóm trước/sau và phương án khôi phục.

## P0 — Test phải chạy file migration thật

`backend/test/item-migration.integration.ts` hiện chép lại hai câu `UPDATE` của migration 6 và tự đặt cutoff. Nó không chạy file `migration.sql`, không kiểm tra cách đọc `_prisma_migrations`, và không tái hiện tác động của migration 5. Sửa runner để dựng schema/DB cô lập theo đúng chuỗi migration 1–5, nạp dữ liệu vào các thời điểm thích hợp rồi chạy **chính file migration mới** qua Prisma hoặc SQL. Kiểm tra tối thiểu:

- Karma cũ 30 và 2000 luôn chưa xác nhận, không lộ API công khai.
- VND thật 0, 500 và 5.000.000 sau migration 5 vẫn được phân loại đúng, kể cả `karma_value` đã bị điền nhầm với giá thấp.
- Item có ID 10 nhưng thực chất là karma cũ ở DB khác vẫn bị ẩn.
- Bài cũ đã được người sở hữu xác nhận giá VND không bị ghi đè.
- Thiếu migration history hoặc thiếu bằng chứng cutoff thì migration dừng an toàn.

Không chạy kiểm thử ghi/xóa trên schema dữ liệu chung. Báo cáo đúng lệnh, DB/schema cô lập và kết quả từng ca.

## P1 — Giới hạn kiểm thử xóa đồng thời

`item.e2e-spec.ts` nay có hai HTTP DELETE chạy đồng thời và kiểm tra chỉ một request thành công; phần này đạt mục tiêu cho **hai lệnh xóa**. Nó chưa kiểm tra race giữa DELETE và việc tạo BorrowRequest/Transaction. `ItemService.remove()` đếm request rồi cập nhật item; transaction mặc định không tự ngăn một thao tác tạo request ở kết nối khác. Khi bổ sung API tạo request/giao dịch, bắt buộc kiểm tra trạng thái item dưới cùng quy tắc khóa hoặc ràng buộc và thêm integration test chạy hai thao tác đó đồng thời. Hiện tại báo cáo rõ giới hạn này, không tuyên bố đã xử lý mọi race condition.

## P2 — Xác minh giao diện ứng dụng thật

`ui-preview.html` là trang mô phỏng độc lập. Nó không chứng minh route `/items` của Next.js đã hoạt động hoặc đúng theme. Mở chính ứng dụng và chụp desktop/mobile, thử filter, Sheet, ảnh lỗi, trạng thái rỗng/lỗi, dark mode. Đối chiếu báo cáo với code: Sheet thực tế mở từ **bên trái**; preview mô tả từ dưới. Cung cấp ảnh hoặc video của route thật, không thay bằng mock HTML.

## Báo cáo Gemini cần gửi lại

Ghi rõ file/diff đã sửa, SQL migration mới và chứng cứ phân loại từng nhóm dữ liệu, kết quả test chạy file migration thật, giới hạn concurrency còn lại, ảnh route thật desktop/mobile, kết quả build/test và trạng thái migration trên Neon. Chỉ đề xuất deploy khi các ca P0 đều qua và audit dữ liệu Neon được đối chiếu.
