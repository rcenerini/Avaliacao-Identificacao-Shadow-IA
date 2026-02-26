# api/webhook_server.py
from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
import uvicorn
import base64
import requests
import os
from typing import List

from scanner.core import Scanner
from reporting.formatter import ReportFormatter
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Shadow AI & MCP Architecture Scanner")

# Configuração de CORS para permitir que o Frontend (Vite) acesse o backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em prod, restringir para as URLs corretas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scanner = Scanner()
OPA_URL_BASE = os.environ.get('OPA_URL_BASE', 'http://opa:8181/v1/data/exceptions')
scanner = Scanner()

class InlineScanRequest(BaseModel):
    repository_name: str
    files: List[dict]  # expected: [{'filename': 'package.json', 'content_base64': '...'}]

@app.post("/scan/inline")
async def scan_inline(scan_req: InlineScanRequest):
    """
    Endpoint para ser chamado pelas esteiras de CI/CD (GitHub Actions, GitLab CI).
    Recebe o conteúdo dos arquivos alterados no Pull Request para validação rápida.
    """
    all_matches = []
    
    for file in scan_req.files:
        try:
            content_decoded = base64.b64decode(file.get("content_base64", "")).decode("utf-8")
            matches = scanner.scan_content(file.get("filename", "unknown"), content_decoded)
            all_matches.extend(matches)
        except Exception:
            continue
            
    ci_log = ReportFormatter.to_ci_log(all_matches)
    report_json = ReportFormatter.to_json_report(scan_req.repository_name, all_matches)
    
    # Se detectou violação, retorna o CILOG orientativo e status. 
    # Caberá a esteira de CI/CD ler o status e injetar esse log.
    response = {
        "status": "NON_COMPLIANT" if all_matches else "COMPLIANT",
        "ci_log_output": ci_log,
        "detail": report_json
    }
    
    return response

# Rota para Webhooks crus do GitHub (Webhook events: pull_request)
# Implementação simplificada
@app.post("/webhook/github")
async def github_webhook(request: Request):
    payload = await request.json()
    action = payload.get("action")
    
    if action in ["opened", "synchronize", "reopened"]:
        _pr = payload.get("pull_request")
        repo = payload.get("repository", {}).get("full_name")
        # Numa implementacao real cruzaria com a API do github para pegar o diff
        # e analisaria os arquivos aqui mesmo.
        return {"msg": f"Webhook recebido para PR no repo {repo}. Scan pendente."}
        
    return {"msg": "Evento ignorado."}

# ==========================================
# GOVERNANCE & OPA INTEGRATION MOCK PROXY
# ==========================================
# Definir a chave secreta ou token para autenticação
WEBHOOK_SECRET = "sua_chave_secreta_webhook"

class ExceptionRequest(BaseModel):
    repository: str
    lib: str  # Nome exato da lib/padrão a ser isento para aquele repo

@app.get("/api/governance/exceptions")
async def get_exceptions():
    """Retorna as regras consolidadas do motor de policy OPA"""
    try:
        resp = requests.get(OPA_URL_BASE)
        if resp.status_code == 200:
            data = resp.json()
            result = data.get("result")
            if result is not None:
                return {"exceptions": result.get("rules", [])}
        return {"exceptions": []}
    except Exception:
        return {"exceptions": [], "msg": "OPA Indisponível."}

@app.post("/api/governance/exceptions")
async def add_exception(req: ExceptionRequest):
    """Adiciona um pareamento de Exceção {repo, lib} pro OPA (Mock)"""
    try:
        current_list = []
        get_resp = requests.get(OPA_URL_BASE)
        new_rule = {"repository": req.repository, "lib": req.lib}
        
        if get_resp.status_code == 200:
            data = get_resp.json()
            result = data.get("result")
            if result is not None:
                current_list = result.get("rules", [])
            
        if new_rule not in current_list:
            current_list.append(new_rule)
            
        payload = {"rules": current_list}
        
        put_resp = requests.put(OPA_URL_BASE, json=payload)
        if put_resp.status_code == 204 or put_resp.status_code == 200:
             return {"msg": "Exceção adicionada com sucesso", "exceptions": current_list}
        else:
            raise Exception("Falha ao salvar regra na engine de políticas")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro OPA: {str(e)}")

@app.delete("/api/governance/exceptions")
async def remove_exception(req: ExceptionRequest):
    """Remove uma regra da lista de permissões do OPA baseando-se por {repo, lib}"""
    try:
        current_list = []
        get_resp = requests.get(OPA_URL_BASE)
        if get_resp.status_code == 200:
            data = get_resp.json()
            result = data.get("result")
            if result is not None:
                current_list = result.get("rules", [])
            
        rule_to_remove = {"repository": req.repository, "lib": req.lib}
        
        if rule_to_remove not in current_list:
            return {"msg": "Regra (Repo + Lib) não encontrada na lista."}

        current_list.remove(rule_to_remove)
        payload = {"rules": current_list}
        
        put_resp = requests.put(OPA_URL_BASE, json=payload)
        if put_resp.status_code == 204 or put_resp.status_code == 200:
             return {"msg": "Exceção removida com sucesso", "exceptions": current_list}
        else:
            raise Exception("Falha ao remover regra na engine de políticas")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro OPA: {str(e)}")

if __name__ == "__main__":
    # Rodar servidor via "python -m api.webhook_server"
    uvicorn.run("api.webhook_server:app", host="0.0.0.0", port=8000, reload=True)
