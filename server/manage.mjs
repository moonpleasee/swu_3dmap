import {createApp} from './app.mjs';
import {scrypt,randomBytes,randomUUID} from 'node:crypto';
import {promisify} from 'node:util';
import path from 'node:path';
const {db,dir}=await createApp();
try{
 if(process.argv[2]==='admin'){
  const name=process.env.ADMIN_USERNAME,password=process.env.ADMIN_PASSWORD;
  if(!name||!password||password.length<12)throw Error('请通过 ADMIN_USERNAME 和 ADMIN_PASSWORD 设置管理员用户名及至少12位密码');
  if(name.length<3||name.length>24||! /^[\p{L}\p{N}_-]+$/u.test(name))throw Error('管理员用户名须为3—24个文字、数字、下划线或短横线');
  const salt=randomBytes(16).toString('hex'),key=await promisify(scrypt)(password,salt,64);
  db.prepare("INSERT INTO users(id,username,password,role,createdAt) VALUES(?,?,?,'admin',?) ON CONFLICT(username) DO UPDATE SET password=excluded.password,role='admin'").run(randomUUID(),name,`${salt}:${key.toString('hex')}`,new Date().toISOString());
  const user=db.prepare('SELECT id FROM users WHERE username=?').get(name);db.prepare('DELETE FROM sessions WHERE userId=?').run(user.id);console.log('管理员已设置，现有会话已失效。');
 }else if(process.argv[2]==='backup'){
  const target=path.resolve(process.argv[3]||path.join(dir,`backup-${Date.now()}.sqlite`));db.prepare('VACUUM INTO ?').run(target);console.log(`数据库备份：${target}；同时备份 uploads 目录。`);
 }else throw Error('命令：admin / backup [目标文件]');
}finally{db.close();}
