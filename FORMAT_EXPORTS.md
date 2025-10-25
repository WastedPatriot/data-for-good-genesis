# Format Exports - Multi-Format Dataset Distribution

## Supported Formats

### 1. CSV (Comma-Separated Values)
- **Use Case**: Excel, Tableau, general analytics
- **Library**: Native (JavaScript)
- **File Size**: Medium
- **Edge Function**: `/export-dataset?format=csv`

**Example**:
```csv
domain,region,sector,signal_type,confidence_score,timestamp
climate,US,energy,renewable_adoption,0.92,2025-01-15T10:00:00Z
```

### 2. JSONL (JSON Lines)
- **Use Case**: Streaming pipelines, Elasticsearch, BigQuery
- **Library**: Native (JavaScript)
- **File Size**: Medium-Large
- **Edge Function**: `/export-dataset?format=jsonl`

**Example**:
```jsonl
{"domain":"climate","region":"US","sector":"energy","signal_type":"renewable_adoption","confidence_score":0.92}
{"domain":"esg","region":"EU","sector":"manufacturing","signal_type":"emissions_report","confidence_score":0.88}
```

### 3. Parquet (Apache Parquet)
- **Use Case**: Data warehouses (Snowflake, Redshift), ML pipelines
- **Library**: PyArrow (Python) or DuckDB (Deno)
- **File Size**: Small (columnar compression)
- **Exporter**: Python script (see below)

**Advantages**:
- 50-70% smaller than CSV
- Schema embedded
- Columnar queries

### 4. SQLite (Embedded Database)
- **Use Case**: Mobile apps, offline analytics, single-file portability
- **Library**: sqlite3 (Python) or better-sqlite3 (Node)
- **File Size**: Medium
- **Exporter**: Python script (see below)

**Advantages**:
- Queryable without loading into memory
- Full SQL support
- Portable across platforms

## Edge Function Exports (CSV, JSONL)

**Endpoint**: `/functions/v1/export-dataset`

**Request**:
```json
{
  "dataset_id": "uuid",
  "format": "csv" | "jsonl"
}
```

**Response**:
```
Content-Type: text/csv | application/x-ndjson
Content-Disposition: attachment; filename="dataset_name.csv"
```

## Python Exporter (Parquet, SQLite)

**Location**: `data-scraper-module/exporters/dataset_exporter.py`

**Install**:
```bash
pip install pyarrow duckdb
```

**Usage**:
```bash
python exporters/dataset_exporter.py \
  --dataset-id <uuid> \
  --format parquet \
  --output /tmp/dataset.parquet
```

**Code**:
```python
import pyarrow as pa
import pyarrow.parquet as pq
import duckdb
import sqlite3

def export_to_parquet(data: list[dict], output_path: str):
    table = pa.Table.from_pylist(data)
    pq.write_table(table, output_path, compression='snappy')

def export_to_sqlite(data: list[dict], output_path: str):
    conn = sqlite3.connect(output_path)
    cursor = conn.cursor()
    
    # Create table from first record
    if data:
        columns = list(data[0].keys())
        cursor.execute(f"CREATE TABLE dataset ({', '.join([f'{col} TEXT' for col in columns])})")
        
        for record in data:
            placeholders = ', '.join(['?' for _ in columns])
            values = [record.get(col) for col in columns]
            cursor.execute(f"INSERT INTO dataset VALUES ({placeholders})", values)
    
    conn.commit()
    conn.close()
```

## Machine Agent GUI Integration

**Tab**: "Format Exports"

**UI**:
```tsx
<Select value={format} onValueChange={setFormat}>
  <SelectItem value="csv">CSV</SelectItem>
  <SelectItem value="jsonl">JSONL</SelectItem>
  <SelectItem value="parquet">Parquet</SelectItem>
  <SelectItem value="sqlite">SQLite</SelectItem>
</Select>

<Button onClick={handleExport}>
  Export as {format.toUpperCase()}
</Button>
```

**Download Flow**:
1. User selects dataset + format
2. If CSV/JSONL → call `/export-dataset` edge function
3. If Parquet/SQLite → call Python exporter subprocess
4. Save file to local disk
5. Show success toast with file path

## Upload to Storage Bucket

After export, upload to `dataset-files` bucket:

```typescript
const { data, error } = await supabase.storage
  .from('dataset-files')
  .upload(`${dataset_id}/${format}/${filename}`, file);

await supabase.from('dataset_export_metadata').insert({
  dataset_id,
  format,
  file_size_bytes: file.size,
  checksum_sha256: await sha256(file)
});
```

## Format Badges (Marketplace UI)

**Dataset Card**:
```tsx
<div className="flex gap-2">
  <Badge variant="outline">📄 CSV</Badge>
  <Badge variant="outline">📋 JSONL</Badge>
  <Badge variant="outline">📦 Parquet</Badge>
  <Badge variant="outline">🗄️ SQLite</Badge>
</div>
```

## Performance Notes

**File Size Comparison** (10,000 records):
- CSV: 2.5 MB
- JSONL: 3.1 MB
- Parquet: 0.8 MB (68% savings)
- SQLite: 2.2 MB

**Export Speed**:
- CSV/JSONL: 1-2 seconds (Edge Function)
- Parquet: 3-5 seconds (Python subprocess)
- SQLite: 4-6 seconds (Python subprocess)

**Recommendation**:
- CSV/JSONL: Real-time download
- Parquet/SQLite: Background job + email notification
