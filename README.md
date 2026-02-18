# Scraping de X + análisis de sentimiento de emisoras

Pipeline inicial para:

1. Scrapeo de publicaciones en X (Twitter) de cuentas objetivo.
2. Análisis de sentimiento de cada tweet.
3. Detección de emisoras listadas (por cashtag/alias) y resumen agregado.

## Cuentas objetivo iniciales

- Elon Musk (`@elonmusk`)
- Cathie Wood (`@CathieDWood`)
- Michael Saylor (`@saylor`)

## Estructura

```text
src/
  cli.py            # Entrada principal por consola
  scraper.py        # Extracción de tweets
  sentiment.py      # NLP + detección de emisoras
  pipeline.py       # Orquestación y guardado de resultados
config/
  issuers.csv       # Catálogo editable de emisoras
tests/
  test_sentiment.py
```

## Instalación

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Ejecución rápida

```bash
python -m src.cli \
  --accounts @elonmusk @CathieDWood @saylor \
  --limit-per-account 100 \
  --since 2025-01-01 \
  --until 2026-01-01 \
  --backend auto
```

Si no defines `--output-dir`, el sistema crea automáticamente:

```text
data/runs/<timestamp_utc>/
```

Con estos archivos:

- `tweets_raw.json`: tweets crudos scrapeados
- `tweets_sentiment.csv`: tweet por tweet con score de sentimiento
- `account_summary.csv`: resumen por cuenta
- `issuer_summary.csv`: resumen por emisor detectado
- `scrape_errors.json`: errores de scraping por cuenta (si aplica)
- `run_metadata.json`: metadata de la corrida

## Backends de scraping

El CLI permite 3 modos:

- `--backend snscrape`: scraping sin login (puede fallar si X bloquea endpoints públicos).
- `--backend twikit`: scraping autenticado.
- `--backend auto`: intenta `snscrape` y si falla usa `twikit` (si hay auth disponible).

### Uso con Twikit (recomendado cuando hay bloqueos)

Puedes autenticarte con cookies o con credenciales.

#### Opción A: cookies

```bash
export X_COOKIES_FILE=/ruta/a/cookies.json
python -m src.cli --backend twikit --accounts @elonmusk @CathieDWood @saylor
```

#### Opción B: login (guarda cookies para próximas corridas)

```bash
export X_AUTH_INFO_1="tu_usuario_o_email"
export X_PASSWORD="tu_password"
export X_COOKIES_FILE="./x_cookies.json"
python -m src.cli --backend twikit --accounts @elonmusk @CathieDWood @saylor
```

Si usas 2FA, también define `X_TOTP_SECRET`.

## Catálogo de emisoras

Edita `config/issuers.csv` para agregar más emisoras:

```csv
ticker,aliases
TSLA,tesla
MSTR,microstrategy|strategy
```

- `ticker`: símbolo bursátil
- `aliases`: términos alternativos separados por `|`

## Tests

```bash
pytest -q
```

## Nota importante

El scraping en X puede verse afectado por cambios en la plataforma, límites de tasa, bloqueos geográficos o ajustes de ToS. Si una corrida falla, prueba:

1. Reducir `--limit-per-account`.
2. Acotar ventana temporal (`--since` / `--until`).
3. Ejecutar con `--backend twikit` y autenticación.
4. Reintentar más tarde.
