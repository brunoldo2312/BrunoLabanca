/* =========================================================
   Portfólio Bruno Labanca — script.js
   - Tema claro/escuro com persistência
   - Lista de plataformas de vagas (renderizada via JS)
   - Carregamento de vagas (Adzuna API ou exemplos)
   ========================================================= */

/* ---------- CONFIGURAÇÃO ADZUNA ---------- */
// Cadastre-se grátis em https://developer.adzuna.com/
// e cole aqui seu App ID e App Key (100 buscas/dia grátis)
const ADZUNA_APP_ID  = ''; // <-- cole aqui
const ADZUNA_APP_KEY = ''; // <-- cole aqui
const ADZUNA_COUNTRY = 'br';
const ADZUNA_QUERY   = 'estágio contabilidade';
const ADZUNA_LIMIT   = 12;

/* ---------- PLATAFORMAS DE VAGAS ---------- */
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

/* ---------- VAGAS DE EXEMPLO ---------- */
const VAGAS_EXEMPLO = [
  {
    title: 'Estágio em Contabilidade',
    company: { display_name: 'Grupo Contábil ABC' },
    location: { display_name: 'Rio de Janeiro, RJ' },
    redirect_url: 'https://www.vagas.com.br',
  },
  {
    title: 'Estágio em Departamento Fiscal',
    company: { display_name: 'Escritório Fiscal XYZ' },
    location: { display_name: 'Cabo Frio, RJ' },
    redirect_url: 'https://www.catho.com.br',
  },
  {
    title: 'Estágio em Controladoria',
    company: { display_name: 'Indústria Nacional' },
    location: { display_name: 'Remoto' },
    redirect_url: 'https://www.linkedin.com/jobs',
  },
  {
    title: 'Estágio em Auditoria',
    company: { display_name: 'Auditoria Prime' },
    location: { display_name: 'Niterói, RJ' },
    redirect_url: 'https://www.glassdoor.com.br',
  },
];

/* ---------- TEMA CLARO / ESCURO ---------- */
const btnTema = document.getElementById('theme-toggle');
const iconeTema = btnTema ? btnTema.querySelector('i') : null;

function aplicarTema(tema) {
  document.body.classList.toggle('dark', tema === 'dark');
  if (iconeTema) {
    iconeTema.className = tema === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
}

function iniciarTema() {
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

/* ---------- UTILITÁRIO: ESCAPAR HTML ---------- */
function escapar(txt) {
  const d = document.createElement('div');
  d.textContent = txt ?? '';
  return d.innerHTML;
}

/* ---------- RENDERIZAR PLATAFORMAS ---------- */
function renderizarPlataformas() {
  const container = document.querySelector('.plataformas');
  if (!container) return;

  // Caso o HTML já tenha as plataformas hardcoded, substitui pelas do array
  container.innerHTML = PLATAFORMAS.map(p => `
    <a href="${p.url}" target="_blank" rel="noopener" title="${escapar(p.descricao)}">
      <i class="${p.icone}"></i> ${escapar(p.nome)}
    </a>
  `).join('');
}

/* ---------- RENDERIZAR VAGAS ---------- */
function renderizarVagas(vagas) {
  const container = document.getElementById('vagas-container');
  if (!container) return;

  if (!vagas.length) {
    container.innerHTML = `
      <div class="vazio" style="grid-column: 1/-1; text-align:center; padding:30px; color:var(--text-muted);">
        <i class="fas fa-inbox" style="font-size:2.5rem; color:var(--border); display:block; margin-bottom:10px;"></i>
        <p>Nenhuma vaga encontrada no momento.</p>
      </div>`;
    return;
  }

  container.innerHTML = vagas.map(v => {
    const titulo  = v.title || 'Vaga';
    const empresa = v.company?.display_name || 'Empresa não informada';
    const local   = v.location?.display_name || 'Local não informado';
    const link    = v.redirect_url || '#';

    return `
      <div class="vaga-card">
        <h3>${escapar(titulo)}</h3>
        <p class="empresa">${escapar(empresa)}</p>
        <p class="localidade"><i class="fas fa-map-marker-alt"></i> ${escapar(local)}</p>
        <a href="${link}" target="_blank" rel="noopener">
          Ver vaga <i class="fas fa-external-link-alt"></i>
        </a>
      </div>`;
  }).join('');
}

/* ---------- BUSCAR VAGAS NA ADZUNA ---------- */
async function buscarVagasAdzuna() {
  const url = `https://api.adzuna.com/v1/api/jobs/${ADZUNA_COUNTRY}/search/1`
    + `?app_id=${ADZUNA_APP_ID}`
    + `&app_key=${ADZUNA_APP_KEY}`
    + `&results_per_page=${ADZUNA_LIMIT}`
    + `&what=${encodeURIComponent(ADZUNA_QUERY)}`
    + `&content-type=application/json`;

  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Falha ao consultar Adzuna');
  const dados = await resp.json();
  return dados.results || [];
}

/* ---------- CARREGAR VAGAS ---------- */
async function carregarVagas() {
  const container = document.getElementById('vagas-container');
  if (!container) return;

  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    renderizarVagas(VAGAS_EXEMPLO);
    return;
  }

  container.innerHTML = `
    <div style="grid-column:1/-1; text-align:center; padding:30px; color:var(--text-muted);">
      <i class="fas fa-spinner fa-spin" style="font-size:1.5rem;"></i>
      <p>Carregando vagas...</p>
    </div>`;

  try {
    const vagas = await buscarVagasAdzuna();
    renderizarVagas(vagas.length ? vagas : VAGAS_EXEMPLO);
  } catch (err) {
    console.warn('Erro Adzuna, usando exemplos:', err);
    renderizarVagas(VAGAS_EXEMPLO);
  }
}

/* ---------- START ---------- */
document.addEventListener('DOMContentLoaded', () => {
  iniciarTema();
  renderizarPlataformas();
  carregarVagas();
});