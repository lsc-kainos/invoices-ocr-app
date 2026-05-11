# ai-runtime

Facade provider-agnóstica para LLMs. Substitui chamada direta da OpenAI SDK no domínio OCR.

## Divergência consciente vs. CLAUDE.md

- **CLAUDE.md** estabelece "OpenAI único" e "SDK direto da OpenAI, não LangChain". Este módulo usa Vercel AI SDK (`ai` package) para suportar provider switching opcional. Não é LangChain (sem chains/agents/retrievers); é wrapper fino sobre as SDKs nativas.
- OpenAI continua sendo o único provider exigido. Anthropic/Google são habilitados apenas se a env correspondente estiver presente.
- Decisão registrada em `docs/superpowers/specs/2026-05-10-f3.1-ai-runtime-design.md` §2.3.
