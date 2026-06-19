# Plano de Testes: ChatSchema Validation

**Feature ID:** P1.3
**Issue:** #58 (Bug: ChatSchema sem testes unitários)
**Dependências:** Nenhuma (independente)
**Estimativa Total:** 12 testes unitários

---

## 1. Escopo

### O que será testado
- Schema `ChatSchema` do Zod (em `shared/src/validation/schemas.ts`)
- Validação do campo `message`: string, min 1 caractere, max 200 caracteres
- Validação do campo `channel`: enum `['global', 'party', 'guild', 'whisper']`
- Validação de parâmetros opcionais (ex: `targetName` para whisper)
- Aceitação de mensagens com caracteres especiais, emojis, espaços
- Rejeição de mensagens vazias, null, undefined
- Rejeição de channel inválido
- Mensagens no limite de tamanho (200 chars)
- Mensagens acima do limite (> 200 chars)
- Testes de type narrowing (TypeScript): tipo inferido corretamente
- Compatibilidade: `ChatSchema` usado tanto no cliente quanto no servidor

### O que NÃO será testado
- Lógica de negócio do chat (broadcast, canais, histórico) — será testado separadamente
- UI do chat (já testada indiretamente)
- Outros schemas (`LoginSchema`, `RegisterSchema`, `MoveSchema`) — já testados em `schemas.test.ts`

---

## 2. Testes Unitários

### 2.1 ChatSchema — Campo `message`

- [ ] **TC-001: Aceita mensagem válida curta**
  - Input: `{ message: 'Hello!', channel: 'global' }`
  - Expected: `safeParse().success === true`, `data.message === 'Hello!'`

- [ ] **TC-002: Aceita mensagem no limite máximo (200 caracteres)**
  - Input: `{ message: 'A'.repeat(200), channel: 'global' }`
  - Expected: `success === true`

- [ ] **TC-003: Rejeita mensagem vazia (0 caracteres)**
  - Input: `{ message: '', channel: 'global' }`
  - Expected: `success === false`, erro na validação de `message`

- [ ] **TC-004: Rejeita mensagem acima do limite (> 200 caracteres)**
  - Input: `{ message: 'A'.repeat(201), channel: 'global' }`
  - Expected: `success === false`, erro `message` muito longo

- [ ] **TC-005: Rejeita mensagem null**
  - Input: `{ message: null, channel: 'global' }`
  - Expected: `success === false`

- [ ] **TC-006: Rejeita mensagem undefined**
  - Input: `{ message: undefined, channel: 'global' }`
  - Expected: `success === false`

- [ ] **TC-007: Aceita mensagem com caracteres especiais e acentos**
  - Input: `{ message: 'Olá, mundo! @#$% 你好', channel: 'global' }`
  - Expected: `success === true`

- [ ] **TC-008: Aceita mensagem com emojis**
  - Input: `{ message: '🔥💪⚔️ Vamos lutar! 🏰', channel: 'global' }`
  - Expected: `success === true` (Zod conta code points corretamente ou permite)

### 2.2 ChatSchema — Campo `channel`

- [ ] **TC-009: Aceita channel válido 'global'**
  - Input: `{ message: 'test', channel: 'global' }`
  - Expected: `success === true`

- [ ] **TC-010: Aceita channel válido 'party'**
  - Input: `{ message: 'test', channel: 'party' }`
  - Expected: `success === true`

- [ ] **TC-011: Aceita channel válido 'guild'**
  - Input: `{ message: 'test', channel: 'guild' }`
  - Expected: `success === true`

- [ ] **TC-012: Aceita channel válido 'whisper'**
  - Input: `{ message: 'test', channel: 'whisper' }`
  - Expected: `success === true`

- [ ] **TC-013: Rejeita channel inválido**
  - Input: `{ message: 'test', channel: 'invalid' }`
  - Expected: `success === false`, erro no campo `channel`

- [ ] **TC-014: Rejeita channel null**
  - Input: `{ message: 'test', channel: null }`
  - Expected: `success === false`

- [ ] **TC-015: Rejeita channel undefined**
  - Input: `{ message: 'test' }` (sem channel)
  - Expected: `success === false`

- [ ] **TC-016: Rejeita channel em letras maiúsculas (case-sensitive)**
  - Input: `{ message: 'test', channel: 'GLOBAL' }`
  - Expected: `success === false` (espera minúsculas)

### 2.3 ChatSchema — Tipo Inferido

- [ ] **TC-017: TypeScript infere tipo correto de `z.infer<typeof ChatSchema>`**
  - Input: Declaração `type ChatMessage = z.infer<typeof ChatSchema>`
  - Expected: `ChatMessage` = `{ message: string; channel: 'global' | 'party' | 'guild' | 'whisper' }`

### 2.4 ChatSchema — Validação no Handler (Integração)

- [ ] **TC-018: Handler `PLAYER_CHAT` valida com ChatSchema antes de processar**
  - Setup: Network handler mockado
  - Steps:
    1. Receber `{ type: 'PLAYER_CHAT', message: 'hello', channel: 'global' }`
    2. Handler executa `ChatSchema.parse()`
  - Expected: Parse bem-sucedido, mensagem processada

- [ ] **TC-019: Handler `PLAYER_CHAT` rejeita mensagem inválida com erro**
  - Setup: Network handler mockado
  - Steps:
    1. Receber `{ type: 'PLAYER_CHAT', message: '', channel: 'global' }`
    2. Handler executa `ChatSchema.safeParse()`
  - Expected: Parse falha, handler retorna erro `INVALID_CHAT_MESSAGE`

- [ ] **TC-020: Handler `PLAYER_CHAT` rejeita channel inválido com erro**
  - Setup: Network handler mockado
  - Steps:
    1. Receber `{ type: 'PLAYER_CHAT', message: 'hi', channel: 'invalid' }`
    2. Handler executa `ChatSchema.safeParse()`
  - Expected: Parse falha, handler retorna erro `INVALID_CHANNEL`

---

## 3. Casos de Borda

- [ ] **TC-021: Mensagem com apenas espaços**
  - Input: `{ message: '   ', channel: 'global' }`
  - Expected: `success === true` (ou `false` se houver trim prévio — documentar comportamento)

- [ ] **TC-022: Mensagem com espaços no início/fim**
  - Input: `{ message: '  hello world  ', channel: 'global' }`
  - Expected: `success === true`, mensagem mantida (ou trimmed conforme design)

- [ ] **TC-023: Mensagem HTML injection**
  - Input: `{ message: '<script>alert("xss")</script>', channel: 'global' }`
  - Expected: `success === true` (Zod não sanitiza — validação é de schema, não sanitização)

- [ ] **TC-024: Mensagem com newlines (\n)**
  - Input: `{ message: 'line1\nline2\nline3', channel: 'global' }`
  - Expected: `success === true` (newlines são caracteres válidos)

- [ ] **TC-025: Mensagem com apenas números**
  - Input: `{ message: '12345', channel: 'global' }`
  - Expected: `success === true`

---

## 4. Regressão

- Testes de Schemas existentes (`schemas.test.ts`) — ChatSchema adicionado ao arquivo
- Testes de handlers de chat (servidor) — validação de entrada
- Testes de handlers de chat (cliente) — UI só envia mensagens válidas

---

## 5. Mocking Strategy

- **Nenhum mock necessário**: Zod schemas são funções puras, testáveis em isolamento

---

## 6. Estimativa de Esforço

| Tipo | Quantidade | Esforço |
|------|-----------|---------|
| Unit (message) | 8 | 1h |
| Unit (channel) | 8 | 1h |
| Casos de Borda | 5 | 1h |
| Integração | 3 | 1h |
| **Total** | **24** | **4h** |
