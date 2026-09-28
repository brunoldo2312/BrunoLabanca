/* =========================================================
   Cloudflare Worker — Backend do Currículo IA
   
   Rotas:
   POST /linkedin/token       → troca code por access_token
   POST /ia/otimizar          → chama OpenAI e devolve texto
   ========================================================= */

const LINKEDIN_CLIENT_ID = 'SEU_LINKEDIN_CLIENT_ID';
const LINKEDIN_CLIENT_SECRET = 'SEU_LINKEDIN_CLIENT_SECRET';
const OPENAI_API_KEY = 'SUA_OPENAI_KEY'; // ou Anthropic, Gemini, etc.

/* ---------- CORS ---------- */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);

    if (url.pathname === '/linkedin/token') {
      return await trocarToken(request);
    }

    if (url.pathname === '/ia/otimizar') {
      return await otimizarCurriculo(request);
    }

    return new Response('Not found', { status: 404, headers: CORS });
  }
};

/* ---------- LinkedIn: trocar code por token ---------- */
async function trocarToken(request) {
  try {
    const { code, redirect_uri } = await request.json();

    const resp = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
      }),
    });

    const dados = await resp.json();

    if (!resp.ok) {
      return new Response(JSON.stringify({ erro: dados.error_description || 'Falha' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(dados), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });

  } catch (erro) {
    return new Response(JSON.stringify({ erro: erro.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }
}

/* ---------- IA: otimizar currículo ---------- */
async function otimizarCurriculo(request) {
  try {
    const { texto, objetivo, perfil } = await request.json();

    if (!texto || texto.length < 50) {
      return new Response(JSON.stringify({ erro: 'Texto muito curto.' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    const nomeUsuario = perfil?.nome || 'o candidato';

    const prompt = `Você é um especialista em RH e recrutamento para vagas de ${objetivo}.

Reescreva o currículo de ${nomeUsuario} abaixo, mantendo TODAS as informações verdadeiras (não invente experiências), mas:
1. Destaque competências relevantes para contabilidade/controladoria/fiscal
2. Use verbos de ação fortes (ex.: "Auxiliei", "Implementei", "Otimizei")
3. Quantifique resultados quando possível
4. Organize em seções claras: DADOS DE CONTATO, OBJETIVO, EXPERIÊNCIA, FORMAÇÃO, COMPETÊNCIAS
5. Seja profissional mas direto
6. Foque em palavras-chave que recrutadores buscam

CURRÍCULO ORIGINAL:
${texto}

Devolva APENAS o currículo reescrito, sem comentários seus.`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    const dados = await resp.json();

    if (!resp.ok) {
      return new Response(JSON.stringify({ erro: dados.error?.message || 'Erro OpenAI' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    const textoFinal = dados.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ texto: textoFinal }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });

  } catch (erro) {
    return new Response(JSON.stringify({ erro: erro.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }
}