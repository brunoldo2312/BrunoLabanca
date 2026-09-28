/* =========================================================
   Portfólio Bruno Labanca — script.js
   VERSÃO COMPLETA E MESCLADA
   
   Recursos:
   - Tema claro/escuro com persistência
   - Lista de plataformas externas (renderizada via JS)
   - Busca dinâmica de vagas (Adzuna API)
   - Filtros por categoria (contabilidade/financeiro/administrativo)
   - Sistema de favoritos (localStorage)
   - Compartilhar vaga (copiar link)
   - Contadores: vagas encontradas, visitas
   - Tratamento de erro detalhado (401/429/CORS/400)
   - Escape seguro de HTML e atributos
   ========================================================= */

/* =========================================================
   CONFIGURAÇÃO ADZUNA
   ---------------------------------------------------------
   👉 Cadastre-se grátis em: https://developer.adzuna.com/
   👉 Cole o App ID e App Key abaixo (100 buscas/dia grátis)
   ⚠️  NUNCA suba estas chaves para o GitHub
   ========================================================= */
const ADZUNA_APP_ID  = '';   // <-- cole aqui seu App ID (~8 caracteres)
const ADZUNA_APP_KEY = '';   // <-- cole aqui sua App Key (32 caracteres)
const ADZUNA_COUNTRY = 'br';
const ADZUNA_QUERY   = 'estágio contabilidade';
const ADZUNA_LIMIT   = 50;   // máximo permitido pela API
const ADZUNA_DIAS    = 15;   // só vagas dos últimos X dias

/* =========================================================
   PLATAFORMAS EXTERNAS
   ========================================================= */
const PLATAFORMAS = [
  {
    nome: "Vagas.com.br",
    url: "https://www.vagas.com.br/vagas-de-estagio-em-contabilidade",
    icone: "fas fa-briefcase",
    descricao: "Maior portal de estágios do Brasil"
  },
  {
    nome: "Catho",
    url: "https://www.catho.com.br/vagas/estagiario-contabilidade/",
    icone: "fas fa-building",
    descricao: "Encontre sua vaga mais próxima"
  },
  {
    nome: "LinkedIn Jobs",
    url: "https://www.linkedin.com/jobs/search/?keywords=est%C3%A1gio%20contabilidade",
    icone: "fab fa-linkedin",
    descricao: "Networking e vagas corporativas"
  },
  {
    nome: "Trabalha Brasil",
    url: "https://www.trabalhabrasil.com.br/vagas-empregos-em-cabo-frio-rj/estagio",
    icone: "fas fa-hard-hat",
    descricao: "Vagas por cidade e região"
  },
  {
    nome: "Glassdoor",
    url: "https://www.glassdoor.com.br/Vaga/est%C3%A1gio-contabilidade-vagas-SRCH_KO0,24.htm",
    icone: "fas fa-chart-line",
    descricao: "Salários e avaliações de empresas"
  },
  {
    nome: "Indeed",
    url: "https://br.indeed.com/jobs?q=est%C3%A1gio+contabilidade",
    icone: "fas fa-search",
    descricao: "Buscador global de empregos"
  },
  {
    nome: "Gupy",
    url: "https://portal.gupy.io/job-search/term=est%C3%A1gio%20contabilidade",
    icone: "fas fa-rocket",
    descricao: "Plataforma usada por grandes empresas"
  },
  {
    nome: "CIEE",
    url: "https://www.ciee.org.br/vagas",
    icone: "fas fa-graduation-cap",
    descricao: "Especializado em estágios e aprendizes"
  }
];

/* =========================================================
   VAGAS DE EXEMPLO (fallback quando API não configurada)
   ========================================================= */
const VAGAS_EXEMPLO = [
  {
    id: 'ex-1',
    title: 'Estágio em Contabilidade',
    company: { display_name: 'Grupo Contábil ABC' },
    location: { display_name: 'Rio de Janeiro, RJ' },
    description: 'Auxiliar em lançamentos contábeis, conciliação bancária e arquivamento de documentos.',
    redirect_url: 'https://www.vagas.com.br',
  },
  {
    id: 'ex-2',
    title: 'Estágio em Departamento Fiscal',
    company: { display_name: 'Escritório Fiscal XYZ' },
    location: { display_name: 'Cabo Frio, RJ' },
    description: 'Apoio em rotinas fiscais, apuração de impostos e organização documental.',
    redirect_url: 'https://www.catho.com.br',
  },
  {
    id: 'ex-3',
    title: 'Estágio em Controladoria',
    company: { display_name: 'Indústria Nacional' },
    location: { display_name: 'Remoto' },
    description: 'Apoio em relatórios gerenciais, análise de custos e fluxo de caixa.',
    redirect_url: 'https://www.linkedin.com/jobs',
  },
  {
    id: 'ex-4',
    title: 'Estágio em Auditoria',
    company: { display_name: 'Auditoria Prime' },
    location: { display_name: 'Niterói, RJ' },
    description: 'Suporte em auditoria interna, conferência de balanços e controles internos.',
    redirect_url: 'https://www.glassdoor.com.br',
  },
];

/* =========================================================
   ESTADO GLOBAL
   ========================================================= */
let vagasCarregadas = [];
let filtroAtual = 'todas';

/* =========================================================
   UTILITÁRIOS
   ========================================================= */

// Escapa texto para exibição segura em HTML
function escapar(txt) {
  const d = document.createElement('div');
  d.textContent = txt ?? '';
  return d.innerHTML;
}

// Escapa valor para uso em atributos HTML (href, data-*, etc.)
function escapeAtributo(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Verifica se as chaves da Adzuna estão configuradas (não são placeholders)
function chavesConfiguradas() {
  return ADZUNA_APP_ID &&
         ADZUNA_APP_KEY &&
         !ADZUNA_APP_ID.includes('COLE') &&
         !ADZUNA_APP_KEY.includes('COLE') &&
         ADZUNA_APP_ID.length > 3 &&
         ADZUNA_APP_KEY.length > 10;
}

/* =========================================================
   TEMA CLARO / ESCURO
   ========================================================= */
function iniciarTema() {
  const btnTema = document.getElementById('theme-toggle');
  const iconeTema = btnTema ? btnTema.querySelector('i') : null;

  const aplicarTema = (tema) => {
    document.body.classList.toggle('dark', tema === 'dark');
    if (iconeTema) {
      iconeTema.className = tema === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  };

  const salvo = localStorage.getItem('tema') || 'light';
  aplicarTema(salvo);

  if (btnTema) {
    btnTema.addEventListener('click', () => {
      const novo = document.body.classList.contains('dark') ? 'light' : 'dark';
      localStorage.setItem('tema', novo);
      aplicarTema(novo);
    });
  }
}

/* =========================================================
   RENDERIZAR PLATAFORMAS EXTERNAS
   ========================================================= */
function renderizarPlataformas() {
  // Aceita tanto .plataformas quanto #plataformas-container
  const container =
    document.querySelector('.plataformas') ||
    document.getElementById('plataformas-container');

  if (!container) return;

  container.innerHTML = PLATAFORMAS.map(p => `
    <a href="${escapeAtributo(p.url)}"
       target="_blank"
       rel="noopener noreferrer"
       class="plataforma-card"
       title="${escapar(p.descricao)}">
      <i class="${p.icone}"></i>
      <span>${escapar(p.nome)}</span>
    </a>
  `).join('');
}

/* =========================================================
   FAVORITOS
   ========================================================= */
function getFavoritos() {
  try {
    return JSON.parse(localStorage.getItem('vagasFavoritas') || '[]');
  } catch {
    return [];
  }
}

function toggleFavorito(vagaId) {
  let favs = getFavoritos();
  if (favs.includes(vagaId)) {
    favs = favs.filter(id => id !== vagaId);
  } else {
    favs.push(vagaId);
  }
  localStorage.setItem('vagasFavoritas', JSON.stringify(favs));
  renderizarVagas(filtroAtual);
}

/* =========================================================
   COMPARTILHAR VAGA
   ========================================================= */
function compartilharVaga(link) {
  if (!link || link === '#') {
    alert('⚠️ Esta vaga não possui link para compartilhar.');
    return;
  }

  navigator.clipboard.writeText(link)
    .then(() => alert('🔗 Link da vaga copiado para a área de transferência!'))
    .catch(() => {
      // Fallback para navegadores antigos
      const input = document.createElement('input');
      input.value = link;
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand('copy');
        alert('🔗 Link copiado!');
      } catch {
        alert('Erro ao copiar link.');
      }
      document.body.removeChild(input);
    });
}

/* =========================================================
   CLASSIFICAR VAGA POR CATEGORIA
   ========================================================= */
function classificarVaga(texto) {
  const t = texto.toLowerCase();
  if (/contabil|fiscal|auditor|tributar/i.test(t)) return 'contabilidade';
  if (/financeir|cobrar|pagar|receber|tesouraria|faturamento/i.test(t)) return 'financeiro';
  return 'administrativo';
}

/* =========================================================
   PROCESSAR VAGAS DA API
   ========================================================= */
function processarVagas(lista) {
  return lista.map(v => ({
    id: v.id || `vaga-${Math.random().toString(36).substring(2, 9)}`,
    titulo: v.title || 'Vaga sem título',
    empresa: v.company?.display_name || 'Empresa não informada',
    local: v.location?.display_name || 'Local não informado',
    descricao: (v.description || 'Sem descrição disponível.').substring(0, 160) + '...',
    tipo: classificarVaga((v.title || '') + ' ' + (v.description || '')),
    link: v.redirect_url || '#',
    // Compatibilidade com renderização antiga
    title: v.title,
    company: v.company,
    location: v.location,
    redirect_url: v.redirect_url
  }));
}

/* =========================================================
   RENDERIZAR VAGAS
   ========================================================= */
function renderizarVagas(vagas) {
  const container = document.getElementById('vagas-container');
  if (!container) return;

  // Se for array bruto da API, processa
  if (vagas.length > 0 && vagas[0].title && !vagas[0].titulo) {
    vagasCarregadas = processarVagas(vagas);
  } else {
    vagasCarregadas = vagas;
  }

  const favoritos = getFavoritos();
  let filtradas = [];

  // Aplica filtro atual
  if (filtroAtual === 'favoritas') {
    filtradas = vagasCarregadas.filter(v => favoritos.includes(v.id));
  } else if (filtroAtual === 'todas') {
    filtradas = vagasCarregadas;
  } else {
    filtradas = vagasCarregadas.filter(v => v.tipo === filtroAtual);
  }

  // Atualiza contador
  const totalVagasEl = document.getElementById('totalVagasCount');
  if (totalVagasEl) totalVagasEl.textContent = filtradas.length;

  // Estado vazio
  if (filtradas.length === 0) {
    const msg = filtroAtual === 'favoritas'
      ? 'Você ainda não possui vagas favoritas. Clique na ⭐ para salvar!'
      : 'Nenhuma vaga encontrada para esta categoria ou busca.';

    container.innerHTML = `
      <div class="vazio" style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted);">
        <i class="fas fa-inbox" style="font-size:2.5rem; color:var(--border); display:block; margin-bottom:12px;"></i>
        <p>${escapar(msg)}</p>
      </div>`;
    return;
  }

  // Renderiza cada vaga
  container.innerHTML = filtradas.map(v => {
    const isFav = favoritos.includes(v.id);
    const titulo = v.titulo || v.title || 'Vaga';
    const empresa = v.empresa || v.company?.display_name || 'Empresa não informada';
    const local = v.local || v.location?.display_name || 'Local não informado';
    const descricao = v.descricao || (v.description || '').substring(0, 160) + '...';
    const link = v.link || v.redirect_url || '#';

    return `
      <div class="vaga-card">
        <div class="vaga-card-header" style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
          <h3 style="margin:0;">${escapar(titulo)}</h3>
          <button
            class="btn-fav"
            data-fav-id="${escapeAtributo(v.id)}"
            title="${isFav ? 'Remover dos favoritos' : 'Salvar vaga'}"
            style="background:none; border:none; cursor:pointer; font-size:1.2rem; color:${isFav ? '#f39c12' : 'var(--text-muted)'};"
          >
            <i class="${isFav ? 'fas' : 'far'} fa-star"></i>
          </button>
        </div>

        <p class="empresa"><i class="fas fa-building"></i> ${escapar(empresa)}</p>
        <p class="localidade"><i class="fas fa-map-marker-alt"></i> ${escapar(local)}</p>
        <p class="descricao">${escapar(descricao)}</p>

        <div class="vaga-card-footer" style="display:flex; gap:8px; margin-top:12px;">
          <a href="${escapeAtributo(link)}"
             target="_blank"
             rel="noopener noreferrer"
             class="btn-link"
             style="flex:1;">
            Ver vaga <i class="fas fa-external-link-alt"></i>
          </a>
          <button
            class="btn-link btn-share"
            data-share-link="${escapeAtributo(link)}"
            title="Copiar link"
            style="padding:8px 12px;">
            <i class="fas fa-share-alt"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Delegação de eventos (evita onclick inline)
  container.querySelectorAll('.btn-fav').forEach(btn => {
    btn.addEventListener('click', () => toggleFavorito(btn.dataset.favId));
  });

  container.querySelectorAll('.btn-share').forEach(btn => {
    btn.addEventListener('click', () => compartilharVaga(btn.dataset.shareLink));
  });
}

/* =========================================================
   BUSCAR VAGAS NA ADZUNA
   ========================================================= */
async function buscarVagasAdzuna(busca = ADZUNA_QUERY) {
  const container = document.getElementById('vagas-container');
  const dataAtualizacao = document.getElementById('data-atualizacao');

  // Se chaves não configuradas, usa exemplos
  if (!chavesConfiguradas()) {
    vagasCarregadas = VAGAS_EXEMPLO;
    filtroAtual = 'todas';
    renderizarVagas(vagasCarregadas);

    if (dataAtualizacao) {
      dataAtualizacao.textContent = '🔧 Configure ADZUNA_APP_ID e ADZUNA_APP_KEY para vagas em tempo real';
      dataAtualizacao.style.color = 'var(--primary)';
    }
    return;
  }

  // Loading
  if (container) {
    container.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted);">
        <i class="fas fa-spinner fa-spin" style="font-size:2rem; margin-bottom:12px;"></i>
        <p>Buscando vagas atualizadas...</p>
      </div>`;
  }

  try {
    // Monta URL com parâmetros otimizados
    const baseUrl = `https://api.adzuna.com/v1/api/jobs/${ADZUNA_COUNTRY}/search/1`;
    const params = new URLSearchParams({
      app_id: ADZUNA_APP_ID,
      app_key: ADZUNA_APP_KEY,
      results_per_page: ADZUNA_LIMIT,
      what: busca,
      where: 'Brasil',
      max_days_old: ADZUNA_DIAS,
      sort_by: 'date',
      'content-type': 'application/json'
    });

    const resposta = await fetch(`${baseUrl}?${params}`);

    if (!resposta.ok) {
      let detalhe = '';
      try {
        const erroJson = await resposta.json();
        detalhe = erroJson?.exception || erroJson?.display || '';
      } catch { /* ignora */ }
      throw new Error(`HTTP ${resposta.status} ${detalhe}`.trim());
    }

    const dados = await resposta.json();

    if (!dados.results || dados.results.length === 0) {
      vagasCarregadas = [];
      renderizarVagas([]);
      if (dataAtualizacao) {
        dataAtualizacao.textContent = `🔍 Nenhuma vaga encontrada para "${busca}".`;
        dataAtualizacao.style.color = 'var(--primary)';
      }
      return;
    }

    vagasCarregadas = processarVagas(dados.results);
    renderizarVagas(vagasCarregadas);

    if (dataAtualizacao) {
      const agora = new Date().toLocaleString('pt-BR');
      const total = dados.count || dados.results.length;
      dataAtualizacao.textContent = `✅ ${dados.results.length} de ${total} vagas — atualizado em ${agora}`;
      dataAtualizacao.style.color = 'inherit';
    }

  } catch (erro) {
    console.error('Erro Adzuna:', erro);

    let mensagem = '⚠️ Erro ao buscar vagas. Exibindo exemplos:';

    if (erro.message.includes('401') || erro.message.includes('403')) {
      mensagem = '🔑 Chave da API inválida. Verifique suas credenciais.';
    } else if (erro.message.includes('429')) {
      mensagem = '⏱️ Limite diário atingido (100/dia). Tente novamente amanhã.';
    } else if (erro.message.includes('Failed to fetch') || erro.message.includes('CORS')) {
      mensagem = '🌐 Erro de CORS. Rode via GitHub Pages ou Live Server.';
    } else if (erro.message.includes('400')) {
      mensagem = '⚠️ Parâmetros inválidos na consulta.';
    }

    vagasCarregadas = VAGAS_EXEMPLO;
    renderizarVagas(vagasCarregadas);

    if (dataAtualizacao) {
      dataAtualizacao.textContent = mensagem;
      dataAtualizacao.style.color = 'var(--primary)';
    }
  }
}

/* =========================================================
   EVENTOS DE FILTRO E BUSCA
   ========================================================= */
function iniciarFiltros() {
  const botoes = document.querySelectorAll('.filtro-btn');
  botoes.forEach(botao => {
    botao.addEventListener('click', () => {
      botoes.forEach(b => b.classList.remove('active'));
      botao.classList.add('active');
      filtroAtual = botao.dataset.filtro || 'todas';
      renderizarVagas(vagasCarregadas);
    });
  });
}

function iniciarBusca() {
  const inputBusca = document.getElementById('inputBusca');
  const btnBuscar = document.getElementById('btnBuscar');

  const executar = () => {
    const termo = inputBusca ? inputBusca.value.trim() : '';
    buscarVagasAdzuna(termo !== '' ? termo : ADZUNA_QUERY);
  };

  if (btnBuscar) btnBuscar.addEventListener('click', executar);

  if (inputBusca) {
    inputBusca.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') executar();
    });
  }
}

/* =========================================================
   CONTADOR DE VISITAS
   ========================================================= */
function iniciarContadorVisitas() {
  const el = document.getElementById('visitCount');
  if (!el) return;

  try {
    const visits = parseInt(localStorage.getItem('visits') || '0', 10) + 1;
    localStorage.setItem('visits', visits.toString());
    el.textContent = visits;
  } catch {
    el.textContent = '1';
  }
}

/* =========================================================
   DOWNLOAD DO CURRÍCULO
   ========================================================= */
function iniciarDownloadCV() {
  const el = document.getElementById('downloadCV');
  if (!el) return;

  el.addEventListener('click', (e) => {
    e.preventDefault();
    alert('📄 Coloque seu currículo.pdf na mesma pasta e atualize o link!');
  });
}

/* =========================================================
   ANIMAÇÃO DE SCROLL (fade-in)
   ========================================================= */
function iniciarAnimacaoScroll() {
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  iniciarTema();
  renderizarPlataformas();
  iniciarFiltros();
  iniciarBusca();
  iniciarContadorVisitas();
  iniciarDownloadCV();
  iniciarAnimacaoScroll();
  buscarVagasAdzuna();
});

console.log('✅ Portfólio Bruno Labanca carregado com sucesso!');