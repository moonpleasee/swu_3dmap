import {createApp} from './app.mjs';
const {app,db}=await createApp();
const server=app.listen(Number(process.env.PORT||4311),process.env.HOST||'127.0.0.1',()=>console.log(`西大云游: http://${process.env.HOST||'127.0.0.1'}:${process.env.PORT||4311}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{db.close();process.exit(0);}));
