# devlife M5: Life sim (ngày, chỉ số, sự kiện, thông báo, store, cá tính)
Owner: Devlife PM. Duyệt bởi síp 2026-10-17. File này là NGUỒN SỰ THẬT; mọi thay đổi do PM cập nhật.
Nguồn thảo luận chi tiết: group "Devlife Design Room" (Day Designer + Balance Designer).

## Nguyên tắc chung
- Module tách riêng, giao tiếp qua event bus; mọi số/text trong config (src/game/config/*); có docs.
- Lưu local (StorageAdapter, cập nhật docs/db/schema.sql). Animation nhẹ. Room giữ nhỏ.
- Asset dùng ĐÚNG key trong mục "Asset keys" bên dưới. Code dùng placeholder cùng key cho đến khi Art/Sound giao file thật -> chỉ cần thay file.

## 1. Thời gian
- 4 phase: Sáng 6-12, Chiều 12-18, Tối 18-24, Đêm. 1 slot = 2h game; ngày thường 10 slot, cuối tuần 12.
- Thức khuya: thêm slot, mỗi slot thêm SK -4, mood hôm sau -5.
- Lịch: 1 tháng = 4 tuần = 28 ngày; năm 12 tháng. Mỗi thứ có "vị": T2 mood -nhẹ; T6 event deploy; T7-CN rảnh.
- Lễ: Tết (3-4 ngày), 30/4-1/5, Trung thu, Black Friday (store giảm giá), thi cuối kỳ (SV), review lương (J+).

## 2. Chỉ số & thuật toán (statConfig)
Stats 0-100 lưu float, UI làm tròn: energy, health(Sức khỏe), mood. Tiền VND.
Thứ tự mỗi action: base -> diminishing (mood dương: x0.6^timesToday, reset mỗi sáng) -> nhân cá tính -> cộng nội thất (cap 3 món/stat) -> streak (workStreak>=3: energy cost x1.2) -> clamp -> check ngưỡng.
passiveTick mỗi slot thức: mood -1*traitDecay; workStreak>=3: mood -2.
endOfDay: meals<2 SK-5, meals==3 SK+2; mood += furniture.dailyMood; mood += (60-mood)*0.1; 3 ngày làm liền & funSlots<2: mood-3.
sleep(h): Emax = SK<30?70:100; E=min(Emax, E+12.5h+sleepBonus); h<6: SK -=4*(6-h), mood mai -5.
Ngưỡng: E<cost khóa action ("cố làm" SK-5); E<15 không nhận job; mood<30 XP x0.7 & bug+1; mood<15 burnout (khóa freelance ngày mai); SK<30 ốm (Emax 70); SK<10 nằm viện (mất 2 ngày, -1tr).
Event effect: cộng thẳng + clamp + check ngưỡng (KHÔNG nhân cá tính/nội thất).

## 3. Tiền (tháng, đóng ngày 1; lương ngày 10)
| Giai đoạn | Trọ | Điện nước net | Lương |
| SV | 2.8tr | 600k | freelance 300k-1.5tr/job |
| Junior | 6tr | 1.2tr | 15-20tr |
| Senior | 16tr | 2.4tr | 45-60tr |
Ăn: mì 8k (SK-), cơm nhà 25k, cơm tấm 35k. Tiền đầu 3tr. pay = base*(1+0.1*diff)*(0.8+rep/250).
Nợ trọ: mood -3/ngày; từ ngày 3 event chủ trọ nhắc khéo; ngày 7 "chủ trọ gõ cửa". Tiến độ flexible, không ép mốc ngày.

## 4. Sự kiện ngẫu nhiên (eventConfig)
Schema: {id, stages, phases, conditions, weight, cooldownDays(5), text, portrait, choices[{text, effects, setFlags}]}.
Roll: cuối slot (trừ slot đầu & ngủ), p=0.12+pity*0.05; tối đa 1 event nhỏ/ngày; pity++ khi ngày trống (cap 3); mood<30 event tốt weight x1.5; không roll khi terminal mở (đợi đóng). Story beat & event ngưỡng kênh riêng.
Thang: nhẹ mood±3 SK±3 E±5; vừa ±6/±6/±10; mạnh ±12/±10/±20.
18 event: 1 cúp điện (cafe -45k | ngủ sớm +20E); 2 wifi trọ (4G -30k | đọc docs soft XP+, mood-nhẹ); 3 mưa ngập (lội SK-6 | ngồi quán -35k, mất slot); 4 crush (trà sữa -50k mood+12, mất slot | bận mood-6); 5 mẹ gọi (nghe mood+vừa mất slot | đang họp mood-nhẹ); 6 khách quỵt (đòi 50% lấy lại | bỏ qua mood-vừa); 7 sửa chút xíu (free rep+3 E-vừa | báo giá +30% rep-1); 8 Stack Overflow (mood+vừa, job sau bug-1); 9 laptop ồn (vệ sinh -150k | kệ 20% bug+1); 10 karaoke (hát mood+vừa E-vừa | tai nghe mood-nhẹ); 11 group đồ án (flag teamProject); 12 hackathon T6 (hết cuối tuần, thắng 10%+3%*maxLv giải 20tr, XP+200); 13 prod sập 2h (fix SK-10 rep+5 | ngủ rep-5 mood+3); 14 họp vô ích (nghe mất slot soft XP+ | lén code 30% rep-3); 15 headhunter (flag offerChain); 16 đồng nghiệp bao trà sữa (mood+vừa); 17 đau lưng (gym SK+6 E-vừa | panadol SK-3); 18 nhặt 50k (+50k mood+3). Text chi tiết: xem group Design Room / Day Designer.

## 5. Thông báo (tab Thông báo panel trái - đang bỏ trống)
notificationConfig: {id, trigger event, severity info|warn|urgent, icon key, text template, action?}.
Mỗi thông báo có giờ game + icon, chưa đọc -> badge đỏ đếm số; thông báo có hành động có nút (Trả trọ, Xem job, Mở store).
Ví dụ: nhắc trọ trước 1 ngày; trễ trọ ngày N mood-3; lương về; bill điện; SK<30; burnout; deadline còn 1 ngày; khách quen có job; headhunter; dòng tóm tắt mỗi random event; đủ tiền món đang ghim; Black Friday.

## 6. UX hiển thị
- Event có lựa chọn: pause, phòng mờ, khung thoại pixel 1/3 dưới cột game + chân dung + 2-3 nút.
- Event buff: bong bóng thoại trên đầu nhân vật 3s.
- Thay đổi chỉ số: số +/- bay cạnh thanh stat panel phải (gộp nếu >3).
- Trong terminal: chỉ log `> WARN: ...`.
- Cảnh báo ngưỡng: thanh stat nhấp nháy + biểu cảm nhân vật (ho, mây xám).
- Ngày quan trọng: banner trượt đầu cột game 2s + sound.
- Recap khi ngủ: trang "Nhật ký" (tiền, XP, chỉ số so hôm qua, câu hài, tiến độ món đang ghim).

## 7. Store
Phòng Junior/Senior và nội thất mua trong store (thay chuyển stage tự động).
| Món | Giá | Mở khóa | Lợi ích |
| Phòng Junior | 25tr | 1 skill lv3 + rep 30 | sleep +10E, mood +3/ngày |
| Phòng Senior | 180tr | 2 skill lv8 | sleep +20E, SK +2/ngày |
| Cây xanh | 150k | - | mood +2/ngày |
| Quạt / Máy lạnh | 400k / 7tr | - | sleep +5 / +10E |
| Ghế công thái học | 3.5tr | - | job energy -10% |
| Màn hình thứ 2 | 4tr | phòng Junior | work XP +10% |
| Nệm xịn | 5tr | - | SK +1/ngày |
Ghim món muốn nhắm; recap hiện % tiến độ. Black Friday giảm giá (config).

## 8. Cá tính (random 1 khi tạo nhân vật)
Cú đêm (+20% XP sau 22h | sáng E-10); Chăm chỉ (study XP +15% | mood decay x1.3); Hướng ngoại (soft XP +25%, pay +5% | ở nhà 2 ngày mood-5); Tiết kiệm (food -20% | mood mua sắm -50%); Cẩn thận (careful bug -1 | job lâu +10%); Lạc quan (mood floor 20 | XP -5%).

## Thứ tự Code
P1 thời gian+chỉ số+tiền/bill -> P2 sự kiện+thông báo+UX -> P3 store -> P4 cá tính. Mỗi phase 1 PR, báo PM + nhắn riêng síp (link, cách test).

## Asset keys (Art/Sound giao đúng tên; Code dùng placeholder)
Art -> /workspace/devlife-art/out/m5/ (PNG trong suốt, style-locked palette)
- ui_dialog_frame.png (9-slice), ui_diary_page.png, ui_banner.png, ui_store_frame.png, ui_store_card.png, ui_badge_unread.png
- portrait_{mom,crush,landlord,client,boss,roommate,headhunter,coworker}.png (48x48)
- icon_notif_{money,rent,salary,bill,sick,burnout,deadline,job,store,rain,power_outage,event,sale}.png (16x16)
- icon_severity_{info,warn,urgent}.png
- emote_{cough,cloud,happy,sweat}.png; ui_speech_bubble.png
- item_{plant,fan,aircon,ergo_chair,monitor2,mattress}.png (+ thumbnail store 32x32 icon_store_*)
- icon_trait_{night_owl,diligent,extrovert,frugal,careful,optimist}.png
Sound -> /workspace/devlife-sound/ (ogg+mp3, manifest.json, -3dB) — síp nghe duyệt trước khi giao Code
- sfx_notif_info, sfx_notif_warn, sfx_notif_urgent, sfx_event_open, sfx_landlord_knock, sfx_salary, sfx_store_buy, sfx_diary_flip, sfx_sick_cough
