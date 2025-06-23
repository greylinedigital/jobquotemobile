export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
      };
      business_profiles: {
        Row: {
          id: string;
          business_name: string | null;
          logo_url: string | null;
          abn: string | null;
          phone: string | null;
          email: string | null;
          payment_terms: string | null;
          quote_footer: string | null;
          quote_footer_notes: string | null;
          bank_name: string | null;
          bsb: string | null;
          account_number: string | null;
          account_name: string | null;
          hourly_rate: number | null;
          gst_enabled: boolean;
          country: string | null;
        };
        Insert: {
          id: string;
          business_name?: string | null;
          logo_url?: string | null;
          abn?: string | null;
          phone?: string | null;
          email?: string | null;
          payment_terms?: string | null;
          quote_footer?: string | null;
          quote_footer_notes?: string | null;
          bank_name?: string | null;
          bsb?: string | null;
          account_number?: string | null;
          account_name?: string | null;
          hourly_rate?: number | null;
          gst_enabled?: boolean;
          country?: string | null;
        };
        Update: {
          id?: string;
          business_name?: string | null;
          logo_url?: string | null;
          abn?: string | null;
          phone?: string | null;
          email?: string | null;
          payment_terms?: string | null;
          quote_footer?: string | null;
          quote_footer_notes?: string | null;
          bank_name?: string | null;
          bsb?: string | null;
          account_number?: string | null;
          account_name?: string | null;
          hourly_rate?: number | null;
          gst_enabled?: boolean;
          country?: string | null;
        };
      };
      clients: {
        Row: {
          id: string;
          user_id: string | null;
          name: string | null;
          email: string | null;
          phone: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      quotes: {
        Row: {
          id: string;
          user_id: string | null;
          client_id: string | null;
          job_title: string | null;
          description: string | null;
          status: string | null;
          total: number | null;
          gst: number | null;
          created_at: string | null;
          updated_at: string | null;
          gst_amount: number | null;
          subtotal: number | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          client_id?: string | null;
          job_title?: string | null;
          description?: string | null;
          status?: string | null;
          total?: number | null;
          gst?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          gst_amount?: number | null;
          subtotal?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          client_id?: string | null;
          job_title?: string | null;
          description?: string | null;
          status?: string | null;
          total?: number | null;
          gst?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          gst_amount?: number | null;
          subtotal?: number | null;
        };
      };
      quote_items: {
        Row: {
          id: string;
          quote_id: string | null;
          type: string | null;
          name: string | null;
          qty: number | null;
          cost: number | null;
          quantity: number | null;
          unit_price: number | null;
          total: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          quote_id?: string | null;
          type?: string | null;
          name?: string | null;
          qty?: number | null;
          cost?: number | null;
          quantity?: number | null;
          unit_price?: number | null;
          total?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          quote_id?: string | null;
          type?: string | null;
          name?: string | null;
          qty?: number | null;
          cost?: number | null;
          quantity?: number | null;
          unit_price?: number | null;
          total?: number | null;
          created_at?: string | null;
        };
      };
      invoices: {
        Row: {
          id: string;
          quote_id: string | null;
          invoice_number: string | null;
          total: number | null;
          due_date: string | null;
          status: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          quote_id?: string | null;
          invoice_number?: string | null;
          total?: number | null;
          due_date?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          quote_id?: string | null;
          invoice_number?: string | null;
          total?: number | null;
          due_date?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
  };
}

export type Client = Database['public']['Tables']['clients']['Row'];
export type Quote = Database['public']['Tables']['quotes']['Row'];
export type QuoteItem = Database['public']['Tables']['quote_items']['Row'];
export type BusinessProfile = Database['public']['Tables']['business_profiles']['Row'];
export type Invoice = Database['public']['Tables']['invoices']['Row'];