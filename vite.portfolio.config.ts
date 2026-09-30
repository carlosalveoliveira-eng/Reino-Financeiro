import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  plugins:[react(),{name:'portfolio-entry',configureServer(server){server.middlewares.use((req,_res,next)=>{if(req.url?.split('?')[0]==='/'||req.url?.split('?')[0]==='/demo'||req.url?.split('?')[0]==='/apresentacao')req.url='/portfolio.html';next()})}}],
  resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},
  server:{host:'127.0.0.1',port:5174},
  build:{outDir:'dist-portfolio',rollupOptions:{input:'portfolio.html'}}
});
