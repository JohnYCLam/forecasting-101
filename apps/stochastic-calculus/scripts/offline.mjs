// Build the same app as a single file for readers opening it from File Explorer.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
const dist=fileURLToPath(new URL('../dist/',import.meta.url));
let html=readFileSync(join(dist,'index.html'),'utf8');
const assets={};for(const name of readdirSync(join(dist,'examples'))){
  assets[name]=readFileSync(join(dist,'examples',name)).toString('base64');
}
const script=html.match(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/);
const css=html.match(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
if(!script||!css) throw Error('Expected one compiled script and stylesheet');
const cssFile=resolve(dist,css[1]);
const embeddedCss=readFileSync(cssFile,'utf8').replace(/url\((["']?)([^)'"]+)\1\)/g,(all,q,url)=>{
  if(url.startsWith('data:'))return all;
  const f=resolve(dirname(cssFile),url);
  const mime={'.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'}[extname(f)];
  if(!mime) throw Error('Unknown style asset: '+basename(f));
  return 'url(data:'+mime+';base64,'+readFileSync(f).toString('base64')+')';
});
html=html.replace(css[0],()=>'<style>'+embeddedCss+'</style>');
const fixDownloads=`\n;{const files=${JSON.stringify(assets)};for(const a of document.querySelectorAll('a[download]')){const name=a.getAttribute('href').split('/').pop();if(files[name]){a.download=name;a.href='data:application/octet-stream;base64,'+files[name];}}}`;
const js=(readFileSync(resolve(dist,script[1]),'utf8')+fixDownloads).replace(/<\/script/gi,'<\\/script');
html=html.replace(script[0],()=>'<script type="module">'+js+'</script>');
writeFileSync(join(dist,'preview.html'),html);
console.log('Offline lesson: dist/preview.html');

