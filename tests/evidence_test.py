import json,math,unittest
from pathlib import Path
D=json.loads((Path(__file__).resolve().parents[1]/'public/evidence/research.json').read_text())
class EvidenceTests(unittest.TestCase):
 def test_complete_run_grid(self):
  self.assertEqual(len(D['results']),8)
  self.assertEqual({(r['seed'],r['aggregation'],r['malicious_fraction']) for r in D['results']},{(s,a,m) for s in (42,43) for a in ('fedavg','trust') for m in (0,.2)})
  for run in D['results']:
   rounds=[r for r in D['rounds'] if all(r[k]==run[k] for k in ('seed','aggregation','malicious_fraction'))]
   self.assertEqual([r['round'] for r in rounds],list(range(1,31)))
 def test_confusion_report_consistency(self):
  cm=D['confusion']['matrix'];self.assertEqual(sum(map(sum,cm)),1431)
  for i,row in enumerate(cm):
   p=D['confusion']['perclass'][i];self.assertEqual(sum(row),p['support'])
   precision=cm[i][i]/sum(r[i] for r in cm);recall=cm[i][i]/sum(row)
   self.assertAlmostEqual(precision,p['precision'],places=5);self.assertAlmostEqual(recall,p['recall'],places=5)
   self.assertAlmostEqual(2*precision*recall/(precision+recall),p['f1-score'],places=5)
  r=next(r for r in D['results'] if r['id']==D['confusion']['run'])
  self.assertAlmostEqual(sum(cm[i][i] for i in range(7))/1431,r['test_accuracy'],places=5)
  self.assertAlmostEqual(sum(cm[i][0] for i in [1,3,4])/sum(sum(cm[i]) for i in [1,3,4]),r['test_asr'],places=5)
 def test_client_totals(self):
  self.assertEqual(sum(c['samples'] for c in D['clients']),7153)
  for c in D['clients']:self.assertEqual(sum(c['distribution']),c['samples'])
 def test_trust_windows_and_weights(self):
  for s in [42,43]:
   for m in [0,.2]:
    rounds=[r for r in D['rounds'] if r['aggregation']=='trust' and r['seed']==s and r['malicious_fraction']==m]
    for i,r in enumerate(rounds):
     self.assertEqual(len(r['clients']),5)
     self.assertAlmostEqual(sum(c['contribution'] for c in r['clients']),1)
     for c in r['clients']:
      expected=any(x['clients'][c['id']]['phi']<.5 for x in rounds[max(0,i-4):i+1]);self.assertEqual(c['flagged'],expected)
      self.assertAlmostEqual(c['effective_weight'],c['phi']*c['reputation'])
 def test_no_invented_seed_f1(self):
  self.assertEqual(sum(r['test_macro_f1'] is not None for r in D['results']),1)
  self.assertTrue(all(r['clients'] is None for r in D['rounds'] if r['aggregation']=='fedavg'))
 def test_summary_matches_available_runs(self):
  for summary in D['summary']:
   runs=[r for r in D['results'] if r['aggregation']==summary['aggregation'] and r['malicious_fraction']==summary['malicious_fraction']]
   for key in ['test_accuracy','test_asr','test_macro_precision','test_macro_recall','test_macro_specificity']:
    if summary[key] is None:continue
    vals=[r[key] for r in runs];mean=sum(vals)/2;sd=math.sqrt(sum((v-mean)**2 for v in vals))
    self.assertLess(abs(mean-summary[key]),.000051)
    self.assertLess(abs(sd-summary['std'][key]),.000051)
if __name__=='__main__':unittest.main()
