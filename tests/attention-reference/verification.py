import numpy as np
from math import sqrt
E={'en':[1,0],'nsi':[0,1],'web':[0,-1],'on':[0,0],'tu':[0,0],'vas':[0,0],'code':[0,0],'programme':[0,0],'programmer':[0,0]}
train=[('nsi on programme en',0),('web on code en',1),('en nsi on code en',0),('en web on programme en',1)]
test=[('en nsi tu vas programmer en',0),('en web tu vas programmer en',1)]
rng=np.random.default_rng(12); W=rng.choice([-0.5,0.5],size=(3,2,2)); initial=W.copy()
def soft(x):
 e=np.exp(x-np.max(x));return e/e.sum()
def forward(W,s):
 X=np.array([E[t] for t in s.split()]); Q,K,V=[X@w for w in W]; a=soft(K@Q[-1]/sqrt(2)); z=a@V; h=X[-1]+z; p=soft(np.array([h[1],-h[1]]));return X,Q,K,V,a,z,h,p
def loss(W,data=train):return np.mean([-np.log(forward(W,s)[-1][y]) for s,y in data])
def grad(W):
 g=np.zeros_like(W); eps=1e-5
 for i in np.ndindex(W.shape):
  d=np.zeros_like(W);d[i]=eps;g[i]=(loss(W+d)-loss(W-d))/(2*eps)
 return g
if __name__=='__main__':
 print('initial',W,loss(W));print('gradient',grad(W));
 for i in range(20):
  W-=.5*grad(W)
  if i in [0,1,4,9,19]:print(i+1,loss(W),W, [forward(W,s)[-1] for s,y in test])
 print('test detail',forward(W,test[0][0]))
