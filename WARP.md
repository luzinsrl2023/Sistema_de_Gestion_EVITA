# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

EVITA Sistema de Gestión is an ERP SaaS application specialized in managing cleaning supplies, general articles, and electrical products for EVITA Artículos de Limpieza business. The system supports dual database modes: LocalStorage for development/demo and Supabase PostgreSQL for production.

## Architecture

### Technology Stack
- **Frontend**: React 18 + Vite + TailwindCSS
- **Routing**: React Router DOM v6 with lazy loading
- **State Management**: React Query (@tanstack/react-query) + Zustand
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Headless UI + Lucide React icons
- **Database**: Dual mode - LocalStorage (dev) / Supabase PostgreSQL (prod)
- **Authentication**: Custom service with Supabase Auth integration
- **Deployment**: Netlify (configured via netlify.toml)

### Module Structure
The application follows a modular architecture pattern located in `frontend/src/modules/`:
- **dashboard**: Executive KPI dashboard
- **productos**: Product catalog management (limpieza, electricidad, articulos_generales)
- **clientes**: Customer management with payment status tracking
- **proveedores**: Supplier management
- **compras**: Purchase order management
- **facturas**: Sales invoice management with PDF generation
- **cobranzas**: Collections and accounts receivable management
- **reportes**: Business intelligence reports (sales, purchases, stock, dashboard)

### Data Layer Architecture
- **Services**: Located in `frontend/src/services/` - abstract database operations
- **Hooks**: Located in `frontend/src/hooks/` - React Query integration for data fetching
- **Contexts**: Authentication and Theme contexts for global state
- **Database Detection**: Automatic mode switching based on `VITE_USE_LOCAL_DB` environment variable

### Key Data Entities
- **Productos**: SKU, stock levels, pricing, categories (limpieza/electricidad/general)
- **Clientes**: Payment status tracking, account receivables
- **Proveedores**: Supplier contact information and terms
- **Facturas/Ordenes**: Document management with PDF export capabilities
- **Movimientos Inventario**: Stock movement tracking
- **Transacciones Caja**: Cash flow management
- **Contabilidad**: Double-entry accounting system

## Development Commands

### Initial Setup
```powershell
# Quick start with batch file (Windows)
.\iniciar_sistema.bat

# Or manual setup
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Daily Development
```powershell
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
npm run lint:fix

# Format code
npm run format

# Run tests
npm run test
npm run test:watch

# Analyze bundle
npm run build:analyze
```

### Database Management
```powershell
# Start Supabase locally (if using Supabase mode)
npm run supabase:start

# Deploy database changes to Supabase
npm run supabase:deploy

# For SQLite mode, run the batch file to initialize:
.\iniciar_sistema.bat
```

## Development Workflow

### Database Mode Configuration
The system automatically detects the database mode via environment variables:
- **Development**: Set `VITE_USE_LOCAL_DB=true` or leave undefined to use LocalStorage
- **Production**: Set `VITE_USE_LOCAL_DB=false` and configure Supabase credentials

### Authentication
- **Development credentials**: `admin@evita.com` / `evita123`
- **Production**: Uses Supabase Auth with full user management

### Testing New Features
1. Use LocalStorage mode for rapid prototyping
2. Test with demo credentials
3. Use React Query DevTools (available in development)
4. Verify PDF generation functionality for invoices

### Module Development Pattern
When adding new modules, follow the established pattern:
1. Create module directory in `frontend/src/modules/`
2. Implement List and Form components
3. Add service layer in `frontend/src/services/`
4. Create React Query hooks in `frontend/src/hooks/`
5. Add routes to `AppRoutes.jsx`
6. Update navigation in Layout component

## Key Business Logic

### Product Categories
- **limpieza**: Cleaning products (desinfectantes, detergentes)
- **electricidad**: Electrical items (bombillas LED, cables, enchufes)  
- **articulos_generales**: General merchandise (bolsas, papel higiénico)

### Financial Workflow
1. Purchase Orders → Update inventory → Generate accounting entries
2. Sales Invoices → Accounts Receivable → Payment tracking
3. Cash transactions → Automatic double-entry bookkeeping

### Stock Management
- Automatic low stock alerts
- Movement tracking for all inventory changes
- Integration with purchase orders and sales

## File Organization

### Important Files
- `frontend/src/App.jsx`: Main application with routing and providers
- `frontend/src/modules/routes/AppRoutes.jsx`: Route definitions with lazy loading
- `frontend/src/contexts/AuthContext.jsx`: Authentication state management  
- `frontend/src/lib/supabaseClient.js`: Database client configuration
- `sqlite/create_tables.sql`: Complete database schema
- `iniciar_sistema.bat`: Quick setup script for Windows

### Configuration Files
- `frontend/package.json`: Dependencies and scripts
- `frontend/vite.config.js`: Build configuration with chunk splitting
- `frontend/.env.example`: Environment variables template
- `netlify.toml`: Deployment configuration

## Code Patterns

### Component Structure
Components follow a consistent pattern:
- Form components use React Hook Form + Zod validation
- List components use React Query for data fetching
- All components use TailwindCSS with dark theme support
- PDF export functionality available for invoices and reports

### Data Fetching
```javascript
// Standard hook pattern
const { data, error, isLoading, saveItem, removeItem } = useEntityName()
```

### Error Handling  
- React Query handles data fetching errors
- Form validation through Zod schemas
- User-friendly error notifications via notification system

## Deployment

### Development
The system runs locally with hot reload on `http://localhost:5173`

### Production
- Automatically deploys to Netlify from the `main` branch
- Configure Supabase environment variables in Netlify
- Database migrations handled through Supabase dashboard

### Environment Variables
- `VITE_USE_LOCAL_DB`: Toggle database mode
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

## Specialized Features

### PDF Generation
- Invoice PDF generation using jsPDF + autotable
- Export functionality for reports and documents
- Spanish localization for all documents

### Excel Integration
- Export capabilities for all data tables
- Import functionality for bulk operations
- XLSX library integration

### Multi-tenancy Ready
- User-based data isolation
- Role-based access control framework
- Scalable for multiple companies

### Accounting Integration
- Double-entry bookkeeping system
- Automatic journal entries for transactions
- Balance sheet and P&L reporting capabilities