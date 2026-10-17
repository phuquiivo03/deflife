# devlife M5.2: layout fix + job management (síp 2026-10-17 21:06)
Owner: Devlife PM. PR xong gửi PM review, PM merge. Mỗi mục 1 PR. Save đổi schema phải có migration.
Ảnh hiện trạng síp gửi: layout hiện tại lệch mockup m5_1_v2.

## L. Layout (CHỜ mockup Art -> síp duyệt rồi mới code) — Dev B (Devlife Code 2)
L1. Thanh trên cùng, phía trên canvas: Tiền + Ngày/giờ + nút Cửa hàng (icon).
L2. Nút Ăn (bát cơm) đặt cạnh nút Ngủ; nút Ngủ giữ vị trí cũ. Bỏ bát cơm + chữ "Đói" đang nằm riêng dưới card.
L3. Popup sự kiện (Mẹ gọi, Cúp điện...) hiện trên canvas, phần dưới canvas (overlay), không nằm cuối trang.
L4. Mọi nút khác (Học, Việc làm, Kỹ năng, Đã đọc, nút trong popup...) theo style nút "Ăn"/"Xem job" trong thông báo (nền sáng, viền đậm tối, chữ tối, icon trái).

## N. Không đổi layout (làm ngay) — Dev B (Devlife Code 2)
N1. Thông báo đói KHÔNG đưa vào panel Thông báo (chỉ hiện ở nút Ăn).
N2. Nút Ăn: bỏ icon đói nhỏ nhấp nháy; khi đói thì chính icon bát cơm trong nút nhấp nháy (Hơi đói: nhấp nháy chậm/nhẹ; Đói: rõ hơn). Tooltip ghi mức đói.

## J. Hệ thống job mới — Dev A (Devlife Code)
J1. Mỗi thông báo job = đúng 1 job (tên, mảng skill, độ khó, tiền, deadline). Nút: "Nhận" và "Bỏ qua" (đóng thông báo). Nhiều job thì nhiều thông báo, nhưng phân bổ rải: tối đa 1 thông báo job mới mỗi 2 slot, tối đa 3 job chưa xử lý trong panel; thông báo job tự hết hạn sau 1 ngày nếu không nhận.
J2. Bảng Quản lý job (mở từ nút "Việc làm"): danh sách job đã nhận, mỗi job hiện tiền, độ khó, deadline còn lại (đỏ khi còn <=1 ngày), nút "Làm" mở màn terminal hiện tại cho đúng job đó. Job xong rời bảng, nhận tiền như cũ.
J3. Nhận bao nhiêu tùy (không giới hạn). Deadline mặc định theo độ khó: dễ 2 ngày, vừa 3 ngày, khó 4 ngày (config). Quá deadline chưa xong: job bị hủy, rep -5 (config), thông báo warning "Trễ deadline: <job>" + mood -3. Còn 1 ngày: thông báo nhắc deadline có nút "Làm".
J4. Migration: job đang dở/cũ chuyển thành job đã nhận với deadline mới tính từ hôm nay.

## Đồng bộ
- Dev A sở hữu: job store/logic, bảng Quản lý job, notice job (nội dung + action accept/dismiss qua notice API).
- Dev B sở hữu: NotificationsPanel (render nút Nhận/Bỏ qua chung cho mọi notice có actions), HUD/top bar, layout, nút, event popup placement.
- Thống nhất notice action ids mới: acceptJob, dismissNotice, openJobs. Id lạ = no-op + warn.
