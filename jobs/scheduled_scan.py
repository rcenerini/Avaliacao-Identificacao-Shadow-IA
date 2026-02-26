import os
import json
from dotenv import load_dotenv

from scanner.core import Scanner
from scanner.git_connector import GitConnector
from reporting.formatter import ReportFormatter

# Carrega as chaves da raiz do projeto (.env) se existirem
load_dotenv()

def run_scheduled_scan():
    """
    Roda um escaneamento em lote. 
    Ideal para ser invocado via cron job (ex: GitHub Actions `schedule`).
    """
    org_name = os.getenv("TARGET_ORGANIZATION", "your_target_org_name")
    
    print(f"Iniciando escaneamento de shadow AI na organização: {org_name}")
    
    connector = GitConnector()
    scanner = Scanner()
    
    # 1. Obter Repositórios
    repos = connector.get_github_repos(org_name)
    print(f"Foram encontrados {len(repos)} repositórios na organização {org_name}.")
    
    # 2. Loop por cada repo
    all_reports = []
    
    # Limitando aos 10 primeiros para teste local
    for repo in repos[:10]:
        repo_name = repo['full_name']
        print(f" -> Escaneando {repo_name}...")
        
        # 3. Obter os arquivos relevantes
        files = connector.get_github_repo_files(repo_name, repo['default_branch'])
        
        # 4. Baixar conteúdo e escanear
        repo_matches = []
        for file in files:
            content = connector.get_github_blob_content(file['url'])
            if content:
                file_matches = scanner.scan_content(file['path'], content)
                repo_matches.extend(file_matches)
        
        # 5. Formatar Resumo do Repo
        report_json = ReportFormatter.to_json_report(repo_name, repo_matches)
        all_reports.append(json.loads(report_json))
        
        if repo_matches:
            print(f"    [ALERTA] Violações detectadas em {repo_name}!")
        else:
            print("    [OK] Seguro.")
            
    # 6. Salva e Consolida 
    output_file = "architecture_shadow_ai_report.json"
    with open(output_file, 'w') as f:
        json.dump(all_reports, f, indent=2)
        
    print(f"Scan finalizado. Relatório salvo em {output_file}.")

if __name__ == "__main__":
    run_scheduled_scan()
