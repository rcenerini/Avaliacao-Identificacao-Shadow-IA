import re
import os
import requests
from typing import List
from pydantic import BaseModel

class DetectionMatch(BaseModel):
    rule_name: str
    category: str
    severity: str
    description: str
    match_preview: str
    line_number: int = -1

class DetectionRule(BaseModel):
    name: str
    category: str  # e.g., 'LIBRARY', 'API_CALL', 'CODE_PATTERN', 'SECRET'
    severity: str  # e.g., 'HIGH', 'CRITICAL'
    description: str
    regex: str

# Define our static rules based on brainstorm.md
RULES: List[DetectionRule] = [
    # Node.js Libraries (package.json)
    DetectionRule(
        name="Node.js GenAI/MCP Library",
        category="LIBRARY",
        severity="CRITICAL",
        description="Identified usage of unapproved GenAI or MCP library in Node.js ecosystem",
        regex=r'["\'](openai|@anthropic-ai/sdk|@google/generative-ai|cohere-ai|langchain|@modelcontextprotocol/sdk|mcp-framework|mcp-use|ollama|node-llama-cpp|ai|mastra|bee-agent-framework|voltagent|copilotkit)["\']\s*:\s*["\'][\d\.\^\~]+["\']'
    ),
    # Python Libraries (requirements.txt, pyproject.toml)
    DetectionRule(
        name="Python GenAI/MCP Library",
        category="LIBRARY",
        severity="CRITICAL",
        description="Identified usage of unapproved GenAI or MCP library in Python ecosystem",
        regex=r'(?i)(^|[^a-zA-Z0-9_-])(openai|anthropic|google-generativeai|langchain|langgraph|crewai|autogen|llama-index|semantic-kernel|smolagents|mcp|fastmcp|ollama|vllm|litellm|phidata|pydantic-ai)([\s=><~]|$)'
    ),
    # API endpoints
    DetectionRule(
        name="Direct API Call to LLM Provider",
        category="API_CALL",
        severity="CRITICAL",
        description="Direct HTTP call to LLM API endpoints like OpenAI, Anthropic, or local Ollama",
        regex=r'(?i)(api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis\.com|ai\.google\.dev|bedrock-runtime\.[a-z0-9-]+\.amazonaws\.com|localhost:11434)'
    ),
    # Code Patterns
    DetectionRule(
        name="Agent/LLM Code Pattern",
        category="CODE_PATTERN",
        severity="HIGH",
        description="Code instantiating GenAI models or Agent structures",
        regex=r'(?i)(ChatOpenAI\(|Anthropic\(|BedrockChat\(|AgentExecutor\(|ToolNode\(|Assistant\(|Agent\()'
    ),
    # MCP Code Patterns
    DetectionRule(
        name="MCP Code Pattern",
        category="CODE_PATTERN",
        severity="CRITICAL",
        description="Code implementing or interacting with Model Context Protocol",
        regex=r'(?i)(mcp_server|stdio_server|sse_server|listTools\(\)|callTool\(\))'
    ),
    # GUI and Gateway webhooks
    DetectionRule(
        name="GUI and Gateway Integration",
        category="CODE_PATTERN",
        severity="CRITICAL",
        description="Integration traces from GUI block builders or routing gateways like Flowise, Dify, Bifrost",
        regex=r'(?i)(flowise|langflow|dify|agentkit|bifrost|truefoundry|context-forge)'
    ),
    # Secrets (Basic check)
    DetectionRule(
        name="GenAI API Key Leak",
        category="SECRET",
        severity="CRITICAL",
        description="Potential hardcoded API key or environment variable for LLMs",
        regex=r'(?i)(OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY|COHERE_API_KEY|GROQ_API_KEY)'
    )
]

class Scanner:
    def __init__(self):
        self.rules = RULES
        self.compiled_rules = [(rule, re.compile(rule.regex)) for rule in self.rules]
        self.opa_url = os.environ.get('OPA_URL', 'http://opa:8181/v1/data/saga/governance/allow')

    def is_repository_allowed(self, repository: str) -> bool:
        """
        Queries OPA to check if the repository is globally allowed (allowlisted).
        Returns True if the repository is explicitly allowed, False otherwise.
        """
        try:
            payload = {"input": {"repository": repository}}
            response = requests.post(self.opa_url, json=payload, timeout=2)
            if response.status_code == 200:
                result = response.json().get('result', False)
                return bool(result)
        except Exception:
            # If OPA is unreachable, fail-closed (not allowed)
            pass
        return False

    def scan_content(self, repository: str, filename: str, content: str) -> List[DetectionMatch]:
        """
        Scans the text content (file contents) against the defined rules.
        """
        matches = []
        
        # OPA Check - If allowed globally, bail early!
        if self.is_repository_allowed(repository):
            return matches

        lines = content.split('\n')
        
        for line_idx, line in enumerate(lines):
            # Skip very long lines (like minified JS) to avoid regex DoS
            if len(line) > 1000:
                continue
                
            for rule, compiled_regex in self.compiled_rules:
                match = compiled_regex.search(line)
                if match:
                    matches.append(DetectionMatch(
                        rule_name=rule.name,
                        category=rule.category,
                        severity=rule.severity,
                        description=rule.description,
                        match_preview=line.strip()[:200], # Keep a snippet
                        line_number=line_idx + 1
                    ))
        
        return matches

    def scan_file(self, repository: str, filepath: str) -> List[DetectionMatch]:
        """
        Helper to scan a local file (useful for Ad-hoc scanning).
        """
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            return self.scan_content(repository, filepath, content)
        except Exception:
            # We skip binary files or unreadable files silently for now
            return []
