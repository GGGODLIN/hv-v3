/** Lossless deterministic JSON shards for complete source-backed measurements. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const encode=data=>JSON.stringify(data,null,2)+'\n';
const hash=raw=>createHash('sha256').update(raw).digest('hex');
export const SHARD_LIMIT=65536;
export async function writeShardedMeasurement(data,indexPath,arrayKeys){
  const destination=resolve(indexPath);await mkdir(dirname(destination),{recursive:true});
  const keys=Object.keys(data),arrays={},metadata={},shards=[];
  for(const key of keys){
    if(!arrayKeys.includes(key)){metadata[key]=data[key];continue;}
    assert.match(key,/^[a-zA-Z]+$/);assert.ok(Array.isArray(data[key]));arrays[key]={length:data[key].length};
    let batch=[],part=0;
    const flush=async()=>{
      if(!batch.length)return;
      const payload={array:key,part,items:batch},raw=encode(payload),file=`${key}-${String(part).padStart(3,'0')}.json`;
      assert.ok(Buffer.byteLength(raw)<=SHARD_LIMIT,`single measurement item exceeds ${SHARD_LIMIT} bytes`);
      await writeFile(join(dirname(destination),file),raw,{flag:'wx'});
      shards.push({array:key,part,file,count:batch.length,bytes:Buffer.byteLength(raw),sha256:hash(raw)});part++;batch=[];
    };
    for(const item of data[key]){
      if(batch.length&&Buffer.byteLength(encode({array:key,part,items:[...batch,item]}))>SHARD_LIMIT)await flush();
      batch.push(item);
    }
    await flush();
  }
  const complete=encode(data),index={format:'hv-dot-measurement-shards-v1',maxShardBytes:SHARD_LIMIT,keys,metadata,arrays,shards,
    reconstructed:{bytes:Buffer.byteLength(complete),sha256:hash(complete)}};
  const raw=encode(index);assert.ok(Buffer.byteLength(raw)<=SHARD_LIMIT);await writeFile(destination,raw,{flag:'wx'});
  assert.deepEqual(await readShardedMeasurement(destination),data,'lossless reconstruction must equal complete original');
  return {index:destination,files:shards.length+1,maxBytes:Math.max(Buffer.byteLength(raw),...shards.map(s=>s.bytes)),reconstructed:index.reconstructed};
}
export async function readShardedMeasurement(indexPath){
  const path=resolve(indexPath),index=JSON.parse(await readFile(path,'utf8'));
  assert.equal(index.format,'hv-dot-measurement-shards-v1');const arrays=Object.fromEntries(Object.keys(index.arrays).map(key=>[key,[]]));
  const nextPart=Object.fromEntries(Object.keys(arrays).map(key=>[key,0]));
  for(const entry of index.shards){
    assert.match(entry.file,/^[a-zA-Z]+-\d{3}\.json$/);assert.ok(Object.hasOwn(arrays,entry.array));assert.equal(entry.part,nextPart[entry.array]++);
    const raw=await readFile(join(dirname(path),entry.file));assert.equal(raw.length,entry.bytes);assert.ok(raw.length<=SHARD_LIMIT);assert.equal(hash(raw),entry.sha256);
    const shard=JSON.parse(raw);assert.equal(shard.array,entry.array);assert.equal(shard.part,entry.part);assert.equal(shard.items.length,entry.count);arrays[entry.array].push(...shard.items);
  }
  for(const [key,expected] of Object.entries(index.arrays))assert.equal(arrays[key].length,expected.length);
  const data=Object.fromEntries(index.keys.map(key=>[key,Object.hasOwn(arrays,key)?arrays[key]:index.metadata[key]])),raw=encode(data);
  assert.equal(Buffer.byteLength(raw),index.reconstructed.bytes);assert.equal(hash(raw),index.reconstructed.sha256);return data;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [indexPath,outputPath]=process.argv.slice(2);assert.ok(indexPath&&outputPath,'Usage: node scripts/measurement-shards.mjs INDEX.json OUTPUT.json');
  await writeFile(resolve(outputPath),encode(await readShardedMeasurement(indexPath)),{flag:'wx'});
  console.log(JSON.stringify({reconstructed:resolve(outputPath),verified:true}));
}
