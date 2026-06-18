# Política de Segurança — Arcan Gods

## Reportando uma Vulnerabilidade

Valorizamos a segurança do projeto. Se você encontrou uma vulnerabilidade, **não abra uma issue pública**.

Envie um email para: **netoo.elio@hotmail.com**

Inclua:

- Descrição do problema
- Passos para reproduzir (se aplicável)
- Versão afetada
- Possível impacto

### Prazo de resposta

- Confirmação de recebimento: **48h**
- Atualização sobre a correção: **5 dias úteis**
- Correção publicada: **14 dias úteis** (dependendo da gravidade)

## Práticas do Projeto

- Senhas hashadas com bcrypt (cost 12)
- JWT com expiração curta + refresh token
- Validação server-side de todas as ações de jogo
- Rate limiting por conexão/IP
- Sanitização de inputs (chat, comandos)
- Dependências auditadas via `npm audit` no CI
- Secrets gerenciados via variáveis de ambiente, nunca no código
