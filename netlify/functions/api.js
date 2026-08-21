const ALLOWED_ACTIONS = new Set([
  'getBootstrap',
  'getLeaderboard',
  'registerParticipant',
  'startQuiz',
  'submitQuiz',
  'uploadShelfPhoto',
  'trackEvent'
]);

exports.handler = async function handler(event) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'Chỉ hỗ trợ phương thức POST.' }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const action = String(payload.action || '');
    if (!ALLOWED_ACTIONS.has(action)) throw new Error('Hàm không được hỗ trợ: ' + action);

    const upstreamUrl = process.env.APPS_SCRIPT_API_URL;
    const secret = process.env.APPS_SCRIPT_API_SECRET;
    if (!upstreamUrl || !secret) throw new Error('Website chưa được cấu hình kết nối dữ liệu.');

    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ secret, action, args: Array.isArray(payload.args) ? payload.args : [] }),
      redirect: 'follow'
    });

    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); }
    catch (_) { throw new Error('Không đọc được phản hồi từ hệ thống dữ liệu.'); }

    return { statusCode: data.ok ? 200 : 400, headers, body: JSON.stringify(data) };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: error && error.message ? error.message : 'Lỗi máy chủ.' })
    };
  }
};
