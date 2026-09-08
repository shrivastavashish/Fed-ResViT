"""Extract implementation/configuration only; never import notebook execution outputs."""
import ast,hashlib,json,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
if len(sys.argv)!=2: raise SystemExit('Usage: python3 scripts/extract-revision-protocol.py /path/to/notebook.ipynb')
p=Path(sys.argv[1])
n=json.loads(p.read_text());ns={'OUTPUT_DIR':'ARTIFACT_ROOT','STUDY_STAGE':'main','STUDY_ROOT':'ARTIFACT_ROOT/study','PILOT_ROUNDS':2};sources={}
for i,c in enumerate(n['cells']):
 if c['cell_type']!='code':continue
 s=''.join(c['source'])
 if any(l.lstrip().startswith(('%','!')) for l in s.splitlines()):continue
 tree=ast.parse(s)
 for node in tree.body:
  if isinstance(node,ast.Assign) and any(isinstance(t,ast.Name) and t.id in ('BASE_CONFIG','PROFILE_OVERRIDES') for t in node.targets):
   exec(compile(ast.Module(body=[node],type_ignores=[]),'config','exec'),ns)
 if 'BASE_CONFIG' in ns and 'PROFILE_OVERRIDES' in ns and 'CONFIG' not in ns:
  ns['CONFIG']=dict(ns['BASE_CONFIG']);ns['CONFIG'].update(ns['PROFILE_OVERRIDES']['target90_v4_multirun'])
 for node in tree.body:
  if isinstance(node,ast.Expr) and isinstance(node.value,ast.Call) and isinstance(node.value.func,ast.Attribute) and isinstance(node.value.func.value,ast.Name) and node.value.func.value.id=='CONFIG' and node.value.func.attr=='update' and node.value.args and isinstance(node.value.args[0],ast.Dict):
   ns['CONFIG'].update(eval(compile(ast.Expression(node.value.args[0]),'revision','eval'),ns))
 defs=[node for node in tree.body if isinstance(node,(ast.FunctionDef,ast.ClassDef))]
 names=[x.name for x in defs]
 if any(x in names for x in ['build_plan','_run_federated_core','TrustAwareAggregator','dirichlet_partition','compute_metrics','FedResViT','set_seed']):
  name=f'cell-{i}.py';(root/'public/evidence/revision'/name).write_text(ast.unparse(ast.Module(body=defs,type_ignores=[]))+'\n')
  sources[name]={'cell':i,'definitions':names,'sha256':hashlib.sha256((root/'public/evidence/revision'/name).read_bytes()).hexdigest()}
cfg=ns['CONFIG'];cfg.pop('OUTPUT_DIR',None)
meta={'protocol_id':'mentor-revision-v2','source_notebook':p.name,'source_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'source_scope':'Implementation and main-stage configuration only. No training outputs ingested.','results_ingested':False,'config':cfg,'sources':sources}
for target in ['lib/protocol.json','public/evidence/revision/protocol.json']:(root/target).write_text(json.dumps(meta,indent=2)+'\n')
print({k:cfg[k] for k in ['NUM_CLIENTS','NUM_ROUNDS','SEEDS','MAX_TRAIN_BATCHES_PER_CLIENT','MAX_VAL_BATCHES','TRUST_GEOM_MEDIAN_ITERS']})
