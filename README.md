# Invoice Management System

AI-powered invoice extraction and management platform built with Next.js, PostgreSQL, and Google Gemini AI.

## Features

- 🤖 AI-powered invoice data extraction from PDFs and images
- 📊 Analytics dashboard with supplier and article insights
- 💱 Multi-currency support with exchange rate management
- 📋 Comprehensive supplier management
- 🔔 Payment reminders and notifications
- 💬 AI chat assistant for invoice queries
- 📈 Price trend analysis and supplier comparisons

## Setup

### 1. Database Setup

Start PostgreSQL with Docker:

```bash
docker-compose up -d
```

This will start PostgreSQL on port 5434 with:
- Database: `invoicedb`
- User: `invoicer`
- Password: `invoicer_pw`

### 2. Initialize Database

Run the SQL scripts to create tables and seed initial data:

```bash
# Connect to the database and run the schema
psql postgresql://invoicer:invoicer_pw@localhost:5434/invoicedb -f scripts/01-create-database-schema.sql
psql postgresql://invoicer:invoicer_pw@localhost:5434/invoicedb -f scripts/02-seed-initial-data.sql
```

### 3. Environment Variables

Copy `.env.local` and add your API keys:

```bash
cp .env.local.example .env.local
```

Add your Google/Gemini API key:
```
GOOGLE_API_KEY=your_actual_api_key_here
```

### 4. Python Dependencies

Install Python dependencies for invoice extraction:

```bash
npm run py:setup
```

### 5. Start Development Server

```bash
npm install
npm run dev
```

## Usage

1. **Upload Invoices**: Go to `/upload` to upload PDF or image files
2. **Manage Suppliers**: Add and manage supplier information
3. **View Analytics**: Analyze spending patterns and supplier performance
4. **Set Exchange Rates**: Configure currency conversion rates in settings
5. **Chat Assistant**: Ask questions about your invoices and payments

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL 17
- **AI**: Google Gemini for invoice extraction
- **UI**: shadcn/ui components
- **Charts**: Recharts

## API Endpoints

- `GET /api/invoices` - List invoices with filters
- `POST /api/invoices` - Create new invoice
- `POST /api/invoices/extract` - Extract data from uploaded files
- `GET /api/suppliers` - List suppliers
- `POST /api/suppliers` - Create new supplier
- `GET /api/analytics/*` - Various analytics endpoints
- `POST /api/chat` - Chat with AI assistant

## Database Schema

The system uses PostgreSQL with the following main tables:
- `suppliers` - Supplier information
- `invoices` - Invoice records
- `invoice_items` - Line items for invoices
- `currencies` - Supported currencies
- `exchange_rates` - Currency conversion rates
- `payment_reminders` - Payment reminder system