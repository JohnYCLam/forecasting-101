import { spawnSync } from 'node:child_process';
export function npm(args,cwd){
  if(!process.env.npm_execpath)throw Error('Run this script through its npm command.');
  const result=spawnSync(process.execPath,[process.env.npm_execpath,...args],{cwd,stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status??1);
}
