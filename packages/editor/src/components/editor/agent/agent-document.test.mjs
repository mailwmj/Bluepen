import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadTypeScript } from '../../../../tests/load-typescript.mjs';

const file = name => fileURLToPath(new URL(name, import.meta.url));
const library = loadTypeScript(file('../library/index.ts'));
const options = { mocks: { '../library': library, '../library/index': library }, globals: { crypto: webcrypto, URL, AbortController } };
const d = loadTypeScript(file('./agent-document.ts'), options);
const { AgentController } = loadTypeScript(file('./agent-controller.ts'), options);
const { planToElement } = loadTypeScript(file('./prototype-plan.ts'), options);
const button = (id, parentId = null) => ({ id, type: 'button', name: id, x: 8, y: 16, width: 120, height: 40, rotation: 0, opacity: 1, visible: true, locked: false, parentId, children: [], autoLayout: null, props: { ...library.library.find(item => item.type === 'button').defaultProps, text: id } });
const group = (id, children) => ({ ...button(id), type: 'group', x: 100, y: 100, width: 400, height: 300, props: {}, children: children.map(node => ({ ...node, parentId: id })) });
const initial = () => [group('g', [button('a'), button('b')]), button('outside')];
const base = { projectId: 'project', pageId: 'page', pageName: '页面' };
function context(elements, ids = ['g'], extra = []) {
  const page = { id: 'page', name: '页面', elements };
  return structuredClone(d.captureAgentContext({ ...base, references: [...d.canvasReferences('project', page, ids), ...extra] }, [page]));
}
const change = (...operations) => ({ summary: '更新选区', operations });
const update = (nodeId, value, key = 'props.text') => ({ kind: 'update', nodeId, fields: [{ key, value }] });
const apply = (elements, ctx, changes, id = 'tx') => d.prepareAgentChanges(changes, ctx, elements, id);
const plain = value => JSON.parse(JSON.stringify(value));

test('selection preserves object identity, deduplicates parent/child and bounds the readable document', () => {
  const elements = initial(), ctx = context(elements, ['g', 'a']);
  assert.equal(ctx.references.length, 1);
  assert.deepEqual(plain(ctx.snapshot.writableIds), ['g', 'a', 'b']);
  assert.equal(ctx.snapshot.nodes.some(node => node.id === 'outside'), false);
  assert.throws(() => context(Array.from({ length: 601 }, (_, index) => button(`n${index}`)), Array.from({ length: 601 }, (_, index) => `n${index}`)), /600/);
});
test('batch update changes both selected components in place and merges props', () => {
  const elements = initial(), ctx = context(elements, ['a', 'b']);
  const result = apply(elements, ctx, change(update('a', '提交'), update('b', '取消')));
  const nodes = d.indexAgentNodes(result.elements);
  assert.equal(nodes.get('a').props.text, '提交'); assert.equal(nodes.get('b').props.text, '取消');
  assert.equal(nodes.get('a').parentId, 'g'); assert.equal(nodes.get('a').width, 120);
  assert.equal(result.elements[1], result.elements.find(node => node.id === 'outside'));
  assert.equal(elements[0].children[0].props.text, 'a');
  assert.equal(d.agentReceiptState(result.receipt, result.elements), 'applied');
});
test('read-only references, missing targets and cross-page edits fail before any mutation', () => {
  const elements = initial(), reference = { kind: 'canvas', role: 'reference', id: 'ref', nodeId: 'outside', projectId: 'project', pageId: 'page', pageName: '页面', name: '参考' };
  const ctx = context(elements, ['a'], [reference]);
  assert.ok(ctx.snapshot.referenceNodes.some(node => node.id === 'outside'));
  assert.throws(() => apply(elements, ctx, change(update('outside', '误改'))), /超出选定对象/);
  assert.throws(() => d.captureAgentContext({ ...ctx, pageId: 'other' }, [{ id: 'page', name: '页面', elements }, { id: 'other', name: '其他', elements: [] }]), /切换到/);
  assert.throws(() => d.captureAgentContext(ctx, [{ id: 'page', name: '页面', elements: [] }]), /已删除/);
});
test('ancestor and descendant locks cannot be bypassed by model operations', () => {
  const elements = initial(), ctx = context(elements);
  elements[0].locked = true;
  assert.throws(() => apply(elements, ctx, change(update('a', '错误'))), /锁定/);
  assert.throws(() => context(elements, ['a']), /锁定/);
  elements[0].locked = false; elements[0].children[0].locked = true;
  assert.throws(() => apply(elements, context(elements), change({ kind: 'delete', nodeId: 'g' })), /选定对象|锁定/);
});
test('manual changes conflict atomically while unrelated manual properties are preserved', () => {
  const elements = initial(), ctx = context(elements, ['a', 'b']);
  const manual = structuredClone(elements); manual[0].children[1].props.text = '手工输入';
  const before = JSON.stringify(manual);
  assert.throws(() => apply(manual, ctx, change(update('a', 'AI'), update('b', 'AI'))), /手工修改/);
  assert.equal(JSON.stringify(manual), before);
  const unrelated = structuredClone(elements); unrelated[0].children[0].opacity = 0.4;
  const result = apply(unrelated, ctx, change(update('a', 'AI')));
  assert.equal(result.elements[0].children[0].opacity, 0.4);
});
test('moved or regrouped targets require a fresh snapshot', () => {
  const elements = initial(), ctx = context(elements, ['a']); elements[0].x += 20;
  assert.throws(() => apply(elements, ctx, change(update('a', 'AI'))), /父组合已变化/);
});
test('invalid fields and out-of-range dimensions are rejected', () => {
  const elements = initial(), ctx = context(elements);
  for (const [key, value] of [['id', 'fake'], ['locked', false], ['props.__proto__', 'x'], ['width', -1], ['opacity', 4], ['props.text', 42], ['props.unknown', 'x']]) assert.throws(() => apply(elements, ctx, change(update('a', value, key))), /无效/);
});
test('scoped undo preserves later unrelated edits and refuses to overwrite the same edited field', () => {
  const elements = initial(), result = apply(elements, context(elements), change(update('a', 'AI')));
  result.elements[0].children[0].opacity = 0.5;
  const undone = d.undoAgentReceipt(result.receipt, result.elements);
  assert.equal(undone[0].children[0].props.text, 'a'); assert.equal(undone[0].children[0].opacity, 0.5);
  assert.equal(d.agentReceiptState(result.receipt, undone), 'reverted');
  result.elements[0].children[0].props.text = '后续手工输入';
  assert.equal(d.agentReceiptState(result.receipt, result.elements), 'changed');
  assert.throws(() => d.undoAgentReceipt(result.receipt, result.elements), /无法安全撤销/);
});
test('insert, move and delete are atomic, retain IDs and have reversible structural receipts', () => {
  const elements = initial(), ctx = context(elements);
  const node = { type: 'button', name: '新按钮', x: 8, y: 80, width: 120, height: 40, props: { text: '新增' }, children: [] };
  const inserted = apply(elements, ctx, change({ kind: 'insert', parentId: 'g', index: 1, node }));
  assert.equal(inserted.elements[0].children[1].props.text, '新增');
  assert.deepEqual(plain(d.undoAgentReceipt(inserted.receipt, inserted.elements)), elements);
  const moved = apply(elements, ctx, change({ kind: 'move', nodeId: 'a', parentId: 'g', index: 1, x: 24, y: 64 }));
  assert.equal(moved.elements[0].children[1].id, 'a'); assert.equal(moved.elements[0].children[1].x, 24);
  assert.deepEqual(plain(d.undoAgentReceipt(moved.receipt, moved.elements)), elements);
  const deleted = apply(elements, ctx, change({ kind: 'delete', nodeId: 'a' }));
  assert.equal(deleted.elements[0].children.length, 1);
  assert.deepEqual(plain(d.undoAgentReceipt(deleted.receipt, deleted.elements)), elements);
});
test('deletion does not leave an external connector dangling', () => {
  const elements = initial(); elements.push({ ...button('edge'), type: 'connector', props: { startElementId: 'a', endElementId: 'outside' } });
  assert.throws(() => apply(elements, context(elements), change({ kind: 'delete', nodeId: 'a' })), /连接线/);
});
test('template generation creates real editable atomic children and preview locates nested targets', () => {
  const template = planToElement({ artifactKind: 'component', pageName: '登录', purpose: '', notes: [], root: { type: 'web-login-card', name: '登录模板', x: 0, y: 0, width: 360, height: 400 } }, 0, 0);
  assert.equal(template.type, 'group'); assert.ok(template.children.length > 3);
  assert.ok(template.children.every(node => node.parentId === template.id));
  const projected = d.projectAgentElements(initial(), ['a']);
  assert.equal(projected[0].x, 108); assert.equal(projected[0].y, 116); assert.equal(projected[0].id, 'a');
  // A selected group also appears in its receipt's changed IDs. Render it once.
  const combined = d.projectAgentElements(initial(), ['g', 'g', 'a']);
  assert.equal(combined.length, 1); assert.equal(combined[0].children.length, 2);
});

async function session(provider) {
  let elements = initial(), history, commits = 0;
  const storage = { loadHistory: async () => history, saveHistory: async value => { history = structuredClone(value); }, loadSettings: async () => ({ baseUrl: 'https://example.com/v1', apiKey: 'fixture-key', model: 'fixture' }), saveSettings: async () => {} };
  const agent = new AgentController(storage, provider);
  const adapter = {
    capture: ctx => d.captureAgentContext(ctx, [{ id: 'page', name: '页面', elements }]),
    apply: (changes, ctx, id) => { const result = apply(elements, ctx, changes, id); elements = result.elements; commits++; return { pageId: 'page', elementId: 'a', name: changes.summary, receipt: result.receipt }; },
    status: artifact => d.agentReceiptState(artifact.receipt, elements),
    undo: artifact => { elements = d.undoAgentReceipt(artifact.receipt, elements); commits++; },
    preview: () => ({ before: [], after: [] }),
  };
  agent.setCanvasAdapter(adapter); await agent.initialize(); const current = agent.newSession('project');
  agent.addReferences(current.id, d.canvasReferences('project', { id: 'page', name: '页面', elements }, ['a', 'b']));
  return { agent, id: current.id, storage, adapter, document: () => elements, commits: () => commits };
}
test('Controller freezes references, applies batch changes once and restores receipts with live status', async () => {
  let input;
  const s = await session(async value => { input = value; return { reply: '统一文案', changes: change(update('a', '提交'), update('b', '取消')) }; });
  await s.agent.send(s.id, '改这两个按钮', base);
  assert.equal(input.context.snapshot.writableIds.length, 2); assert.equal(s.commits(), 1);
  const message = s.agent.session(s.id).messages.at(-1);
  assert.equal(message.status, 'completed'); assert.ok(message.applied.receipt);
  s.agent.applyChanges(s.id, message.id); assert.equal(s.commits(), 1);
  await s.agent.flush(); const restored = new AgentController(s.storage, async () => ({})); restored.setCanvasAdapter(s.adapter); await restored.initialize();
  assert.equal(restored.getSnapshot().historyError, ''); assert.equal(restored.session(s.id).references.length, 2);
  restored.undo(s.id, message.id); assert.equal(s.document()[0].children[0].props.text, 'a');
  assert.equal(restored.resultState(restored.session(s.id).messages.at(-1).applied), 'reverted'); await restored.flush();
});
test('late provider results after Stop never apply edits', async () => {
  let resolve; const pending = new Promise(done => { resolve = done; });
  const s = await session(() => pending); const run = s.agent.send(s.id, '修改', base);
  s.agent.stop(); resolve({ reply: '迟到', changes: change(update('a', '错误')) }); await run;
  assert.equal(s.commits(), 0); assert.equal(s.document()[0].children[0].props.text, 'a'); await s.agent.flush();
});
test('structural edits wait for explicit application and refused proposals never mutate', async () => {
  const s = await session(async () => ({ reply: '删除其中一个', changes: change({ kind: 'delete', nodeId: 'a' }) }));
  await s.agent.send(s.id, '删除第一个按钮', base); const message = s.agent.session(s.id).messages.at(-1);
  assert.equal(message.status, 'waiting-approval'); assert.equal(s.commits(), 0);
  s.agent.dismiss(s.id, message.id); s.agent.applyChanges(s.id, message.id); assert.equal(s.commits(), 0); await s.agent.flush();
});
