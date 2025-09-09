# LiveX

## Architecture

![Block Diagram](./diagram.jpg)

## Prerequisites

- Node.js 18+ installed
- API key for Gemini 2.0 Model

## Getting Started

1. Clone the repository
```bash
git clone git@github.com:Pawardevelops/LiveX.git
cd LiveX
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```
Add your Gemini API key to `.env.local`:
```
GEMINI_API_KEY=your_api_key_here
```

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.


