import verification as m
import numpy as np, json
from pathlib import Path

def detail(w,s,y):
 X,Q,K,V,a,z,h,p=m.forward(w,s)
 scores=K@Q[-1]/np.sqrt(2)
 return dict(text=s,target=y,X=X.tolist(),Q=Q.tolist(),K=K.tolist(),V=V.tolist(),scores=scores.tolist(),attention=a.tolist(),z=z.tolist(),h=h.tolist(),logits=[float(h[1]),float(-h[1])],p=p.tolist(),loss=float(-np.log(p[y])))
w=m.initial.copy(); trace=[]
for i in range(21):
 g=m.grad(w)
 trace.append(dict(step=i,W=w.tolist(),gradient=g.tolist(),loss=float(m.loss(w)),train=[detail(w,*s) for s in m.train],test=[detail(w,*s) for s in m.test]))
 if i<20:w=w-.5*g
assert all(b['loss']<a['loss'] for a,b in zip(trace,trace[1:]))
assert all(np.argmax(d['p'])==d['target'] for d in trace[-1]['test'])
for t in trace:
 for d in t['train']+t['test']:
  assert abs(sum(d['attention'])-1)<1e-12 and abs(sum(d['p'])-1)<1e-12
Path(__file__).with_name('reference.json').write_text(json.dumps(dict(embeddings=m.E,vocabulary=['Python','HTML'],seed=12,epsilon=1e-5,eta=.5,trace=trace),indent=2))
print('PASS: 21 états, 126 propagations, normalisations, décroissance et tests finaux')
