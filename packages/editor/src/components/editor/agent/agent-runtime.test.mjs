import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { loadTypeScript } from '../../../../tests/load-typescript.mjs';
import * as ai from 'ai';
import * as openai from '@ai-sdk/openai';

const filename = fileURLToPath(new URL('./agent-runtime.ts', import.meta.url));
const library = loadTypeScript(fileURLToPath(new URL('../library/index.ts', import.meta.url)));
function runtime(fetch, browser = true) {
  return loadTypeScript(filename, {
    mocks: { ai, '@ai-sdk/openai': openai, '../library': library, '../library/index': library },
    globals: { fetch, URL, Headers, Request, Response, AbortSignal, AbortController, TransformStream, TextDecoder,
      process: { env: { NEXT_PUBLIC_TOKENBOX_PROXY: '/api/ai/tokenbox' } },
      ...(browser ? { window: { location: { origin: 'http://localhost:3000' } } } : {}),
    },
  });
}
const settings = { baseUrl: 'https://tokbox-api.netease.im/', apiKey: 'test-only-key', model: 'gpt-5.6-terra' };
const messages = [{ role: 'user', content: '灵感模板页面' }, { role: 'assistant', content: '需要分类吗？' }, { role: 'user', content: '需要，先讨论' }];

function chatEvents(deltas, finish = 'stop') {
  return deltas.map(delta => `data: ${JSON.stringify({ choices: [{ index: 0, delta, finish_reason: null }] })}\n\n`).join('') +
    `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: finish }] })}\n\ndata: [DONE]\n\n`;
}

test('Chat Completions preserves DeepSeek thinking across tool calls and conversation turns', async () => {
  const requests = [], events = [];
  const provider = runtime(async (url, init) => {
    requests.push({ url: String(url), body: JSON.parse(init.body) });
    const body = requests.length === 1 ? chatEvents([
      { reasoning_content: '先查询组件。' },
      { tool_calls: [{ index: 0, id: 'call_chat', type: 'function', function: { name: 'searchComponents', arguments: '{"query":"button"}' } }] },
    ], 'tool_calls') : chatEvents([{ content: JSON.stringify({ reply: '连接成功', questions: [], plan: null, changes: null }) }]);
    return new Response(body, { headers: { 'content-type': 'text/event-stream' } });
  });
  const result = await provider.responsesAgentProvider({
    messages: [{ role: 'assistant', content: '你好', reasoning: '已有思考。' }, { role: 'user', content: '连接测试' }],
    settings: { ...settings, baseUrl: 'https://api.deepseek.com/chat/completions', model: 'deepseek-flash', protocol: 'chat-completions', thinking: 'high' },
    onEvent: event => events.push(event),
  });
  assert.equal(result.reply, '连接成功');
  assert.equal(requests.length, 2);
  assert.equal(requests[0].url, 'https://api.deepseek.com/chat/completions');
  assert.equal(requests[0].body.thinking.type, 'enabled');
  assert.equal(requests[0].body.reasoning_effort, 'high');
  // Json_object mode returns bare field values and whitespace on this gateway,
  // so the schema contract rides the newest user turn instead of response_format.
  assert.equal(requests[0].body.response_format, undefined);
  assert.match(requests[0].body.messages.findLast(m => m.role === 'user').content, /JSON Schema/);
  assert.match(requests[1].body.messages.findLast(m => m.role === 'user').content, /additionalProperties/);
  assert.equal(requests[0].body.messages.find(m => m.role === 'assistant').reasoning_content, '已有思考。');
  assert.equal(requests[1].body.messages.find(m => m.tool_calls)?.reasoning_content, '先查询组件。');
  assert.ok(requests[1].body.messages.some(m => m.role === 'tool' && m.tool_call_id === 'call_chat'));
  assert.ok(events.some(event => event.type === 'reasoning' && event.text === '先查询组件。'));
  assert.ok(events.some(event => event.type === 'tool' && event.status === 'completed'));
});

test('explicit prohibited schema errors retry with JSON mode and retain local validation', async () => {
  const requests = [];
  const provider = runtime(async (_url, init) => {
    const body = JSON.parse(init.body); requests.push(body);
    if (requests.length === 1) return new Response(JSON.stringify({ error: { message: "Invalid schema for response_format 'response': In context=('properties', 'changes', 'anyOf', '0', 'properties', 'operations', 'items'), 'oneOf' is not permitted." } }), { status: 400 });
    return new Response(responseEvents({ reply: '连接成功', questions: [], plan: null, changes: null }), { headers: { 'content-type': 'text/event-stream' } });
  });
  assert.equal((await provider.responsesAgentProvider({ messages, settings })).reply, '连接成功');
  assert.equal(requests.length, 2);
  assert.equal(requests[1].text.format.type, 'json_object');
  assert.ok(JSON.stringify(requests[1].input).includes('additionalProperties'));
});

test('JSON compatibility cannot turn malformed nodes into an applicable plan', async () => {
  const output = pageOutput(); output.plan.root.children[0].width = -20;
  const provider = runtime(async () => new Response(chatEvents([{ content: JSON.stringify({ ...output, changes: null }) }]), { headers: { 'content-type': 'text/event-stream' } }));
  await assert.rejects(provider.responsesAgentProvider({ messages, settings: { ...settings, protocol: 'chat-completions' } }), /原型计划无效/);
});

test('compatible JSON object props support structural inserts but still reject unknown attributes', async () => {
  const node = { type: 'button', name: '稍后按钮', x: 184, y: 152, width: 80, height: 40, props: { text: '稍后' }, children: [] };
  const output = { reply: '请确认新增', questions: [], plan: null, changes: { summary: '新增稍后按钮', operations: [{ kind: 'insert', parentId: 'group-a', index: 4, node }] } };
  const provider = runtime(async () => new Response(chatEvents([{ content: JSON.stringify(output) }]), { headers: { 'content-type': 'text/event-stream' } }));
  const input = { messages, settings: { ...settings, protocol: 'chat-completions' } };
  assert.equal((await provider.responsesAgentProvider(input)).changes.operations[0].node.props.text, '稍后');
  node.props.onClick = 'alert(1)';
  await assert.rejects(provider.responsesAgentProvider(input), /属性 onClick 无效/);
});

test('ordinary 400 errors and credentials are not retried or exposed by compatibility mode', async () => {
  let calls = 0;
  const provider = runtime(async () => { calls++; return new Response(JSON.stringify({ error: { message: `Invalid model test-only-key` } }), { status: 400 }); });
  await assert.rejects(provider.responsesAgentProvider({ messages, settings }), error => error.message.includes('[已隐藏]') && !error.message.includes(settings.apiKey));
  assert.equal(calls, 1);
});

test('a bare questions array from JSON mode is recovered instead of failing the turn', async () => {
  const questions = [{ id: 'bg', title: '背景往哪个方向调？', options: ['更暗', '更中性'], multiple: false, required: true }];
  const provider = runtime(async () => new Response(chatEvents([{ content: `   ${JSON.stringify(questions)}` }]), { headers: { 'content-type': 'text/event-stream' } }));
  const result = await provider.responsesAgentProvider({ messages, settings: { ...settings, protocol: 'chat-completions' } });
  assert.equal(result.questions[0].id, 'bg');
  assert.equal(result.plan, undefined);
  assert.equal(result.changes, undefined);
});

test('clarification questions missing presentation defaults still reach the user', async () => {
  const provider = runtime(async () => new Response(chatEvents([{ content: JSON.stringify([{ id: 'tone', title: '想要哪种底色？' }]) }]), { headers: { 'content-type': 'text/event-stream' } }));
  const result = await provider.responsesAgentProvider({ messages, settings: { ...settings, protocol: 'chat-completions' } });
  assert.deepEqual(result.questions[0].options, []);
  assert.equal(result.questions[0].required, false);
});

test('an unusable JSON-mode answer is retried once with the output contract', async () => {
  const requests = [];
  const provider = runtime(async (_url, init) => {
    requests.push(JSON.parse(init.body));
    const content = requests.length === 1 ? '   ' : JSON.stringify({ reply: '当前没有可改对象', questions: [], plan: null, changes: null });
    return new Response(chatEvents([{ content }]), { headers: { 'content-type': 'text/event-stream' } });
  });
  const result = await provider.responsesAgentProvider({ messages, settings: { ...settings, protocol: 'chat-completions' } });
  assert.equal(result.reply, '当前没有可改对象');
  assert.equal(requests.length, 2);
  assert.match(requests[1].messages.at(-1).content, /只输出一个 JSON 对象/);
});

test('twice unusable output reports the real cause instead of a timeout', async () => {
  let calls = 0;
  const provider = runtime(async () => { calls++; return new Response(chatEvents([{ content: '   ' }]), { headers: { 'content-type': 'text/event-stream' } }); });
  await assert.rejects(provider.responsesAgentProvider({ messages, settings: { ...settings, protocol: 'chat-completions' } }), error => /JSON/.test(error.message) && !/超时|截断/.test(error.message));
  assert.equal(calls, 2);
});

test('a length-limited answer is reported as truncation', async () => {
  const provider = runtime(async () => new Response(chatEvents([{ content: '{"reply":"只写了开头' }], 'length'), { headers: { 'content-type': 'text/event-stream' } }));
  await assert.rejects(provider.responsesAgentProvider({ messages, settings: { ...settings, protocol: 'chat-completions' } }), /长度上限/);
});

test('missing BYOK key fails instead of pretending a fixture is generated', async () => {
  const provider = runtime(() => { throw Error('must not send'); });
  await assert.rejects(provider.responsesAgentProvider({ messages, settings: { ...settings, apiKey: '' } }), /API Key/);
});

test('real Responses SDK streams through TokenBox proxy with original model, roles and strict schema', async () => {
  let request;
  const provider = runtime(async (url, init) => {
    request = { url: String(url), body: JSON.parse(init.body), headers: new Headers(init.headers) };
    return new Response(JSON.stringify({ error: { message: 'Invalid API key', type: 'authentication_error' } }), { status: 401, headers: { 'content-type': 'application/json' } });
  });
  await assert.rejects(provider.responsesAgentProvider({ messages, settings }), /API Key|Invalid API key/);
  assert.equal(request.url, 'http://localhost:3000/api/ai/tokenbox/responses');
  assert.equal(request.body.model, settings.model);
  assert.equal(request.body.stream, true);
  assert.equal(request.body.store, false);
  assert.equal(request.headers.get('authorization'), 'Bearer test-only-key');
  assert.deepEqual(request.body.input.filter(m => m.role !== 'developer' && m.role !== 'system').map(m => m.role), messages.map(m => m.role));
  const schema = request.body.text.format.schema;
  function check(value) {
    if (!value || typeof value !== 'object') return;
    if (value.type === 'object') {
      assert.equal(value.additionalProperties, false);
      assert.deepEqual(value.required.sort(), Object.keys(value.properties).sort());
    }
    for (const item of Object.values(value)) if (typeof item === 'object') check(item);
  }
  check(schema);
  assert.ok(!JSON.stringify(schema).includes('"anyOf":[{},'));
  assert.ok(schema.properties.plan.anyOf[0].properties.artifactKind);
});

import { responseEvents, pageOutput } from './responses-fixture.mjs';

test('Responses events update reply and produce validated editable catalog components', async () => {
  const replies = [];
  const provider = runtime(async () => new Response(responseEvents(pageOutput()), { headers: { 'content-type': 'text/event-stream' } }));
  const result = await provider.responsesAgentProvider({ messages, settings, onReply: text => replies.push(text) });
  assert.equal(result.plan.artifactKind, 'page');
  assert.equal(result.plan.root.type, 'group');
  assert.equal(result.plan.root.children[0].name, '页面底板');
  assert.deepEqual(
    ['x', 'y', 'width', 'height'].map(key => result.plan.root.children[0][key]),
    [0, 0, result.plan.root.width, result.plan.root.height],
  );
  assert.equal(result.plan.root.children.filter(node => node.type === 'image').length, 3);
  assert.equal(result.plan.root.children[3].props.text, '使用模板');
  assert.ok(replies.includes(result.reply));
});

test('existing page backgrounds are normalized, moved first and not duplicated', async () => {
  const output = pageOutput();
  output.plan.root.children.push({
    type: 'rectangle', name: '页面背景', x: 24, y: 32, width: 320, height: 200,
    props: [{ key: 'fill', value: '#FFFFFF' }, { key: 'radius', value: 8 }], children: [],
  });
  const provider = runtime(async () => new Response(responseEvents(output), { headers: { 'content-type': 'text/event-stream' } }));
  const { plan } = await provider.responsesAgentProvider({ messages, settings });
  const backgrounds = plan.root.children.filter(node => node.name === '页面底板');
  assert.equal(backgrounds.length, 1);
  assert.equal(plan.root.children[0], backgrounds[0]);
  assert.deepEqual(
    ['x', 'y', 'width', 'height'].map(key => backgrounds[0][key]),
    [0, 0, plan.root.width, plan.root.height],
  );
  assert.equal(backgrounds[0].props.fill, '#FFFFFF');
  assert.equal(backgrounds[0].props.radius, 0);
});

test('sections and single components remain transparent at the root', async () => {
  for (const artifactKind of ['section', 'component']) {
    const output = pageOutput();
    output.plan.artifactKind = artifactKind;
    output.plan.root.children = output.plan.root.children.slice(0, artifactKind === 'component' ? 1 : 3);
    output.plan.root.children.push({
      type: 'rectangle', name: '页面背景', x: 0, y: 0,
      width: output.plan.root.width, height: output.plan.root.height, props: [], children: [],
    });
    const provider = runtime(async () => new Response(responseEvents(output), { headers: { 'content-type': 'text/event-stream' } }));
    const { plan } = await provider.responsesAgentProvider({ messages, settings });
    assert.equal(plan.artifactKind, artifactKind);
    assert.equal(plan.root.children.some(node => /页面.*(底板|背景)/.test(node.name)), false);
  }
});

test('invalid component props and dimensions never become a confirmed plan', async () => {
  for (const mutate of [
    o => { o.plan.root.children[0].props = [{ key: 'onclick', value: 'alert(1)' }]; },
    o => { o.plan.root.width = -1; },
    o => { o.plan.root.children[0].type = 'html'; },
  ]) {
    const output = pageOutput(); mutate(output);
    const provider = runtime(async () => new Response(responseEvents(output), { headers: { 'content-type': 'text/event-stream' } }));
    await assert.rejects(provider.responsesAgentProvider({ messages, settings }));
  }
});

test('cancelled Responses requests return no plan', async () => {
  const controller = new AbortController(); controller.abort();
  const provider = runtime(async () => { throw Error('must not send'); });
  await assert.rejects(provider.responsesAgentProvider({ messages, settings, signal: controller.signal }), /取消/);
});

test('other compatible providers retain explicitly configured API base paths', async () => {
  let target;
  const provider = runtime(async url => {
    target = String(url);
    return new Response(JSON.stringify({ error: { message: 'Invalid API key' } }), { status: 401 });
  });
  await assert.rejects(provider.responsesAgentProvider({ messages, settings: { ...settings, baseUrl: 'https://example.com/custom/v1/' } }));
  assert.equal(target, 'https://example.com/custom/v1/responses');
});

test('browser tracing cleanup does not emit an unhandled rejection after an API error', async () => {
  // SDK uses process.release.name to detect Node tracing. Exercise the browser
  // branch here as well as in the dev-browser E2E check (see patches/README.md).
  const release = Object.getOwnPropertyDescriptor(process, 'release');
  Object.defineProperty(process, 'release', { ...release, value: { name: 'browser' } });
  try {
    const provider = runtime(async () => new Response('{"error":{"message":"Invalid API key"}}', { status: 401 }));
    await assert.rejects(provider.responsesAgentProvider({ messages, settings }), /401/);
    await new Promise(resolve => setImmediate(resolve));
  } finally {
    Object.defineProperty(process, 'release', release);
  }
});

test('Responses tool loop reads the real catalog before returning a plan', async () => {
  const requests = [];
  const progress = [];
  const provider = runtime(async (url, init) => {
    const request = JSON.parse(init.body); requests.push(request);
    if (requests.length === 1) {
      const item = { type: 'function_call', id: 'fc_test', call_id: 'call_test', name: 'searchComponents', arguments: '{"query":"image"}' };
      const events = [
        { type: 'response.output_item.added', output_index: 0, item },
        { type: 'response.output_item.done', output_index: 0, item: { ...item, status: 'completed' } },
        { type: 'response.completed', response: { usage: { input_tokens: 20, output_tokens: 30 } } },
      ];
      return new Response(events.map(event => `data: ${JSON.stringify(event)}\n\n`).join(''), { headers: { 'content-type': 'text/event-stream' } });
    }
    return new Response(responseEvents(pageOutput()), { headers: { 'content-type': 'text/event-stream' } });
  });
  const result = await provider.responsesAgentProvider({ messages, settings, onEvent: event => progress.push(event) });
  assert.equal(requests.length, 2);
  assert.equal(progress.find(event => event.type === 'tool' && event.status === 'running').id, 'call_test');
  assert.match(progress.find(event => event.type === 'tool' && event.status === 'completed').detail, /可用组件/);
  assert.ok(progress.some(event => event.type === 'phase' && event.label.includes('验证')));
  assert.deepEqual(requests[0].tools.map(tool => tool.name), ['searchComponents']);
  assert.ok(requests[0].input.some(item => item.role === 'developer' || item.role === 'system'));
  const toolResult = requests[1].input.find(item => item.type === 'function_call_output');
  assert.equal(toolResult.call_id, 'call_test');
  const components = JSON.parse(toolResult.output);
  assert.ok(components.some(item => item.type === 'image' && item.defaultProps.label === '图片占位区域'));
  assert.equal(result.plan.root.type, 'group');
});

test('structured human questions survive the actual Responses decoder and never produce an applicable plan', async () => {
  const output = { reply: '需要确认平台', plan: null, questions: [{ id: 'platform', title: '哪个平台？', options: ['桌面端', '移动端'], multiple: false, required: true }] };
  const provider = runtime(async () => new Response(responseEvents(output), { headers: { 'content-type': 'text/event-stream' } }));
  const result = await provider.responsesAgentProvider({ messages, settings });
  assert.equal(result.questions[0].required, true);
  assert.deepEqual(result.questions[0].options, ['桌面端', '移动端']);
  assert.equal(result.plan, undefined);
});

test('ambiguous question plus plan output is rejected rather than offering premature approval', async () => {
  const output = pageOutput(); output.questions = [{ id: 'p', title: '哪个平台？', options: [], multiple: false, required: true }];
  const provider = runtime(async () => new Response(responseEvents(output), { headers: { 'content-type': 'text/event-stream' } }));
  await assert.rejects(provider.responsesAgentProvider({ messages, settings }), /同时返回/);
});

test('reasoning shown in the UI is sourced from real provider reasoning deltas', async () => {
  const reasoningEvents = [
    { type: 'response.output_item.added', output_index: 0, item: { type: 'reasoning', id: 'rs_test', summary: [] } },
    { type: 'response.reasoning_summary_part.added', item_id: 'rs_test', output_index: 0, summary_index: 0, part: { type: 'summary_text', text: '' } },
    { type: 'response.reasoning_summary_text.delta', item_id: 'rs_test', output_index: 0, summary_index: 0, delta: '先确定页面结构。' },
    { type: 'response.reasoning_summary_part.done', item_id: 'rs_test', output_index: 0, summary_index: 0, part: { type: 'summary_text', text: '先确定页面结构。' } },
    { type: 'response.output_item.done', output_index: 0, item: { type: 'reasoning', id: 'rs_test', summary: [{ type: 'summary_text', text: '先确定页面结构。' }] } },
  ];
  const events = [];
  const provider = runtime(async () => new Response(reasoningEvents.map(event => `data: ${JSON.stringify(event)}\n\n`).join('') + responseEvents(pageOutput()), { headers: { 'content-type': 'text/event-stream' } }));
  await provider.responsesAgentProvider({ messages, settings, onEvent: event => events.push(event) });
  assert.equal(events.filter(event => event.type === 'reasoning').map(event => event.text).join(''), '先确定页面结构。');
});

test('Responses carries a bounded selection and image reference, and decodes in-place changes', async () => {
  let request;
  const output = { reply: '更新按钮文案', questions: [], plan: null, changes: { summary: '更新文案', operations: [{ kind: 'update', nodeId: 'button-a', fields: [{ key: 'props.text', value: '确认' }] }] } };
  const provider = runtime(async (url, init) => { request = JSON.parse(init.body); return new Response(responseEvents(output), { headers: { 'content-type': 'text/event-stream' } }); });
  const context = { projectId: 'p', pageId: 'page', pageName: '首页', references: [{ kind: 'image', id: 'image-ref', role: 'reference', name: '参考图', dataUrl: 'data:image/png;base64,aGVsbG8=' }], snapshot: { roots: ['button-a'], writableIds: ['button-a'], nodes: [], referenceNodes: [] } };
  const result = await provider.responsesAgentProvider({ messages: [{ role: 'user', content: '修改此按钮' }], settings, context });
  assert.equal(result.changes.operations[0].nodeId, 'button-a'); assert.equal(result.plan, undefined);
  const user = request.input.find(item => item.role === 'user');
  assert.ok(user.content.some(part => part.type === 'input_image' && part.image_url.startsWith('data:image/png;base64,')));
  assert.ok(user.content.some(part => part.type === 'input_text' && part.text.includes('BLUEPEN_CONTEXT') && part.text.includes('button-a')));
});
