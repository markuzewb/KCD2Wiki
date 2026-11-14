'use strict';
/* Optional offline batch import of images that the project owner legally possesses.
 * JSON manifest: [{"id":"KCD2-GUID","file":"items/sword.png"}]
 * node tools/import-item-images.js --source ./exported-icons --manifest ./icons.json --data ./data
 */
const fs=require('node:fs');const path=require('node:path');
const args=process.argv.slice(2);
function option(key,fall){const i=args.indexOf('--'+key);return i>=0?args[i+1]:fall;}
const source=path.resolve(option('source','')),
 manifest=path.resolve(option('manifest','')),
 dest=path.resolve(option('data',path.join(__dirname,'..','data'))),dry=args.includes('--dry-run');
if(!fs.existsSync(source)||!fs.statSync(source).isDirectory()||!fs.existsSync(manifest)){
 console.error('Usage: node tools/import-item-images.js --source /folder --manifest /path/list.json [--data /path/data] [--dry-run]');
 process.exit(2);
}
const entries=JSON.parse(fs.readFileSync(manifest,'utf8'));
if(!Array.isArray(entries)||entries.length>12000)throw Error('Manifest must be JSON array of up to 12,000 entries');
const guid=/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
const dir=path.join(dest,'media','items');let copied=0,skipped=0;
for(const entry of entries){
 if(!entry||!guid.test(entry.id)||typeof entry.file!=='string'||!entry.file||entry.file.length>260)throw Error('Invalid manifest row');
 const candidate=path.resolve(source,entry.file);
 if(!candidate.startsWith(source+path.sep))throw Error('File escapes source folder: '+entry.file);
 if(!fs.existsSync(candidate)||!fs.statSync(candidate).isFile()){skipped++;console.warn('Missing:',entry.file);continue;}
 // Do not follow symbolic links outside the given folder.
 const resolved=fs.realpathSync(candidate);if(!resolved.startsWith(fs.realpathSync(source)+path.sep))throw Error('Symlink escapes source folder');
 const b=fs.readFileSync(resolved);if(b.length<40||b.length>2097152){skipped++;continue;}
 let ext='';
 if(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))ext='png';
 else if(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP')ext='webp';
 else if(b[0]===255&&b[1]===216&&b[2]===255&&b[b.length-2]===255&&b[b.length-1]===217)ext='jpg';
 if(!ext){skipped++;console.warn('Unsupported format:',entry.file);continue;}
 const id=entry.id.toLowerCase(),name=path.join(dir,id+'.'+ext);
 if(!dry){fs.mkdirSync(dir,{recursive:true});for(const e of ['png','webp','jpg']){const x=path.join(dir,id+'.'+e);if(fs.existsSync(x))fs.rmSync(x)}fs.writeFileSync(name,b)}
 copied++;
}
console.log(JSON.stringify({imported:copied,skipped,dryRun:dry,destination:dir}));
