package saga.governance

import rego.v1

# Por padrão, a autorização (exceção) é falsa e a quebra da esteira (block) é avaliada pelo python
default allow := false

# Allowlist pareada: repósitório X pode usar biblioteca/padrão Y sem bloqueio no pipeline
# Estrutura esperada do request de entrada: { "input": { "repository": "SAGA/repositorio-homologado", "lib": "mcp-framework" } }
allow if {
    some rule in data.exceptions.rules
    input.repository == rule.repository
    input.lib == rule.lib
}
