"""Extract measured evidence only. Source cells use zero-based notebook indexes."""
import json,re,sys,hashlib,base64,csv,io
from pathlib import Path
from html.parser import HTMLParser
class TableParser(HTMLParser):
 def __init__(self):super().__init__();self.rows=[];self.row=[];self.cell=None;self.depth=0
 def handle_starttag(self,t,a):
  if t=='tr':self.row=[]
  if t in ('td','th'):self.cell=''
 def handle_data(self,d):
  if self.cell is not None:self.cell+=d
 def handle_endtag(self,t):
  if t in ('td','th') and self.cell is not None:self.row.append(self.cell.strip());self.cell=None
  if t=='tr' and self.row:self.rows.append(self.row)
def table(cell):
 for o in reversed(cell.get('outputs',[])):
  if 'text/html' in o.get('data',{}):
   p=TableParser();p.feed(''.join(o['data']['text/html']));return p.rows
 return []
def scalar(v):
 if v in ('NaN','None','—',''):return None
 try:return float(v) if '.' in v or 'e-' in v else int(v)
 except:return v
p=Path(sys.argv[1]);nb=json.loads(p.read_text());cells=nb['cells'];root=Path(__file__).resolve().parents[1];dest=root/'public/evidence';dest.mkdir(parents=True,exist_ok=True)
# Only displayed precision is recoverable; do not reverse-engineer omitted columns.
rows=table(cells[46]);results=[]
for row in rows[1:]:
 d={k:scalar(v) for k,v in zip(rows[0][1:],row[1:]) if k!='...'}
 d['id']=f"{d['aggregation']}_mal{str(float(d['malicious_fraction'])).replace('.', 'p')}_seed{d['seed']}";d['state']='EXECUTED';d['test_macro_f1']=None;results.append(d)
rows=table(cells[48]);summaries=[]
for row in rows[1:]:
 d={};std={}
 for k,v in zip(rows[0][1:],row[1:]):
  if '±' in v:a,b=v.split('±');d[k]=float(a);std[k]=float(b)
  else:d[k]=scalar(v)
 d['std']=std;summaries.append(d)
log='\n'.join(''.join(o.get('text',[])) for o in cells[46]['outputs']);histories=[];current=None
for line in log.splitlines():
 m=re.search(r'Aggregator: (\w+) \| malicious_fraction=([\d.]+) \| seed=(\d+)',line)
 if m:current={'aggregation':m[1],'malicious_fraction':float(m[2]),'seed':int(m[3])}
 m=re.search(r'Round (\d{3}) \| loss=([\d.]+) \| lr=([\de.+-]+) \| val_acc=([\d.]+) \| val_f1=([\d.]+) \| ASR=([^|]+)',line)
 if m and current:
  d={**current,'round':int(m[1]),'loss':float(m[2]),'lr':float(m[3]),'val_accuracy':float(m[4]),'val_macro_f1':float(m[5]),'val_asr':None if 'NA' in m[6] else float(m[6]),'clients':None};histories.append(d)
 if '  dist:' in line:
  m=re.search(r'dist:\s*\[([^\]]+)\]\s*thr:\s*\(([^)]+)\)\s*phi:\s*\[([^\]]+)\]\s*rep:\s*\[([^\]]+)\]\s*flag_now:\s*\[([^\]]+)\]',line)
  assert m,line
  arrays=[[float(x) for x in m[j].replace(',',' ').split()] for j in range(1,6)]
  distances,thresholds,phi,rep,flags=arrays
  histories[-1]['thresholds']=thresholds
  weights=[a*b for a,b in zip(phi,rep)];total=sum(weights)
  histories[-1]['clients']=[{'id':i,'distance':distances[i],'phi':phi[i],'reputation':rep[i],'flagged':bool(flags[i]),'effective_weight':weights[i],'contribution':weights[i]/total if total else None,'ground_truth_malicious':current['malicious_fraction']>0 and i==3} for i in range(5)]
cm=[[908,26,16,4,1,3,0],[49,78,24,5,1,2,0],[33,13,104,2,4,0,1],[7,1,9,52,2,2,1],[4,2,19,7,14,0,1],[2,1,0,1,0,16,0],[4,0,1,2,1,0,8]]
assert sum(map(sum,cm))==1431
assert sum(cm[i][0] for i in [1,3,4])==60
rows=table(cells[52]);perclass=[{'name':row[0],**{k:scalar(v) for k,v in zip(rows[0][1:],row[1:])}} for row in rows[1:8]]
results[-1]['test_macro_f1']=next(float(row[3]) for row in rows if row[0]=='macro avg')
config={}
log7=''.join(''.join(o.get('text',[])) for o in cells[7]['outputs'])
for line in log7.splitlines():
 if line.startswith('  ') and ': ' in line:k,v=line.strip().split(': ',1);config[k]=scalar(v)
clients=[{'id':i,'samples':v[0],'distribution':v[1:]} for i,v in enumerate([[1433,958,159,157,74,47,21,17],[1432,958,159,157,74,47,20,17],[1430,958,159,157,73,47,20,16],[1430,958,159,157,73,47,20,16],[1428,957,159,157,73,46,20,16]])]
stats=[{'condition':0,'metric':'macro_f1','difference':.005481,'t':.700831,'wilcoxon':1,'pairs':2},{'condition':.2,'metric':'macro_f1','difference':.021891,'t':.007335,'wilcoxon':.5,'pairs':2},{'condition':.2,'metric':'asr','difference':-.130357,'t':.145658,'wilcoxon':.5,'pairs':2}]
for i,c in enumerate(cells):
 if c['cell_type']=='code':(dest/f'cell-{i}.py').write_text(''.join(c['source']))
for i,name in [(21,'ham10000-research-gallery.png'),(52,'confusion-matrix-source.png')]:
 for o in cells[i]['outputs']:
  if 'image/png' in o.get('data',{}):(dest/name).write_bytes(base64.b64decode(o['data']['image/png']))
artifact_names=[]
for o in cells[58]['outputs']:
 for line in ''.join(o.get('text',[])).splitlines():
  if line.startswith(' - '):artifact_names.append(Path(line.strip()[2:]).name)
data={'source':{'notebook':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'profile':'target90_v4_multirun','execution':'NVIDIA A100-SXM4-80GB','precision':'Saved display precision; round metrics 4 decimals, trust scores/reputation 3 decimals. Derived weights are approximate.','cells':{'config':7,'split':23,'partition':27,'attack':29,'model':31,'metrics':33,'training':37,'trust':39,'runner':41,'results':46,'summary':48,'confusion':52,'statistics':56}},'results':results,'summary':summaries,'rounds':histories,'config':config,'clients':clients,'confusion':{'run':'trust_mal0p2_seed43','matrix':cm,'source':'Manually transcribed from embedded cell 52 figure; row totals and report metrics verified.','perclass':perclass},'statistics':stats,'artifactNames':artifact_names}
assert len(histories)==240 and len(results)==8 and len(summaries)==4
(dest/'research.json').write_text(json.dumps(data,indent=2,allow_nan=False))
(root/'lib/research.json').write_text(json.dumps(data,allow_nan=False))
for name,items in [('recovered-results.csv',results),('recovered-round-history.csv',[{k:v for k,v in x.items() if k not in ('clients','thresholds')} for x in histories])]:
 with (dest/name).open('w') as f:w=csv.DictWriter(f,fieldnames=list(items[0]));w.writeheader();w.writerows(items)
(dest/'active-config.json').write_text(json.dumps(config,indent=2))
print(f'Extracted {len(results)} runs, {len(histories)} rounds and {sum(x["clients"] is not None for x in histories)} trust snapshots. No generated predictions.')
