# Samples

Arquivos pequenos (≤ 100 KB) usados para teste manual do pipeline OCR (F2) e
para o E2E. Não contêm dados reais — são gerados com ImageMagick a partir de
templates fictícios.

| Arquivo              | Tipo            | Descrição                                                                             |
| -------------------- | --------------- | ------------------------------------------------------------------------------------- |
| `invoice-en.jpg`     | image/jpeg      | Invoice genérica em inglês para validação rápida do pipeline (vendor, total, due)     |
| `invoice-en.pdf`     | application/pdf | Mesma invoice em PDF — exercita o caminho `pdf-to-img → vision`                       |
| `nota-fiscal-br.jpg` | image/jpeg      | DANFE NF-e fictícia anonimizada (CNPJ inventados, chave 44 dígitos válida no formato) |

A suite real BR (3-5 NF-e + 2-3 NFS-e + 2 boletos anonimizados) fica para F5
conforme o master plan.

## Regenerar

```bash
cd samples
magick -size 800x1000 xc:white -pointsize 22 -fill black -gravity NorthWest \
  -annotate +40+40 "INVOICE #INV-2026-0042..." invoice-en.jpg
magick invoice-en.jpg invoice-en.pdf
```
