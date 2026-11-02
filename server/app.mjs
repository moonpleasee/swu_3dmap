import express from 'express';
import helmet from 'helmet';
import {rateLimit} from 'express-rate-limit';
import multer from 'multer';
import sharp from 'sharp';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes,randomUUID,scrypt as scryptCb,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {mkdir,readFile,writeFile,unlink,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const scrypt=promisify(scryptCb),root=fileURLToPath(new URL('../',import.meta.url));
export async function createApp(options={}){
 const communityEnabled=options.communityEnabled??process.env.COMMUNITY_ENABLED==='1';
 const dir=path.resolve(options.dir||process.env.DATA_DIR||path.join(root,'server-data'));
 await mkdir(path.join(dir,'uploads'),{recursive:true});
 const db=new DatabaseSync(path.join(dir,'campus.sqlite'));
 db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,username TEXT UNIQUE NOT NULL,password TEXT NOT NULL,role TEXT DEFAULT 'user',createdAt TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,userId TEXT REFERENCES users(id) ON DELETE CASCADE,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS places(id TEXT PRIMARY KEY,fixedId TEXT,name TEXT,description TEXT,point TEXT,userId TEXT REFERENCES users(id),status TEXT NOT NULL,createdAt TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS posts(id TEXT PRIMARY KEY,placeId TEXT REFERENCES places(id),userId TEXT REFERENCES users(id),kind TEXT NOT NULL,text TEXT,parentId TEXT REFERENCES posts(id),file TEXT,status TEXT NOT NULL,createdAt TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS ratings(placeId TEXT REFERENCES places(id),userId TEXT REFERENCES users(id),value INTEGER CHECK(value BETWEEN 1 AND 5),PRIMARY KEY(placeId,userId));
 CREATE TABLE IF NOT EXISTS suggestions(id TEXT PRIMARY KEY,buildingId TEXT NOT NULL,userId TEXT REFERENCES users(id),name TEXT NOT NULL,evidence TEXT NOT NULL,status TEXT NOT NULL,createdAt TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY,postId TEXT REFERENCES posts(id),userId TEXT REFERENCES users(id),reason TEXT NOT NULL,status TEXT DEFAULT 'open',createdAt TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,userId TEXT,action TEXT,target TEXT,createdAt TEXT);
 CREATE INDEX IF NOT EXISTS posts_place ON posts(placeId,createdAt); CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);`);
 const campus=JSON.parse(await readFile(path.join(root,'public/data/campus.json'),'utf8'));
 const buildings=new Map(campus.buildings.map(f=>[String(f.id),f]));
 const insert=db.prepare('INSERT OR IGNORE INTO places VALUES(?,?,?,?,?,?,?,?)');
 for(const f of [...campus.buildings,...campus.surfaces])insert.run(`fixed:${f.id}`,String(f.id),f.displayName||f.name||'校园地点','',JSON.stringify(f.center),null,'approved',new Date().toISOString());
 const q=(sql,...args)=>db.prepare(sql).all(...args),one=(sql,...args)=>db.prepare(sql).get(...args),run=(sql,...args)=>db.prepare(sql).run(...args);
 const stamp=()=>new Date().toISOString(),id=()=>randomUUID();
 const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
 const text=(v,max,min=1)=>{if(typeof v!=='string'||v.trim().length<min||v.trim().length>max)fail(400,`请输入${min}—${max}个字符`);return v.trim();};
 const hash=v=>createHash('sha256').update(v).digest('hex');
 const audit=(u,a,t)=>run('INSERT INTO audit VALUES(?,?,?,?,?)',id(),u,a,t,stamp());
 const app=express();app.disable('x-powered-by');
 if(process.env.TRUST_PROXY==='1')app.set('trust proxy',1);
 app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'"],imgSrc:["'self'",'data:','blob:'],connectSrc:["'self'"],workerSrc:["'self'",'blob:'],objectSrc:["'none'"]}},crossOriginEmbedderPolicy:false}));
 app.use('/api',rateLimit({windowMs:60000,limit:240,standardHeaders:'draft-8',legacyHeaders:false}));
 app.get('/api/health',(req,res)=>res.json({ok:true,communityEnabled,moderation:process.env.MODERATION==='off'?'off':'manual'}));
 app.use(['/api','/media','/admin','/admin.js'],(req,res,next)=>communityEnabled?next():res.status(403).json({error:'暂不开放'}));
 app.use('/api',(req,res,next)=>{
  if(!['GET','HEAD','OPTIONS'].includes(req.method)){
   const expected=process.env.PUBLIC_ORIGIN||`${req.protocol}://${req.get('host')}`;
   if(req.get('origin')&&req.get('origin')!==expected)return res.status(403).json({error:'请求来源不匹配'});
   if(req.get('x-campus-request')!=='1')return res.status(403).json({error:'缺少请求校验标记'});
  }
  next();
 });
 app.use(express.json({limit:'32kb'}));
 app.use('/api',(req,res,next)=>{
  res.set('Cache-Control','no-store');
  const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('campus_session='))?.slice(15);
  if(token){req.sessionHash=hash(token);req.user=one('SELECT u.id,u.username,u.role FROM sessions s JOIN users u ON u.id=s.userId WHERE s.token=? AND s.expires>?',req.sessionHash,Date.now());}
  next();
 });
 const auth=(req,res,next)=>{if(!req.user)return res.status(401).json({error:'请先登录'});next();};
 const admin=(req,res,next)=>{if(req.user?.role!=='admin')return res.status(403).json({error:'需要管理员权限'});next();};
 const visible=(p,u)=>p&&(p.status==='approved'||(p.status==='pending'&&(p.userId===u?.id||u?.role==='admin')));
 const place=(req)=>{const p=one('SELECT * FROM places WHERE id=?',req.params.id);if(!visible(p,req.user))fail(404,'地点不存在');return p;};
 const moderate=()=>process.env.MODERATION==='off'?'approved':'pending';
 const loginLimit=rateLimit({windowMs:15*60000,limit:30,standardHeaders:true,legacyHeaders:false});
 const cookie=(res,value,max)=>res.cookie('campus_session',value,{httpOnly:true,sameSite:'lax',secure:process.env.COOKIE_SECURE==='1',maxAge:max,path:'/'});
 app.get('/__campus_health',(req,res)=>res.json({app:'swu-campus-local',backend:true}));
 app.get('/api/me',(req,res)=>res.json({user:req.user||null}));
 app.post('/api/auth/:action',loginLimit,async(req,res)=>{
  const {action}=req.params;if(!['register','login','logout'].includes(action))fail(404,'不存在');
  if(action==='logout'){if(req.sessionHash)run('DELETE FROM sessions WHERE token=?',req.sessionHash);cookie(res,'',0);return res.json({ok:true});}
  const username=text(req.body.username,24,3),password=text(req.body.password,128,10);
  if(!/^[\p{L}\p{N}_-]+$/u.test(username))fail(400,'用户名只能包含文字、数字、下划线与短横线');
  let user=one('SELECT * FROM users WHERE username=?',username);
  if(action==='register'){
   if(process.env.REGISTRATION==='closed')fail(403,'暂未开放注册');
   if(user)fail(409,'用户名已存在');
   const salt=randomBytes(16).toString('hex'),key=await scrypt(password,salt,64);
   try{run('INSERT INTO users(id,username,password,createdAt) VALUES(?,?,?,?)',id(),username,`${salt}:${key.toString('hex')}`,stamp());}catch{fail(409,'用户名已存在');}
   user=one('SELECT * FROM users WHERE username=?',username);
  }else{
   const [salt,key]=(user?.password||'invalid:'+Buffer.alloc(64).toString('hex')).split(':');
   const derived=await scrypt(password,salt,64);if(!user||!timingSafeEqual(derived,Buffer.from(key,'hex')))fail(401,'用户名或密码错误');
  }
  run('DELETE FROM sessions WHERE expires<=?',Date.now());const token=randomBytes(32).toString('hex');
  run('INSERT INTO sessions VALUES(?,?,?)',hash(token),user.id,Date.now()+7*86400000);cookie(res,token,7*86400000);
  res.json({user:{id:user.id,username:user.username,role:user.role}});
 });
 const pack=(p,u)=>{
  const posts=q(`SELECT p.*,u.username AS author FROM posts p JOIN users u ON u.id=p.userId WHERE placeId=? AND (p.status='approved' OR (p.status='pending' AND (p.userId=? OR ?='admin'))) ORDER BY p.createdAt DESC LIMIT 500`,p.id,u?.id||'',u?.role||'').reverse();
  const serial=x=>({...x,file:undefined,userId:undefined,data:x.file?`/media/${x.id}`:undefined,canDelete:x.userId===u?.id||u?.role==='admin'});
  return {...p,point:JSON.parse(p.point),userId:undefined,photos:posts.filter(x=>x.kind==='photo').map(x=>({...serial(x),name:x.text})),comments:posts.filter(x=>x.kind==='comment').map(x=>({...serial(x),replies:posts.filter(r=>r.parentId===x.id).map(serial)})),ratings:q('SELECT value FROM ratings WHERE placeId=?',p.id).map(x=>x.value)};
 };
 app.get('/api/places',(req,res)=>res.json({places:q(`SELECT * FROM places WHERE fixedId IS NULL AND (status='approved' OR userId=? OR ?='admin') ORDER BY createdAt DESC LIMIT 500`,req.user?.id||'',req.user?.role||'').map(p=>pack(p,req.user))}));
 app.get('/api/places/:id',(req,res)=>res.json(pack(place(req),req.user)));
 app.post('/api/places',auth,(req,res)=>{
  const name=text(req.body.name,40),description=text(req.body.description||' ',240,0),point=req.body.point;
  if(!Array.isArray(point)||point.length!==2||!point.every(x=>Number.isFinite(x)&&Math.abs(x)<5000))fail(400,'地点坐标无效');
  const key=`user:${id()}`;run('INSERT INTO places VALUES(?,?,?,?,?,?,?,?)',key,null,name,description,JSON.stringify(point),req.user.id,moderate(),stamp());res.status(201).json(pack(one('SELECT * FROM places WHERE id=?',key),req.user));
 });
 app.post('/api/places/:id/comments',auth,(req,res)=>{place(req);const value=text(req.body.text,240),parent=req.body.parentId||null;
  if(parent&&!one("SELECT id FROM posts WHERE id=? AND placeId=? AND kind='comment' AND (status='approved' OR userId=?)",parent,req.params.id,req.user.id))fail(400,'回复对象不存在');
  run('INSERT INTO posts VALUES(?,?,?,?,?,?,?,?,?)',id(),req.params.id,req.user.id,parent?'reply':'comment',value,parent,null,moderate(),stamp());res.status(201).json(pack(place(req),req.user));
 });
 app.post('/api/places/:id/rating',auth,(req,res)=>{place(req);const v=req.body.value;if(!Number.isInteger(v)||v<1||v>5)fail(400,'评分须为1—5');run('INSERT INTO ratings VALUES(?,?,?) ON CONFLICT(placeId,userId) DO UPDATE SET value=excluded.value',req.params.id,req.user.id,v);res.json(pack(place(req),req.user));});
 const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1}}).single('photo');
 app.post('/api/places/:id/photos',auth,(req,res,next)=>{place(req);upload(req,res,next);},async(req,res)=>{
  if(!req.file)fail(400,'请选择图片');
  const used=one("SELECT COUNT(*) AS n FROM posts WHERE userId=? AND kind='photo'",req.user.id).n;
  if(used>=200)fail(429,'已达每账号200张照片上限，请联系管理员');
  if((await stat(dir)).isDirectory()&&q("SELECT id FROM posts WHERE kind='photo'").length>=10000)fail(507,'图库已达容量上限');
  let bytes;try{const image=sharp(req.file.buffer,{limitInputPixels:24_000_000,animated:false});const metadata=await image.metadata();if(!['jpeg','png','webp'].includes(metadata.format))fail(400,'不支持的格式');bytes=await image.rotate().resize(1600,1600,{fit:'inside',withoutEnlargement:true}).webp({quality:82}).toBuffer();}catch{fail(400,'无法读取图片，请上传正常的JPEG、PNG或WebP图片');}
  const key=id(),file=`${key}.webp`;await writeFile(path.join(dir,'uploads',file),bytes);
  try{run('INSERT INTO posts VALUES(?,?,?,?,?,?,?,?,?)',key,req.params.id,req.user.id,'photo',String(req.file.originalname).slice(0,100),null,file,moderate(),stamp());}catch(e){await unlink(path.join(dir,'uploads',file));throw e;}
  res.status(201).json(pack(place(req),req.user));
 });
 app.get('/media/:id',(req,res)=>{const p=one('SELECT * FROM posts WHERE id=? AND kind=?',req.params.id,'photo');
  // Resolve session for private pending media without exposing upload paths.
  const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('campus_session='))?.slice(15);
  const u=token?one('SELECT u.id,u.role FROM sessions s JOIN users u ON s.userId=u.id WHERE token=? AND expires>?',hash(token),Date.now()):null;
  const parent=p&&one('SELECT * FROM places WHERE id=?',p.placeId);
  if(!visible(p,u)||!visible(parent,u))return res.sendStatus(404);res.type('webp').set('Cache-Control','private, no-store').sendFile(path.join(dir,'uploads',p.file));
 });
 app.delete('/api/posts/:id',auth,async(req,res)=>{const p=one('SELECT * FROM posts WHERE id=?',req.params.id);if(!p)fail(404,'不存在');if(p.userId!==req.user.id&&req.user.role!=='admin')fail(403,'无权删除');run("UPDATE posts SET status='deleted' WHERE id=? OR parentId=?",p.id,p.id);if(p.file)await unlink(path.join(dir,'uploads',p.file)).catch(()=>{});audit(req.user.id,'delete',p.id);res.json({ok:true});});
 app.post('/api/posts/:id/report',auth,(req,res)=>{if(!one("SELECT id FROM posts WHERE id=? AND status='approved'",req.params.id))fail(404,'内容不存在');run('INSERT INTO reports(id,postId,userId,reason,createdAt) VALUES(?,?,?,?,?)',id(),req.params.id,req.user.id,text(req.body.reason,240),stamp());res.json({ok:true});});
 app.post('/api/buildings/:id/suggestions',auth,(req,res)=>{if(!buildings.has(req.params.id))fail(404,'建筑不存在');run('INSERT INTO suggestions VALUES(?,?,?,?,?,?,?)',id(),req.params.id,req.user.id,text(req.body.name,40),text(req.body.evidence||'',500,0), 'pending',stamp());res.status(201).json({ok:true});});
 app.get('/api/buildings/:id/suggestions',auth,(req,res)=>res.json({suggestions:q('SELECT id,name,evidence,status,createdAt FROM suggestions WHERE buildingId=? AND userId=? ORDER BY createdAt DESC LIMIT 20',req.params.id,req.user.id)}));
 app.get('/api/admin/queue',auth,admin,(req,res)=>res.json({posts:q("SELECT p.id,p.kind,p.placeId,p.text,p.status,p.createdAt,u.username FROM posts p JOIN users u ON p.userId=u.id WHERE p.status IN ('pending','approved') ORDER BY p.createdAt DESC LIMIT 200"),places:q("SELECT id,name,description,status FROM places WHERE fixedId IS NULL AND status='pending' LIMIT 200"),suggestions:q("SELECT s.*,u.username FROM suggestions s JOIN users u ON s.userId=u.id ORDER BY createdAt DESC LIMIT 200"),reports:q("SELECT * FROM reports WHERE status='open' LIMIT 200")}));
 app.post('/api/admin/review',auth,admin,(req,res)=>{const {type,id:key,status}=req.body;const table={post:'posts',place:'places',suggestion:'suggestions',report:'reports'}[type];if(!table||!['approved','rejected','resolved'].includes(status)||typeof key!=='string')fail(400,'审核参数不正确');if(!one(`SELECT id FROM ${table} WHERE id=?`,key))fail(404,'不存在');run(`UPDATE ${table} SET status=? WHERE id=?`,status,key);audit(req.user.id,`${type}:${status}`,key);res.json({ok:true});});
 app.use('/api',(req,res)=>res.status(404).json({error:'接口不存在'}));
 app.use(express.static(path.join(root,'dist'),{index:'index.html',maxAge:0}));
 app.get('/admin',(req,res)=>res.sendFile(path.join(root,'server/admin.html')));
 app.get('/admin.js',(req,res)=>res.sendFile(path.join(root,'server/admin.js')));
 app.use((err,req,res,next)=>{const status=err.status||(err instanceof multer.MulterError?400:500);if(status>=500)console.error(err);res.status(status).json({error:status>=500?'服务暂时不可用，请稍后重试':err.message});});
 return {app,db,dir};
}
