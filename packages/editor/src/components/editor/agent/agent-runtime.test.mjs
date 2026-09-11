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
    globals: { fetch, URL, Headers, Request, Response, AbortSignal, AbortController,
      process: { env: { NEXT_PUBLIC_TOKENBOX_PROXY: '/api/ai/tokenbox' } },
      ...(browser ? { window: { location: { origin: 'http://localhost:3000' } } } : {}),
    },
  });
}
const settings = { baseUrl: 'https://tokbox-api.netease.im/', apiKey: 'test-only-key', model: 'gpt-5.6-terra' };
const messages = [{ role: 'user', content: '灵感模板页面' }, { role: 'assistant', content: '需要分类吗？' }, { role: 'user', content: '需要，先讨论' }];

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
