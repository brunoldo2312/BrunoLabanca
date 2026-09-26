// ============================================================
// SCRIPT.JS — Bruno Labanca de Oliveira
// Versão atualizada com todas as funcionalidades
// ============================================================

// ==================== TEMA ESCURO/CLARO ====================
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const body = document.body;

// Verifica tema salvo
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  body.classList.add('dark-mode');
  themeIcon.classList.remove('fa-moon');
  themeIcon.classList.add('fa-sun');
}

themeToggle.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  const isDark = body.classList.contains('dark-mode');
  
  if (isDark) {
    localStorage.setItem('theme', 'dark');
    themeIcon.classList.remove('fa-moon');
    themeIcon.classList.add('fa-sun');
  } else {
    localStorage.setItem('theme', 'light');
    themeIcon.classList.remove('fa-sun');
    themeIcon.classList.add('fa-moon');
  }
});

// ==================== ANIMAÇÃO DE SCROLL ====================
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -30px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => {
  observer.observe(el);
});

// ==================== CONTADOR DE VISITAS ====================
function updateVisitCounter() {
  let visits = parseInt(localStorage.getItem('visits') || '0');
  visits++;
  localStorage.setItem('visits', visits.toString());
  document.getElementById('visitCount').textContent = visits;
}
updateVisitCounter();

// ==================== DOWNLOAD DO CURRÍCULO ====================
document.getElementById('downloadCV').addEventListener('click', (e) => {
  e.preventDefault();
  alert('📄 Função de download: Substitua este link pelo seu arquivo PDF!\n\nColoque seu currículo.pdf na mesma pasta e atualize o código.');
  // Exemplo de código quando tiver o arquivo:
  // const link = document.createElement('a');
  // link.href = 'curriculo-bruno-labanca.pdf';
  // link.download = 'curriculo-bruno-labanca.pdf';
  // link.click();
});

// ==================== SISTEMA DE VAGAS ====================
const vagas = [
  {
    id: 1,
    titulo: 'Estagiário de Contabilidade',
    empresa: 'Escritório de Contabilidade',
    local: 'Remoto',
    tipo: 'remoto',
    descricao: 'Auxiliar em lançamentos contábeis, conciliação bancária e atendimento a clientes. Horário flexível.',
    link: '#'
  },
  {
    id: 2,
    titulo: 'Auxiliar de Contabilidade',
    empresa: 'Empresa de Serviços LTDA',
    local: 'Rio de Janeiro - RJ',
    tipo: 'presencial',
    descricao: 'Suporte ao setor fiscal e financeiro, organização de documentos e lançamentos em sistema.',
    link: '#'
  },
  {
    id: 3,
    titulo: 'Estagiário Financeiro',
    empresa: 'Consultoria Financeira',
    local: 'Cabo Frio - RJ',
    tipo: 'hibrido',
    descricao: 'Apoio em contas a pagar e receber, fluxo de caixa e relatórios financeiros.',
    link: '#'
  },
  {
    id: 4,
    titulo: 'Assistente Administrativo/Contábil',
    empresa: 'Comércio Local',
    local: 'Cabo Frio - RJ',
    tipo: 'presencial',
    descricao: 'Organização de documentos, lançamentos básicos e atendimento ao público.',
    link: '#'
  }
];

const container = document.getElementById('vagas-container');
const botoesFiltro = document.querySelectorAll('.filtro-btn');

// Renderiza vagas
function renderizarVagas(filtro = 'todas') {
  const vagasFiltradas = filtro === 'todas' 
    ? vagas 
    : vagas.filter(v => v.tipo === filtro);
  
  if (vagasFiltradas.length === 0) {
    container.innerHTML = `
      <div style="padding: 30px; text-align: center; color: var(--gray);">
        <i class="fas fa-search" style="font-size: 1.5rem; margin-bottom: 10px;"></i>
        <p>Nenhuma vaga encontrada para este filtro.</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = vagasFiltradas.map(vaga => `
    <div class="vaga-card" data-tipo="${vaga.tipo}">
      <h3>${escapeHtml(vaga.titulo)}</h3>
      <span class="empresa"><i class="fas fa-building"></i> ${escapeHtml(vaga.empresa)}</span>
      <span class="local"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(vaga.local)}</span>
      <span class="tipo-vaga">${formatarTipoVaga(vaga.tipo)}</span>
      <p class="descricao">${escapeHtml(vaga.descricao)}</p>
      <a href="${escapeHtml(vaga.link)}" target="_blank" class="btn-link">
        <i class="fas fa-paper-plane"></i> Candidatar-se
      </a>
    </div>
  `).join('');
}

function formatarTipoVaga(tipo) {
  const tipos = {
    remoto: '🌐 Remoto',
    presencial: '🏢 Presencial',
    hibrido: '🔄 Híbrido'
  };
  return tipos[tipo] || tipo;
}

function escapeHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

// Eventos dos filtros
botoesFiltro.forEach(botao => {
  botao.addEventListener('click', () => {
    // Ativa botão clicado
    botoesFiltro.forEach(b => b.classList.remove('active'));
    botao.classList.add('active');
    
    // Filtra vagas
    const filtro = botao.getAttribute('data-filtro');
    renderizarVagas(filtro);
  });
});

// Inicializa com todas as vagas
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    renderizarVagas('todas');
  }, 800); // Simula carregamento
});

console.log('✅ Portfólio carregado com sucesso!');
