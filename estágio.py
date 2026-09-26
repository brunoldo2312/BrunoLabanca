import requests
import pandas as pd

# 1. Substitua pela sua API Key fornecida pelo gerente de conta
API_KEY = "SUA_API_KEY_AQUI"

# 2. A URL base e o endpoint (conforme a documentação)
# Nota: O endpoint exato para busca de vagas pode ser ligeiramente diferente. 
# Se o "/jobs/search" não funcionar, verifique com seu gerente qual é o endpoint exato para busca.
BASE_URL = "https://api.intelligence.adzuna.com/v1.1"
ENDPOINT = "/jobs/search" 
URL = BASE_URL + ENDPOINT

# 3. Cabeçalhos com a autenticação Api-Key (exatamente como na documentação)
headers = {
    "Authorization": f"Api-Key {API_KEY}"
}

# 4. Parâmetros da busca
params = {
    "what": "estágio contabilidade remoto",
    "where": "br", # Brasil
    "results_per_page": 50
}

def buscar_vagas():
    try:
        # Fazendo a requisição GET passando os headers e os params
        resposta = requests.get(URL, headers=headers, params=params)
        
        # Verifica se a requisição foi bem-sucedida (código 200)
        resposta.raise_for_status() 
        
        dados = resposta.json()
        vagas = []
        
        # Adapte as chaves abaixo de acordo com o retorno real da sua API
        # (A estrutura pode variar um pouco entre a Jobs API e a Intelligence API)
        for v in dados.get("results", []):
            vagas.append({
                "titulo": v.get("title", ""),
                "empresa": v.get("company", {}).get("display_name", ""),
                "local": v.get("location", {}).get("display_name", ""),
                "link": v.get("redirect_url", ""),
                "publicado": v.get("created", ""),
                "descricao": v.get("description", "")[:300]
            })
        return vagas
        
    except requests.exceptions.RequestException as e:
        print(f"Erro na requisição: {e}")
        return []

if __name__ == "__main__":
    print("Buscando vagas na Adzuna Intelligence API...")
    vagas = buscar_vagas()
    
    if vagas:
        df = pd.DataFrame(vagas)
        df.to_csv("vagas_contabilidade_remoto.csv", index=False, encoding="utf-8-sig")
        print(f"Sucesso! {len(vagas)} vagas encontradas e salvas em 'vagas_contabilidade_remoto.csv'.")
    else:
        print("Nenhuma vaga encontrada ou erro na autenticação.")
        print("Dica: Verifique se a sua API_KEY está correta e se o endpoint '/jobs/search' é o correto para o seu plano.")