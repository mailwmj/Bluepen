// Local QA only. Not imported by production; uses no real credentials.
import http from 'node:http';
import { responseEvents, pageOutput } from '../src/components/editor/agent/responses-fixture.mjs';
let calls = 0;
const event = value => `data: ${JSON.stringify(value)}\n\n`;
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization,content-type,x-stainless-lang,x-stainless-package-version,x-stainless-os,x-stainless-arch,x-stainless-runtime,x-stainless-runtime-version,x-stainless-retry-count,x-stainless-timeout,x-vercel-ai-sdk');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS,GET');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.url === '/status') { res.end(JSON.stringify({ calls })); return; }
  if (req.url !== '/responses') { res.writeHead(404); res.end(); return; }
  let raw = ''; for await (const chunk of req) raw += chunk;
  const body = JSON.parse(raw); calls++;
  const user = [...(body.input ?? [])].reverse().find(item => item.role === 'user');
  const prompt = typeof user?.content === 'string' ? user.content : JSON.stringify(user?.content ?? '');
  if (body.model === 'fixture-error') { res.writeHead(429, {'content-type':'application/json'}); res.end(JSON.stringify({error:{message:'Fixture rate limit'}})); return; }
  res.writeHead(200, {'content-type':'text/event-stream','cache-control':'no-cache'});
  const delay = body.model === 'fixture-slow' ? 3500 : 180;
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const hasTool = body.input?.some(item => item.type === 'function_call_output');
  if (!hasTool) {
    const item = {type:'function_call',id:'fc_fixture',call_id:'call_fixture',name:'searchComponents',arguments:'{"query":"button"}'};
    res.write(event({type:'response.output_item.added',output_index:0,item}));
    await wait(delay);
    res.write(event({type:'response.output_item.done',output_index:0,item:{...item,status:'completed'}}));
    res.end(event({type:'response.completed',response:{usage:{input_tokens:20,output_tokens:20}}})); return;
  }
  await wait(delay);
  const result = /连接测试/.test(prompt) ? { reply:'连接成功',plan:null,questions:[] } : /梳理|先讨论/.test(prompt) ? {reply:'我已查阅可用组件，先确认两个会影响结构的问题。',plan:null,questions:[{id:'platform',title:'这个页面面向哪个平台？',options:['桌面端','移动端'],multiple:false,required:true},{id:'features',title:'需要哪些内容？',options:['任务列表','筛选与搜索','统计概览'],multiple:true,required:false}]} : pageOutput();
  result.reply = result.plan ? '方案已准备好。\n\n- 使用可编辑的原生组件\n- 保留完整页面结构\n\n确认后会新增到目标页面。' : result.reply;
  for (const part of responseEvents(result).split('\n\n').filter(Boolean)) { if (res.destroyed) break; res.write(part+'\n\n'); await wait(180); }
  res.end();
});
server.listen(4319,'127.0.0.1',()=>console.log('Bluepen fixture listening on 4319 (test data only)'));
