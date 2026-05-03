# Analisis de sentimiento de emisoras con FinBERT

Pipeline en Python para combinar:

- transcripts trimestrales de earnings calls en PDF,
- tweets de X/Twitter obtenidos con Apify,
- sentimiento financiero con `ProsusAI/finbert`,
- rendimiento de mercado via Yahoo Finance,
- salida CSV y grafica del score normalizado contra rendimiento.

## Instalacion

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Define tu token de Apify:

```bash
export APIFY_TOKEN="tu_token"
```

## Configuracion

Copia el ejemplo:

```bash
cp config/example.yaml config/local.yaml
```

Edita `config/local.yaml` con tus emisoras, rutas de PDFs y fechas de reporte.

La ventana de tweets se calcula automaticamente desde 24 horas antes hasta 72 horas despues de `earnings_datetime`.

## Ejecucion

```bash
python3 -m finbert_emisoras --config config/local.yaml
```

Si ejecutas desde el repositorio sin instalar el paquete:

```bash
PYTHONPATH=src python3 -m finbert_emisoras --config config/local.yaml
```

## Salidas

Por defecto se escriben en `outputs/`:

- `sentiment_event_scores.csv`: resultados por emisora/evento.
- `selected_tweets.csv`: tweets seleccionados y ponderados, si existen.
- `run_metadata.json`: parametros principales de la corrida.
- `sentiment_vs_return.png`: grafica de sentimiento normalizado contra rendimiento.

## Peso de tweets

El peso combina:

- verificacion del usuario,
- interacciones de la publicacion,
- seguidores del autor,
- cercania temporal al reporte,
- presencia de palabras clave de politicos, economistas o analistas financieros.

Puedes ajustar los parametros en `tweet_weighting` dentro del YAML.
