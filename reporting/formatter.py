import json
from typing import List
from scanner.core import DetectionMatch

class ReportFormatter:
    @staticmethod
    def to_ci_log(matches: List[DetectionMatch]) -> str:
        """
        Formats the output for a CI/CD pipeline, warning the developer.
        """
        if not matches:
            return "✅ Architecture Scan Passed: No unapproved GenAI or MCP patterns detected."

        log_lines = [
            "❌ ATENÇÃO: A ESTEIRA NÃO ESTÁ DE ACORDO COM OS PADRÕES DE SEGURANÇA DA EMPRESA.",
            "Bibliotecas não homologadas de LLM/Agentes ou conexões MCP foram detectadas.",
            "Por favor, solicite revisão e homologação com o time de Arquitetura de Segurança da Informação.",
            "\nDetalhes das Infrações:"
        ]
        
        for m in matches:
            line_info = f" (Line: {m.line_number})" if m.line_number > 0 else ""
            log_lines.append(f" - [{m.severity}] {m.rule_name}{line_info}: {m.description}")
            log_lines.append(f"   Trecho: `{m.match_preview}`")

        return "\n".join(log_lines)

    @staticmethod
    def to_json_report(repo_name: str, matches: List[DetectionMatch]) -> str:
        """
        Generates a JSON payload suitable to be sent to an Architecture/SecOps Dashboard.
        """
        report = {
            "repository": repo_name,
            "status": "NON_COMPLIANT" if matches else "COMPLIANT",
            "violations_count": len(matches),
            "violations": [m.dict() for m in matches]
        }
        return json.dumps(report, indent=2)
