# Misoginia e Direitos Humanos nas Escolas

Painel analítico interativo para a pesquisa **“Misoginia e Direitos Humanos nas Escolas — análise das percepções, do conhecimento e dos resultados de uma ação educativa”**.

A aplicação é 100% estática: lê a planilha `Base Questionarios.xlsx` diretamente no navegador (SheetJS), normaliza os dados, calcula os indicadores e exibe gráficos interativos. Não há backend, banco de dados, autenticação nem variáveis secretas.

## Estrutura dos dados

Arquivo `Base Questionarios.xlsx`, aba `Página1`, intervalo `A1:R22`.

| Colunas | Bloco | Conteúdo |
|---|---|---|
| A–C | Perfil | `IDADE`, `GENERO`, `ANO_ESCOLAR` |
| D–L | Questionário 01 | 9 perguntas de diagnóstico inicial (conhecimento, percepções, experiências) |
| M–Q | Questionário 02 | 5 perguntas de avaliação após a apresentação |
| R | Perfil | `Escola` (valor único: Brasília) |

- Linha 1 = cabeçalhos; linhas 2–22 = **21 participantes**. Cada linha é um participante, com as respostas dos dois questionários.
- Sem valores ausentes, sem alternativas inesperadas, sem registros duplicados.
- Inconsistência encontrada: espaços excedentes no início/fim das respostas (ex.: `" Masculino  "`, `"Feminino     "`), unificados pela normalização e listados na página Metodologia.
- Não há coluna de identificação: o vínculo Q1 × Q2 é a própria linha.

## Tecnologias

React 19 + TypeScript · Vite 8 · Tailwind CSS 4 · Recharts 3 · SheetJS (`xlsx` 0.20.3, distribuição oficial da SheetJS) · Lucide React · React Router (HashRouter) · Vitest.

## Estrutura de pastas

```
Base Questionarios.xlsx      ← fonte oficial dos dados (substitua para atualizar)
scripts/sync-data.mjs        ← copia a planilha para public/data e gera manifest.json
src/
  data/       schema.ts (catálogo de perguntas, alternativas e agrupamentos)
              normalize.ts (normalização + relatório de qualidade)
              load.ts (leitura com SheetJS)
  stats/      stats.ts (frequências, contingência, p.p.), indicators.ts,
              insights.ts (achados por regras), filters.ts, format.ts
  state/      AppState.tsx (carregamento, filtros globais, modo apresentação)
  components/ charts/ (barras, empilhadas, mapa de calor), analysis/, layout/, common/
  pages/      8 páginas do painel
tests/        testes unitários e de integração com a planilha real
.github/workflows/deploy.yml
```

## Executar localmente

Requer Node.js 20.19+ (testado com Node 24).

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # testes
npm run build      # build de produção em dist/
npm run preview    # serve o build
```

`npm run dev` e `npm run build` executam antes o script `sync-data`, que copia `Base Questionarios.xlsx` da raiz para `public/data/`.

## Atualizar a planilha

1. Substitua `Base Questionarios.xlsx` na raiz, mantendo os cabeçalhos.
2. Rode `npm test` (o teste de integração confere contagens da planilha atual — atualize-as se os dados mudarem).
3. Faça commit e push: o deploy é automático.

As colunas são associadas pelo texto do cabeçalho (posição só como alternativa). Valores fora do catálogo são preservados e sinalizados como “alternativa não prevista”. Para incluir novas alternativas ou perguntas, edite `src/data/schema.ts`.

Também é possível analisar outra planilha **localmente** em *Metodologia → Analisar outra planilha*; o arquivo é processado apenas no navegador e não é publicado.

## Publicar no GitHub Pages

1. Crie o repositório no GitHub e envie o projeto para a branch `main`.
2. Em **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions**.
3. A cada push na `main`, o workflow `.github/workflows/deploy.yml` instala dependências, roda os testes, gera o build com `BASE_PATH=/<nome-do-repositório>/` e publica.
4. O endereço será `https://<usuário>.github.io/<nome-do-repositório>/`.

A navegação usa `HashRouter` (`.../#/perfil`), portanto recarregar páginas internas nunca gera 404. Sem `BASE_PATH`, o build usa caminhos relativos (`./`), que também funcionam em qualquer subcaminho.

> No Git Bash para Windows, use `MSYS_NO_PATHCONV=1 BASE_PATH=/repo/ npm run build` para testar o build com subcaminho; sem isso o shell converte `/repo/` em caminho de disco. No GitHub Actions (Linux) isso não é necessário.

## Regras estatísticas

- Denominador = respostas válidas da pergunta no recorte filtrado; ausências ficam fora do denominador e são sempre informadas.
- Nenhuma categoria é excluída (“Não sei responder”, “Nunca pensei sobre isso”, “Não tenho certeza”).
- Ausência nunca é tratada como resposta negativa.
- Sem pontuação composta, escalas numéricas ou pesos.
- Agrupamentos (ex.: “apenas ouviu falar” = duas alternativas) são explícitos no catálogo e listados na página Metodologia; os gráficos sempre mostram todas as alternativas.
- Tabelas de contingência: % linha, % coluna ou % do total, com base (pares válidos) e excluídos informados.
- Diferenças entre grupos em pontos percentuais.
- Percentuais com 1 casa decimal (padrão pt-BR).
- Nenhuma afirmação causal: Q2 é autoavaliação posterior, sem grupo de controle e sem as mesmas perguntas do Q1.

## Limitações

- Amostra pequena (21) e de uma única escola; grupos desbalanceados (2º ano: 3; 16–18 anos: 5).
- O formulário original não estava disponível: o catálogo contém só as alternativas observadas (ex.: “Prefiro não responder” não aparece com zero).
- Medidas autorrelatadas; experiências relatadas não medem incidência de violência.
