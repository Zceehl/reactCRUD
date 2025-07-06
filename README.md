# Inventory Management System

A comprehensive inventory management system built with React Native and Appwrite, featuring role-based access control, CRUD operations, and real-time data management.

## Features

### 🔐 Authentication & Authorization

- **User Registration & Login**: Secure authentication using Appwrite
- **Role-Based Access Control**: Two user roles with different permissions
  - **Admin**: Full CRUD access to all features
  - **Inventory**: Can create movements and read data
- **Session Management**: Automatic session handling and logout functionality

### 📦 Inventory Management

- **Ingredients Management**: Add, edit, delete, and view ingredients
- **Stock Tracking**: Real-time stock quantity updates
- **Movement Tracking**: Record stock in/out movements with reasons and notes
- **Low Stock Alerts**: Automatic detection of items below minimum stock levels
- **Unit Management**: Support for various units (kg, g, liter, ml, piece, box, pack, bottle, can)

### 📊 Analytics & Reporting

- **Dashboard**: Overview of key metrics and quick actions
- **Analytics Screen**: Detailed statistics and insights
- **Stock Value Calculation**: Total inventory worth tracking
- **Top Ingredients**: Ranking by value and usage
- **Movement History**: Complete audit trail of all stock movements

### 👥 User Management (Admin Only)

- **User List**: View all registered users
- **User Status**: Activate/deactivate user accounts
- **Role Assignment**: Manage user roles and permissions
- **User Search**: Find users by name, email, or username

### ⚙️ Settings & Preferences

- **Account Settings**: Profile management and password changes
- **App Preferences**: Notification settings and theme options
- **System Settings**: Administrative configurations
- **Support**: Help and FAQ access

## Technical Architecture

### 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │   Expo Router   │    │    Appwrite     │
│     Frontend    │◄──►│   Navigation    │◄──►│   Backend API   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │    │   Route Files   │    │   Collections   │
│   & Screens     │    │   & Layouts     │    │   & Auth        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 📁 Project Structure

```
app/
├── config/
│   └── appwrite.js          # Appwrite configuration & client setup
├── contexts/
│   └── AuthContext.js       # Authentication state management
├── screens/
│   ├── LoginScreen.js       # Authentication UI
│   ├── DashboardScreen.js   # Main dashboard with statistics
│   ├── IngredientsScreen.js # Ingredients list with CRUD
│   ├── AddIngredientScreen.js # Ingredient creation form
│   ├── EditIngredientScreen.js # Ingredient editing form
│   ├── AddMovementScreen.js # Stock movement form
│   ├── MovementsScreen.js   # Movement history display
│   ├── LowStockScreen.js    # Low stock alerts
│   ├── AnalyticsScreen.js   # Statistics and insights
│   ├── UsersScreen.js       # User management (admin)
│   └── SettingsScreen.js    # App settings and preferences
├── services/
│   └── inventoryService.js  # Business logic & API calls
├── _layout.jsx             # Navigation layout configuration
├── index.jsx              # Entry point (login)
├── dashboard.jsx          # Dashboard route
├── ingredients.jsx        # Ingredients route
├── add-ingredient.jsx     # Add ingredient route
├── edit-ingredient.jsx    # Edit ingredient route
├── add-movement.jsx       # Add movement route
├── movements.jsx          # Movements route
├── low-stock.jsx          # Low stock route
├── analytics.jsx          # Analytics route
├── users.jsx              # Users route
└── settings.jsx           # Settings route
```

## Code Implementation Details

### 🔐 Authentication System

#### **AuthContext.js - State Management**

```javascript
// Context provides authentication state across the app
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Login function with Appwrite integration
  const login = async (email, password) => {
    try {
      // Create email session with Appwrite
      const session = await account.createEmailPasswordSession(email, password);

      // Fetch user data from database
      const userDoc = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        session.userId
      );

      // Set user state and role
      setUser(userDoc);
      setUserRole(userDoc.role_id);
    } catch (error) {
      throw error;
    }
  };

  // Permission checking based on user role
  const hasPermission = (permission) => {
    if (!userRole) return false;

    const rolePermissions = {
      admin: ["create", "read", "update", "delete", "create_movement", "admin"],
      inventory: ["read", "create_movement"],
    };

    return rolePermissions[userRole]?.includes(permission) || false;
  };
};
```

#### **LoginScreen.js - Authentication UI**

```javascript
const LoginScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    first_name: "",
    last_name: "",
    role_id: "",
  });

  const handleSubmit = async () => {
    if (isLogin) {
      // Login flow
      await login(formData.email, formData.password);
      router.replace("/dashboard");
    } else {
      // Registration flow
      const account = await account.create(
        ID.unique(),
        formData.email,
        formData.password,
        formData.username
      );

      // Create user document in database
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        account.$id,
        {
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role_id: formData.role_id,
          is_active: true,
          created_at: new Date().toISOString(),
        }
      );
    }
  };
};
```

### 📦 Inventory Management System

#### **InventoryService.js - Business Logic Layer**

```javascript
export class InventoryService {
  // CRUD operations for ingredients
  static async createIngredient(ingredientData) {
    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.INGREDIENTS,
        ID.unique(),
        {
          ingredient_name: ingredientData.ingredient_name,
          unit: ingredientData.unit,
          stock_quantity: parseFloat(ingredientData.stock_quantity) || 0,
          unit_cost: parseFloat(ingredientData.unit_cost),
          minimum_stock: parseFloat(ingredientData.minimum_stock) || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      );
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Movement creation with stock validation
  static async createMovement(movementData) {
    try {
      // Validate stock out won't result in negative stock
      if (movementData.movement_type === "out") {
        const ingredient = await this.getIngredient(movementData.ingredient_id);
        if (ingredient.success) {
          const currentStock = parseFloat(ingredient.data.stock_quantity);
          const movementQuantity = parseFloat(movementData.quantity);
          const newStock = currentStock - movementQuantity;

          if (newStock < 0) {
            return {
              success: false,
              error: `Insufficient stock. Current stock: ${currentStock.toFixed(
                2
              )}. Cannot remove ${movementQuantity}.`,
            };
          }
        }
      }

      // Create movement document
      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.INGREDIENT_MOVEMENTS,
        ID.unique(),
        {
          ingredient_id: movementData.ingredient_id,
          movement_type: movementData.movement_type,
          quantity: parseFloat(movementData.quantity),
          reason: movementData.reason || "",
          notes: movementData.notes || "",
          created_at: new Date().toISOString(),
        }
      );

      // Update ingredient stock quantity
      const ingredient = await this.getIngredient(movementData.ingredient_id);
      if (ingredient.success) {
        const currentStock = parseFloat(ingredient.data.stock_quantity);
        const movementQuantity = parseFloat(movementData.quantity);
        const newStock =
          movementData.movement_type === "in"
            ? currentStock + movementQuantity
            : currentStock - movementQuantity;

        await this.updateIngredient(movementData.ingredient_id, {
          ...ingredient.data,
          stock_quantity: newStock,
        });
      }

      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

#### **AddMovementScreen.js - Movement Validation**

```javascript
const handleSubmit = async () => {
  // Frontend validation
  if (!movementData.ingredient_id || !movementData.quantity) {
    Alert.alert("Error", "Please fill in all required fields");
    return;
  }

  if (parseFloat(movementData.quantity) <= 0) {
    Alert.alert("Error", "Quantity must be greater than 0");
    return;
  }

  // Validate stock out won't result in negative stock
  if (movementData.movement_type === "out" && selectedIngredient) {
    const currentStock = parseFloat(selectedIngredient.stock_quantity);
    const movementQuantity = parseFloat(movementData.quantity);
    const newStock = currentStock - movementQuantity;

    if (newStock < 0) {
      Alert.alert(
        "Insufficient Stock",
        `Cannot remove ${movementQuantity} ${selectedIngredient.unit} of ${
          selectedIngredient.ingredient_name
        }. Current stock is ${currentStock.toFixed(2)} ${
          selectedIngredient.unit
        }. Maximum quantity that can be removed is ${currentStock.toFixed(2)} ${
          selectedIngredient.unit
        }.`
      );
      return;
    }
  }

  // Submit to backend
  const result = await InventoryService.createMovement(movementData);
  if (result.success) {
    Alert.alert("Success", "Movement added successfully");
  } else {
    Alert.alert("Error", result.error || "Failed to add movement");
  }
};
```

### 🧮 Analytics & Calculations

#### **AnalyticsScreen.js - Statistical Analysis**

```javascript
const loadAnalytics = async () => {
  try {
    const [ingredients, lowStock, stockValue, movements] = await Promise.all([
      InventoryService.getIngredients(),
      InventoryService.getLowStockIngredients(),
      InventoryService.getStockValue(),
      InventoryService.getMovements(),
    ]);

    if (ingredients.success) {
      const totalValue = stockValue.success ? stockValue.data : 0;
      const averageCost =
        ingredients.data.length > 0 ? totalValue / ingredients.data.length : 0;

      // Get top 5 ingredients by value
      const topIngredients = ingredients.data
        .map((ingredient) => ({
          ...ingredient,
          totalValue:
            parseFloat(ingredient.stock_quantity) *
            parseFloat(ingredient.unit_cost),
        }))
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 5);

      setStats({
        totalIngredients: ingredients.data.length,
        lowStockCount: lowStock.success ? lowStock.data.length : 0,
        totalValue: totalValue,
        averageCost: averageCost,
        topIngredients: topIngredients,
        recentMovements: movements.success ? movements.data.length : 0,
      });
    }
  } catch (error) {
    console.error("Error loading analytics:", error);
  }
};
```

### 🔄 Data Flow Architecture

#### **1. Authentication Flow**

```
User Input → LoginScreen → AuthContext → Appwrite Auth → Database User Doc → Set State → Navigate
```

#### **2. CRUD Operations Flow**

```
UI Action → Screen Component → Service Layer → Appwrite API → Database → Response → UI Update
```

#### **3. Real-time Stock Updates**

```
Movement Creation → Validation → Database Update → Stock Calculation → UI Refresh → Analytics Update
```

### 🛡️ Security Implementation

#### **Role-Based Access Control (RBAC)**

```javascript
// Permission matrix
const rolePermissions = {
  admin: [
    "create",
    "read",
    "update",
    "delete",
    "create_movement",
    "admin",
    "manage_users",
  ],
  inventory: ["read", "create_movement"],
};

// Permission checking function
const hasPermission = (permission) => {
  if (!userRole) return false;
  return rolePermissions[userRole]?.includes(permission) || false;
};

// Usage in components
{
  hasPermission("admin") && (
    <TouchableOpacity onPress={() => router.push("/users")}>
      <Text>Manage Users</Text>
    </TouchableOpacity>
  );
}
```

#### **Input Validation & Sanitization**

```javascript
// Frontend validation
const validateIngredientData = (data) => {
  if (!data.ingredient_name || !data.unit || !data.unit_cost) {
    throw new Error("Required fields missing");
  }

  if (parseFloat(data.unit_cost) <= 0) {
    throw new Error("Unit cost must be greater than 0");
  }

  return {
    ...data,
    stock_quantity: parseFloat(data.stock_quantity) || 0,
    unit_cost: parseFloat(data.unit_cost),
    minimum_stock: parseFloat(data.minimum_stock) || 0,
  };
};

// Backend validation
const validateMovement = async (movementData) => {
  if (movementData.movement_type === "out") {
    const ingredient = await getIngredient(movementData.ingredient_id);
    const newStock = ingredient.stock_quantity - movementData.quantity;

    if (newStock < 0) {
      throw new Error("Insufficient stock");
    }
  }
};
```

### 📊 Database Schema & Relationships

#### **Collections Structure**

```javascript
// Users Collection
{
    $id: string,           // Appwrite Account ID
    username: string,      // Unique username
    email: string,         // User email
    first_name: string,    // First name
    last_name: string,     // Last name
    phone: string,         // Phone number (optional)
    role_id: string,       // Reference to roles collection
    is_active: boolean,    // Account status
    created_at: string,    // ISO timestamp
    updated_at: string     // ISO timestamp
}

// Roles Collection
{
    $id: string,           // Role ID ('admin', 'inventory')
    role_name: string,     // Human-readable name
    permissions: string[],  // Array of permissions
    created_at: string     // ISO timestamp
}

// Ingredients Collection
{
    $id: string,           // Unique ingredient ID
    ingredient_name: string, // Ingredient name
    unit: string,          // Unit of measurement
    stock_quantity: number, // Current stock level
    unit_cost: number,     // Cost per unit
    minimum_stock: number, // Minimum stock threshold
    created_at: string,    // ISO timestamp
    updated_at: string     // ISO timestamp
}

// Ingredient Movements Collection
{
    $id: string,           // Unique movement ID
    ingredient_id: string, // Reference to ingredients
    movement_type: string, // 'in' or 'out'
    quantity: number,      // Movement quantity
    reason: string,        // Movement reason
    notes: string,         // Additional notes
    created_at: string     // ISO timestamp
}
```

### 🔄 State Management Patterns

#### **Context API for Global State**

```javascript
// AuthContext provides authentication state
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const value = {
    user,
    userRole,
    loading,
    login,
    logout,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

#### **Local State Management**

```javascript
// Component-level state management
const [ingredients, setIngredients] = useState([]);
const [loading, setLoading] = useState(false);
const [searchQuery, setSearchQuery] = useState("");

// Derived state
const filteredIngredients = useMemo(() => {
  return ingredients.filter((ingredient) =>
    ingredient.ingredient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [ingredients, searchQuery]);
```

### 🎨 UI/UX Implementation

#### **Responsive Design Patterns**

```javascript
// Adaptive layouts
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
```

#### **Component Composition**

```javascript
// Reusable components
const StatCard = ({ title, value, subtitle, color, onPress }) => (
  <TouchableOpacity
    style={[styles.statCard, { borderLeftColor: color }]}
    onPress={onPress}
  >
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
    {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
  </TouchableOpacity>
);

// Usage
<StatCard
  title="Total Value"
  value={`$${stats.totalValue.toFixed(2)}`}
  subtitle="inventory worth"
  color="#34C759"
  onPress={() => router.push("/analytics")}
/>;
```

### 🔧 Error Handling Strategy

#### **Multi-layer Error Handling**

```javascript
// Service layer error handling
static async createIngredient(ingredientData) {
    try {
        const response = await databases.createDocument(/* ... */);
        return { success: true, data: response };
    } catch (error) {
        console.error('Error creating ingredient:', error);
        return { success: false, error: error.message };
    }
}

// Component layer error handling
const handleSubmit = async () => {
    try {
        setLoading(true);
        const result = await InventoryService.createIngredient(ingredientData);

        if (result.success) {
            Alert.alert('Success', 'Ingredient added successfully');
            router.back();
        } else {
            Alert.alert('Error', result.error || 'Failed to add ingredient');
        }
    } catch (error) {
        console.error('Error:', error);
        Alert.alert('Error', 'An unexpected error occurred');
    } finally {
        setLoading(false);
    }
};
```

## Screens & Navigation

### Main Screens

- **Login Screen** (`/`): User authentication
- **Dashboard** (`/dashboard`): Main overview and quick actions
- **Ingredients List** (`/ingredients`): View and manage all ingredients
- **Add Ingredient** (`/add-ingredient`): Create new ingredients (Admin only)
- **Edit Ingredient** (`/edit-ingredient`): Modify existing ingredients (Admin only)
- **Movements List** (`/movements`): View all stock movements
- **Add Movement** (`/add-movement`): Record new stock movements
- **Low Stock Items** (`/low-stock`): Items requiring attention
- **Analytics** (`/analytics`): Detailed statistics and insights
- **Users Management** (`/users`): User administration (Admin only)
- **Settings** (`/settings`): App preferences and account management

## Database Schema

### Collections

#### Users

```javascript
{
  $id: string,
  first_name: string,
  last_name: string,
  email: string,
  username: string,
  phone: string,
  role_id: string,
  is_active: boolean,
  created_at: string,
  updated_at: string
}
```

#### Roles

```javascript
{
  $id: string,
  role_name: string,
  permissions: string[],
  created_at: string
}
```

#### Ingredients

```javascript
{
  $id: string,
  ingredient_name: string,
  unit: string,
  stock_quantity: number,
  unit_cost: number,
  minimum_stock: number,
  created_at: string,
  updated_at: string
}
```

#### Ingredient Movements

```javascript
{
  $id: string,
  ingredient_id: string,
  movement_type: 'in' | 'out',
  quantity: number,
  reason: string,
  notes: string,
  created_at: string
}
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Appwrite account and project

### 1. Clone and Install

```bash
git clone <repository-url>
cd reactCRUD
npm install
```

### 2. Appwrite Configuration

1. Create an Appwrite project
2. Set up the following collections:

   - `users`
   - `roles`
   - `ingredients`
   - `ingredient_movements`

3. Configure collection attributes:

   - **Users**: firstName, lastName, email, username, phone, roleId, isActive, createdAt, updatedAt
   - **Roles**: roleName, permissions, createdAt
   - **Ingredients**: ingredientName, unit, stockQuantity, unitCost, minimumStock, createdAt, updatedAt
   - **Ingredient Movements**: ingredientId, movementType, quantity, reason, notes, createdAt

4. Set up authentication:
   - Enable email/password authentication
   - Configure user registration and login

### 3. Environment Configuration

Run the setup script to configure Appwrite connection:

```bash
node setup.js
```

The setup script will prompt you for:

- **Appwrite endpoint** (e.g., https://cloud.appwrite.io/v1)
- **Project ID** (from your Appwrite project)
- **Database ID** (default: inventory_system)
- **Collection IDs** for roles, users, ingredients, and movements

Or manually configure in `app/config/appwrite.js`:

```javascript
export const ENDPOINT = "your-appwrite-endpoint";
export const PROJECT_ID = "your-project-id";
export const DATABASE_ID = "your-database-id";
export const COLLECTIONS = {
  USERS: "users",
  ROLES: "roles",
  INGREDIENTS: "ingredients",
  INGREDIENT_MOVEMENTS: "ingredient_movements",
};
```

### 4. Create Initial Data

1. Create role documents in Appwrite:

   - `admin` role with full permissions
   - `inventory` role with limited permissions

2. Register the first admin user through the app

### 5. Run the Application

```bash
npx expo start
```

## Permissions System

### Admin Permissions

- ✅ Create, read, update, delete ingredients
- ✅ Create, read, update, delete movements
- ✅ Manage users (activate/deactivate)
- ✅ View analytics and reports
- ✅ Access all screens and features

### Inventory Permissions

- ✅ Read ingredients and movements
- ✅ Create new movements (stock in/out)
- ✅ View low stock alerts
- ✅ Access dashboard and basic features
- ❌ Cannot modify ingredients or delete movements
- ❌ Cannot manage users or access admin features

## Key Features

### Real-time Stock Updates

- Automatic stock quantity updates when movements are recorded
- Validation to prevent negative stock levels
- Audit trail for all stock changes

### Search and Filter

- Search ingredients by name
- Search movements by ingredient, reason, or notes
- Filter low stock items
- User search functionality

### Data Validation

- Required field validation
- Numeric value validation
- Stock level validation
- User input sanitization

### Error Handling

- Comprehensive error messages
- Network error handling
- User-friendly alerts
- Graceful fallbacks

## Security Features

- **Role-based Access Control**: Strict permission enforcement
- **Input Validation**: Server-side and client-side validation
- **Session Management**: Secure session handling
- **Data Sanitization**: Protection against malicious input
- **Audit Trail**: Complete movement history tracking

## Performance Optimizations

- **Lazy Loading**: Screens load only when needed
- **Caching**: Efficient data caching strategies
- **Optimized Queries**: Minimal database calls
- **Refresh Control**: Pull-to-refresh functionality
- **Search Optimization**: Fast search with debouncing

## Troubleshooting

### Common Issues

1. **Registration Failed**

   - Check Appwrite project configuration
   - Verify collection permissions
   - Ensure role documents exist

2. **Login Issues**

   - Verify email/password
   - Check user document exists
   - Ensure user is active

3. **Navigation Errors**

   - Clear app cache
   - Restart development server
   - Check route configurations

4. **Data Not Loading**
   - Verify Appwrite connection
   - Check collection permissions
   - Ensure proper authentication

### Debug Mode

Enable debug logging by setting `console.log` statements in the code for detailed error tracking.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ using React Native and Appwrite**
