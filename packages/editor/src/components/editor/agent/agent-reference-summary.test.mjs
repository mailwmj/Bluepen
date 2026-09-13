import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { loadTypeScript } from '../../../../tests/load-typescript.mjs';

const file = fileURLToPath(new URL('./agent-reference-summary.ts', import.meta.url));
const { agentReferenceSummary } = loadTypeScript(file);
const canvas = (id, name, role = 'target') => ({ kind: 'canvas', id, name, role, projectId: 'project', pageId: 'page', pageName: 'Page 1', nodeId: id });

test('reference summary keeps one target recognizable and collapses larger scopes', () => {
  assert.equal(agentReferenceSummary([canvas('a', '登录卡片')]), '修改：登录卡片');
  assert.equal(agentReferenceSummary([canvas('a', '标题'), canvas('b', '按钮')]), '修改：2 个对象');
});

test('reference summary separates editable targets from supporting context', () => {
  const image = { kind: 'image', id: 'image', name: '参考图.png', role: 'reference', dataUrl: 'data:image/png;base64,' };
  const catalog = { kind: 'catalog', id: 'catalog:button', name: '按钮', role: 'reference', componentType: 'button' };
  assert.equal(agentReferenceSummary([canvas('a', '卡片'), image]), '修改：卡片 · 参考：参考图.png');
  assert.equal(agentReferenceSummary([image, catalog]), '参考：2 项');
});
