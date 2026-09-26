// ==========================================
// CONFIGURAÇÃO DA API
// ==========================================
// ATENÇÃO: NUNCA coloque sua API Key real aqui em produção. 
// Qualquer pessoa pode ver o código fonte do seu site e roubar a chave.
const API_KEY = "SUA_API_KEY_AQUI"; 
const API_URL = "https://api.intelligence.adzuna.com/v1.1/jobs/search"; 

// ==========================================
// FUNÇÃO PARA BUSCAR VAGAS NA API (COM REAL)
// ==========================================
// Descomente esta função quando tiver um backend ou proxy para proteger a chave
/*
async function buscarVagasAPI() {
  try {
    const response = await fetch(`${API_URL}?what=estagio+contabilidade+remoto&where=br`, {
      method: 'GET',
      headers: {
        'Authorization': `Api-Key ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Erro na requisição');
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Erro ao buscar vagas:", error);
    return [];
  }
}
*/

// ==========================================
// MOCK DE DADOS (Para testar o visual agora)
// ==========================================
// Estes são dados falsos apenas para você ver como o layout vai ficar no site.
const vagasMock = [
  {
    title: "Estágio em Contabilidade - Remoto",
    company: { display_name: "Empresa Exemplo 1" },
    location: { display_name: "Brasil (Remoto)" },
    description: "Vaga para estágio em contabilidade, atuação remota. Necessário conhecimento em Excel e rotinas fiscais.",
    redirect_url: "#"
  },
  {
    title: "Estágio em Controladoria (Home Office)",
    company: { display_name: "Empresa Exemplo 2" },
    location: { display_name: "SÃO PAULO, SP (Remoto)" },
    description: "Buscamos estagiário de contabilidade para auxiliar na conciliação e relatórios gerenciais.",
    redirect_url: "#"
  },
  {
    title: "Estágio em Auditoria - Remoto",
    company: { display_name: "Empresa Exemplo 3" },
    location: { display_name: "Rio de Janeiro, RJ (Remoto)" },
    description: "Oportunidade para estudantes de contabilidade com foco em auditoria e compliance.",
    redirect_url: "#"
  }
];

// ==========================================
// FUNÇÃO PARA RENDERIZAR AS VAGAS NO HTML
// ==========================================
function renderizarVagas(vagas) {
  const container = document.getElementById('vagas-container');
  if (!container) return; // Segurança caso a div não exista

  container.innerHTML = ''; // Limpa o aviso de "Carregando..."

  if (vagas.length === 0) {
    container.innerHTML = '<div class="loading">Nenhuma vaga encontrada no momento.</div>';
    return;
  }

  vagas.forEach(vaga => {
    const card = document.createElement('div');
    card.className = 'vaga-card';
    
    // Tratando a estrutura do JSON (ajuste conforme o retorno real da API Adzuna)
    const titulo = vaga.title || "Vaga sem título";
    const empresa = vaga.company?.display_name || "Empresa não informada";
    const local = vaga.location?.display_name || "Local não informado";
    const descricao = vaga.description ? vaga.description.substring(0, 150) + "..." : "Sem descrição.";
    const link = vaga.redirect_url || "#";

    card.innerHTML = `
      <h3>${titulo}</h3>
      <div class="empresa"><i class="fas fa-building"></i> ${empresa}</div>
      <div class="local"><i class="fas fa-map-marker-alt"></i> ${local}</div>
      <div class="descricao">${descricao}</div>
      <a href="${link}" target="_blank" class="btn-link">Ver Vaga Completa <i class="fas fa-external-link-alt"></i></a>
    `;
    container.appendChild(card);
  });
}

// ==========================================
// INICIALIZAÇÃO (RODA QUANDO A PÁGINA CARREGA)
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  // Para usar dados reais no futuro, descomente a linha abaixo e comente a linha do Mock
  // const vagas = await buscarVagasAPI();
  
  const vagas = vagasMock; // Usando dados de teste temporariamente
  
  // Simula um pequeno atraso de 1 segundo para você ver o efeito de "Carregando"
  setTimeout(() => {
    renderizarVagas(vagas);
  }, 1000);
});