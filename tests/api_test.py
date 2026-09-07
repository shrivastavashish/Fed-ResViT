import os,tempfile,unittest
from pathlib import Path
from fastapi.testclient import TestClient
TEMP=tempfile.TemporaryDirectory()
os.environ['FEDRESVIT_DB']=str(Path(TEMP.name)/'evidence.sqlite3')
from backend.app import app,connection
class ApiTests(unittest.TestCase):
 def setUp(self):self.context=TestClient(app);self.client=self.context.__enter__()
 def tearDown(self):self.context.__exit__(None,None,None)
 def test_read_only_availability(self):
  h=self.client.get('/api/health').json();self.assertFalse(h['inference_available']);self.assertFalse(h['training_available'])
  self.assertEqual(self.client.post('/api/predict').status_code,503)
  self.assertEqual(self.client.post('/api/experiments').status_code,501)
 def test_runs_and_invalid_run(self):
  self.assertEqual(len(self.client.get('/api/experiments').json()),8)
  self.assertEqual(len(self.client.get('/api/experiments/trust_mal0p2_seed43/rounds').json()),30)
  self.assertEqual(self.client.get('/api/experiments/nonexistent').status_code,404)
 def test_artifact_boundaries(self):
  self.assertEqual(self.client.get('/api/artifacts/research.json').status_code,200)
  self.assertEqual(self.client.get('/api/artifacts/trust_mal0p2_seed43.pt').status_code,404)
 def test_relations(self):
  with connection() as db:
   self.assertEqual(db.execute('SELECT COUNT(*) FROM federated_round').fetchone()[0],240)
   self.assertEqual(db.execute('SELECT COUNT(*) FROM trust_score').fetchone()[0],600)
   self.assertEqual(db.execute('SELECT COUNT(*) FROM prediction').fetchone()[0],0)
   self.assertEqual(db.execute('PRAGMA foreign_key_check').fetchall(),[])
 def test_replay_stream(self):
  with self.client.websocket_connect('/ws/replay/trust_mal0p2_seed43') as ws:
   first=ws.receive_json();self.assertEqual(first['record']['round'],1);self.assertEqual(first['state'],'EXECUTED');self.assertEqual(first['animation'],'DEMONSTRATION')
 def test_invalid_replay(self):
  with self.client.websocket_connect('/ws/replay/not-a-run') as ws:self.assertIn('error',ws.receive_json())
if __name__=='__main__':unittest.main()
