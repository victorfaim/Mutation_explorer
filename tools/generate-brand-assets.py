from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'brand'
OUT.mkdir(parents=True,exist_ok=True)
DARK=(8,17,31,255); CYAN=(103,232,249,255); PURPLE=(124,58,237,255); AMBER=(245,158,11,255); WHITE=(248,250,252,255)
def symbol(size):
 im=Image.new('RGBA',(size,size),(0,0,0,0)); d=ImageDraw.Draw(im); s=size/128
 d.rounded_rectangle((0,0,size-1,size-1),radius=28*s,fill=DARK)
 d.polygon([(25*s,28*s),(75*s,28*s),(87*s,31*s),(97*s,39*s),(103*s,51*s),(101*s,64*s),(93*s,73*s),(80*s,78*s),(52*s,78*s),(52*s,102*s),(25*s,102*s)],fill=CYAN)
 d.polygon([(52*s,48*s),(72*s,48*s),(80*s,51*s),(80*s,57*s),(72*s,60*s),(52*s,60*s)],fill=DARK)
 d.polygon([(65*s,84*s),(104*s,84*s),(95*s,94*s),(74*s,94*s)],fill=AMBER)
 d.polygon([(74*s,98*s),(95*s,98*s),(91*s,110*s),(78*s,110*s)],fill=AMBER)
 return im
for n in (16,32,180,192,512): symbol(n).save(OUT/f'pal-forge-{n}x{n}.png',optimize=True)
symbol(64).save(ROOT/'favicon.ico',sizes=[(16,16),(32,32),(48,48),(64,64)])
# Social card: original abstract forge motif, no game artwork.
w,h=1200,630
im=Image.new('RGBA',(w,h),DARK); d=ImageDraw.Draw(im)
for y in range(h):
 t=y/(h-1); d.line((0,y,w,y),fill=(8+int(10*t),17+int(8*t),31+int(22*t),255))
for x in range(-200,1300,120): d.line((x,630,x+420,0),fill=(22,42,70,120),width=2)
for y in range(40,630,100): d.line((0,y,w,y),fill=(22,42,70,90),width=2)
mark=symbol(230); im.alpha_composite(mark,(90,130))
font_paths=[Path(r'C:/Windows/Fonts/segoeuib.ttf'),Path(r'C:/Windows/Fonts/arialbd.ttf')]
font_path=next((p for p in font_paths if p.exists()),None)
font=lambda n: ImageFont.truetype(str(font_path),n) if font_path else ImageFont.load_default()
d.text((380,185),'Pal Forge',font=font(92),fill=WHITE)
d.text((386,302),'Community Tools for Palworld',font=font(38),fill=CYAN)
d.rounded_rectangle((386,382,980,448),radius=22,outline=(103,232,249,120),width=2,fill=(12,29,49,220))
d.text((420,396),'Palpedia • Breeding • Maps • Items',font=font(25),fill=(203,213,225,255))
im.convert('RGB').save(OUT/'pal-forge-social.png',quality=90,optimize=True)
