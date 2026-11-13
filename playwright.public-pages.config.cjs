const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'./tests/e2e',
 testMatch:'g4-public-pages-runtime.spec.cjs',
 timeout:45000,
 retries:0,
 reporter:'list',
 use:{browserName:'chromium',headless:true,baseURL:'http://127.0.0.1:5180/microalbert-lab/'},
 webServer:{
  command:'npm --prefix frontend run dev -- --help',
  url:'http://127.0.0.1:5180/microalbert-lab/',
  reuseExistingServer:false,
  timeout:120000
 }
});
