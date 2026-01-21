# {{NAME_PASCAL}}

Full-stack monorepo with microservices and micro-frontends.

## Quick Start

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Create new backend microservice
npm run create backend user-service

# Create new frontend MFE
npm run create frontend dashboard

# AI agent operations
npm run agent:init .
npm run agent:enhance services/user-service
npm run agent:fix apps/dashboard
```

## Project Structure

```
{{NAME_KEBAB}}/
├── apps/              # Frontend MFEs
│   ├── shell/         # Main shell application
│   └── */             # Feature MFEs
├── services/          # Backend microservices
│   ├── api/           # API gateway
│   └── */             # Feature services
├── packages/          # Shared packages
│   ├── ui/            # Shared UI components
│   ├── config/        # Shared configuration
│   └── types/         # Shared types
├── .ai/               # AI agent configurations
├── .generator/        # Code generator
└── templates/         # Project templates
```

## AI Agent Integration

This project is configured for AI-assisted development:

- **Auto-enhancement**: Agents can improve code quality
- **Auto-fixing**: Agents can detect and fix issues
- **Code generation**: Generate new features from descriptions

## License

MIT
