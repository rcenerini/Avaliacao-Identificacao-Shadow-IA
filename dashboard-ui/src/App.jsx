import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, Shield, Code2, AlertTriangle, Search, ArrowRight, Settings, Plus, Trash2 } from 'lucide-react';
import './index.css';

const MOCK_REPORT = [
    {
        "repository": "SAGA/meu-repo-node",
        "status": "NON_COMPLIANT",
        "violations_count": 2,
        "violations": [
            {
                "rule_name": "Node.js GenAI/MCP Library",
                "category": "LIBRARY",
                "severity": "CRITICAL",
                "description": "Identified usage of unapproved GenAI or MCP library in Node.js ecosystem",
                "match_preview": "\"mcp-framework\": \"^1.0.0\",",
                "line_number": 12
            },
            {
                "rule_name": "Node.js GenAI/MCP Library",
                "category": "LIBRARY",
                "severity": "CRITICAL",
                "description": "Identified usage of unapproved GenAI or MCP library in Node.js ecosystem",
                "match_preview": "\"@modelcontextprotocol/sdk\": \"*\"",
                "line_number": 14
            }
        ]
    },
    {
        "repository": "SAGA/payment-gateway-api",
        "status": "COMPLIANT",
        "violations_count": 0,
        "violations": []
    },
    {
        "repository": "SAGA/backoffice-python-app",
        "status": "NON_COMPLIANT",
        "violations_count": 1,
        "violations": [
            {
                "rule_name": "Agent/LLM Code Pattern",
                "category": "CODE_PATTERN",
                "severity": "HIGH",
                "description": "Code instantiating GenAI models or Agent structures",
                "match_preview": "agent = AgentExecutor(tools=tools, llm=llm)",
                "line_number": 45
            }
        ]
    }
];

function App() {
    const [currentView, setCurrentView] = useState('landing'); // 'landing', 'scanning', 'dashboard', 'governance'
    const [repoInput, setRepoInput] = useState('');
    const [exceptionInput, setExceptionInput] = useState('');
    const [reports, setReports] = useState([]);
    const [exceptions, setExceptions] = useState([]);
    const [libInput, setLibInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Carrega os dados mockados 
        setReports(MOCK_REPORT);
    }, []);

    const handleScan = (e) => {
        e.preventDefault();
        if (!repoInput.trim()) return;

        setCurrentView('scanning');

        // Simulate network delay
        setTimeout(() => {
            // For demonstration, if repo is "github.com/SAGA/novo-repo", we inject a fake report
            if (repoInput.includes('novo-repo')) {
                setReports([{
                    "repository": repoInput,
                    "status": "COMPLIANT",
                    "violations_count": 0,
                    "violations": []
                }, ...MOCK_REPORT]);
            }
            setCurrentView('dashboard');
        }, 2500);
    };

    const navToLanding = () => {
        setCurrentView('landing');
        setRepoInput('');
        setReports(MOCK_REPORT); // reseta os mocks
    };

    const fetchExceptions = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/governance/exceptions');
            if (res.ok) {
                const data = await res.json();
                setExceptions(data.exceptions || []);
            }
        } catch (e) {
            console.error("Erro ao buscar exceções OPA", e);
        }
    };

    const handleOpenGovernance = () => {
        setCurrentView('governance');
        fetchExceptions();
    };

    const handleAddException = async (e) => {
        e.preventDefault();
        if (!exceptionInput.trim() || !libInput.trim()) {
            alert("Preencha o repositório e o padrão liberado.");
            return;
        }
        setIsSaving(true);
        try {
            const res = await fetch('http://localhost:8000/api/governance/exceptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repository: exceptionInput.trim(), lib: libInput.trim() })
            });
            if (res.ok) {
                setExceptionInput('');
                setLibInput('');
                fetchExceptions(); // recarrega a lista
            }
        } catch (e) {
            console.error("Falha ao salvar", e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteException = async (repoName, libName) => {
        // Optimistic UI update could be placed here, for now just backend call
        try {
            const res = await fetch('http://localhost:8000/api/governance/exceptions', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repository: repoName, lib: libName })
            });
            if (res.ok) {
                fetchExceptions(); // recarrega lista pos deleção
            } else {
                alert("Falha ao remover regra do OPA");
            }
        } catch (e) {
            console.error("Erro na deleção", e);
        }
    };

    const totalScanned = reports.length;
    const totalViolations = reports.filter(r => r.status === 'NON_COMPLIANT').length;

    return (
        <div className="layout-container">
            {/* Header Centralizado - Padrão Cielo */}
            <header className="cielo-header">
                <div className="header-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="logo-area" onClick={navToLanding} style={{ cursor: 'pointer' }}>
                            <Shield className="logo-icon" size={32} />
                            <h1>SAGA Scanner</h1>
                        </div>
                        <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Sistema de Análise e Gerenciamento de Ameaças</p>
                    </div>

                    <button onClick={handleOpenGovernance} className="btn-secondary" style={{ background: 'transparent', color: 'white', borderColor: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Settings size={18} /><span>Governança via OPA</span>
                    </button>
                </div>
            </header>

            <main className="main-content">

                {/* VIEW 1: LANDING PAGE */}
                {currentView === 'landing' && (
                    <div className="landing-view">
                        <div className="hero-section">
                            <div className="hero-icon-wrapper">
                                <Search size={48} className="hero-icon-main" />
                                <ShieldAlert size={24} className="hero-icon-badge" />
                            </div>
                            <h2>Auditoria de Arquitetura e GenAI</h2>
                            <p className="hero-description">
                                A plataforma SAGA (Sistema de Análise e Gerenciamento de Ameaças) protege nossos repositórios contra a introdução não homologada de Modelos de Linguagem (LLMs), Agentes Autônomos e <strong>Model Context Protocols (MCP)</strong>.
                            </p>
                        </div>

                        <div className="info-sections">
                            <h2 style={{ fontSize: '28px', color: 'var(--cielo-blue-dark)', marginBottom: '16px', gridColumn: '1 / -1', textAlign: 'center' }}>O que é o SAGA Scanner?</h2>
                            <p style={{ fontSize: '16px', color: 'var(--text-dark)', lineHeight: '1.6', marginBottom: '32px', gridColumn: '1 / -1', textAlign: 'center', maxWidth: '800px', margin: '0 auto 32px auto' }}>
                                O SAGA (Sistema de Análise e Gerenciamento de Ameaças) atua preventivamente nas esteiras de DevOps para detectar e conter a proliferação de Shadow AI. Ele realiza análise estática e heurística de código em tempo real via Webhook ou através de varreduras agendadas, garantindo que o desenvolvimento com Generative AI e Context Protocols ocorra sob as diretrizes de Arquitetura da Cielo.
                            </p>
                            <div className="info-card">
                                <h3>O que é o Shadow AI?</h3>
                                <p><strong>Shadow AI</strong> refere-se ao uso, desenvolvimento ou integração de ferramentas de Inteligência Artificial generativa e frameworks de agentes autônomos por equipes ou desenvolvedores sem a aprovação, conhecimento ou governança formal da área de Arquitetura e Segurança da Informação da empresa.</p>
                                <p>Isso inclui bibliotecas populares acopladas diretamente no código, como <code>LangChain</code>, <code>Flowise</code>, <code>Ollama</code>, e chamadas diretas a APIs de IA como <code>GPT</code> e <code>Claude</code>.</p>
                            </div>

                            <div className="info-card">
                                <h3>Por que precisamos bloquear isso? (O Risco)</h3>
                                <ul className="info-list">
                                    <li><strong>Vazamento de Dados (DLP):</strong> Ferramentas não homologadas podem enviar dados sensíveis de clientes ou código-fonte corporativo para provedores externos de IA para treinamento.</li>
                                    <li><strong>Agentic Tool Calling:</strong> Agentes (AI Agents) e conexões <strong>MCP (Model Context Protocol)</strong> podem receber instruções externas maliciosas de Prompt Injection e deletar bases de dados ou vazar secrets com facilidade, agindo como Backdoors.</li>
                                    <li><strong>Débito Arquitetural:</strong> Adoção de ferramentas experimentais gera gargalos de perfomance e quebra a padronização das nossas soluções em nuvem.</li>
                                </ul>
                            </div>

                            <div className="info-card">
                                <h3>Como este motor funciona? (Shift-Left)</h3>
                                <p>Nossa solução age de duas maneiras complementares:</p>
                                <ul className="info-list">
                                    <li><strong>Varredura Contínua (Jobs):</strong> Periodicamente, vasculhamos as organizações via APIs do GitHub/GitLab mapeando através de Análise Estática Heurística (AST) e Regras complexas (Regex) as dependências em <code>package.json</code>, <code>requirements.txt</code> etc.</li>
                                    <li><strong>Bloqueio no CI/CD:</strong> Atuando "Shift-Left", qualquer Pull Request inserindo uma biblioteca proibida dispara o Webhook do Scanner que quebra a esteira com o log orientativo para buscar revisão da equipe de Cyber Security.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="scan-card">
                            <h3>Varredura Ad-Hoc (Escaneamento Manual)</h3>
                            <p>Precisa validar um repositório imediatamente ou conferir seu próprio Pull Request? Insira a URL do repositório para forçar o escaneamento na esteira.</p>

                            <form onSubmit={handleScan} className="scan-form">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder="Ex: organizacao/meu-repositorio"
                                        value={repoInput}
                                        onChange={(e) => setRepoInput(e.target.value)}
                                        autoFocus
                                    />
                                    <button type="submit" disabled={!repoInput.trim()}>
                                        Iniciar Scan <ArrowRight size={18} />
                                    </button>
                                </div>
                            </form>

                            <div className="view-reports-divider">ou</div>

                            <button
                                type="button"
                                className="btn-secondary btn-full"
                                onClick={() => setCurrentView('dashboard')}
                            >
                                <Search size={18} /> Ver Histórico de Auditorias
                            </button>
                        </div>
                    </div>
                )}

                {/* VIEW 2: SCANNING SPINNER */}
                {currentView === 'scanning' && (
                    <div className="scanning-view">
                        <div className="spinner"></div>
                        <h2>Analisando Repositório...</h2>
                        <p>Avaliando dependências e código fonte de <br /><strong>{repoInput}</strong></p>
                    </div>
                )}

                {/* VIEW 3: DASHBOARD DE RELATÓRIOS */}
                {currentView === 'dashboard' && (
                    <div className="dashboard-view animate-fade-in">
                        <div className="dashboard-header">
                            <h2>Relatórios de Execução</h2>
                            <button className="btn-secondary" onClick={navToLanding}>
                                Submeter Novo Repositório
                            </button>
                        </div>

                        <section className="stats-row">
                            <div className="stat-card">
                                <h3>Repositórios Analisados</h3>
                                <p className="stat-number">{totalScanned}</p>
                            </div>
                            <div className="stat-card error-card">
                                <h3>Projetos com Shadow AI (Risco)</h3>
                                <p className="stat-number">{totalViolations}</p>
                            </div>
                        </section>

                        <section className="report-section">
                            <div className="repo-grid">
                                {reports.map((repo, idx) => (
                                    <div key={idx} className={`repo-card ${repo.status === 'COMPLIANT' ? 'card-ok' : 'card-danger'}`}>
                                        <div className="repo-header">
                                            <div className="repo-title">
                                                <Code2 size={20} className="repo-icon" />
                                                <h3>{repo.repository}</h3>
                                            </div>
                                            <div className="repo-badge">
                                                {repo.status === 'COMPLIANT' ? (
                                                    <span className="badge-ok"><CheckCircle size={14} /> HOMOLOGADO</span>
                                                ) : (
                                                    <span className="badge-danger"><AlertTriangle size={14} /> NON-COMPLIANT</span>
                                                )}
                                            </div>
                                        </div>

                                        {repo.status === 'NON_COMPLIANT' && (
                                            <div className="violations-container">
                                                <p className="violations-title">
                                                    <ShieldAlert size={16} />
                                                    {repo.violations_count} Violações Detectadas:
                                                </p>
                                                <ul className="violations-list">
                                                    {repo.violations.map((v, vIdx) => (
                                                        <li key={vIdx} className="violation-item">
                                                            <div className="violation-header">
                                                                <span className="severity-tag">{v.severity}</span>
                                                                <strong>{v.rule_name}</strong>
                                                                <span className="line-info">(Linha: {v.line_number})</span>
                                                            </div>
                                                            <p className="violation-desc">{v.description}</p>
                                                            <div className="code-snippet">
                                                                <code>{v.match_preview}</code>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {/* VIEW 4: GOVERNANÇA (OPA) */}
                {currentView === 'governance' && (
                    <div className="governance-view animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <div className="dashboard-header">
                            <div>
                                <h2>Gestão de Exceções & Governança (Policy as Code / OPA)</h2>
                                <p style={{ color: 'var(--text-light)', marginTop: '8px', fontSize: '14px' }}>
                                    Repositórios aqui listados estão isentos das regras de bloqueio do Scanner na esteira de CI/CD via Open Policy Agent.
                                </p>
                            </div>
                        </div>

                        <div className="governance-form-container" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '32px' }}>
                            <h3 style={{ marginTop: 0, color: 'var(--text-dark)' }}>Nova Exceção</h3>
                            <form onSubmit={handleAddException} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <label htmlFor="repoInput" style={{ display: 'block' }}>
                                        <input
                                            id="repoInput"
                                            type="text"
                                            value={exceptionInput}
                                            onChange={(e) => setExceptionInput(e.target.value)}
                                            placeholder="Ex: SAGA/payment-gateway-api"
                                            aria-label="Repositório"
                                            style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '15px' }}
                                        />
                                        <small style={{ color: 'var(--text-light)', display: 'block', marginTop: '6px' }}>URL Absoluta ou Nome da Org/Repositório no Github/Gitlab</small>
                                    </label>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label htmlFor="libInput" style={{ display: 'block' }}>
                                        <input
                                            id="libInput"
                                            type="text"
                                            value={libInput}
                                            onChange={(e) => setLibInput(e.target.value)}
                                            placeholder="Ex: langchain, mcp-framework, pydantic-ai"
                                            aria-label="Biblioteca ou padrão"
                                            style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '15px' }}
                                        />
                                        <small style={{ color: 'var(--text-light)', display: 'block', marginTop: '6px' }}>Padrão exato, Framework ou Lib que o repo tem autorização de usar.</small>
                                    </label>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    style={{ padding: '12px 32px', borderRadius: '8px', border: 'none', background: 'var(--cielo-blue-dark)', color: 'white', fontWeight: 'bold', cursor: isSaving ? 'wait' : 'pointer', fontSize: '15px' }}
                                >
                                    {isSaving ? 'Salvando...' : 'Autorizar'}
                                </button>
                            </form>
                        </div>

                        <div className="repo-grid">
                            {exceptions.length === 0 ? (
                                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-light)', background: 'white', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                                    A base OPA atual não possui nenhuma exceção ativa.
                                </div>
                            ) : (
                                exceptions.map((rule, idx) => (
                                    <div key={idx} className="repo-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderLeft: '4px solid var(--success-color)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <Code2 size={20} color="var(--text-light)" />
                                                <strong style={{ fontSize: '15px', color: 'var(--text-dark)' }}>{rule.repository}</strong>
                                            </div>
                                            <div style={{ paddingLeft: '32px', fontSize: '13px', color: 'var(--text-light)' }}>
                                                Lib/Padrão Permitido: <span style={{ fontWeight: '500', color: 'var(--primary-color)' }}>{rule.lib}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div className="badge-ok" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                                                <CheckCircle size={14} /> EXCEÇÃO OPA ATIVA
                                            </div>
                                            <button
                                                onClick={() => handleDeleteException(rule.repository, rule.lib)}
                                                style={{ background: 'transparent', border: 'none', color: 'var(--cielo-red)', cursor: 'pointer', padding: '4px' }}
                                                title="Remover Permissão"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}

export default App;
