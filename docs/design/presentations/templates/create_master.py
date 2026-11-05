#!/usr/bin/env python3
"""Original editable SMPT v2 slide-template generator.

Builds a reusable 8-layout starter. PowerPoint text and figures remain editable.
Requires python-pptx: pip install python-pptx
Usage: python templates/create_master.py [output.pptx]
For production use, replace sample figures with controlling model outputs and verify exports.
No proprietary consulting images or fonts are included.
"""
from pathlib import Path
import sys
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

DARK="12110F"; PAPER="F5F3EE"; INK="1B1915"; GOLD="C8993E"
ACCENT="7A5510"; LIGHT="E3B04B"; WHITE="EFECE6"; MUTED="5B5548"
SOFT="E9E5DC"; BORDER="D8D3C7"
prs=Presentation(); prs.slide_width=Inches(13.333); prs.slide_height=Inches(7.5)
blank=prs.slide_layouts[6]

def col(c): return RGBColor.from_string(c)

def box(sl,x,y,w,h,c,outline=None):
    s=sl.shapes.add_shape(MSO_SHAPE.RECTANGLE,Inches(x),Inches(y),Inches(w),Inches(h))
    s.fill.solid(); s.fill.fore_color.rgb=col(c)
    if outline: s.line.color.rgb=col(outline)
    else: s.line.fill.background()
    return s

def txt(sl,value,x,y,w,h,pt=18,bold=False,ink=INK,serif=False):
    s=sl.shapes.add_textbox(Inches(x),Inches(y),Inches(w),Inches(h))
    tf=s.text_frame; tf.clear(); tf.word_wrap=True
    tf.margin_left=Inches(.02); tf.margin_top=Inches(.02)
    p=tf.paragraphs[0]; p.text=value
    p.font.name="Georgia" if serif else "Source Sans 3"
    p.font.size=Pt(pt); p.font.bold=bold; p.font.color.rgb=col(ink)
    return s

def page(title,number,subtitle="",dark=False):
    s=prs.slides.add_slide(blank)
    box(s,0,0,13.333,7.5,DARK if dark else PAPER)
    box(s,0,0,13.333,.12,GOLD if dark else DARK)
    txt(s,"SMPT / RESEARCH PRESENTATION",.62,.35,10,.33,11,True,LIGHT if dark else ACCENT)
    txt(s,str(number).zfill(2),12,.35,.65,.33,11,False,LIGHT if dark else MUTED)
    txt(s,title,.62,.84,12,1.14,26,True,WHITE if dark else INK,True)
    if subtitle: txt(s,subtitle,.62,2.02,12,.42,13,False,"AAA397" if dark else MUTED)
    box(s,.62,2.47,12.05,.015,"433E34" if dark else BORDER)
    box(s,.62,6.91,12.05,.015,"433E34" if dark else BORDER)
    txt(s,"Original SMPT template • replace all example inputs before publication",.62,7.00,11.25,.24,9,False,"AAA397" if dark else MUTED)
    return s

# 1: Cover / house identity
s=prs.slides.add_slide(blank);box(s,0,0,13.333,7.5,DARK);box(s,0,0,13.333,.12,GOLD)
txt(s,"STRATEGIC MATERIALS POLICY TRACKER",.7,.68,11,.40,15,True,LIGHT)
txt(s,"Industrial capital and\\ncommercial execution",.7,1.62,11.6,1.8,42,True,WHITE,True)
txt(s,"Reusable 16:9 research presentation system",.72,4.19,11.7,.66,22,False,WHITE)
box(s,.72,5.5,3.2,.05,LIGHT)
txt(s,"Version 2.0 • 5 November 2026",.72,5.87,8.1,.4,15,False,"AAA397")

# 2: Executive thesis
s=page("State the answer before the evidence",2,"Executive findings — one governing judgment and three drivers")
for i,(large,label) in enumerate([("£61m","Core financing"),("£40–45m","Project spend guidance"),("Timing","Commercial dependency")]):
    x=.68+i*4.08;box(s,x,2.92,3.80,2.12,SOFT)
    txt(s,large,x+.22,3.17,3.37,.64,31,True,ACCENT,True)
    txt(s,label,x+.22,4.13,3.37,.45,18,True,INK)
txt(s,"The analysis must explain the mechanism connecting these facts.",.69,5.66,11.4,.58,19,False,INK)

# 3: Dominant original exhibit
s=page("Core financing and uncommitted capacity are different",3,"Financial instruments • reported amounts (£m)")
box(s,.73,3.07,5.1,1.05,DARK);box(s,5.83,3.07,3.54,1.05,GOLD)
txt(s,"£36m equity",.95,3.43,4.6,.46,21,True,WHITE)
txt(s,"£25m core loan",6.0,3.43,3.12,.46,21,True,INK)
txt(s,"£61m gross core",9.68,3.37,2.70,.66,23,True,ACCENT,True)
box(s,.73,4.78,3.40,.65,PAPER,ACCENT)
txt(s,"£10m uncommitted",.92,4.96,3.10,.37,17,True,ACCENT)
txt(s,"Separate legal status; not available cash.",4.47,4.97,7.55,.52,18,False,INK)

# 4: Financial mechanism matrix
s=page("Compare like-for-like contractual terms",4,"Decision matrix — edit categories and source values")
rows=[("Equity","Residual financial risk","No principal maturity"),("Loan","Interest / repayment","Full core draw reported"),("Accordion","Conditional borrowing","Not committed")]
for i,(kind,mechanism,status) in enumerate(rows):
    y=2.96+i*1.04;box(s,.74,y,11.80,.85,SOFT if i%2==0 else PAPER)
    txt(s,kind,.96,y+.17,2.3,.44,19,True,ACCENT)
    txt(s,mechanism,3.33,y+.17,4.16,.52,18,False,INK)
    txt(s,status,8.13,y+.17,3.96,.52,18,False,INK)

# 5: Milestone-to-cash conversion
s=page("Show reporting status at each commercial milestone",5,"Source date, activity date and verification status should stay distinct")
for i,(stage,status) in enumerate([("Processing","Issuer-reported"),("Offtake","Contract signed"),("Deliveries","Verification open"),("Collections","Verification open")]):
    x=.74+i*3.10;box(s,x,3.17,2.79,.83,DARK if i<2 else SOFT,ACCENT if i>=2 else None)
    txt(s,stage,x+.15,3.38,2.45,.42,19,True,WHITE if i<2 else INK)
    txt(s,status,x+.10,4.26,2.59,.65,16,False,MUTED)
box(s,.74,5.60,11.75,.54,SOFT)
txt(s,"Sequence shows information needs, not a claim of achieved production or cash receipts.",.95,5.73,11.28,.34,16,False,INK)

# 6: Scenario drivers
s=page("Label each sensitivity driver and its source",6,"Illustrative £m increments; not a current cash shortage")
for i,(name,amount,length) in enumerate([("Capex increment","2.50",3.30),("Delay proxy","3.00",3.96),("Rate proxy","0.25",.36)]):
    y=3.02+i*.94;txt(s,name,.77,y,3.9,.47,19,False,INK)
    box(s,4.86,y-.02,length,.53,[DARK,GOLD,"928A7D"][i])
    txt(s,"£"+amount+"m",5.11+length,y-.02,2,.49,20,True,INK)
txt(s,"Total incremental stress: £5.75m",.79,6.12,11.4,.43,21,True,ACCENT,True)

# 7: Stakeholder decisions
s=page("Different users require different supporting disclosures",7,"Investment research should identify who needs which evidence")
items=[("Investors","Cash headroom and funding/dilution risks"),
       ("Lenders","Maturity, security and refinancing terms"),
       ("Public capital","Use of proceeds and realized industrial results")]
for i,(actor,needs) in enumerate(items):
    y=2.94+i*1.07;box(s,.74,y,3.08,.83,DARK);box(s,3.82,y,8.67,.83,SOFT)
    txt(s,actor,.96,y+.18,2.65,.48,18,True,WHITE)
    txt(s,needs,4.06,y+.18,8.11,.48,18,False,INK)

# 8: Conclusion
s=page("Finish with the evidence that could change the judgment",8,"Specific monitoring indicators; preserve analytical uncertainty",True)
txt(s,"Established",.77,3.01,2.7,.4,18,True,LIGHT)
txt(s,"Government-backed instruments, disclosed project spending and operating progress",.78,3.49,11.7,.90,23,False,WHITE)
box(s,.76,4.69,11.78,.018,"433E34")
txt(s,"Unresolved",.77,4.99,2.7,.4,18,True,LIGHT)
txt(s,"Current cash, full debt position, collections and refinancing arrangements",.78,5.44,11.7,.90,23,False,WHITE)

dest=Path(sys.argv[1] if len(sys.argv)>1 else "SMPT_Research_Master_v2.pptx")
dest.parent.mkdir(parents=True,exist_ok=True)
prs.save(dest)
print(f"Created {dest} ({len(prs.slides)} editable slides)")
