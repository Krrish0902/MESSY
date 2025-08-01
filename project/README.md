# MESSY - Mess Management SaaS Platform

A comprehensive mobile application for connecting customers with community meal providers. Built with React Native, Expo, and Supabase.

## 🚀 Features

### For Customers
- **Location-based Mess Discovery**: Find nearby messes using GPS
- **Menu Browsing**: View detailed menus with photos and descriptions
- **Subscription Management**: Daily, weekly, and monthly meal plans
- **Mess Cut System**: Skip meals with 12-hour advance notice
- **Delivery Tracking**: Real-time tracking and history
- **Rating & Reviews**: Rate messes and leave feedback

### For Mess Owners
- **Mess Profile Management**: Complete business profile setup
- **Menu Management**: Daily menu creation and editing
- **Subscription Oversight**: Manage active subscriptions
- **Delivery Management**: Track and confirm deliveries
- **Analytics Dashboard**: Customer insights and revenue tracking
- **Real-time Notifications**: Instant mess cut alerts

### For Admins
- **Mess Approval Workflow**: Review and approve new messes
- **User Management**: Monitor and manage all users
- **System Analytics**: Comprehensive platform reports
- **Issue Resolution**: Handle disputes and system issues

## 🛠 Tech Stack

- **Frontend**: React Native with Expo SDK 52+
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Navigation**: Expo Router with tab-based navigation
- **UI Components**: React Native Paper
- **State Management**: React Context API
- **Notifications**: Expo Notifications
- **Location Services**: Expo Location
- **Date/Time**: Luxon
- **Storage**: AsyncStorage

## 📋 Prerequisites

- Node.js 18+ 
- Expo CLI
- Supabase account
- iOS Simulator / Android Emulator (for testing)

## 🔧 Installation & Setup

### 1. Clone and Install
```bash
git clone <repository-url>
cd messy-app
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Update `.env` with your Supabase credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the database migrations in order:
   - `supabase/migrations/create_users_table.sql`
   - `supabase/migrations/create_messes_table.sql`
   - `supabase/migrations/create_menus_table.sql`
   - `supabase/migrations/create_subscriptions_table.sql`
   - `supabase/migrations/create_deliveries_table.sql`
   - `supabase/migrations/create_ratings_notifications_tables.sql`

3. Configure RLS policies (included in migration files)

### 4. Run the Application
```bash
npm run dev
```

## 📱 App Structure

```
app/
├── (tabs)/                 # Tab navigation screens
│   ├── home.tsx           # Customer dashboard
│   ├── discover.tsx       # Mess discovery
│   ├── subscriptions.tsx  # Subscription management
│   └── profile.tsx        # User profile
├── _layout.tsx            # Root layout with auth
└── +not-found.tsx         # 404 screen

components/
├── common/                # Reusable components
├── auth/                  # Authentication screens
└── customer/              # Customer-specific components

contexts/
├── AuthContext.tsx        # Authentication state
└── ThemeContext.tsx      # Theme management

services/
├── NotificationService.ts # Push notifications
├── LocationService.ts     # GPS and location
└── MessCutService.ts     # Mess cut logic

lib/
└── supabase.ts           # Supabase client

types/
└── database.ts           # TypeScript types
```

## 🔐 Authentication & Authorization

The app implements role-based access control with three user types:

- **Customer**: Browse messes, manage subscriptions, skip meals
- **Mess Owner**: Manage mess profile, menus, and deliveries  
- **Admin**: System-wide management and oversight

### Authentication Flow
1. Email/password signup with role selection
2. Profile creation in `users` table
3. Role-based dashboard redirection
4. JWT token management via Supabase Auth

## 📊 Database Schema

### Core Tables
- `users` - User profiles with role-based access
- `messes` - Mess information and status
- `menus` - Daily menus by meal type
- `subscriptions` - Customer meal plans
- `deliveries` - Individual meal deliveries
- `ratings` - Customer feedback and ratings
- `notifications` - System notifications

### Key Relationships
- Users → Messes (one-to-many)
- Messes → Menus (one-to-many)
- Users → Subscriptions (many-to-many via messes)
- Subscriptions → Deliveries (one-to-many)

## 🔔 Notification System

### Types
- **Mess Cut Notifications**: Real-time alerts to mess owners
- **Delivery Updates**: Status changes and confirmations
- **Subscription Events**: Plan activations and renewals
- **System Alerts**: Admin announcements

### Implementation
- Expo Notifications for push notifications
- Supabase real-time subscriptions for live updates
- Database-stored notification history

## 📍 Location Features

### Customer Location
- GPS-based mess discovery
- Distance calculation and sorting
- Delivery address management

### Mess Location
- Service area radius configuration
- Address validation and geocoding
- Delivery feasibility checking

## ⏰ Mess Cut System

### Business Rules
- 12-hour advance notice requirement
- Automatic validation using Luxon
- Real-time notifications to mess owners
- Subscription and delivery updates

### Implementation
```typescript
// Check if mess cut is allowed
const canSkip = MessCutService.canRequestMessCut(date, mealType);

// Request mess cut
await MessCutService.requestMessCut(subscriptionId, date, mealType, reason);
```

## 🎨 UI/UX Design

### Design System
- **Colors**: Professional blue primary, green secondary, orange accent
- **Typography**: Clear hierarchy with proper contrast ratios
- **Spacing**: Consistent 8px grid system
- **Components**: Material Design 3 via React Native Paper

### Responsive Design
- Mobile-first approach
- Tablet-optimized layouts
- Web compatibility via Expo Web

### Dark Mode
- System-wide theme switching
- Persistent user preference
- Smooth transition animations

## 🔒 Security Features

### Row Level Security (RLS)
- User data isolation
- Role-based data access
- Secure API endpoints

### Data Validation
- Input sanitization
- Type-safe database operations
- Error boundary implementation

## 📈 Performance Optimization

### Caching Strategy
- AsyncStorage for offline data
- Image caching for menu photos
- Location data persistence

### Real-time Updates
- Supabase subscriptions for live data
- Optimistic updates for better UX
- Background sync capabilities

## 🚀 Deployment

### Development Build
```bash
npx expo build:ios
npx expo build:android
```

### Production Deployment
1. Configure app.json for production
2. Update environment variables
3. Generate signed builds
4. Submit to App Store / Play Store

## 🧪 Testing

### Test Users
Create test users for each role:
```sql
-- Admin user
INSERT INTO users (email, role, full_name, is_active) 
VALUES ('admin@messy.com', 'admin', 'System Admin', true);

-- Mess owner
INSERT INTO users (email, role, full_name, is_active) 
VALUES ('owner@messy.com', 'mess_owner', 'John Doe', true);

-- Customer
INSERT INTO users (email, role, full_name, is_active) 
VALUES ('customer@messy.com', 'customer', 'Jane Smith', true);
```

## 📚 API Documentation

### Key Endpoints
- `GET /api/messes` - List approved messes
- `POST /api/subscriptions` - Create subscription
- `PUT /api/deliveries/:id` - Update delivery status
- `POST /api/ratings` - Submit rating

### Real-time Channels
- `deliveries:customer_id` - Customer delivery updates
- `notifications:user_id` - User notifications
- `messes:owner_id` - Mess owner updates

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🆘 Support

For support and questions:
- Email: support@messy.com
- Documentation: [docs.messy.com](https://docs.messy.com)
- Issues: GitHub Issues

---

Built with ❤️ using React Native and Supabase