# Contributing to DataForEarth Machine Agent

Thank you for your interest in contributing!

## Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/yourusername/dataforearth-agent.git
   cd dataforearth-agent/machine-agent-gui
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Running Locally

```bash
npm run dev
```

This starts:
- React dev server on http://localhost:3001
- Electron in development mode with hot reload

## Code Style

- Use TypeScript for all new code
- Follow existing component patterns
- Add JSDoc comments for complex functions
- Use semantic variable names
- Keep components focused and small

## Component Structure

```typescript
import React, { useState, useEffect } from 'react';

interface MyComponentProps {
  config: any;
}

export default function MyComponent({ config }: MyComponentProps) {
  const [state, setState] = useState<Type>(initialValue);

  useEffect(() => {
    // Setup
    return () => {
      // Cleanup
    };
  }, [dependencies]);

  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

## Adding New Features

### New Tab
1. Create component in `renderer/src/components/`
2. Import in `App.tsx`
3. Add to tabs array
4. Add case in render switch

### New IPC Handler
1. Add handler in `electron/main.ts`
2. Expose in `electron/preload.ts`
3. Add type in `electron/index.d.ts`
4. Use in component

### New Edge Function Integration
1. Add function in main process
2. Implement HMAC if needed
3. Add error handling
4. Add logging
5. Expose via IPC

## Testing

### Manual Testing
1. Test all tabs
2. Test configuration save/load
3. Test automation start/stop
4. Test edge function calls
5. Test error scenarios

### Build Testing
```bash
npm run package:linux
./dist-package/DataForEarth-Agent-*.AppImage
```

## Commit Guidelines

- Use present tense: "Add feature" not "Added feature"
- Use imperative mood: "Move cursor to..." not "Moves cursor to..."
- Limit first line to 72 characters
- Reference issues: "Fix #123: Description"

### Commit Types
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc)
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build/tooling changes

## Pull Request Process

1. Update documentation
2. Test thoroughly
3. Update CHANGELOG.md
4. Submit PR with clear description
5. Link related issues

## Questions?

Open an issue or contact the DataForEarth team.
