# devlife M5.1: UI polish (síp yêu cầu 2026-10-17)
Owner: Devlife PM. Sửa TỪNG PHẦN, mỗi phần 1 PR nhỏ. Hai dev: Devlife Code (Dev A) và Devlife Code 2 (Dev B) làm song song, phần nào cần asset mới thì dùng placeholder đúng key, Art giao file sau. Mockup Art -> PM -> síp duyệt. Giữ style pixel/HUD, animation nhẹ, số trong config, save đổi schema phải có migration.

## Dev A (Devlife Code)
A1. Banner ngày quan trọng: to hơn, trượt xuống + bounce, viền vàng lấp lánh + confetti pixel 1.5s, giữ 3s, overlay mờ nhẹ. sfx_event_open.
A2. Popup tạo nhân vật: heading "Bạn đã hóa thân vào nhân vật:"; slot-machine quay 6 icon_trait_* ~1.5s rồi dừng + flash; hiện avatar, trait + mô tả hiệu ứng, chỉ số khởi đầu; nút "Bắt đầu".
A3. Nhật ký thành cửa sổ Notepad (titlebar "nhat_ky_ngay_N.txt", nút _ □ x), giữ font. Tiền tách: Kiếm được +X (xanh), Đã tiêu -Y (đỏ, liệt kê ngắn ăn/trọ/mua đồ), Còn lại Z.
A4. Sự kiện trong task/terminal: khách đổi yêu cầu -> dòng WARNING vàng nhấp nháy 3 lần + rung nhẹ; có bug -> dòng ERROR đỏ nhấp nháy. Áp cho mọi event, không chỉ debug.
A5. Ăn uống: nút icon bát cơm mở popup ăn uống. Đói 3 mức theo số slot từ bữa gần nhất: 0-2 No, 3-4 Hơi đói, >=5 Đói (icon nhấp nháy nhẹ + thông báo nhắc ăn). Mốc trong config.

## Dev B (Devlife Code 2)
B1. Hệ nút mới: pixel 3D (viền đậm 2px, mặt sáng + đáy tối, nhấn lún 2px, hover sáng), biến thể primary/secondary/danger + nút icon vuông. Làm component dùng chung trước để A dùng lại.
B2. Nút đi ngủ: icon giường + "zzz" bay nhẹ, không chữ, tooltip "Đi ngủ".
B3. Nút cửa hàng chỉ icon shop, dời lên thanh icon HUD; store thành popup modal.
B4. Thông báo: badge đỏ to hơn (~16px); item gọn lại (padding/font nhỏ, 1-2 dòng); icon action: trả trọ = cọc tiền, xem job = ticket, mở store = túi, đi ăn = bát cơm, ngủ = giường.
B5. Desktop: 2 panel hai bên cao tối đa = viewport, fixed/sticky, nội dung tự scroll.

## Asset keys mới (Art -> /workspace/devlife-art/out/m5_1/, native + _x2)
icon_btn_sleep, icon_btn_store, icon_btn_food, icon_action_{pay_rent,view_job,open_store,eat,sleep}, icon_hunger_{full,peckish,hungry}, ui_btn_{primary,secondary,danger,icon} (9-slice, normal/hover/pressed), ui_window_notepad, ui_badge_unread_lg, fx_confetti (spritesheet), ui_banner_v2.

## Đồng bộ
- Tránh đụng file của nhau: B sở hữu components/ui/button + HUD bar + notifications panel + layout; A sở hữu banner, onboarding, diary, terminal events, food. Cần sửa file bên kia thì nhắn dev kia/PM trước.
- Rebase lên main trước khi merge; mỗi PR báo PM + síp link và cách test.
