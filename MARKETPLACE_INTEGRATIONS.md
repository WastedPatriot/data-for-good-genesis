# Marketplace Integrations - External Publishing

## Overview
DataForEarth supports automated publishing to external data marketplaces to maximize dataset reach and revenue.

## Supported Platforms

### 1. HuggingFace Datasets
- **Priority**: High
- **API**: `huggingface_hub` Python library
- **Auth**: HF_TOKEN (user secret)
- **Format**: Parquet, JSONL
- **Throttle**: 2 releases/month per domain
- **Revenue Model**: Free tier (citation/attribution)

### 2. Kaggle Datasets
- **Priority**: High
- **API**: Kaggle API (kaggle.json credentials)
- **Auth**: KAGGLE_USERNAME, KAGGLE_KEY
- **Format**: CSV, SQLite
- **Throttle**: 2 releases/month per domain
- **Revenue Model**: Free tier (community engagement)

### 3. GitHub Releases
- **Priority**: Medium
- **API**: GitHub REST API
- **Auth**: GITHUB_TOKEN
- **Format**: All (packaged as .zip)
- **Throttle**: 4 releases/month total
- **Revenue Model**: Free (OSS visibility)

### 4. Data.world
- **Priority**: Medium
- **API**: data.world API
- **Auth**: DW_API_TOKEN
- **Format**: CSV, JSONL
- **Throttle**: 1 release/month per domain
- **Revenue Model**: Freemium (paid visibility)

## Integration Flow

```
1. Dataset built via /admin/dataset-builder
   ↓
2. Admin selects "Publish to External Marketplaces"
   ↓
3. Edge function /publish-to-external triggered
   ↓
4. Check release_policy throttle (max_external_releases_per_month_per_domain)
   ↓
5. Generate export files (CSV/Parquet/SQLite)
   ↓
6. Upload to each marketplace via their API
   ↓
7. Store external URLs in dataset_files table
   ↓
8. Update datasets.sample_data with external links
   ↓
9. Audit log entry created
```

## Throttle Policy

**Default Limits** (per domain):
- On-site releases: 2/week
- External marketplace releases: 2/month
- Burst mode: override for 1 cycle

**Enforcement**:
```sql
SELECT COUNT(*) FROM datasets
WHERE domain = 'climate'
  AND source_channel = 'huggingface'
  AND created_at > now() - interval '30 days';
```

If count >= `max_external_releases_per_month_per_domain`, block publish.

## Metadata Mapping

### HuggingFace
```yaml
dataset_name: dataforearth/{domain}-{timestamp}
description: {dataset.description}
tags:
  - sustainability
  - {domain}
  - dataforearth
license: CC-BY-4.0
```

### Kaggle
```json
{
  "title": "{dataset.name}",
  "id": "dataforearth/{slug}",
  "licenses": [{"name": "CC-BY-4.0"}],
  "keywords": ["{domain}", "sustainability", "esg"]
}
```

### GitHub
```json
{
  "tag_name": "v{dataset.batch_number}",
  "name": "{dataset.name}",
  "body": "{dataset.description}\n\nDomain: {domain}\nQuality: {avg_confidence}",
  "assets": ["{dataset_file.download_url}"]
}
```

## Badge System

After external publish:
- Update `dataset_files` with `external_url`
- Display badges on /marketplace:
  - 🤗 HuggingFace
  - 📊 Kaggle
  - 🐙 GitHub
  - 🌐 Data.world

## Secrets Required

Admin must configure (via `/admin/integrations`):
- `HF_TOKEN`
- `KAGGLE_USERNAME`, `KAGGLE_KEY`
- `GITHUB_TOKEN`
- `DW_API_TOKEN`

Edge function checks secret availability before attempting publish.

## Error Handling

- API rate limit → retry after 1 hour
- Auth failure → notify admin, skip platform
- Upload failure → log, continue to next platform
- All successes/failures logged in `audit_logs`
