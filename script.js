// ============================================================
// SCRIPT.JS — Bruno Labanca de Oliveira
// VERSÃO COM MÚLTIPLAS FONTES DE VAGAS
// ============================================================

// ==================== CONFIGURAÇÃO DA API ADZUNA ====================
// 👉 Cadastre-se GRATUITAMENTE em: https://developer.adzuna.com/
const ADZUNA_APP_ID = "";   // ← Seu App ID aqui
const ADZUNA_APP_KEY = "";  // ← Sua Chave aqui
const PAIS = "br";

// ==================== OUTRAS PLATAFORMAS DE VAGAS ====================
const PLATAFORMAS = [
  { 
    nome: "Vagas.com.br", 
    url: "https://www.vagas.com.br/vagas-de-estagiario-contabilidade",
    icone: "fas fa-briefcase",
    descricao: "Milhares de vagas em todo o Brasil"
  },
  { 
    nome: "Catho", 
    url: "https://www.catho.com.br/vagas/estagiario-contabilidade/",
    icone: "fas fa-building",
    descricao "Encontre sua vaga mais próxima"
  },
  { 
    nome: "LinkedIn", 
    url: "https://www.linkedin.com/jobs/search/?keywords=estagiário%20contabilidade&location=Brasil",
    icone: "fab fa-linkedin",
    descricao: "Rede profissional — conecte diretamente"
  },
  { 
    nome: "Trabalha Brasil", 
    url: "https://www.trabalhabrasil.com.br/vagas?q=estagiário+contabilidade",
    icone: "fas fa-map-marker-alt",
    descricao: "Vagas por todo o território nacional"
  },
  { 
    nome: "Glassdoor", 
    url: "https://www.glassdoor.com.br/Encontrar-emprego.htm?sc.keyword=estagiário contabilidade",
    icone: "fas fa-chart-bar",
    descricao: "Salários e avaliações de empresas"
  }
];

// Vagas de exemplo (aparece se a API não estiver configurada)
const vagasExemplo = [
  {
    titulo: 'Estagiário de Contabilidade',
    empresa: 'Grupo Contábil Brasil',
    local: 'Rio de Janeiro - RJ',
    descricao: 'Auxiliar em lançamentos contábeis, conciliação bancária e arquivamento de documentos. Ensino superior em andamento em Ciências Contábeis.',
    tipo: 'contabilidade',
    link: 'https://www.vagas.com.br'
  },
  {
    titulo: 'Estagiário Financeiro',
    empresa: 'Empresa de Serviços LTDA',
    local: 'Cabo Frio - RJ',
    descricao: 'Apoio em contas a pagar e receber, fluxo de caixa e relatórios financeiros. Conhecimento básico de Excel.',
    tipo: 'financeiro',
    link: 'https://www.vagas.com.br'
  },
  {
    titulo: 'Auxiliar Administrativo/Contábil',
    empresa: 'Comércio Local',
    local: 'Araruama - RJ',
    descricao: 'Organização de documentos, atendimento ao cliente e suporte ao setor contábil. Horário flexível.',
    tipo: 'administrativo',
    link: 'https://www.vagas.com.br'
  }
];

// ==================== TEMA ESCURO/CLARO ====================
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const body = document.body;

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  body.classList.add('dark-mode');
  themeIcon.classList.remove('fa-moon');
  themeIcon.classList.add('fa-sun');
}

themeToggle.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  const isDark = body.classList.contains('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  themeIcon.classList.toggle('fa-moon', !isDark);
  themeIcon.classList.toggle('fa-sun', isDark);
});

// ==================== ANIMAÇÃO DE SCROLL ====================
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ==================== CONTADOR DE VISITAS ====================
const visits = parseInt(localStorage.getItem('visits') || '0') + 1;
localStorage.setItem('visits', visits.toString());
document.getElementById('visitCount').textContent = visits;

// ==================== DOWNLOAD DO CURRÍCULO ====================
document.getElementById('downloadCV').addEventListener('click', (e) => {
  e.preventDefault();
  alert('📄 Coloque seu currículo.pdf na mesma pasta e atualize o link no código!');
});

// ==================== BUSCAR VAGAS REAIS — API ADZUNA ====================
const container = document.getElementById('vagas-container');
const plataformasContainer = document.getElementById('plataformas-container');
const dataAtualizacao = document.getElementById('data-atualizacao');
const botoesFiltro = document.querySelectorAll('.filtro-btn');

let vagasCarregadas = [];

// Carregar outras plataformas
function carregarPlataformas() {
  if (!plataformasContainer) return;
  plataformasContainer.innerHTML = PLATAFORMAS.map(p => `
    <a href="${p.url}" target="_blank" class="plataforma-card">
      <i class="${p.icone}"></i>
      <h4>${p.nome}</h4>
      <p>${p.descricao}</p>
      <span class="link-icone"><i class="fas fa-external-link-alt"></i></span>
    </a>
  `).join('');
}

// Buscar da API Adzuna
async function buscarVagasAPI(busca = "estágio contabilidade") {
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    usarVagasExemplo("🔧 Configure sua API Adzuna para ver vagas atualizadas! Usando exemplos:");
    return;
  }

  try {
    const url = `https://api.adzuna.com/v1/api/jobs/${PAIS}/search/1`;
    const params = new URLSearchParams({
      app_id: ADZUNA_APP_ID,
      app_key: ADZUNA_APP_KEY,
      results_per_page: 15,
      what: busca,
      where: "Brasil",
      full_time: 0,
      part_time: 1
    });

    const resposta = await fetch(`${url}?${params}`);
    
    if (!resposta.ok) throw new Error("Erro na API");
    
    const dados = await resposta.json();
    vagasCarregadas = processarVagas(dados.results || []);
    renderizarVagas('todas');
    
    const agora = new Date().toLocaleString('pt-BR');
    dataAtualizacao.textContent = `✅ Atualizado em: ${agora}`;
    
  } catch (erro) {
    console.error("Erro ao buscar vagas:", erro);
    usarVagasExemplo("⚠️ Não foi possível conectar à API. Vagas de exemplo:");
  }
}

function processarVagas(lista) {
  return lista.map(v => ({
    titulo: v.title || "Vaga sem título",
    empresa: v.company?.display_name || "Empresa não informada",
    local: v.location?.display_name || "Local não informado",
    descricao: (v.description || "").substring(0, 120) + "...",
    tipo: classificarVaga(v.title + " " + v.description),
    link: v.redirect_url || "#"
  }));
}

function classificarVaga(texto) {
  const t = texto.toLowerCase();
  if (/contabil|fiscal|auditor/.test(t)) return 'contabilidade';
  if (/financeir|cobrar|pagar|receber/.test(t)) return 'financeiro';
  return 'administrativo';
}

function usarVagasExemplo(mensagem) {
  vagasCarregadas = vagasExemplo;
  renderizarVagas('todas');
  dataAtualizacao.textContent = mensagem;
  dataAtualizacao.style.color = 'var(--primary)';
}

function renderizarVagas(filtro) {
  const filtradas = filtro === 'todas' 
    ? vagasCarregadas 
    : vagasCarregadas.filter(v => v.tipo === filtro);

  if (filtradas.length === 0) {
    container.innerHTML = `
      <div style="padding: 30px; text-align: center; color: var(--gray);">
        <i class="fas fa-search" style="font-size: 1.5rem; margin-bottom: 10px;"></i>
        <p>Nenhuma vaga encontrada para este filtro.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtradas.map(vaga => `
    <div class="vaga-card">
      <h3>${escapeHtml(vaga.titulo)}</h3>
      <span class="empresa"><i class="fas fa-building"></i> ${escapeHtml(vaga.empresa)}</span>
      <span class="local"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(vaga.local)}</span>
      <p class="descricao">${escapeHtml(vaga.descricao)}</p>
      <a href="${escapeHtml(vaga.link)}" target="_blank" class="btn-link">
        <i class="fas fa-external-link-alt"></i> Ver Vaga
      </a>
    </div>
  `).join('');
}

function escapeHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

// Filtros
botoesFiltro.forEach(botao => {
  botao.addEventListener('click', () => {
    botoesFiltro.forEach(b => b.classList.remove('active'));
    botao.classList.add('active');
    renderizarVagas(botao.dataset.filtro);
  });
});

// Iniciar
document.addEventListener('DOMContentLoaded', () => {
  carregarPlataformas();
  buscarVagasAPI();
});

console.log('✅ Portfólio carregado com sucesso!');
