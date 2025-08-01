export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: 'customer' | 'mess_owner' | 'admin';
          full_name: string;
          phone?: string;
          avatar_url?: string;
          location?: {
            latitude: number;
            longitude: number;
            address: string;
          };
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      messes: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string;
          address: string;
          location: {
            latitude: number;
            longitude: number;
          };
          phone: string;
          email?: string;
          images: string[];
          operating_hours: {
            open_time: string;
            close_time: string;
            days: string[];
          };
          status: 'pending' | 'approved' | 'rejected' | 'suspended';
          rating_average: number;
          rating_count: number;
          delivery_radius: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messes']['Row'], 'id' | 'created_at' | 'updated_at' | 'rating_average' | 'rating_count'>;
        Update: Partial<Database['public']['Tables']['messes']['Insert']>;
      };
      menus: {
        Row: {
          id: string;
          mess_id: string;
          date: string;
          meal_type: 'breakfast' | 'lunch' | 'dinner';
          items: {
            name: string;
            description?: string;
            image_url?: string;
            is_veg: boolean;
          }[];
          price: number;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['menus']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['menus']['Insert']>;
      };
      subscriptions: {
        Row: {
          id: string;
          customer_id: string;
          mess_id: string;
          plan_type: 'daily' | 'weekly' | 'monthly';
          meal_types: ('breakfast' | 'lunch' | 'dinner')[];
          start_date: string;
          end_date: string;
          price_per_meal: number;
          total_amount: number;
          status: 'active' | 'paused' | 'cancelled' | 'expired';
          delivery_address: string;
          delivery_instructions?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
      };
      deliveries: {
        Row: {
          id: string;
          subscription_id: string;
          mess_id: string;
          customer_id: string;
          date: string;
          meal_type: 'breakfast' | 'lunch' | 'dinner';
          status: 'scheduled' | 'skipped' | 'delivered' | 'cancelled';
          skip_reason?: string;
          skip_requested_at?: string;
          delivered_at?: string;
          delivery_notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['deliveries']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['deliveries']['Insert']>;
      };
      ratings: {
        Row: {
          id: string;
          customer_id: string;
          mess_id: string;
          delivery_id?: string;
          rating: number;
          review?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ratings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['ratings']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: 'mess_cut' | 'delivery' | 'subscription' | 'system' | 'rating';
          data?: Record<string, any>;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
    };
  };
}