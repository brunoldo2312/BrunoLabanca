/* =========================================================
   curriculo.js — LinkedIn + PDF + IA
   ========================================================= */

/* ---------- CONFIGURAÇÃO ---------- */
const LINKEDIN_CLIENT_ID = 'SEU_LINKEDIN_CLIENT_ID';
const LINKEDIN_REDIRECT_URI = window.location.origin + window.location.pathname;
const WORKER_URL = 'https://SEU-WORKER.workers.dev'; // Cloudflare Worker

/* ---------- ESTADO GLOBAL ---------- */
let perfilLinkedIn = null;
let textoCurriculoOriginal = '';
let textoCurriculoOtimizado = '';

/* =========================================================
   ETAPA 1 — LINKEDIN OAUTH
   ========================================================= */
function iniciarLinkedIn() {
  const btn = document.getElementById('btnLinkedIn');
  const btnLogout = document.getElementById('btnLogoutLinkedIn');

  // Verifica se voltou do OAuth com código
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (code) {
    trocarCodigoPorToken(code);
    // Limpa URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Restaura sessão salva
  const salvo = localStorage.getItem('linkedin_perfil');
  if (salvo) {
    perfilLinkedIn = JSON.parse(salvo);
    mostrarPerfilLinkedIn(perfilLinkedIn);
  }

  if (btn) {
    btn.addEventListener('click', () => {
      const state = Math.random().toString(36).substring(2);
      sessionStorage.setItem('linkedin_state', state);

      const url = `https://www.linkedin.com/oauth/v2/authorization`
        + `?response_type=code`
        + `&client_id=${LINKEDIN_CLIENT_ID}`
        + `&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}`
        + `&state=${state}`
        + `&scope=openid%20profile%20email`;

      window.location.href = url;
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('linkedin_perfil');
      localStorage.removeItem('linkedin_access_token');
      perfilLinkedIn = null;
      document.getElementById('perfilLinkedIn').style.display = 'none';
      document.getElementById('btnLinkedIn').style.display = 'inline-flex';
    });
  }
}

async function trocarCodigoPorToken(code) {
  // ⚠️ Em produção, esta troca DEVE ser feita no backend (Cloudflare Worker)
  // Aqui é uma versão simplificada para você testar
  try {
    const resp = await fetch(`${WORKER_URL}/linkedin/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        redirect_uri: LINKEDIN_REDIRECT_URI
      })
    });

    if (!resp.ok) throw new Error('Falha ao trocar código por token');

    const dados = await resp.json();
    localStorage.setItem('linkedin_access_token', dados.access_token);

    // Busca perfil do usuário
    await buscarPerfilLinkedIn(dados.access_token);

  } catch (erro) {
    console.error('Erro LinkedIn:', erro);
    alert('Não foi possível conectar ao LinkedIn. Tente novamente.');
  }
}

async function buscarPerfilLinkedIn(accessToken) {
  try {
    // OpenID Connect userinfo endpoint (novo padrão do LinkedIn)
    const resp = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!resp.ok) throw new Error('Falha ao buscar perfil');

    const dados = await resp.json();
    perfilLinkedIn = {
      nome: dados.name || `${dados.given_name || ''} ${dados.family_name || ''}`.trim(),
      email: dados.email,
      foto: dados.picture
    };

    localStorage.setItem('linkedin_perfil', JSON.stringify(perfilLinkedIn));
    mostrarPerfilLinkedIn(perfilLinkedIn);

  } catch (erro) {
    console.error('Erro ao buscar perfil:', erro);
  }
}

function mostrarPerfilLinkedIn(perfil) {
  const box = document.getElementById('perfilLinkedIn');
  const btn = document.getElementById('btnLinkedIn');
  if (!box) return;

  document.getElementById('fotoLinkedIn').src = perfil.foto || '';
  document.getElementById('nomeLinkedIn').textContent = perfil.nome;
  document.getElementById('emailLinkedIn').textContent = perfil.email;

  box.style.display = 'flex';
  if (btn) btn.style.display = 'none';
}

/* =========================================================
   ETAPA 2 — UPLOAD E EXTRAÇÃO DO PDF
   ========================================================= */
function iniciarUploadPDF() {
  const area = document.getElementById('areaUpload');
  const input = document.getElementById('inputPDF');
  const btnRemover = document.getElementById('btnRemoverPDF');

  if (!area || !input) return;

  area.addEventListener('click', () => input.click());

  area.addEventListener('dragover', (e) => {
    e.preventDefault();
    area.classList.add('drag-over');
  });

  area.addEventListener('dragleave', () => area.classList.remove('drag-over'));

  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) processarPDF(file);
  });

  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) processarPDF(file);
  });

  if (btnRemover) {
    btnRemover.addEventListener('click', () => {
      textoCurriculoOriginal = '';
      document.getElementById('arquivoInfo').style.display = 'none';
      document.getElementById('areaUpload').style.display = 'block';
      document.getElementById('btnMelhorarIA').disabled = true;
      document.getElementById('etapa-resultado').style.display = 'none';
    });
  }
}

async function processarPDF(file) {
  // Valida tipo e tamanho
  if (file.type !== 'application/pdf') {
    alert('⚠️ Envie um arquivo PDF.');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert('⚠️ PDF muito grande (máximo 5MB).');
    return;
  }

  const status = document.getElementById('statusIA');
  status.style.display = 'flex';
  status.className = 'status-ia carregando';
  status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Extraindo texto do PDF...';

  try {
    // Usa pdf.js para extrair texto
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let textoCompleto = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const pagina = await pdf.getPage(i);
      const conteudo = await pagina.getTextContent();
      const textoPagina = conteudo.items.map(item => item.str).join(' ');
      textoCompleto += textoPagina + '\n\n';
    }

    textoCurriculoOriginal = textoCompleto.trim();

    if (textoCurriculoOriginal.length < 50) {
      throw new Error('PDF parece estar vazio ou ser uma imagem (sem texto).');
    }

    // Mostra info do arquivo
    document.getElementById('nomeArquivo').textContent = file.name;
    document.getElementById('arquivoInfo').style.display = 'flex';
    document.getElementById('areaUpload').style.display = 'none';
    document.getElementById('btnMelhorarIA').disabled = false;

    status.className = 'status-ia sucesso';
    status.innerHTML = `<i class="fas fa-check-circle"></i> PDF processado! ${textoCurriculoOriginal.length} caracteres extraídos.`;

  } catch (erro) {
    console.error('Erro ao processar PDF:', erro);
    status.className = 'status-ia erro';
    status.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${erro.message}`;
  }
}

/* =========================================================
   ETAPA 3 — OTIMIZAÇÃO COM IA
   ========================================================= */
function iniciarIA() {
  const btn = document.getElementById('btnMelhorarIA');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    if (!textoCurriculoOriginal) {
      alert('Envie um PDF primeiro.');
      return;
    }

    const objetivo = document.getElementById('objetivoIA').value;
    const status = document.getElementById('statusIA');

    status.style.display = 'flex';
    status.className = 'status-ia carregando';
    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A IA está reescrevendo seu currículo... (pode levar 20-30s)';
    btn.disabled = true;

    try {
      const resp = await fetch(`${WORKER_URL}/ia/otimizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texto: textoCurriculoOriginal,
          objetivo,
          perfil: perfilLinkedIn
        })
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.erro || `Erro HTTP ${resp.status}`);
      }

      const dados = await resp.json();
      textoCurriculoOtimizado = dados.texto;

      // Mostra resultado
      document.getElementById('textoOriginal').textContent = textoCurriculoOriginal;
      document.getElementById('textoOtimizado').textContent = textoCurriculoOtimizado;
      document.getElementById('etapa-resultado').style.display = 'block';
      document.getElementById('etapa-resultado').scrollIntoView({ behavior: 'smooth' });

      status.className = 'status-ia sucesso';
      status.innerHTML = '<i class="fas fa-check-circle"></i> Currículo otimizado com sucesso!';

    } catch (erro) {
      console.error('Erro IA:', erro);
      status.className = 'status-ia erro';
      status.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${erro.message}`;
    } finally {
      btn.disabled = false;
    }
  });

  // Botões de ação
  const btnCopiar = document.getElementById('btnCopiarIA');
  const btnBaixar = document.getElementById('btnBaixarIA');
  const btnRefazer = document.getElementById('btnRefazerIA');

  if (btnCopiar) {
    btnCopiar.addEventListener('click', () => {
      navigator.clipboard.writeText(textoCurriculoOtimizado)
        .then(() => alert('📋 Texto copiado!'))
        .catch(() => alert('Erro ao copiar.'));
    });
  }

  if (btnBaixar) {
    btnBaixar.addEventListener('click', () => {
      const blob = new Blob([textoCurriculoOtimizado], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `curriculo_otimizado_${new Date().toISOString().slice(0,10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (btnRefazer) {
    btnRefazer.addEventListener('click', () => {
      document.getElementById('etapa-resultado').style.display = 'none';
      document.getElementById('btnMelhorarIA').click();
    });
  }
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  iniciarLinkedIn();
  iniciarUploadPDF();
  iniciarIA();
});