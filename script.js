document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('vagas-container');
  if (!container) return;

  try {
    const response = await fetch('./vagas.json');
    if (!response.ok) throw new Error('Arquivo JSON não encontrado');
    const vagas = await response.json();
    renderizarVagas(vagas);
  } catch (error) {
    console.warn("Usando dados de teste.");
    const vagasMock = [
      {
        title: "Estágio em Contabilidade - Remoto",
        company: "Empresa Exemplo",
        location: "Brasil (Remoto)",
        description: "Dado de teste.",
        redirect_url: "#",
        score: 10
      }
    ];
    renderizarVagas(vagasMock);
  }
});

function renderizarVagas(vagas) {
  const container = document.getElementById('vagas-container');
  container.innerHTML = ''; 

  if (vagas.length === 0) {
    container.innerHTML = '<div class="loading">Nenhuma vaga compatível encontrada no momento.</div>';
    return;
  }

  vagas.forEach(vaga => {
    const card = document.createElement('div');
    card.className = 'vaga-card';
    
    const titulo = vaga.title || "Vaga sem título";
    const empresa = vaga.company || "Empresa não informada";
    const local = vaga.location || "Local não informado";
    const descricao = vaga.description ? vaga.description.substring(0, 150) + "..." : "Sem descrição.";
    const link = vaga.redirect_url || "#";
    const score = vaga.score || 0;

    // Define a cor e o texto da etiqueta com base no score
    let badgeHtml = '';
    if (score >= 10) {
      badgeHtml = `<span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; margin-left: 10px;">🌟 Alta Compatibilidade</span>`;
    } else if (score >= 6) {
      badgeHtml = `<span style="background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; margin-left: 10px;">👍 Boa Compatibilidade</span>`;
    }

    card.innerHTML = `
      <h3>${titulo} ${badgeHtml}</h3>
      <div class="empresa"><i class="fas fa-building"></i> ${empresa}</div>
      <div class="local"><i class="fas fa-map-marker-alt"></i> ${local}</div>
      <div class="descricao">${descricao}</div>
      <a href="${link}" target="_blank" class="btn-link">Ver Vaga Completa <i class="fas fa-external-link-alt"></i></a>
    `;
    container.appendChild(card);
  });
}