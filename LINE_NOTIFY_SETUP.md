# ตั้งค่าแจ้งเตือนผู้สมัครใหม่เข้ากลุ่ม LINE — The NEW GEN

เมื่อมีนักเรียนสมัคร (ทั้งคอร์สปกติ แพ็คเกจ และโครงการติวฟรี) บอท LINE OA ของสถาบันจะส่งข้อความเข้ากลุ่มทันที:

```
🔔 มีผู้สมัครคอร์สเรียนใหม่!

👤 ชื่อ-สกุล: ด.ช. ภูมิ รักเรียน
🎓 ระดับชั้น: ป.6
📚 คอร์ส: คอร์สรายเทอม 2/69 (ป.6 ติวสอบเข้า ม.1)
📖 วิชา: วิทยาศาสตร์ • คณิตศาสตร์ • ภาษาอังกฤษ
⏰ รอบเวลา: วันเสาร์ (กลุ่ม 1) • 09.00 - 12.15 น. • 7 พ.ย. 2569 - 20 ก.พ. 2570
🏷️ รูปแบบการเรียน: 💻 Online

🆔 ENR-20261019-QWERTY
🕒 19 ต.ค. 2569 12:30
```

ทำตามลำดับ **A → E** (ใช้เวลาประมาณ 30–60 นาที)

> 🔒 **ห้ามใส่ Channel access token หรือ Channel secret ของ LINE ในโค้ดเว็บหรือบน GitHub เด็ดขาด** ใส่ที่ Supabase → Secrets เท่านั้น

---

## A. ฝั่ง LINE — เปิด Messaging API

1. เข้า https://manager.line.biz → เลือกบัญชี LINE OA ของสถาบัน
2. **ตั้งค่า (Settings)** → **Messaging API** → กด **ใช้ Messaging API (Enable Messaging API)**
   - ระบบให้เลือก Provider → สร้างใหม่ ตั้งชื่อเช่น `The NEW GEN` → ตกลง
3. **ตั้งค่า** → **การตั้งค่าบัญชี (Account settings)** → หัวข้อการเข้าร่วมแชทกลุ่ม → เลือก **อนุญาตให้เข้าร่วมแชทกลุ่มและแชทหลายคน**
4. **ตั้งค่า** → **การตอบกลับ (Response settings)**:
   - **แชท (Chat)**: เปิดไว้เหมือนเดิม (ทีมงานยังคุยกับลูกค้าได้ปกติ)
   - **Webhook**: **เปิด**
5. เข้า https://developers.line.biz/console → เลือก Provider ที่สร้าง → เลือก Channel ของ OA
   - แท็บ **Basic settings** → คัดลอก **Channel secret** เก็บไว้
   - แท็บ **Messaging API** → เลื่อนลงล่างสุด **Channel access token (long-lived)** → กด **Issue** → คัดลอกเก็บไว้

## B. ฝั่ง Supabase — ติดตั้งโปรแกรมส่งข้อความ (Edge Function)

1. Supabase Dashboard → เมนู **Edge Functions** → **Deploy a new function** → **Via Editor**
2. ตั้งชื่อ function ว่า **`line-notify`** (ต้องสะกดตรงนี้)
3. ลบโค้ดตัวอย่างทั้งหมด → เปิดไฟล์ `supabase/functions/line-notify/index.ts` ในโปรเจกต์ → Ctrl+A, Ctrl+C → วาง → กด **Deploy**
4. เข้าไปที่ function `line-notify` → หัวข้อ **Details / Settings** → **ปิด** ตัวเลือก **Enforce JWT Verification (Verify JWT)** → Save
   > ต้องปิดเพราะ LINE ไม่มีบัญชี Supabase — โปรแกรมนี้ตรวจความถูกต้องเองด้วยลายเซ็นของ LINE และรหัสลับ
5. Edge Functions → **Secrets** (หรือ Manage secrets) → เพิ่ม 2 ค่า:

| Name | Value |
|---|---|
| `LINE_CHANNEL_ACCESS_TOKEN` | token จากข้อ A.5 |
| `LINE_CHANNEL_SECRET` | Channel secret จากข้อ A.5 |

## C. เชื่อม LINE กับ Supabase และหา Group ID

1. LINE Developers → แท็บ **Messaging API** → **Webhook URL** ใส่:
   ```
   https://wdazilhmlttnurpfewlk.supabase.co/functions/v1/line-notify
   ```
   → **Update** → กด **Verify** (ต้องขึ้น Success) → เปิด **Use webhook**
2. เชิญบัญชี LINE OA ของสถาบันเข้ากลุ่ม LINE ทีมงาน (เมนูกลุ่ม → เชิญ → ค้นหาชื่อ OA)
3. บอทจะตอบในกลุ่มว่า `Group ID ของกลุ่มนี้: Cxxxxxxxx...`
   - ถ้าไม่ตอบ ลองพิมพ์ในกลุ่มว่า `groupid`
4. คัดลอก Group ID (ขึ้นต้นด้วยตัว **C**) → Supabase → Edge Functions → Secrets → เพิ่ม:

| Name | Value |
|---|---|
| `LINE_GROUP_ID` | Group ID ที่บอทตอบ |

## D. ให้ฐานข้อมูลส่งแจ้งเตือนอัตโนมัติ

1. Supabase → **SQL Editor** → New query → เปิดไฟล์ `supabase/03-line-notify.sql` → Ctrl+A, Ctrl+C → วาง → **Run**
2. ผลลัพธ์ด้านล่างจะมีช่อง `notify_secret_copy_this` → คัดลอกค่านั้น
3. Edge Functions → Secrets → เพิ่ม:

| Name | Value |
|---|---|
| `NOTIFY_SECRET` | ค่าจากข้อ 2 |

## E. ทดสอบ

1. เปิดหน้าเว็บในหน้าต่างไม่ระบุตัวตน (Incognito) → สมัครติวฟรีทดสอบ 1 รายการ
2. ภายในไม่กี่วินาที ต้องมีข้อความเข้ากลุ่ม LINE
3. ลบรายการทดสอบในหลังบ้าน

---

## ถ้าไม่มีข้อความเข้ากลุ่ม

รันใน SQL Editor เพื่อดูผลการเรียกล่าสุด:

```sql
select status_code, content::text, created
from net._http_response
order by created desc
limit 5;
```

| ผลที่เห็น | สาเหตุ / วิธีแก้ |
|---|---|
| `401 unauthorized` | `NOTIFY_SECRET` ไม่ตรงกับค่าในข้อ D.2 → คัดลอกใหม่ |
| `500 ... not set` | ยังไม่ได้ใส่ `LINE_CHANNEL_ACCESS_TOKEN` หรือ `LINE_GROUP_ID` |
| `502 line error` | LINE ไม่ยอมส่ง → ดู Edge Functions → `line-notify` → **Logs** (token ผิด / บอทไม่ได้อยู่ในกลุ่ม / โควต้าข้อความเดือนนี้หมด) |
| `404` | ชื่อ function ไม่ใช่ `line-notify` |
| ไม่มีแถวใหม่เลย | ยังไม่ได้รัน `03-line-notify.sql` |

## ข้อควรรู้

- **โควต้าข้อความ LINE OA**: แพ็กเกจฟรีส่งได้จำกัดต่อเดือน (ดูได้ที่ LINE OA Manager) และ**ข้อความเข้ากลุ่มอาจนับตามจำนวนสมาชิก** — กลุ่ม 4 คน = แจ้งเตือน 1 ครั้งอาจนับ 4 ข้อความ
  ถ้าโควต้าหมด แจ้งเตือนจะหยุดจนถึงเดือนถัดไป แต่**ใบสมัครยังบันทึกเข้าระบบปกติ**
- ข้อความตอบ Group ID ในข้อ C เป็น reply ซึ่งไม่กินโควต้า
- ข้อความแจ้งเตือนมีชื่อนักเรียน — ใช้กลุ่มที่มีเฉพาะทีมงาน
- ข้อมูลที่ส่งออกไปยัง LINE มีเฉพาะ ชื่อ-สกุล ชั้น คอร์ส วิชา รอบเวลา รูปแบบการเรียน (ไม่มีเบอร์โทร LINE ID ที่อยู่ หรือรูป)
- ถ้า token หลุด: LINE Developers → Messaging API → ออก token ใหม่ แล้วอัปเดต Secret ใน Supabase
- ปิดการแจ้งเตือนชั่วคราว: รัน `alter table public.enrollments disable trigger trg_notify_line_new_enrollment;`
  เปิดกลับ: `alter table public.enrollments enable trigger trg_notify_line_new_enrollment;`
