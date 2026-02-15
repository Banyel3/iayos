"""Create comprehensive KYC test images for live backend testing."""
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
import os

img_dir = 'tests/test_images'
os.makedirs(img_dir, exist_ok=True)

# Load face 1 as our primary test subject
face1 = Image.open(f'{img_dir}/kyc_face_1.jpg')
face2 = Image.open(f'{img_dir}/kyc_face_2.jpg')

# 1. Create 'selfie' variant - slightly different crop/brightness (same person)
selfie = face1.copy()
w, h = selfie.size
selfie = selfie.crop((int(w*0.05), int(h*0.05), int(w*0.95), int(h*0.95)))
selfie = selfie.resize((800, 800))
enhancer = ImageEnhance.Brightness(selfie)
selfie = enhancer.enhance(1.15)
selfie.save(f'{img_dir}/kyc_selfie_1.jpg', quality=90)
print(f'Created kyc_selfie_1.jpg: {os.path.getsize(f"{img_dir}/kyc_selfie_1.jpg")} bytes')

# 2. Create 'front ID' - face on a fake ID card layout
id_card = Image.new('RGB', (856, 540), (255, 255, 255))
draw = ImageDraw.Draw(id_card)
draw.rectangle([0, 0, 856, 80], fill=(0, 51, 153))
draw.rectangle([0, 460, 856, 540], fill=(0, 51, 153))

try:
    font_lg = ImageFont.truetype('arial.ttf', 20)
    font_sm = ImageFont.truetype('arial.ttf', 14)
    font_xs = ImageFont.truetype('arial.ttf', 12)
except:
    font_lg = ImageFont.load_default()
    font_sm = font_lg
    font_xs = font_lg

draw.text((200, 20), 'REPUBLIKA NG PILIPINAS', fill='white', font=font_lg)
draw.text((200, 50), 'PHILIPPINE IDENTIFICATION CARD', fill='white', font=font_sm)

face_thumb = face1.copy().resize((200, 250))
id_card.paste(face_thumb, (40, 120))

draw.text((280, 130), 'SURNAME: DELA CRUZ', fill='black', font=font_sm)
draw.text((280, 160), 'GIVEN NAME: JUAN PEDRO', fill='black', font=font_sm)
draw.text((280, 190), 'MIDDLE NAME: SANTOS', fill='black', font=font_sm)
draw.text((280, 220), 'DATE OF BIRTH: 15/03/1995', fill='black', font=font_sm)
draw.text((280, 250), 'SEX: M', fill='black', font=font_sm)
draw.text((280, 280), 'ADDRESS: 123 RIZAL ST, TETUAN', fill='black', font=font_sm)
draw.text((280, 310), 'ZAMBOANGA CITY', fill='black', font=font_sm)
draw.text((280, 340), 'PSN: 1234-5678-9012-3456', fill='black', font=font_sm)
draw.text((60, 470), 'CARD NO: PH-20250001-12345', fill='white', font=font_xs)

id_card.save(f'{img_dir}/kyc_front_id_1.jpg', quality=92)
print(f'Created kyc_front_id_1.jpg: {os.path.getsize(f"{img_dir}/kyc_front_id_1.jpg")} bytes')

# 3. Create 'back ID'
back_id = Image.new('RGB', (856, 540), (240, 240, 240))
draw_back = ImageDraw.Draw(back_id)
draw_back.rectangle([0, 0, 856, 60], fill=(0, 51, 153))
draw_back.text((200, 15), 'BACK OF IDENTIFICATION CARD', fill='white', font=font_lg)
draw_back.text((40, 100), 'IMPORTANT REMINDERS:', fill='black', font=font_sm)
draw_back.text((40, 130), '1. This card is non-transferable', fill='black', font=font_xs)
draw_back.text((40, 155), '2. Report lost or stolen cards immediately', fill='black', font=font_xs)
draw_back.text((40, 180), '3. Card valid for 5 years from date of issue', fill='black', font=font_xs)
draw_back.rectangle([200, 350, 650, 420], fill=(0, 0, 0))
draw_back.text((250, 440), 'MACHINE READABLE ZONE', fill='gray', font=font_xs)
back_id.save(f'{img_dir}/kyc_back_id_1.jpg', quality=92)
print(f'Created kyc_back_id_1.jpg: {os.path.getsize(f"{img_dir}/kyc_back_id_1.jpg")} bytes')

# 4. Create 'NBI clearance' mock
clearance = Image.new('RGB', (800, 1100), (255, 255, 255))
draw_c = ImageDraw.Draw(clearance)
draw_c.rectangle([0, 0, 800, 120], fill=(0, 72, 42))
draw_c.text((150, 30), 'NATIONAL BUREAU OF INVESTIGATION', fill='white', font=font_lg)
draw_c.text((250, 65), 'NBI CLEARANCE', fill='white', font=font_lg)
draw_c.text((100, 160), 'NBI CLEARANCE NO: 2025-12345678', fill='black', font=font_sm)
draw_c.text((100, 200), 'NAME: DELA CRUZ, JUAN PEDRO SANTOS', fill='black', font=font_sm)
draw_c.text((100, 240), 'DATE OF BIRTH: March 15, 1995', fill='black', font=font_sm)
draw_c.text((100, 280), 'ADDRESS: 123 Rizal St, Tetuan, Zamboanga City', fill='black', font=font_sm)
draw_c.text((100, 340), 'RESULT: NO DEROGATORY RECORD AS OF DATE', fill=(0, 100, 0), font=font_lg)
draw_c.text((100, 400), 'VALID UNTIL: February 14, 2026', fill='black', font=font_sm)
draw_c.text((100, 440), 'PURPOSE: EMPLOYMENT', fill='black', font=font_sm)
draw_c.text((100, 500), 'ISSUED AT: NBI ZAMBOANGA FIELD OFFICE', fill='black', font=font_sm)
draw_c.ellipse([300, 700, 500, 900], outline='red', width=3)
draw_c.text((345, 770), 'NBI OFFICIAL', fill='red', font=font_xs)
draw_c.text((360, 790), 'STAMP', fill='red', font=font_xs)
clearance.save(f'{img_dir}/kyc_clearance_1.jpg', quality=92)
print(f'Created kyc_clearance_1.jpg: {os.path.getsize(f"{img_dir}/kyc_clearance_1.jpg")} bytes')

# 5. Create different person selfie for mismatch test
diff_selfie = face2.copy().resize((800, 800))
diff_selfie.save(f'{img_dir}/kyc_selfie_different.jpg', quality=90)
print(f'Created kyc_selfie_different.jpg (different person)')

print('\nAll KYC test images created successfully!')
for f in sorted(os.listdir(img_dir)):
    size = os.path.getsize(os.path.join(img_dir, f))
    print(f'  {f}: {size:,} bytes')
