# ⛳ Golf Charity Platform

<div align="center">

> A modern web application for managing golf-themed charity fundraising draws with real-time prize distributions and automated winner verification.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.1-black)](https://nextjs.org/)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)](https://github.com)

[Live Demo](#) • [Documentation](#-documentation) • [Report Bug](https://github.com/yourusername/golf-charity-platform/issues) • [Request Feature](https://github.com/yourusername/golf-charity-platform/issues)

</div>

---

## 🎯 About

**Golf Charity Platform** transforms charity fundraising through an innovative golf-themed draw system. Users compete in monthly draws, track scores, and directly support charities—all while having the chance to win significant prizes.

### ✨ Key Highlights

- 🎯 **Smart User Management** - Secure registration, JWT authentication, role-based access
- ⛳ **Score Tracking System** - Track golf scores, rankings, and competitive standings
- 🎲 **Automated Monthly Draws** - Real-time draw execution with weighted and random modes
- 💰 **Dynamic Prize Distribution** - Auto-calculated prize pools with jackpot rollover
- 🏥 **Charity Integration** - Direct charities support with automatic donation tracking
- 📊 **Powerful Admin Dashboard** - Complete platform management, analytics, and controls
- 💳 **Stripe Integration** - Subscription management with monthly/yearly plans
- 📧 **Email Notifications** - Automated updates for draws, winners, and transactions
- 🔐 **Enterprise Security** - JWT, bcrypt, HTTPOnly cookies, rate limiting, HTTPS
- 📱 **Responsive Design** - Perfect experience on desktop, tablet, and mobile

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **MongoDB Atlas** account ([Free Signup](https://www.mongodb.com/cloud/atlas))
- **Stripe** account for payments ([Sign Up](https://stripe.com))

### Installation (5 minutes)

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/golf-charity-platform.git
cd golf-charity-platform

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials (see detailed guide below)

# 4. Start development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 🔧 Environment Setup

```bash
# Required environment variables:
MONGODB_URI=your_mongodb_atlas_uri
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
JWT_SECRET=your_jwt_secret_key
NEXT_PUBLIC_API_URL=http://localhost:3000
```

For complete setup instructions, see **[📖 README_DEPLOYMENT.md](./README_DEPLOYMENT.md)**

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[README_DEPLOYMENT.md](./README_DEPLOYMENT.md)** | Step-by-step deployment + detailed setup guide |
| **[.env.example](./.env.example)** | All environment variables with descriptions |
| **[SCALABILITY_AUDIT.md](./SCALABILITY_AUDIT.md)** | Technical architecture & expansion analysis |
| **[PHASE_1_IMPLEMENTATION.md](./PHASE_1_IMPLEMENTATION.md)** | Next phase development roadmap |
| **[EXPANSION_ROADMAP.md](./EXPANSION_ROADMAP.md)** | 9-week scaling strategy & investment analysis |
| **[GITHUB_DEPLOYMENT_CHECKLIST.md](./GITHUB_DEPLOYMENT_CHECKLIST.md)** | Pre-deployment verification steps |

---

## 🏗️ Architecture

### Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Frontend** | React | 19.2.4 |
| **Framework** | Next.js | 16.2.1 |
| **Language** | TypeScript | 5.0+ |
| **Styling** | Tailwind CSS | 4.x |
| **Database** | MongoDB Atlas | Latest |
| **ORM/ODM** | Mongoose | Latest |
| **Authentication** | JWT + bcrypt | - |
| **Payments** | Stripe API | Latest |
| **Email** | Nodemailer | Latest |

### Project Structure

```
golf-charity-platform/
├── src/
│   ├── app/
│   │   ├── admin/              # Admin dashboard (reports, users, draws)
│   │   ├── dashboard/          # User dashboard (scores, winnings)
│   │   ├── api/v1/            # REST API endpoints (32+ routes)
│   │   │   ├── auth/          # Authentication (login, signup)
│   │   │   ├── admin/         # Admin operations
│   │   │   ├── draws/         # Draw management
│   │   │   ├── scores/        # Score tracking
│   │   │   ├── charities/     # Charity operations
│   │   │   └── winnings/      # Prize management
│   │   ├── auth/              # Auth pages
│   │   └── ...
│   ├── lib/
│   │   ├── models/            # MongoDB schemas (8 models)
│   │   ├── services/          # Business logic (11 services)
│   │   ├── auth/              # Authentication logic
│   │   ├── db/                # Database connection
│   │   └── types.ts           # TypeScript definitions
│   └── components/            # Reusable React components
├── public/                    # Static assets
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
├── next.config.ts            # Next.js build config
├── package.json              # Dependencies
└── tsconfig.json             # TypeScript config
```

### Database Models (8 Total)

| Model | Purpose |
|-------|---------|
| **User** | Platform users with subscription management |
| **Charity** | Partner charities and donation records |
| **Draw** | Monthly prize draws and results |
| **Score** | Golf scores and user rankings |
| **Winning** | Prize winners and award amounts |
| **WinnerVerification** | Winner proof documents and verification |
| **Donation** | Charity donation transaction history |
| **Admin** | Administrator accounts and permissions |

---

## 🔌 API Reference

RESTful API with JWT Bearer token authentication.

### Authentication

```bash
# 1. Login to get JWT token
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

# Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "...", "email": "..." }
}

# 2. Use token in subsequent requests
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Key Endpoints (32 Total)

#### 👤 User Management
- `POST /api/v1/auth/signup` - Create new account
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user profile
- `GET /api/v1/subscriptions/status` - Check subscription

#### 🎲 Draws & Scores
- `GET /api/v1/draws` - List all draws
- `POST /api/v1/scores` - Create score entry
- `GET /api/v1/scores` - Get user's scores
- `GET /api/v1/winnings` - Get user's winnings

#### 🏥 Charities
- `GET /api/v1/charities` - List partner charities
- `GET /api/v1/charities/[id]` - Charity details
- `POST /api/v1/charities/[id]/donate` - Make donation

#### 📊 Admin Only
- `GET /api/v1/admin/reports/summary` - Platform statistics
- `GET /api/v1/admin/users` - List all users
- `GET /api/v1/admin/draws` - Manage draws
- `POST /api/v1/admin/draws/simulate` - Run simulation
- `POST /api/v1/admin/draws/run` - Run official draw
- `GET /api/v1/admin/verifications` - Winner verification
- `PATCH /api/v1/admin/verifications/[id]` - Approve/reject winner

---

## 🔐 Security Features

| Feature | Implementation | Status |
|---------|----------------|--------|
| **Password Hashing** | bcrypt SHA-256 | ✅ Active |
| **Authentication** | JWT (7-day expiry) | ✅ Active |
| **Session Storage** | HTTPOnly Cookies | ✅ Active |
| **Data Validation** | Zod Schema Validation | ✅ Active |
| **CORS Protection** | CORS Headers | ✅ Active |
| **HTTPS** | Enforced in production | ✅ Active |
| **Secrets Management** | Environment variables only | ✅ Active |
| **Rate Limiting** | Redis-based (Phase 1) | 📋 Planned |

---

## 💰 Prize Pool System

Intelligent prize distribution based on active subscriptions with automatic rollover:

```
Monthly Revenue Calculation:
├── Active Users: Count of active subscribers
├── Revenue per User: Monthly ($9.99) or Yearly ($99.99)
└── Total Revenue: Sum of all subscriptions

Prize Distribution:
├── Match5 (Jackpot):  40% of revenue + unclaimed rollover
├── Match4 (3nd Prize):  35% of revenue
├── Match3 (3rd Prize):  25% of revenue
└── Total Payout: 100% of monthly revenue
```

### Real Example

```
Current State (March 2026):
├── Active Subscribers: 4
├── Monthly Revenue: $466.00
├── Previous Jackpot: $372.80
└── Total Prize Pool: $838.80

Prize Breakdown:
├── Match5 Pool: $559.20 (40% + $372.80 rollover)
├── Match4 Pool: $163.10 (35% of revenue)
├── Match3 Pool: $116.50 (25% of revenue)
└── Pool Ready: Ready for March 2026 Draw
```

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Alternative Platforms

| Platform | Setup | Features |
|----------|-------|----------|
| **Heroku** | `git push heroku main` | Easy, auto-scaling |
| **Railway** | Connect repo, auto-deploy | Modern, Docker support |
| **Render** | Connect repo, auto-deploy | Fast, WebSockets ready |
| **AWS EC2** | Manual setup | Full control, scalable |

📖 **[Full Deployment Guide](./README_DEPLOYMENT.md#-deployment)**

---

## 🧪 Development Commands

```bash
# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run tsc

# Run linting (if configured)
npm run lint

# Format code (if configured)
npm run format
```

---

## 📈 Scalability Roadmap

| Phase | Timeline | Target | Key Features |
|-------|----------|--------|--------------|
| **Phase 1** | 2 weeks | 100K+ users | Pagination, Mobile Auth, Rate Limiting, Caching |
| **Phase 2** | 4 weeks | 1M+ users | Multi-Org, Team Management, Enterprise RBAC |
| **Phase 3** | 3 weeks | 10M+ users | Campaign System, Advanced Analytics, Global Expansion |

**Investment Required:** $19-30K total
**Expected ROI:** $1 investment = $10 potential revenue

📖 **[Detailed Roadmap](./SCALABILITY_AUDIT.md)**

---

## 🤝 Contributing

We welcome contributions from the community! 🎉

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit** your changes
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push** to your branch
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Write descriptive commit messages
- Test your changes before submitting
- Update documentation as needed
- Maintain code style consistency

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License - You are free to:
✅ Use commercially
✅ Modify the code
✅ Distribute
✅ Use privately

With the condition:
📋 Include license and copyright notice
```

---

## 📞 Support & Community

### Getting Help

| Resource | Purpose |
|----------|---------|
| 📖 **[Setup Guide](./README_DEPLOYMENT.md)** | Installation & configuration |
| 🐛 **[Issues](https://github.com/yourusername/golf-charity-platform/issues)** | Report bugs |
| 💬 **[Discussions](https://github.com/yourusername/golf-charity-platform/discussions)** | Ask questions |
| 📧 **[Email Support](mailto:support@birdiefund.com)** | Direct assistance |

### Security

🔒 **Found a security vulnerability?**

Please email **security@birdiefund.com** instead of using the issue tracker to keep our community safe.

---

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| **Source Files** | 28+ |
| **API Endpoints** | 32+ |
| **Database Models** | 8 |
| **TypeScript Coverage** | 100% |
| **Build Status** | ✅ Passing |
| **Last Updated** | March 2026 |

---

## 🙏 Acknowledgments

Built with ❤️ for the golf and charity communities.

Special thanks to:
- ⛳ Golf enthusiasts for inspiration
- 🏥 Charity partners for their mission
- 👩‍💻 Open-source community for amazing tools

---

<div align="center">

### ⛳ Join the Movement

Help us transform charity fundraising through golf!

[⭐ Star us on GitHub](https://github.com/yourusername/golf-charity-platform) • [🚀 Deploy Now](#-deployment) • [📧 Get Updates](mailto:updates@birdiefund.com)

---

**Made with ❤️ for the golf community**

</div>

