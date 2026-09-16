"""Extract measured main-study aggregates and figures from a completed notebook.

Run from the site root: python scripts/extract_main_study_results.py /path/to/FedResViT.ipynb
"""
import json,hashlib,re,sys,base64
from html.parser import HTMLParser
from pathlib import Path
if len(sys.argv) != 2:
 raise SystemExit('Usage: python scripts/extract_main_study_results.py NOTEBOOK.ipynb')
P=Path(sys.argv[1])
n=json.loads(P.read_text())
class Table(HTMLParser):
 def __init__(self):super().__init__();self.rows=[];self.row=None;self.cell=None
 def handle_starttag(self,tag,attrs):
  if tag=='tr':self.row=[]
  if tag in ('td','th') and self.row is not None:self.cell={'tag':tag,'text':'','attrs':dict(attrs)}
 def handle_data(self,data):
  if self.cell is not None:self.cell['text']+=data
 def handle_endtag(self,tag):
  if tag in ('td','th') and self.cell is not None:self.cell['text']=self.cell['text'].strip();self.row.append(self.cell);self.cell=None
  if tag=='tr' and self.row is not None:self.rows.append(self.row);self.row=None
def table(i,j):
 t=Table();t.feed(''.join(n['cells'][i]['outputs'][j]['data']['text/html']));return t.rows
def f(x):
 try:
  v=float(x)
  return None if v!=v else v
 except:return None
rows=table(79,1);data=[];part=frac=None
for r in rows[3:]:
 if len(r)<13:continue
 c=r[:]
 if c[0]['text'] in ('dirichlet','stratified_balanced'):part=c.pop(0)['text']
 if c[0]['text'] in ('0.0','0.1','0.2','0.3'):frac=float(c.pop(0)['text'])
 method=c.pop(0)['text']
 if method not in ['fedavg','krum','trimmed_mean','coordinate_median','trust']:continue
 vals=[f(x['text']) for x in c]
 data.append({'partition':part,'fraction':frac,'method':method,'accuracy':vals[0:3],'macro_f1':vals[3:6],'malignant_recall':vals[6:9],'asr':vals[9:12]})
assert len(data)==40,len(data)
# Simple tables with row index then six data columns.
def basic(i,j):
 out=[]
 for r in table(i,j)[1:]:
  a=[x['text'] for x in r]
  if a and a[0].isdigit():out.append(a[1:])
 return out
asr=basic(71,1);rec=basic(72,1)
for arr,key in [(asr,'asr'),(rec,'malignant_recall')]:
 for a in arr:
  part,frac,method=a[:3];matches=[v for v in data if v['partition']==part and v['fraction']==float(frac) and v['method']==method]
  if len(matches)==1:
   # Compare against final consolidated table.
   x=matches[0][key];y=[f(v) for v in a[3:6]]
   if x[0] is not None and y[0] is not None: assert abs(x[0]-y[0])<0.00001,(key,a,x)
# Add precision, macro recall, detection and FPR from the displayed summary table.
summary_rows=table(59,1)[3:]
assert len(summary_rows)==40,len(summary_rows)
for item,r in zip(data,summary_rows):
 a=[x['text'] for x in r]
 start=a.index('10')+1
 assert abs(float(a[start+1])-item['accuracy'][0])<0.00001
 item['macro_precision']=[f(v) for v in a[start+4:start+7]]
 item['macro_recall']=[f(v) for v in a[start+7:start+10]]
 tail=a[a.index('...')+1:]
 item['malignant_macro_recall']=[f(tail[2]),f(tail[3]),f(tail[1])]
 item['detection_rate']=[f(tail[5]),f(tail[6]),f(tail[4])]
 item['false_positive_rate']=[f(tail[8]),f(tail[9]),f(tail[7])]
# Aggregate confusion is all 200 model evaluations, not one run.
conf=[]
for r in table(64,3)[1:]:
 a=[x['text'] for x in r]
 if a and a[0] in ['nv','mel','bkl','bcc','akiec','vasc','df']:conf.append([int(x) for x in a[1:]])
assert len(conf)==7
meta={'notebook':'FedResViT (2).ipynb','sha256':hashlib.sha256(P.read_bytes()).hexdigest(),'source_cells':{'main_summary':79,'asr':71,'malignant_recall':72,'confusion_all_200':64,'statistics':68},'scope':'200 completed main-study runs; fixed lesion-disjoint split; 5 seeds; 2 partitions; 5 methods; fractions 0, 0.1, 0.2, 0.3','records':data,'aggregate_confusion':conf}
summary_json=json.dumps(meta,indent=2)+'\n'
Path('lib/main-study-results.json').write_text(summary_json)
print('Extracted', len(data), 'main-study groups from', P)
figures=Path('public/evidence/main-study')
figures.mkdir(parents=True,exist_ok=True)
(figures/'summary.json').write_text(summary_json)
for index,output in enumerate(n['cells'][62]['outputs']):
 encoded=output.get('data',{}).get('image/png')
 if not encoded: continue
 fraction=[0,10,20,30][(index-1)//2]
 metric='macro-f1' if index%2 else 'malignant-recall'
 (figures/f'{metric}-{fraction}.png').write_bytes(base64.b64decode(''.join(encoded)))
print('Exported 8 measured convergence figures')
