const assert = require('assert');
const Module = require('module');
const originalLoad = Module._load;
const sent = [];
let fail = false;
class FakeAccessory {
  constructor(log, config) { this.log=log; this.config=config; this.data=config.data; this.name=config.name; this.state={}; this.setupServiceManager(); }
  async performSend(command) { if(fail) throw new Error('send failed'); sent.push(command); }
}
class FakeManager {
  constructor(){this.values={};}
  setCharacteristic(k,v){this.values[k.name||k]=v;}
  updateCharacteristic(k,v){this.values[k.name||k]=v;}
  addGetCharacteristic(){}
  addSetCharacteristic(){}
}
Module._load=function(request,parent,isMain){
  if(request==='./accessory' && /accessories[\\/]valve\.js$/.test(parent.filename)) return FakeAccessory;
  if(request==='../helpers/serviceManagerTypes' && /accessories[\\/]valve\.js$/.test(parent.filename)) return {ServiceManager:FakeManager,FakeServiceManager:FakeManager};
  return originalLoad.call(this,request,parent,isMain);
};
global.Service={Valve:function(){}};
global.Characteristic={ValveType:{name:'ValveType'},Active:{name:'Active',ACTIVE:1,INACTIVE:0},InUse:{name:'InUse',IN_USE:1,NOT_IN_USE:0}};
const Valve=require('../accessories/valve');
const make=()=>new Valve(()=>{},{name:'Valve',data:{open:'OPEN',close:'CLOSE'}});
const set=(v,n)=>new Promise((res,rej)=>v.setActive(n,e=>e?rej(e):res()));
(async()=>{
 const v=make(); await set(v,1); assert.deepStrictEqual(sent,['OPEN']); await set(v,0); assert.deepStrictEqual(sent,['OPEN','CLOSE']);
 const state={...v.state}; fail=true; await assert.rejects(set(v,1),/send failed/); fail=false; assert.deepStrictEqual(v.state,state);
 assert.throws(()=>new Valve(()=>{},{name:'Bad',data:{open:'OPEN'}}),/requires data\.open and data\.close commands/);
 console.log('PASS: open and close use separate Broadlink commands');
 console.log('PASS: failed send does not update valve state');
 console.log('PASS: incomplete valve configuration is rejected');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{Module._load=originalLoad;});
