# Invoice Dataset — Kaggle (Benchmark OCR)

**Fonte:** [High Quality Invoice Images for OCR](https://www.kaggle.com/datasets/osamahosamabdellatif/high-quality-invoice-images-for-ocr) — Osama Hosam Abdellatif, Kaggle.

**Uso:** dataset de referência para o benchmark automatizado do pipeline OCR (`/admin/benchmark`). As imagens são invoices internacionais sintéticas com dados estruturados já mapeados nos CSVs (ground truth).

## Conteúdo

| Arquivo           | Descrição                           |
| ----------------- | ----------------------------------- |
| `batch1-XXXX.jpg` | 30 imagens de invoice (JPG)         |
| `batch1_1.csv`    | Ground truth para imagens 0001–0010 |
| `batch1_2.csv`    | Ground truth para imagens 0500–0510 |
| `batch1_3.csv`    | Ground truth para imagens 1001–1010 |

## Estrutura dos CSVs

Cada linha contém:

- `File Name` — nome da imagem correspondente
- `Json Data` — campos estruturados: `client_name`, `seller_name`, `invoice_number`, `invoice_date`, `items[]`, `subtotal` (tax, discount, total)
- `OCRed Text` — texto bruto extraído da imagem (referência textual)

## Licença

Dataset disponível publicamente no Kaggle para fins de pesquisa e desenvolvimento.
