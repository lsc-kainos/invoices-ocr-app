# Invoice Dataset — synthetic benchmark fixtures

This directory intentionally contains a **small synthetic dataset** for local
benchmark smoke tests. The previous third-party Kaggle sample was replaced so
this repository can be published without redistributing external dataset files.

## Contents

| File                                | Description                                                              |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `batch1-0001.jpg`–`batch1-0003.jpg` | Synthetic invoice images copied from the repository-owned sample fixture |
| `index.csv`                         | Ground truth consumed by the benchmark loader                            |
| `batch1_1.csv`–`batch1_3.csv`       | Compatibility split files for older docs/scripts                         |

## CSV structure

Each row contains:

- `File Name` — image filename
- `Json Data` — structured synthetic invoice fields (`client_name`, `seller_name`, `invoice_number`, dates, `items[]`, `subtotal`)
- `OCRed Text` — synthetic reference text

## Using an external dataset

For larger/private benchmark runs, download a licensed dataset outside the git
repository and point `BENCHMARK_DATASET_DIR` to that local directory. Do not
commit third-party or real invoice images unless their license and privacy terms
explicitly allow public redistribution.
