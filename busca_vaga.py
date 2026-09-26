import requests
import json
import os

# A chave será lida das variáveis de ambiente do GitHub (Secret)
API_KEY = os.environ.get("ADZUNA_API_KEY")
PAIS = "br"

# ==========================================
# CONFIGURAÇÃO DO SEU PERFIL (PALAVRAS-CHAVE)
# ==========================================
# O robô vai dar pontos para cada palavra-chave encontrada na vaga.
# Você pode adicionar ou remover palavras conforme sua preferência.
PALAVRAS_CHAVE = {
    # Obrigatórias (se não tiver, a vaga é descartada)
    "obrigatorias": ["estágio", "estagiário", "estagiária"],
    
    # Muito importantes (peso 3)
    "peso_3": ["contabilidade", "contábil", "controladoria", "auditoria", "finanças", "fiscal"],
    
    # Importantes (peso 2)
    "peso_2": ["remoto", "home office", "teletrabalho", "híbrido"],
    
    # Desejáveis (peso 1)
    "peso_1": ["excel", "erp", "sap", "conciliação", "balanço", "imposto", "tributário", "gestão"]
}

def calcular_score(vaga):
    """Calcula a pontuação da vaga com base nas palavras-chave."""
    titulo = vaga.get("title", "").lower()
    descricao = vaga.get("description", "").lower()
    texto_completo = f"{titulo} {descricao}"
    
    # Verifica se atende aos requisitos obrigatórios
    tem_obrigatoria = any(p in texto_completo for p in PALAVRAS_CHAVE["obrigatorias"])
    if not tem_obrigatoria:
        return 0 # Descarta a vaga (nota 0)
    
    score = 0
    # Soma os pesos
    for palavra in PALAVRAS_CHAVE["peso_3"]:
        if palavra in texto_completo: score += 3
    for palavra in PALAVRAS_CHAVE["peso_2"]:
        if palavra in texto_completo: score += 2
    for palavra in PALAVRAS_CHAVE["peso_1"]:
        if palavra in texto_completo: score += 1
        
    return score

def buscar_vagas():
    if not API_KEY:
        print("ERRO: A chave ADZUNA_API_KEY não foi configurada nos Secrets do GitHub.")
        return []

    # Busca um número maior de vagas para depois filtrar
    url = f"https://api.intelligence.adzuna.com/v1.1/jobs/search"
    headers = {
        "Authorization": f"Api-Key {API_KEY}",
        "Content-Type": "application/json"
    }
    params = {
        "what": "estágio contabilidade", # Busca mais ampla
        "where": PAIS,
        "results_per_page": 50 # Pega 50 vagas para filtrar
    }

    try:
        resposta = requests.get(url, headers=headers, params=params)
        resposta.raise_for_status()
        dados = resposta.json()
        
        vagas_processadas = []
        for v in dados.get("results", []):
            score = calcular_score(v)
            if score > 0: # Só adiciona se tiver pontuação
                vagas_processadas.append({
                    "title": v.get("title", ""),
                    "company": v.get("company", {}).get("display_name", "Empresa não informada"),
                    "location": v.get("location", {}).get("display_name", "Local não informado"),
                    "description": v.get("description", ""),
                    "redirect_url": v.get("redirect_url", "#"),
                    "score": score
                })
        
        # Ordena da maior pontuação para a menor
        vagas_processadas.sort(key=lambda x: x["score"], reverse=True)
        
        # Pega apenas as 15 melhores vagas
        return vagas_processadas[:15]
        
    except Exception as e:
        print(f"Erro ao buscar vagas: {e}")
        return []

if __name__ == "__main__":
    vagas = buscar_vagas()
    # Salva o resultado no arquivo vagas.json
    with open("vagas.json", "w", encoding="utf-8") as f:
        json.dump(vagas, f, ensure_ascii=False, indent=2)
    print(f"Sucesso! {len(vagas)} vagas filtradas e salvas em vagas.json")