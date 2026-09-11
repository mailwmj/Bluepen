// Protocol fixture only. Never imported by the application or used as a fallback.
export function responseEvents(output) {
  const text = JSON.stringify(output);
  return [
    { type: 'response.created', response: { id: 'resp_test', created_at: 1, model: 'gpt-5.6-terra' } },
    { type: 'response.output_item.added', output_index: 0, item: { type: 'message', id: 'msg_test' } },
    ...[text.slice(0, 20), text.slice(20)].map(delta => ({ type: 'response.output_text.delta', item_id: 'msg_test', delta })),
    { type: 'response.output_item.done', output_index: 0, item: { type: 'message', id: 'msg_test' } },
    { type: 'response.completed', response: { usage: { input_tokens: 40, output_tokens: 80 } } },
  ].map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join('');
}
export function pageOutput() {
  const node = (type, name, x, y, width, height, props = []) => ({ type, name, x, y, width, height, props, children: [] });
  return {
    questions: [],
    reply: '测试协议数据：页面包含三种图片比例和直接可见的操作按钮。',
    plan: {
      artifactKind: 'page',
      pageName: '灵感模板页面（测试）', purpose: '验证流式协议及原型确认流程', notes: ['Hover 用直接可见的操作按钮静态表达'],
      root: {
        ...node('group', '灵感页面', 0, 0, 1120, 720),
        children: [
          node('text', '页面标题', 32, 32, 600, 40, [{ key: 'text', value: '灵感模板' }, { key: 'fontSize', value: 32 }]),
          ...[180, 320, 480].flatMap((height, i) => [
            node('image', `图片 ${i + 1}`, 32 + i * 352, 120, 320, height),
            node('button', `操作 ${i + 1}`, 32 + i * 352, 136 + height, 112, 40, [{ key: 'text', value: '使用模板' }]),
          ]),
        ],
      },
    },
  };
}
