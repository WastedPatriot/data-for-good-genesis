# Architecture Documentation

## Technology Stack

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Chart.js**: Revenue analytics visualization
- **date-fns**: Date formatting

### Backend (Electron Main Process)
- **Electron**: Desktop app framework
- **Node.js**: JavaScript runtime
- **Crypto**: HMAC signature generation
- **FS**: File system operations

### Build Tools
- **Vite**: React bundler
- **electron-builder**: AppImage packaging
- **TypeScript Compiler**: Type checking

## Project Structure

```
machine-agent-gui/
├── electron/              # Main process
│   ├── main.ts           # Electron entry point
│   ├── preload.ts        # Bridge between main/renderer
│   └── index.d.ts        # TypeScript definitions
├── renderer/             # React frontend
│   ├── src/
│   │   ├── components/   # React components (6 tabs)
│   │   ├── App.tsx       # Main app component
│   │   ├── main.tsx      # React entry point
│   │   └── index.css     # Global styles
│   └── index.html        # HTML template
├── dist/                 # Build output
│   ├── electron/         # Compiled main process
│   └── renderer/         # Compiled React app
├── dist-package/         # Final AppImage
├── logs/                 # Application logs
├── package.json          # Dependencies
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript config (renderer)
└── tsconfig.electron.json # TypeScript config (main)
```

## Process Architecture

### Main Process (Electron)
- Manages application lifecycle
- Handles IPC communication
- Performs backend operations:
  - HTTP requests to edge functions
  - File system operations
  - Configuration management
  - Log writing
  - Automation scheduling

### Renderer Process (React)
- Displays UI
- Handles user interactions
- Communicates with main via IPC
- Visualizes data with charts

### IPC Channels

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `load-config` | Renderer → Main → Renderer | Load configuration |
| `save-config` | Renderer → Main → Renderer | Save configuration |
| `fetch-processed-records` | Renderer → Main → Renderer | Get pending records |
| `publish-dataset` | Renderer → Main → Renderer | Publish new dataset |
| `generate-badge-codes` | Renderer → Main → Renderer | Create badge codes |
| `check-dataset-status` | Renderer → Main → Renderer | Query dataset info |
| `query-supabase` | Renderer → Main → Renderer | Direct DB queries |
| `read-logs` | Renderer → Main → Renderer | Fetch log file |
| `start-automation` | Renderer → Main → Renderer | Enable automation |
| `stop-automation` | Renderer → Main → Renderer | Disable automation |
| `automation-tick` | Main → Renderer | Automation timer event |

## Data Flow

### Configuration Management
```
Settings UI → saveConfig IPC → Main Process → config.json
config.json → Main Process → loadConfig IPC → Settings UI
```

### Dataset Publishing
```
User clicks "Publish Now"
  ↓
Automation Tab → publishDataset IPC
  ↓
Main Process:
  - Generate HMAC signature
  - POST to /ingest-dataset
  - Log operation
  ↓
Response → Renderer → UI Update
```

### Automation Loop
```
Start Automation
  ↓
setInterval (config.POLL_INTERVAL_MINUTES)
  ↓
Send automation-tick event
  ↓
Renderer receives tick → Fetch records
  ↓
If threshold met → Publish dataset
  ↓
Update UI → Log results
```

## HMAC Signature Implementation

### Algorithm
```typescript
timestamp = floor(now / 1000)
message = `${timestamp}.${JSON.stringify(payload)}`
signature = hmac_sha256(message, INGEST_SECRET)
header = `t=${timestamp},v1=${signature}`
```

### Verification (Server-side)
```typescript
// Extract timestamp and signature from header
// Regenerate signature with same payload
// Compare signatures (constant-time comparison)
// Verify timestamp within 5-minute window
```

## Security Considerations

1. **Secrets Storage**: Configuration stored in user data directory with OS-level permissions
2. **HMAC Signatures**: All ingest requests signed to prevent tampering
3. **No Hardcoded Credentials**: All secrets loaded from config
4. **Timestamp Validation**: 5-minute tolerance prevents replay attacks

## Edge Function Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/functions/v1/data-harvest-api` | POST | Fetch processed records | INGEST_SECRET |
| `/functions/v1/ingest-dataset` | POST | Publish new dataset | HMAC signature |
| `/functions/v1/create-badge-codes` | POST | Generate codes | INGEST_SECRET |
| `/functions/v1/dataset-status` | GET | Query dataset info | INGEST_SECRET |
| `/rest/v1/*` | GET | Direct Supabase queries | API key |

## Database Schema (Relevant Tables)

### datasets
- `id`: UUID (primary key)
- `name`: Text
- `category`: Text
- `price`: Numeric
- `active`: Boolean
- `created_at`: Timestamp

### purchases
- `id`: UUID (primary key)
- `dataset_id`: UUID (foreign key)
- `user_id`: UUID
- `amount_paid`: Numeric
- `created_at`: Timestamp

### badge_codes
- `id`: UUID (primary key)
- `code`: Text (unique)
- `dataset_id`: UUID (foreign key)
- `claimed`: Boolean
- `created_at`: Timestamp

### data_processing_queue
- `id`: UUID (primary key)
- `submission_id`: UUID
- `processing_status`: Text
- `processed_data`: JSONB
- `quality_score`: Numeric
- `created_at`: Timestamp

## Logging Strategy

### Log Levels
- **INFO**: Normal operations (fetches, publishes)
- **WARNING**: Non-critical issues (low badge inventory)
- **ERROR**: Failed operations (API errors, connection issues)

### Log Format
```
[ISO8601 Timestamp] [LEVEL] Message
```

### Log Rotation
- No automatic rotation (manual clear via UI)
- User can clear logs from Logs tab
- Stored in user data directory

## Build Process

### Development
```bash
npm run dev
# Runs concurrently:
# - vite (React dev server on :3001)
# - tsc + electron (main process)
```

### Production
```bash
npm run build
# 1. vite build (React → dist/renderer)
# 2. tsc (TypeScript → dist/electron)
# 3. electron-builder (Package → AppImage)
```

### Output
- **Linux**: AppImage (single executable file)
- **Size**: ~150-200 MB (includes Electron runtime)

## Systemd Integration

### Service Configuration
- **Type**: simple
- **User**: ubuntu (or configured user)
- **Restart**: always (with 10s delay)
- **Security**: NoNewPrivileges, PrivateTmp

### Lifecycle
- Enabled: Auto-start on boot
- Managed: systemctl commands
- Logs: journalctl integration

## Performance Considerations

1. **Polling Interval**: Configurable (1-1440 minutes) to balance responsiveness vs API load
2. **Dashboard Refresh**: 30-second intervals for real-time stats
3. **Log Refresh**: 5-second intervals (optional auto-refresh)
4. **Chart Rendering**: Canvas-based for smooth 60fps rendering
5. **Table Pagination**: Limits display to prevent UI lag

## Extensibility

### Adding New Tabs
1. Create component in `renderer/src/components/`
2. Add route in `App.tsx`
3. Add navigation button

### Adding New IPC Channels
1. Define handler in `electron/main.ts`
2. Expose in `electron/preload.ts`
3. Add TypeScript definition in `electron/index.d.ts`
4. Use in React components

### Adding New Edge Functions
1. Implement function call in main process
2. Add HMAC signature if required
3. Expose via IPC
4. Add UI controls

## Deployment Checklist

- [ ] Configure Supabase credentials
- [ ] Test connection to edge functions
- [ ] Set reasonable automation thresholds
- [ ] Generate initial badge code inventory
- [ ] Test email notifications
- [ ] Enable systemd service
- [ ] Monitor logs for errors
- [ ] Verify revenue tracking
- [ ] Test manual publish
- [ ] Test automated publish
