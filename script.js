/* =========================================================
   Portfólio Bruno Labanca — script.js
   VERSÃO COMPLETA — Adzuna + SINE (CSV)
   
   Recursos:
   - Tema claro/escuro com persistência
   - Lista de plataformas externas
   - Vagas reais da Adzuna API
   - Vagas do SINE (via CSV local)
   - Filtros por categoria (contabilidade/financeiro/administrativo)
   - Sistema de favoritos (localStorage)
   - Busca dinâmica
   - Compartilhar vaga (copiar link)
   - Contadores de vagas e visitas
   - Tratamento de erro detalhado
   ========================================================= */

/* =========================================================
   CONFIGURAÇÃO ADZUNA
   ---------------------------------------------------------
   👉 Cadastre-se grátis em: https://developer.adzuna.com/
   ⚠️  NUNCA suba estas chaves para o GitHub
   ========================================================= */
const ADZUNA_APP_ID  = '';   // <-- cole aqui seu App ID
const ADZUNA_APP_KEY = '';   // <-- cole aqui sua App Key
const ADZUNA_COUNTRY = 'br';
const ADZUNA_QUERY   = 'estágio contabilidade';
const ADZUNA_LIMIT   = 50;
const ADZUNA_DIAS    = 15;

/* =========================================================
   CONFIGURAÇÃO SINE
   ---------------------------------------------------------
   👉 Baixe o CSV em: https://dados.gov.br
   👉 Salve como "vagas-sine.csv" na mesma pasta do index.html
   ========================================================= */
const SINE_CSV_PATH = 'vagas-sine.csv';
const SINE_ATIVO    = true; // mude para false se não quiser usar o SINE

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
  },
  {
    nome: "Emprega Brasil (SINE)",
    url: "https://empregabrasil.mte.gov.br/",
    icone: "fas fa-landmark",
    descricao: "Portal oficial do governo federal"
  }
];

/* =========================================================
   VAGAS DE EXEMPLO (fallback)
   ========================================================= */
const VAGAS_EXEMPLO = [
  {
    id: 'ex-1',
    titulo: 'Estágio em Contabilidade',
    empresa: 'Grupo Contábil ABC',
    local: 'Rio de Janeiro, RJ',
    descricao: 'Auxiliar em lançamentos contábeis, conciliação bancária e arquivamento de documentos.',
    tipo: 'contabilidade',
    link: 'https://www.vagas.com.br',
    fonte: 'exemplo'
  },
  {
    id: 'ex-2',
    titulo: 'Estágio em Departamento Fiscal',
    empresa: 'Escritório Fiscal XYZ',
    local: 'Cabo Frio, RJ',
    descricao: 'Apoio em rotinas fiscais, apuração de impostos e organização documental.',
    tipo: 'contabilidade',
    link: 'https://www.catho.com.br',
    fonte: 'exemplo'
  },
  {
    id: 'ex-3',
    titulo: 'Estágio em Controladoria',
    empresa: 'Indústria Nacional',
    local: 'Remoto',
    descricao: 'Apoio em relatórios gerenciais, análise de custos e fluxo de caixa.',
    tipo: 'financeiro',
    link: 'https://www.linkedin.com/jobs',
    fonte: 'exemplo'
  },
  {
    id: 'ex-4',
    titulo: 'Estágio em Auditoria',
    empresa: 'Auditoria Prime',
    local: 'Niterói, RJ',
    descricao: 'Suporte em auditoria interna, conferência de balanços e controles internos.',
    tipo: 'contabilidade',
    link: 'https://www.glassdoor.com.br',
    fonte: 'exemplo'
  }
];

/* =========================================================
   ESTADO GLOBAL
   ========================================================= */
let vagasCarregadas = [];
let filtroAtual = 'todas';

/* =========================================================
   UTILITÁRIOS
   ========================================================= */
function escapar(txt) {
  const d = document.createElement('div');
  d.textContent = txt ?? '';
  return d.innerHTML;
}

function escapeAtributo(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function chavesAdzunaConfiguradas() {
  return ADZUNA_APP_ID &&
         ADZUNA_APP_KEY &&
         !ADZUNA_APP_ID.includes('COLE') &&
         !ADZUNA_APP_KEY.includes('COLE') &&
         ADZUNA_APP_ID.length > 3 &&
         ADZUNA_APP_KEY.length > 10;
}

/* =========================================================
   PARSER DE CSV SIMPLES
   Suporta aspas duplas, vírgulas dentro de aspas e quebras de linha
   ========================================================= */
function parseCSV(texto) {
  const linhas = [];
  let linhaAtual = [];
  let campoAtual = '';
  let dentroAspas = false;

  for (let i = 0; i < texto.length; i++) {
    const char = texto[i];
    const proximo = texto[i + 1];

    if (char === '"') {
      if (dentroAspas && proximo === '"') {
        campoAtual += '"';
        i++;
      } else {
        dentroAspas = !dentroAspas;
      }
    } else if (char === ',' && !dentroAspas) {
      linhaAtual.push(campoAtual);
      campoAtual = '';
    } else if ((char === '\n' || char === '\r') && !dentroAspas) {
      if (char === '\r' && proximo === '\n') i++;
      if (campoAtual !== '' || linhaAtual.length > 0) {
        linhaAtual.push(campoAtual);
        linhas.push(linhaAtual);
        linhaAtual = [];
        campoAtual = '';
      }
    } else {
      campoAtual += char;
    }
  }

  if (campoAtual !== '' || linhaAtual.length > 0) {
    linhaAtual.push(campoAtual);
    linhas.push(linhaAtual);
  }

  return linhas;
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
   PLATAFORMAS
   ========================================================= */
function renderizarPlataformas() {
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
  renderizarVagas(vagasCarregadas);
}

/* =========================================================
   COMPARTILHAR
   ========================================================= */
function compartilharVaga(link) {
  if (!link || link === '#') {
    alert('⚠️ Esta vaga não possui link para compartilhar.');
    return;
  }

  navigator.clipboard.writeText(link)
    .then(() => alert('🔗 Link da vaga copiado para a área de transferência!'))
    .catch(() => {
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
   CLASSIFICAR VAGA
   ========================================================= */
function classificarVaga(texto) {
  const t = texto.toLowerCase();
  if (/contabil|fiscal|auditor|tributar/i.test(t)) return 'contabilidade';
  if (/financeir|cobrar|pagar|receber|tesouraria|faturamento/i.test(t)) return 'financeiro';
  return 'administrativo';
}

/* =========================================================
   PROCESSAR VAGAS DA ADZUNA
   ========================================================= */
function processarVagasAdzuna(lista) {
  return lista.map(v => ({
    id: v.id || `adzuna-${Math.random().toString(36).substring(2, 9)}`,
    titulo: v.title || 'Vaga sem título',
    empresa: v.company?.display_name || 'Empresa não informada',
    local: v.location?.display_name || 'Local não informado',
    descricao: (v.description || 'Sem descrição disponível.').substring(0, 160) + '...',
    tipo: classificarVaga((v.title || '') + ' ' + (v.description || '')),
    link: v.redirect_url || '#',
    fonte: 'adzuna'
  }));
}

/* =========================================================
   PROCESSAR VAGAS DO SINE (CSV)
   ========================================================= */
function processarVagasSINE(linhasCSV) {
  if (!linhasCSV || linhasCSV.length < 2) return [];

  // Cabeçalho — normaliza para minúsculas sem acento
  const cabecalho = linhasCSV[0].map(c =>
    c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  );

  // Localiza índices comuns nos CSVs do SINE (varia conforme o ano)
  const idx = {
    ocupacao: cabecalho.findIndex(c => c.includes('ocupacao') || c.includes('cargo') || c.includes('titulo')),
    municipio: cabecalho.findIndex(c => c.includes('municipio')),
    uf: cabecalho.findIndex(c => c.includes('uf') || c.includes('estado')),
    escolaridade: cabecalho.findIndex(c => c.includes('escolaridade') || c.includes('grau')),
    experiencia: cabecalho.findIndex(c => c.includes('experiencia')),
    descricao: cabecalho.findIndex(c => c.includes('descricao') || c.includes('atividade')),
    quantidade: cabecalho.findIndex(c => c.includes('quantidade') || c.includes('vagas'))
  };

  const vagas = [];

  for (let i = 1; i < linhasCSV.length; i++) {
    const linha = linhasCSV[i];
    if (!linha || linha.length < 2) continue;

    const ocupacao = idx.ocupacao > -1 ? (linha[idx.ocupacao] || '').trim() : '';
    const municipio = idx.municipio > -1 ? (linha[idx.municipio] || '').trim() : '';
    const uf = idx.uf > -1 ? (linha[idx.uf] || '').trim() : '';
    const escolaridade = idx.escolaridade > -1 ? (linha[idx.escolaridade] || '').trim() : '';
    const experiencia = idx.experiencia > -1 ? (linha[idx.experiencia] || '').trim() : '';
    const descricaoCSV = idx.descricao > -1 ? (linha[idx.descricao] || '').trim() : '';
    const quantidade = idx.quantidade > -1 ? (linha[idx.quantidade] || '').trim() : '';

    // Ignora linhas sem ocupação
    if (!ocupacao) continue;

    // Monta descrição enriquecida
    const partesDescricao = [];
    if (descricaoCSV) partesDescricao.push(descricaoCSV);
    if (escolaridade) partesDescricao.push(`Escolaridade: ${escolaridade}`);
    if (experiencia) partesDescricao.push(`Experiência: ${experiencia}`);
    if (quantidade) partesDescricao.push(`Vagas: ${quantidade}`);

    vagas.push({
      id: `sine-${i}`,
      titulo: ocupacao,
      empresa: 'SINE / Emprega Brasil',
      local: municipio ? `${municipio} - ${uf || 'BR'}` : (uf || 'Brasil'),
      descricao: partesDescricao.join(' • ') || 'Vaga cadastrada no sistema SINE.',
      tipo: classificarVaga(ocupacao + ' ' + descricaoCSV),
      link: 'https://empregabrasil.mte.gov.br/',
      fonte: 'sine'
    });

    // Limita para não sobrecarregar a página
    if (vagas.length >= 100) break;
  }

  return vagas;
}

/* =========================================================
   RENDERIZAR VAGAS
   ========================================================= */
function renderizarVagas(vagas) {
  const container = document.getElementById('vagas-container');
  if (!container) return;

  // Normaliza: aceita tanto objetos processados quanto crus
  let lista = Array.isArray(vagas) ? vagas : [];

  const favoritos = getFavoritos();
  let filtradas = [];

  if (filtroAtual === 'favoritas') {
    filtradas = lista.filter(v => favoritos.includes(v.id));
  } else if (filtroAtual === 'todas') {
    filtradas = lista;
  } else {
    filtradas = lista.filter(v => v.tipo === filtroAtual);
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
    const link = v.link || v.redirect_url || '#';
    const badgeFonte = v.fonte === 'sine'
      ? '<span class="badge-fonte" style="background:#16a34a;color:#fff;padding:2px 8px;border-radius:10px;font-size:0.7rem;margin-left:6px;">SINE</span>'
      : v.fonte === 'adzuna'
        ? '<span class="badge-fonte" style="background:#2563eb;color:#fff;padding:2px 8px;border-radius:10px;font-size:0.7rem;margin-left:6px;">Adzuna</span>'
        : '';

    return `
      <div class="vaga-card" data-fonte="${v.fonte || 'exemplo'}">
        <div class="vaga-card-header" style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
          <h3 style="margin:0;">${escapar(v.titulo)}${badgeFonte}</h3>
          <button
            class="btn-fav"
            data-fav-id="${escapeAtributo(v.id)}"
            title="${isFav ? 'Remover dos favoritos' : 'Salvar vaga'}"
            style="background:none; border:none; cursor:pointer; font-size:1.2rem; color:${isFav ? '#f39c12' : 'var(--text-muted)'};"
          >
            <i class="${isFav ? 'fas' : 'far'} fa-star"></i>
          </button>
        </div>

        <p class="empresa"><i class="fas fa-building"></i> ${escapar(v.empresa)}</p>
        <p class="localidade"><i class="fas fa-map-marker-alt"></i> ${escapar(v.local)}</p>
        <p class="descricao">${escapar(v.descricao)}</p>

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

  // Delegação de eventos
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
  if (!chavesAdzunaConfiguradas()) {
    return null;
  }

  try {
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
    if (!dados.results || dados.results.length === 0) return [];

    return processarVagasAdzuna(dados.results);

  } catch (erro) {
    console.error('Erro Adzuna:', erro);
    return null;
  }
}

/* =========================================================
   CARREGAR VAGAS DO SINE (CSV LOCAL)
   ========================================================= */
async function carregarVagasSINE() {
  if (!SINE_ATIVO) return null;

  try {
    const resposta = await fetch(SINE_CSV_PATH);
    if (!resposta.ok) throw new Error('Arquivo CSV não encontrado');

    const texto = await resposta.text();
    const linhasCSV = parseCSV(texto);
    const vagas = processarVagasSINE(linhasCSV);

    console.log(`✅ SINE: ${vagas.length} vagas carregadas do CSV`);
    return vagas;

  } catch (erro) {
    console.warn('⚠️ SINE: CSV não disponível (', erro.message, ')');
    return null;
  }
}

/* =========================================================
   CARREGAR VAGAS (AGREGADOR — Adzuna + SINE)
   ========================================================= */
async function carregarTodasVagas(busca = ADZUNA_QUERY) {
  const container = document.getElementById('vagas-container');
  const dataca)Atualizacao = document.getElementById('data-atualiz {
acao');

  // Loading
  if (container) {
       container.innerHTML = `
      <div style=" inputgrid-column:1/-1Bus; text-align:center; padding:40px; color:var(--text-muted);">
        <i class="fas fa-spinner fa-spin" style="font-size:2rem; margin-bottom:12px;"></i>
        <p>Buscando vagas em várias fontes...</p>
      </div>`;
  }

  // Busca em paralelo das duas fontes
  const [vagasAdzuna, vagasSINE] = await Promise.all([
    buscarVagasAdzuna(busca),
    carregarVagasSINE()
  ]);

  // Junta os resultados (Adzuna primeiro, SINE depois)
  const todasVagas = [
    ...(vagasAdzuna || []),
    ...(vagasSINE || [])
  ];

  // Se nada veio de nenhuma fonte, usa exemplos
  if (todasVagas.length === 0) {
    vagasCarregadas = VAGAS_EXEMPLO;
    renderizarVagas(vagasCarregadas);

    if (dataAtualizacao) {
      let msg = '⚠️ Nenhuma fonte de vagas disponível. Exibindo exemplos.';
      if (!chavesAdzunaConfiguradas()) {
        msg = '🔧 Configure Adzuna ou adicione vagas-sine.csv para vagas reais.';
      }
      dataAtualizacao.textContent = msg;
      dataAtualizacao.style.color = 'var(--primary)';
    }
    return;
  }

  vagasCarregadas = todasVagas;
  renderizarVagas(vagasCarregadas);

  // Mensagem de status
  if (dataAtualizacao) {
    const agora = new Date().toLocaleString('pt-BR');
    const qtdAdzuna = (vagasAdzuna || []).length;
    const qtdSINE = (vagasSINE || []).length;

    const fontes = [];
    if (qtdAdzuna > 0) fontes.push(`${qtdAdzuna} Adzuna`);
    if (qtdSINE > 0) fontes.push(`${qtdSINE} SINE`);

    dataAtualizacao.textContent = `✅ ${todasVagas.length} vagas (${fontes.join(' + ')}) — atualizado em ${agora}`;
    dataAtualizacao.style.color = 'inherit';
  }
}

/* =========================================================
   FILTROS E BUSCA
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
    carregarTodasVagas(termo !== '' ? termo : ADZUNA_QUERY);
  };

  if (btnBuscar) btnBuscar.addEventListener('click', executar);

  if (inputBusca.addEventListener('keypress', (e) => {
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
   DOWNLOAD CV
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
   ANIMAÇÃO DE SCROLL
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
  carregarTodasVagas(); // Carrega Adzuna + SINE juntas
});

console.log('✅ Portfólio Bruno Labanca carregado com sucesso!');