/**
 * Lovense Cloud MCP Worker
 * Remote toy control via Cloudflare Workers
 *
 * Built by Mai & Kai, December 2025
 */

const LOVENSE_API = 'https://api.lovense.com/api/lan/v2/command';
const LOVENSE_QR_API = 'https://api.lovense.com/api/lan/getQrCode';

// Tool definitions for MCP
const TOOLS = [
  {
    name: 'get_qr_code',
    description: 'Generate QR code for pairing toy with this MCP. User scans with Lovense Remote app.',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'get_toys',
    description: 'Get list of connected Lovense toys',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'vibrate',
    description: 'Vibrate the toy',
    inputSchema: {
      type: 'object',
      properties: {
        intensity: { type: 'number', description: 'Vibration strength 0-20 (default 10)', minimum: 0, maximum: 20 },
        duration: { type: 'number', description: 'Duration in seconds (default 5)' }
      }
    }
  },
  {
    name: 'vibrate_pattern',
    description: 'Vibrate with on/off pattern (pulsing)',
    inputSchema: {
      type: 'object',
      properties: {
        intensity: { type: 'number', description: 'Vibration strength 0-20 (default 10)' },
        duration: { type: 'number', description: 'Total duration in seconds (default 10)' },
        on_sec: { type: 'number', description: 'Seconds of vibration per pulse (default 2)' },
        off_sec: { type: 'number', description: 'Seconds of pause between pulses (default 1)' }
      }
    }
  },
  {
    name: 'pattern',
    description: 'Send custom intensity pattern',
    inputSchema: {
      type: 'object',
      properties: {
        strengths: { type: 'string', description: 'Semicolon-separated intensity values 0-20 (e.g., "5;10;15;20;15;10;5")' },
        interval_ms: { type: 'number', description: 'Milliseconds between each intensity change (min 100, default 500)' },
        duration: { type: 'number', description: 'Total duration in seconds (default 10)' }
      }
    }
  },
  {
    name: 'preset',
    description: 'Run a built-in pattern preset: pulse, wave, fireworks, or earthquake',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Preset name (default "pulse")', enum: ['pulse', 'wave', 'fireworks', 'earthquake'] },
        duration: { type: 'number', description: 'Duration in seconds (default 10)' }
      }
    }
  },
  {
    name: 'stop',
    description: 'Stop all toy activity immediately',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'edge',
    description: 'Edging pattern - build up then stop, repeat',
    inputSchema: {
      type: 'object',
      properties: {
        intensity: { type: 'number', description: 'Peak vibration strength 0-20 (default 15)' },
        duration: { type: 'number', description: 'Total duration in seconds (default 30)' },
        on_sec: { type: 'number', description: 'Seconds of vibration per cycle (default 5)' },
        off_sec: { type: 'number', description: 'Seconds of pause between cycles (default 3)' }
      }
    }
  },
  {
    name: 'tease',
    description: 'Teasing pattern - random-feeling intensity changes',
    inputSchema: {
      type: 'object',
      properties: {
        duration: { type: 'number', description: 'Duration in seconds (default 20)' }
      }
    }
  },
  {
    name: 'escalate',
    description: 'Gradual escalation from low to high intensity',
    inputSchema: {
      type: 'object',
      properties: {
        start: { type: 'number', description: 'Starting intensity 0-20 (default 3)' },
        peak: { type: 'number', description: 'Peak intensity 0-20 (default 18)' },
        duration: { type: 'number', description: 'Duration in seconds (default 30)' }
      }
    }
  }
];

async function sendCommand(token, uid, commandData) {
  if (!token) {
    return { error: 'LOVENSE_TOKEN not configured' };
  }

  const payload = {
    token,
    uid: uid || 'mai',
    apiVer: 2,
    ...commandData
  };

  try {
    const response = await fetch(LOVENSE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
}

async function getQrCode(token, uid) {
  if (!token) {
    return { error: 'LOVENSE_TOKEN not configured' };
  }

  try {
    const response = await fetch(LOVENSE_QR_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        uid: uid || 'mai',
        uname: 'Mai',
        v: 2
      })
    });
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
}

async function handleTool(name, args, env) {
  const token = env.LOVENSE_TOKEN;
  const uid = env.LOVENSE_UID || 'mai';

  switch (name) {
    case 'get_qr_code':
      return await getQrCode(token, uid);

    case 'get_toys':
      return await sendCommand(token, uid, { command: 'GetToys' });

    case 'vibrate': {
      const intensity = Math.max(0, Math.min(20, args.intensity || 10));
      return await sendCommand(token, uid, {
        command: 'Function',
        action: `Vibrate:${intensity}`,
        timeSec: args.duration || 5
      });
    }

    case 'vibrate_pattern': {
      const intensity = Math.max(0, Math.min(20, args.intensity || 10));
      return await sendCommand(token, uid, {
        command: 'Function',
        action: `Vibrate:${intensity}`,
        timeSec: args.duration || 10,
        loopRunningSec: args.on_sec || 2,
        loopPauseSec: args.off_sec || 1
      });
    }

    case 'pattern': {
      const interval = Math.max(100, args.interval_ms || 500);
      return await sendCommand(token, uid, {
        command: 'Pattern',
        rule: `V:1;F:v;S:${interval}#`,
        strength: args.strengths || '5;10;15;20;15;10;5',
        timeSec: args.duration || 10
      });
    }

    case 'preset': {
      const validPresets = ['pulse', 'wave', 'fireworks', 'earthquake'];
      const presetName = (args.name || 'pulse').toLowerCase();
      if (!validPresets.includes(presetName)) {
        return { error: `Invalid preset. Choose from: ${validPresets.join(', ')}` };
      }
      return await sendCommand(token, uid, {
        command: 'Preset',
        name: presetName,
        timeSec: args.duration || 10
      });
    }

    case 'stop':
      return await sendCommand(token, uid, {
        command: 'Function',
        action: 'Stop',
        timeSec: 0
      });

    case 'edge': {
      const intensity = Math.max(0, Math.min(20, args.intensity || 15));
      return await sendCommand(token, uid, {
        command: 'Function',
        action: `Vibrate:${intensity}`,
        timeSec: args.duration || 30,
        loopRunningSec: args.on_sec || 5,
        loopPauseSec: args.off_sec || 3
      });
    }

    case 'tease': {
      const pattern = '3;5;2;8;4;10;3;6;12;5;8;3;15;4;7;2;10;5';
      return await sendCommand(token, uid, {
        command: 'Pattern',
        rule: 'V:1;F:v;S:800#',
        strength: pattern,
        timeSec: args.duration || 20
      });
    }

    case 'escalate': {
      const start = Math.max(0, Math.min(20, args.start || 3));
      const peak = Math.max(0, Math.min(20, args.peak || 18));
      const duration = args.duration || 30;

      const steps = 10;
      const stepSize = (peak - start) / steps;
      const strengths = [];
      for (let i = 0; i <= steps; i++) {
        strengths.push(Math.round(start + (stepSize * i)));
      }
      const pattern = strengths.join(';');
      const interval = Math.max(100, Math.floor((duration * 1000) / (steps + 1)));

      return await sendCommand(token, uid, {
        command: 'Pattern',
        rule: `V:1;F:v;S:${interval}#`,
        strength: pattern,
        timeSec: duration
      });
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// MCP Protocol Handler
async function handleMCP(request, env) {
  const url = new URL(request.url);

  // Handle SSE endpoint for MCP
  if (url.pathname === '/mcp' || url.pathname === '/sse') {
    // Return tools list for GET
    if (request.method === 'GET') {
      return new Response(JSON.stringify({
        tools: TOOLS,
        name: 'lovense-cloud',
        version: '1.0.0'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle tool calls for POST
    if (request.method === 'POST') {
      const body = await request.json();

      // Handle MCP tool call
      if (body.method === 'tools/call' || body.tool) {
        const toolName = body.params?.name || body.tool;
        const toolArgs = body.params?.arguments || body.args || {};

        const result = await handleTool(toolName, toolArgs, env);

        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          id: body.id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
          }
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Handle tools/list
      if (body.method === 'tools/list') {
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          id: body.id,
          result: { tools: TOOLS }
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Handle initialize
      if (body.method === 'initialize') {
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          id: body.id,
          result: {
            protocolVersion: '2024-11-05',
            serverInfo: { name: 'lovense-cloud', version: '1.0.0' },
            capabilities: { tools: {} }
          }
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }

  // Simple direct API for testing
  if (url.pathname === '/test') {
    const result = await handleTool('get_toys', {}, env);
    return new Response(JSON.stringify(result, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (url.pathname === '/qr') {
    const result = await handleTool('get_qr_code', {}, env);
    return new Response(JSON.stringify(result, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Health check
  if (url.pathname === '/health' || url.pathname === '/') {
    return new Response(JSON.stringify({
      status: 'ok',
      service: 'lovense-cloud',
      tools: TOOLS.map(t => t.name)
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response('Not Found', { status: 404 });
}

export default {
  async fetch(request, env, ctx) {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    const response = await handleMCP(request, env);

    // Add CORS headers to response
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(response.body, {
      status: response.status,
      headers
    });
  }
};
