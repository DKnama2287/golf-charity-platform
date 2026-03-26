# ⛳ Golf Charity Platform

A modern web application for managing golf-themed charity fundraising draws and prize distributions.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB Atlas account
- Stripe account (for payments)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/golf-charity-platform.git
cd golf-charity-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
# Copy the example file
cp .env.example .env.local

# Edit and fill in your values
nano .env.local
```

4. **Required environment variables** (see `.env.example` for details):
- `MONGODB_URI` - MongoDB Atlas connection string
- `STRIPE_SECRET_KEY` - Stripe API key
- `JWT_SECRET` - Random secret for authentication
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` - Admin credentials

5. **Run development server**
```bash
npm run dev
```

Visit `http://localhost:3000`

## 📚 Setup Guides

### MongoDB Atlas Setup
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user
4. Click "Connect" and copy the connection string
5. Set it as `MONGODB_URI` in `.env.local`

### Stripe Setup
1. Sign up at https://stripe.com
2. Go to Products → Add Product
3. Create two prices: monthly ($19) and yearly ($149)
4. Copy the Price IDs and set:
   - `STRIPE_MONTHLY_PRICE_ID`
   - `STRIPE_YEARLY_PRICE_ID`
5. Copy API keys and set them in `.env.local`

### Email Setup (Optional)
For development, emails are logged to console. For production:

**Using Gmail:**
1. Enable 2-Factor Authentication on Gmail
2. Create an "App Password" (Google Account > Security > App passwords)
3. Set in `.env.local`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM_EMAIL=noreply@birdiefund.com
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard
│   ├── dashboard/         # User dashboard
│   ├── api/v1/            # API routes (RESTful v1)
│   └── ...pages
├── lib/
│   ├── models/            # MongoDB models
│   ├── services/          # Business logic
│   ├── auth/              # Authentication
│   └── types.ts           # TypeScript definitions
└── components/            # React components
```

## 🏗️ Database Models

- **User** - Platform users with subscriptions
- **Charity** - Partner charities
- **Draw** - Monthly prize draws
- **Score** - Golf scores
- **Winning** - Prize winners
- **WinnerVerification** - Verification of winning claims
- **Donation** - Charity donations
- **PrizePoolConfig** - Prize pool configuration

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start dev server

# Build & Deploy
npm run build           # Build for production
npm start              # Start production server

# Database
npm run seed           # Seed initial data (if available)

# Testing
npm test               # Run test suite
```

## 🔐 Security

- Passwords hashed with bcrypt
- JWT-based authentication (7-day expiry)
- HTTPOnly cookies for sessions
- HTTPS enforced in production
- Environment variables never committed
- Rate limiting enabled (Phase 1+)

## 📊 API Documentation

### Base URL
- Development: `http://localhost:3000/api/v1`
- Production: `https://yourdomain.com/api/v1`

### Authentication
Include JWT token in requests:
```bash
Authorization: Bearer {token}
```

### Main Endpoints
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `GET /charities` - List charities
- `GET /draws` - List draws
- `POST /draws/simulate` - Simulate a draw
- `POST /draws/{id}/publish` - Publish official draw
- `GET /admin/users` - Admin: List users
- `GET /admin/reports/summary` - Admin: Platform summary

See full API documentation in code comments or generate OpenAPI docs.

## 🚀 Deployment

### Deploy to Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set production environment variables in Vercel dashboard
```

### Deploy to Other Platforms
The app runs on any Node.js hosting:
- Heroku
- Railway
- Render
- AWS Lambda
- Google Cloud Run

## 📈 Scalability Roadmap

**Phase 1** (2 weeks) - Pagination, Mobile Auth, Rate Limiting
- Supports 100K+ users
- Series A ready

**Phase 2** (4 weeks) - Multi-Organization, Teams
- Supports 1M+ users
- Enterprise ready

**Phase 3** (3 weeks) - Campaign Management
- Full SaaS platform
- Global expansion

See [SCALABILITY_AUDIT.md](./SCALABILITY_AUDIT.md) for details.

## 🐛 Debugging

### Enable Debug Logging
```bash
DEBUG=* npm run dev
```

### Check Database
```bash
# In MongoDB Atlas UI:
1. Go to your cluster
2. Click "Collections"
3. View data in each collection
```

### API Testing
Use tools like:
- Postman
- Insomnia
- Thunder Client (VS Code)

## 📝 Environment Variables

**Development (.env.local)**
```
NODE_ENV=development
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
STRIPE_SECRET_KEY=sk_test_...
JWT_SECRET=random-secret-here
ADMIN_EMAIL=xxxxxxxxxx
ADMIN_PASSWORD=xxxxxx
```

**Production**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
JWT_SECRET=change-this-in-production
# Email config (if using)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📄 License

MIT License - see LICENSE file

## 📞 Support

For issues and questions:
- GitHub Issues: [github.com/yourusername/golf-charity-platform/issues](https://github.com)
- Email: support@birdiefund.com

## 🙏 Acknowledgments

Built with:
- Next.js 16
- React 19
- TypeScript
- MongoDB
- Stripe
- Tailwind CSS

---

**Happy golfing! ⛳**
