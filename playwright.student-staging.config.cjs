const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'./tests/e2e',
 testMatch:['g4-p6j-student-staging.spec.cjs','g4-infra-01-python-themes.spec.cjs'],
 timeout:30000,
 retries:0,
 reporter:'list',
 use:{browserName:'chromium',headless:true,baseURL:'http://127.0.0.1:5179'},
 webServer:{
  command:'npm --prefix frontend run dev -- --port 5179 --strictPort',
  url:'http://127.0.0.1:5179',
  reuseExistingServer:false,
  timeout:120000,
  env:{VITE_STUDENT_STAGING:'true'}
 }
});
