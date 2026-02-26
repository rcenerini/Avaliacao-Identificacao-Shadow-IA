# SAGA: Shadow AI & MCP Architecture Scanner

<p align="center">
  <img src="https://img.shields.io/badge/Security-Architecture-00AEEF?style=for-the-badge&logo=shield" alt="Security Architecture" />
  <img src="https://img.shields.io/badge/Made%20for-SAGA-014A8E?style=for-the-badge" alt="SAGA" />
  <img src="https://img.shields.io/badge/Python-3.11+-blue?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

<div align="center">
  <img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow" alt="Status" />
  <img src="https://img.shields.io/badge/Security-Shift--Left-blue" alt="Security Paradigm" />
</div>

<h1 align="center">🛡️ SAGA: Sistema de Análise e Gerenciamento de Ameaças (Shadow AI & MCP Scanner)</h1>

## 🔐 Sobre o Projeto

**SAGA (Sistema de Análise e Gerenciamento de Ameaças)** é uma ferramenta preventiva desenhada para atuar nas esteiras de automação (CI/CD) de código, detectando o uso não autorizado de Modelos de Linguagem Generativos (LLMs), frameworks de Agentes Autônomos e configurações obscuras via **Model Context Protocol (MCP)**.

O **Shadow AI & MCP Architecture Scanner** é uma solução corporativa de *Governança e Segurança* (SecOps) criada especificamente para identificar a utilização não autorizada e não homologada de Inteligências Artificiais, Agentes Autônomos e Model Context Protocols (MCPs) dentro de repositórios privados da organização. Para fins de governança, o sistema rastreia e reporta violações com um esquema `{ "repository": "str", "lib": "str" }`.

O cenário tecnológico atual conta com desenvolvedores importando modelos fundacionais e *frameworks* de IA (LangChain, Flowise, Ollama, etc.) por conveniência, criando um farto **Shadow AI Surface Attack**. O uso não controlado destas bibliotecas:
- Fere políticas de vazamento de dados corporativos (DLP).
- Introduz Backdoors de injeção de prompt e `Agentic Tool Calling`.
- Fere o padrão arquitetural da empresa.

Este motor rastreia o GitHub/GitLab, analisa *Abstract Syntax Trees* e lê arquivos de configuração (`package.json`, `requirements.txt`, etc.) para pegar esses padrões e devolver evidências na esteira de desenvolvimento (**Shift-Left**) e reportar à equipe de Arquitetura.

---

## 🏗️ Arquitetura da Solução

O ecossistema SAGA foi desenhado para atuar de forma invisível e escalável, integrando-se perfeitamente ao ciclo de vida de desenvolvimento de software (SDLC). Abaixo, ilustramos a arquitetura através de três perspectivas fundamentais: a **Arquitetura Técnica** que sustenta os microsserviços, a **Arquitetura Funcional** que descreve as capacidades do motor, e o **Fluxo de Dados (DFD)** que detalha a jornada da informação desde o *commit* até a auditoria final.

### 🌐 Arquitetura Técnica

<div align="center">
  <img src="Arquitetura%20Tecnica.png" alt="Arquitetura Técnica do SAGA" width="800"/>
</div>

A infraestrutura técnica do SAGA é construída sob uma fundação moderna e conteinerizada. Utilizando **Docker Compose**, orquestramos a resiliência de três camadas primárias: o *Frontend* reativo (React/Vite) servindo o Dashboard, o *Backend Integrator* (FastAPI/Python) para roteamento pesado e Webhooks, e a pedra angular do projeto — o **Open Policy Agent (OPA)** —, responsável pela governação de *Policy-as-Code*, garantindo que permissões e bloqueios de Shadow AI sejam imutáveis, versionáveis e descentralizados.

### ⚙️ Arquitetura Funcional

<div align="center">
  <img src="Arquitetura%20Funcional.png" alt="Arquitetura Funcional do SAGA" width="800"/>
</div>

Do ponto de vista funcional, o sistema SAGA se divide em dois esquemas de operação principais. O lado esquerdo das operações compreende os recursos interativos via Dashboard: escaneamentos *ad-hoc* solicitados por auditores de segurança e a gestão administrativa manual. O lado direito abriga o coração da automação: varreduras em lote (cron jobs noturnos) para conformidade global de Segurança da Informação, análise sintática avançada via `AST / Regex Engine` e os disparos assíncronos (**Shift-Left**) que barram *commits* perigosos diretamente na esteira CI/CD.

### 🔄 Data Flow Diagram (DFD) - Nível 1

<div align="center">
  <img src="DFD%20-%20Nivel%201.png" alt="DFD Nível 1 do SAGA" width="800"/>
</div>

O Fluxo de Dados (DFD Nível 1) evidencia de forma clara a roteirização da validação de segurança do código-fonte:
1. O desenvolvedor submete um código novo (Commit / Pull Request).
2. O agente de CI remoto (GitHub Actions/GitLab Runner) aponta o *payload* do código alterado (diff) para a nossa API Gateway.
3. Este código é destrinchado pelo **Motor Analítico (AST/Regexes)**, que procura dependências ou assinaturas injetadas de IA em backdoors, sendo validado simultaneamente contra o **Motor OPA** — que checa se o repositório em questão possui uma isenção/permissão ativa documentada.
4. O *Verdict* é devolvido em tempo real: passe-livre para compilar a aplicação ou **Block (Fail)** orientando o desenvolvedor a revisar suas bibliotecas com a Arquitetura Corporativa.

---

### Módulos Essenciais (Microsserviços)
O projeto é inteiramente desacoplado, sendo composto por **três** módulos primários servidos via Docker:

### 1. Motor Central Analítico (Regex & Rules Engine)
Construído em código nativo, esse módulo contém as Assinaturas Heurísticas e Padrões (Regexes Pydantic) refinados por nós. Ele é capaz de detectar:
*   SDKs Oficiais: `@google/generative-ai`, `openai`, `anthropic`, `boto3 (Bedrock)`
*   Orquestradores de Agentes: `langchain`, `langgraph`, `crewai`, `smolagents`
*   Frameworks MCP: `@modelcontextprotocol/sdk`, `mcp-use`, `fastmcp`
*   Instalações base local: `ollama`, `vllm`, `llama-cpp`
*   Endpoints cruéis Hardcoded de Inference de IA ou chamadas Fetch maliciosas.

### 2. Backend & Webhook CI/CD Integrator (FastAPI / Python)
Desenvolvido via `FastAPI` (porta `8000`), a camada backend fornece uma via de mão dupla da automação:
*   **Job Scheduled API (Varredura de Risco Noturna):** Cruza a base de todos os Codebases usando a API do Github/GitLab autenticada para auditar *todos* os repositórios em formato "Mass-scan", mapeando o Risco Global.
*   **Inline Scan Endpoint (`/scan/inline`):** Um Webhook leve e performático. Quando configurado um GitHub Action ou GitLab Runner nos Pull Requests, a esteira envia o Delta da Mudança (*diff*) e a API devolve falha arquitetural (mensagem formatada de orientação) em tempo real caso encontre a quebra de padrão de "Shadow AI".

### 3. SAGA Interface de Visualização Executiva (Frontend React/Vite)
Nenhum monitoramento é eficaz sem uma camada visual orientada à Cyber. Uma UI interativa em **React JS + Vite** rodando internamente (porta `5173`) desenhada sob o *Design System Corporativo* (Gradient Azul Escuro/Azul Claro e Fundos Brancos Limpos).
A landing Page permite acesso direto aos cards que escrutinam a auditoria, onde cada violação encontrada conta com: **Nível de Risco**, **Nome da Assinatura Disparada**, **Linha do Código** e o **Snippet (Trecho de código da violação)**.

---

## 🚀 Como Subir o Ambiente (Desenvolvimento/Local)

Certifique-se de que as instâncias e vestígios locais (.venv, node_modules root) foram apagados, todo o ambiente reside no **Docker**.

### Pré-requisitos
* Docker Engine 20+
* Docker Compose V2

### Iniciando a Solução
1. Modifique o arquivo `.env.example` para `.env` com suas credenciais (opcional para testes locais).
2. Na raiz do repositório, dispare o comando de construção e injeção do ambiente:
   ```bash
   docker-compose up -d --build
   ```
3. Aguarde o contêiner `frontend` subir e realizar o bundler pré-cache do Vite.
4. **Links de Acesso**:
   * **Dashboard de Arquitetura (Frontend):** `http://localhost:5173/`
   * **Swagger/OpenAPI (Backend):** `http://localhost:8000/docs`

---

## 📋 Entendendo o Dashboard Visual

Quando acessar a interface em `http://localhost:5173/`, encontrará uma Landing Page para escaneamentos "*Ad-hoc*". Nela, membros da equipe de Arquitetura de Software podem submeter o endereço de um clone/repositório e clicar em "Iniciar Scan".

A tela de relatório dividirá em *Cards* contendo:
* 🟢 **HOMOLOGADOS:** Repositórios sem indícios de chamadas genéricas de IA ou APIs de terceiros abertas.
* 🔴 **NON-COMPLIANT:** Repositórios sob suspeita. O Card vermelhado abrigará a tag informacional `[CRITICAL]` ou `[HIGH]`, dizendo se estourou a regra `"Agent/LLM Code Pattern"` ou `"GenAI API Key Leak"` (exibindo a string crua e o arquivo faltoso).

---

## 🔄 Fluxo de Processo no CI/CD (Webhooks)
O sistema deve agir ativamente contra o desenvolvedor que introduziu a IA de forma escondida. O endpoint `POST http://localhost:8000/scan/inline` formatará o `stdout`:

> ❌ ATENÇÃO: A ESTEIRA NÃO ESTÁ DE ACORDO COM OS PADRÕES DE SEGURANÇA DA EMPRESA.
> Bibliotecas não homologadas de LLM/Agentes ou conexões MCP foram detectadas.
> Por favor, solicite revisão e homologação com o time de Arquitetura de Segurança da Informação.

Neste modelo Shift-Left, a esteira não compilará infraestrutura, empoderando o autor a reverter ou acionar as devidas esferas de aprovação arquitetural corporativa.

---