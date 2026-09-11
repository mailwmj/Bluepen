import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadTypeScript } from '../../../../tests/load-typescript.mjs';

const file = name => fileURLToPath(new URL(name, import.meta.url));
const library = loadTypeScript(file('../library/index.ts'));
const mocks = { '../library': library, '../library/index': library };
const { AgentController } = loadTypeScript(file('./agent-controller.ts'), { mocks, globals: { crypto: webcrypto, AbortController, URL } });
const { prepareAgentArtifact } = loadTypeScript(file('./agent-canvas.ts'), { mocks });
const context = { projectId: 'project-a', pageId: 'page-a', pageName: '首页' };
const settings = { baseUrl: 'https://example.com/v1', apiKey: 'test-secret', model: 'fixture' };
const plan = { artifactKind: 'component', pageName: '按钮', purpose: '测试新增', notes: [], root: { type: 'group', name: '按钮组合', x: 0, y: 0, width: 120, height: 40, children: [] } };
function setup(provider = async () => ({ reply: '完成', plan }), initial) {
  const memory = { history: initial, settings, fail: false };
  const storage = {
    loadHistory: async () => structuredClone(memory.history), loadSettings: async () => ({ ...memory.settings }),
    saveHistory: async history => { if (memory.fail) throw new Error('磁盘已满'); memory.history = structuredClone(history); },
    saveSettings: async value => { memory.settings = value; },
  };
  return { controller: new AgentController(storage, provider), memory, storage };
}
function pending() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }

test('new sessions isolate histories and drafts across same-name projects; durable restore retains both roles', async () => {
  const { controller: agent, memory, storage } = setup(); await agent.initialize();
  const a = agent.newSession('project-a'); agent.updateSession(a.id, { draft: '草稿' });
  await agent.send(a.id, '生成按钮', context);
  const b = agent.newSession('project-b'); agent.updateSession(b.id, { draft: '另一个草稿' });
  const c = agent.newSession('project-a'); agent.updateSession(c.id, { title: '第二段讨论' });
  assert.equal(agent.current('project-a').id, c.id); assert.equal(agent.current('project-b').id, b.id);
  await agent.flush();
  assert.ok(!JSON.stringify(memory.history).includes(settings.apiKey));
  const restored = new AgentController(storage, async () => ({})); await restored.initialize();
  assert.equal(restored.session(a.id).messages.length, 2);
  assert.equal(restored.session(a.id).messages[1].status, 'waiting-approval');
  assert.equal(restored.session(b.id).draft, '另一个草稿');
  assert.equal(restored.current('project-a').title, '第二段讨论');
});

test('running session can be deselected; stop rejects late text, events and completed plans', async () => {
  const request = pending(); let input;
  const { controller: agent } = setup(value => { input = value; return request.promise; }); await agent.initialize();
  const a = agent.newSession(context.projectId); const run = agent.send(a.id, '长任务', context);
  assert.equal(agent.session(a.id).messages[0].content, '长任务');
  assert.equal(agent.session(a.id).messages[1].status, 'running');
  const b = agent.newSession(context.projectId); assert.equal(agent.current(context.projectId).id, b.id);
  input.onReply('已接收'); input.onEvent({ type: 'tool', id: 'tool-1', label: '查询组件', status: 'running', detail: 'button' });
  agent.stop(); assert.equal(input.signal.aborted, true);
  input.onReply('不应接收的迟到文本'); input.onEvent({ type: 'reasoning', text: '迟到推理' });
  request.resolve({ reply: '迟到完成', plan }); await run;
  const message = agent.session(a.id).messages[1];
  assert.equal(message.status, 'cancelled'); assert.equal(message.content, '已接收'); assert.equal(message.plan, undefined);
  assert.equal(message.steps[0].status, 'cancelled'); assert.equal(message.reasoning, ''); await agent.flush();
});

test('required questions block continuation; answer is recorded once and continues original target', async () => {
  const calls = []; const second = pending();
  const { controller: agent } = setup(async input => {
    calls.push(input);
    if (calls.length === 1) return { reply: '先确认目标', questions: [{ id: 'platform', title: '目标平台？', options: ['桌面', '移动'], required: true, multiple: false }] };
    return second.promise;
  }); await agent.initialize(); const session = agent.newSession(context.projectId);
  await agent.send(session.id, '做一个页面', context);
  const message = agent.session(session.id).messages[1];
  await assert.rejects(agent.answer(session.id, message.id, {}), /必答/);
  assert.equal(calls.length, 1);
  const run = agent.answer(session.id, message.id, { platform: '移动' });
  await agent.answer(session.id, message.id, { platform: '桌面' });
  assert.equal(calls.length, 2); assert.equal(calls[1].context.pageId, context.pageId);
  assert.ok(calls[1].messages.at(-1).content.includes('移动'));
  second.resolve({ reply: '准备好了', plan }); await run;
  assert.equal(agent.session(session.id).messages[1].answers.platform, '移动');
  assert.equal(agent.session(session.id).messages.length, 4); await agent.flush();
});

test('approval applies once; rejected plans never mutate canvas and failures remain retryable', async () => {
  const { controller: agent } = setup(); await agent.initialize(); const session = agent.newSession(context.projectId);
  await agent.send(session.id, '生成按钮', context); const message = agent.session(session.id).messages.at(-1);
  let count = 0;
  agent.apply(session.id, message.id, () => { throw new Error('目标页面已删除'); });
  assert.equal(agent.session(session.id).messages.at(-1).status, 'waiting-approval');
  assert.match(agent.session(session.id).messages.at(-1).error, /已删除/);
  const apply = () => { count++; return { pageId: context.pageId, elementId: 'el', name: '按钮' }; };
  agent.apply(session.id, message.id, apply); agent.apply(session.id, message.id, apply);
  assert.equal(count, 1); assert.equal(agent.session(session.id).messages.at(-1).status, 'completed');
  await agent.send(session.id, '另一个按钮', context); const next = agent.session(session.id).messages.at(-1);
  agent.dismiss(session.id, next.id); agent.apply(session.id, next.id, apply); assert.equal(count, 1); await agent.flush();
});

test('failed request preserves submitted message; retry does not duplicate user input and uses updated key', async () => {
  let calls = 0;
  const { controller: agent } = setup(async input => { calls++; if (calls === 1) throw new Error('错误 test-secret'); assert.equal(input.settings.apiKey, 'new-key'); return { reply: '成功' }; });
  await agent.initialize(); const session = agent.newSession(context.projectId);
  await agent.send(session.id, '任务', context); const message = agent.session(session.id).messages.at(-1);
  assert.equal(message.status, 'failed'); assert.ok(!message.error.includes('test-secret'));
  await agent.saveSettings({ ...settings, apiKey: 'new-key' });
  await agent.retry(session.id, message.id);
  assert.equal(agent.session(session.id).messages.filter(message => message.role === 'user').length, 1);
  assert.equal(agent.session(session.id).messages.at(-1).status, 'completed'); await agent.flush();
});

test('reload marks in-flight work interrupted without losing waiting human requests; corrupt history is not overwritten', async () => {
  const request = pending();
  const { controller: agent, storage, memory } = setup(() => request.promise); await agent.initialize();
  const session = agent.newSession(context.projectId); const run = agent.send(session.id, '任务', context); await agent.flush();
  const restored = new AgentController(storage, async () => ({ reply: '' })); await restored.initialize();
  assert.equal(restored.session(session.id).messages.at(-1).status, 'interrupted');
  agent.stop(); request.resolve({ reply: '' }); await run;
  const bad = setup(undefined, { version: 1, sessions: [{ id: 'broken' }], selected: {} }); await bad.controller.initialize();
  assert.ok(bad.controller.getSnapshot().historyError); assert.equal(bad.controller.newSession('p'), undefined);
  await bad.controller.flush(); assert.equal(bad.memory.history.sessions[0].id, 'broken'); await agent.flush();
});

test('save failure is visible and latest history can be retried; archive and deletion persist', async () => {
  const { controller: agent, memory } = setup(); await agent.initialize(); const session = agent.newSession(context.projectId);
  memory.fail = true; agent.updateSession(session.id, { draft: '不能丢的草稿' }); await agent.flush(); assert.ok(agent.getSnapshot().saveError);
  memory.fail = false; await agent.flush(); assert.equal(memory.history.sessions[0].draft, '不能丢的草稿'); assert.equal(agent.getSnapshot().saveError, '');
  agent.archive(session.id); await agent.flush(); assert.equal(memory.history.sessions[0].archived, true);
  agent.archive(session.id); agent.remove(session.id); await agent.flush(); assert.equal(memory.history.sessions.length, 0);
});

test('canvas application rejects wrong project/page and has stable deduplicated artifact IDs', () => {
  const canvas = { projectId: context.projectId, pageId: context.pageId, elements: [] };
  assert.throws(() => prepareAgentArtifact(plan, { ...context, projectId: 'other' }, canvas, 'run1'), /其他项目/);
  assert.throws(() => prepareAgentArtifact(plan, { ...context, pageId: 'other' }, canvas, 'run1'), /目标页面/);
  const first = prepareAgentArtifact(plan, context, canvas, 'run1');
  const second = prepareAgentArtifact(plan, context, { ...canvas, elements: first.elements }, 'run1');
  assert.equal(second.elements.length, 1); assert.equal(second.elements, first.elements);
  const third = prepareAgentArtifact(plan, context, { ...canvas, elements: first.elements }, 'run2');
  assert.ok(third.element.x >= first.element.x + first.element.width);
});

test('unfinished human answers persist across reload and explicit session titles survive the first send', async () => {
  const { controller: agent, storage } = setup(async () => ({ reply: '请回答', questions: [{ id: 'p', title: '平台？', options: ['桌面'], required: true, multiple: false }] }));
  await agent.initialize(); const session = agent.newSession(context.projectId);
  agent.updateSession(session.id, { title: '我的命名' }); await agent.send(session.id, '原始任务', context);
  const message = agent.session(session.id).messages.at(-1);
  agent.updateQuestionDraft(session.id, message.id, { p: { choices: ['桌面'], custom: '宽屏' } }); await agent.flush();
  const restored = new AgentController(storage, async () => ({})); await restored.initialize();
  assert.equal(restored.session(session.id).title, '我的命名');
  assert.equal(restored.session(session.id).messages.at(-1).questionDraft.p.custom, '宽屏');
  assert.equal(restored.session(session.id).messages.at(-1).status, 'waiting-input');
});
