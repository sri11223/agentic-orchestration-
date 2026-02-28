# Synapse Agentic Flow

A modern React-based workflow builder using ReactFlow and Shadcn UI components.

## Features

- Visual workflow builder with drag-and-drop interface
- Modern UI components with Tailwind CSS
- TypeScript support
- Vite for fast development

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

### API Configuration
By default the app expects the backend at `http://localhost:3000`. Override with:
```bash
echo "VITE_API_BASE_URL=http://localhost:3000" > .env.local
```

3. Build for production:
```bash
npm run build
```

## Project Structure

- `src/components/workflow/` - Workflow-specific components
- `src/pages/` - Page components
- `src/store/` - State management
- `src/data/` - Static data and configurations
