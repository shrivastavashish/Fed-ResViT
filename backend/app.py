"""Optional local, read-only evidence API. No training or inference is simulated."""
from contextlib import asynccontextmanager
from pathlib import Path
import asyncio,json,os,sqlite3
from fastapi import FastAPI,HTTPException,WebSocket,WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
ROOT=Path(__file__).resolve().parents[1]
EVIDENCE=ROOT/'public'/'evidence'
DATA=json.loads((EVIDENCE/'research.json').read_text())
DB=Path(os.environ.get('FEDRESVIT_DB',str(ROOT/'work'/'evidence.sqlite3')))
def connection():
 db=sqlite3.connect(DB);db.row_factory=sqlite3.Row;db.execute('PRAGMA foreign_keys=ON');return db
def initialize():
 DB.parent.mkdir(parents=True,exist_ok=True)
 with connection() as db:
  db.executescript((ROOT/'backend/schema.sql').read_text())
  db.execute('INSERT OR IGNORE INTO dataset VALUES (?,?,?,?,?,?)',('ham10000','HAM10000',7,7153,1431,1431))
  h=DATA['source']['sha256']
  db.execute('INSERT OR IGNORE INTO configuration VALUES (?,?,?,?)',(h,DATA['source']['profile'],h,json.dumps(DATA['config'])))
  existing=db.execute('SELECT DISTINCT configuration_id FROM experiment').fetchall()
  if existing and any(r[0]!=h for r in existing):raise RuntimeError('Evidence database belongs to a different notebook. Use a separate FEDRESVIT_DB path.')
  for r in DATA['results']:
   rid=r['id'];db.execute('INSERT OR IGNORE INTO experiment VALUES (?,?,?,?,?,?,?)',(rid,'ham10000',h,r['seed'],r['aggregation'],r['malicious_fraction'],'EXECUTED'))
   for c in DATA['clients']:db.execute('INSERT OR IGNORE INTO client VALUES (?,?,?,?,?)',(rid,c['id'],c['samples'],json.dumps(c['distribution']),int(r['malicious_fraction']>.0 and c['id']==3)))
   db.execute('INSERT OR IGNORE INTO attack VALUES (?,?,?,?,?)',(rid,'targeted_label_flipping' if r['malicious_fraction'] else 'none',json.dumps(['MEL','BCC','AKIEC']) if r['malicious_fraction'] else '[]','NV' if r['malicious_fraction'] else None,1.0 if r['malicious_fraction'] else None))
   db.execute('INSERT OR IGNORE INTO evaluation VALUES (?,?,?,?)',(rid,'best_validation_checkpoint_test',46,json.dumps(r)))
   db.execute('INSERT OR IGNORE INTO research_evidence VALUES (?,?,?,?,?)',(rid,rid,h,46,DATA['source']['precision']))
   for snap in DATA['rounds']:
    if any(snap[k]!=r[k] for k in ('seed','aggregation','malicious_fraction')):continue
    n=snap['round'];db.execute('INSERT OR IGNORE INTO federated_round VALUES (?,?,?)',(rid,n,json.dumps(snap)))
    for c in snap['clients'] or []:
     base=(rid,n,c['id']);db.execute('INSERT OR IGNORE INTO client_update VALUES (?,?,?,?,?)',(*base,0,c['distance']))
     db.execute('INSERT OR IGNORE INTO trust_score VALUES (?,?,?,?,?,?,?)',(*base,c['phi'],int(c['flagged']),*snap['thresholds']))
     db.execute('INSERT OR IGNORE INTO reputation VALUES (?,?,?,?)',(*base,c['reputation']))
     db.execute('INSERT OR IGNORE INTO aggregation VALUES (?,?,?,?,?,?)',(*base,c['effective_weight'],c['contribution'],'Derived from rounded notebook logs'))
  for name in DATA['artifactNames']:
   rid=next((r['id'] for r in DATA['results'] if name.startswith(r['id'])),None)
   db.execute('INSERT OR IGNORE INTO artifact VALUES (?,?,?,?,?)',(name,rid,name,'LISTED_ONLY',58))
  for p in EVIDENCE.iterdir():
   if p.is_file():db.execute('INSERT OR IGNORE INTO artifact VALUES (?,?,?,?,?)',('recovered:'+p.name,None,p.name,'RECOVERED_FROM_NOTEBOOK',52 if p.suffix=='.png' else 46))
@asynccontextmanager
async def lifespan(app):
 initialize();yield
app=FastAPI(title='Fed-ResViT Evidence API',version='1.0.0',lifespan=lifespan)
app.add_middleware(CORSMiddleware,allow_origins=['http://localhost:3000','http://127.0.0.1:3000'],allow_methods=['GET'],allow_headers=['Content-Type'])
@app.get('/api/health')
def health():return {'status':'ready','mode':'executed_evidence','inference_available':False,'training_available':False,'source_hash':DATA['source']['sha256']}
@app.get('/api/experiments')
def experiments():return DATA['results']
@app.get('/api/experiments/{run_id}')
def experiment(run_id:str):
 result=next((r for r in DATA['results'] if r['id']==run_id),None)
 if result is None:raise HTTPException(404,'Run was not executed in the supplied evidence.')
 return result
@app.get('/api/experiments/{run_id}/rounds')
def rounds(run_id:str):
 experiment(run_id)
 with connection() as db:return [json.loads(r['payload']) for r in db.execute('SELECT payload FROM federated_round WHERE experiment_id=? ORDER BY round',(run_id,))]
@app.get('/api/artifacts')
def artifacts():
 with connection() as db:return [dict(r) for r in db.execute('SELECT * FROM artifact ORDER BY name')]
@app.get('/api/artifacts/{name}')
def artifact(name:str):
 allowed={p.name:p for p in EVIDENCE.iterdir() if p.is_file()}
 if name not in allowed:raise HTTPException(404,'Artifact bytes were not supplied.')
 return FileResponse(allowed[name],filename=name)
@app.post('/api/predict')
def predict():raise HTTPException(503,'Checkpoint and inference service are not connected. No prediction was generated.')
@app.post('/api/experiments')
def submit():raise HTTPException(501,'Training is not connected. Export a configuration from Experiment Studio; no job was started.')
@app.websocket('/ws/replay/{run_id}')
async def replay(ws:WebSocket,run_id:str):
 await ws.accept()
 try:
  try:items=rounds(run_id)
  except HTTPException:await ws.send_json({'error':'Run not executed'});await ws.close(code=1008);return
  for r in items:
   await ws.send_json({'type':'recorded_round','state':'EXECUTED','animation':'DEMONSTRATION','source_cell':46,'record':r});await asyncio.sleep(.1)
  await ws.send_json({'type':'complete','rounds':len(items)});await ws.close()
 except WebSocketDisconnect:pass
