export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      admission_queries: {
        Row: {
          applying_for_class: string
          created_at: string
          email: string | null
          father_name: string
          id: string
          message: string | null
          mother_phone: string | null
          phone: string
          status: string
          student_name: string
          whatsapp: string | null
        }
        Insert: {
          applying_for_class: string
          created_at?: string
          email?: string | null
          father_name: string
          id?: string
          message?: string | null
          mother_phone?: string | null
          phone: string
          status?: string
          student_name: string
          whatsapp?: string | null
        }
        Update: {
          applying_for_class?: string
          created_at?: string
          email?: string | null
          father_name?: string
          id?: string
          message?: string | null
          mother_phone?: string | null
          phone?: string
          status?: string
          student_name?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      admissions: {
        Row: {
          address: string | null
          admission_date: string | null
          application_no: string
          applying_for_class: string
          applying_for_section: string | null
          cnic_bform: string | null
          created_at: string
          date_of_birth: string
          father_cnic: string | null
          father_name: string
          father_occupation: string | null
          father_phone: string | null
          gender: string
          id: string
          mother_name: string | null
          mother_phone: string | null
          nationality: string | null
          previous_class: string | null
          previous_school: string | null
          religion: string | null
          remarks: string | null
          status: string
          student_name: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          admission_date?: string | null
          application_no: string
          applying_for_class: string
          applying_for_section?: string | null
          cnic_bform?: string | null
          created_at?: string
          date_of_birth: string
          father_cnic?: string | null
          father_name: string
          father_occupation?: string | null
          father_phone?: string | null
          gender?: string
          id?: string
          mother_name?: string | null
          mother_phone?: string | null
          nationality?: string | null
          previous_class?: string | null
          previous_school?: string | null
          religion?: string | null
          remarks?: string | null
          status?: string
          student_name: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          admission_date?: string | null
          application_no?: string
          applying_for_class?: string
          applying_for_section?: string | null
          cnic_bform?: string | null
          created_at?: string
          date_of_birth?: string
          father_cnic?: string | null
          father_name?: string
          father_occupation?: string | null
          father_phone?: string | null
          gender?: string
          id?: string
          mother_name?: string | null
          mother_phone?: string | null
          nationality?: string | null
          previous_class?: string | null
          previous_school?: string | null
          religion?: string | null
          remarks?: string | null
          status?: string
          student_name?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          expires_at: string | null
          id: string
          is_public: boolean
          title: string
          type: string
        }
        Insert: {
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_public?: boolean
          title: string
          type?: string
        }
        Update: {
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_public?: boolean
          title?: string
          type?: string
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          created_at: string
          date: string
          id: string
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          class_teacher_id: string | null
          created_at: string
          id: string
          level: string
          max_students: number | null
          name: string
          room: string | null
          section: string | null
          updated_at: string
        }
        Insert: {
          class_teacher_id?: string | null
          created_at?: string
          id?: string
          level?: string
          max_students?: number | null
          name: string
          room?: string | null
          section?: string | null
          updated_at?: string
        }
        Update: {
          class_teacher_id?: string | null
          created_at?: string
          id?: string
          level?: string
          max_students?: number | null
          name?: string
          room?: string | null
          section?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_class_teacher_id_fkey"
            columns: ["class_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      diary_entries: {
        Row: {
          class_name: string
          created_at: string
          date: string
          homework_text: string
          id: string
          section: string
          subject: string
        }
        Insert: {
          class_name: string
          created_at?: string
          date?: string
          homework_text?: string
          id?: string
          section?: string
          subject?: string
        }
        Update: {
          class_name?: string
          created_at?: string
          date?: string
          homework_text?: string
          id?: string
          section?: string
          subject?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          expense_date: string
          expense_head: string
          id: string
          month: string
          paid_to: string | null
          payment_method: string
          receipt_no: string | null
          remarks: string | null
          updated_at: string
          year: number
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          expense_date?: string
          expense_head: string
          id?: string
          month: string
          paid_to?: string | null
          payment_method?: string
          receipt_no?: string | null
          remarks?: string | null
          updated_at?: string
          year?: number
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          expense_date?: string
          expense_head?: string
          id?: string
          month?: string
          paid_to?: string | null
          payment_method?: string
          receipt_no?: string | null
          remarks?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      fee_vouchers: {
        Row: {
          admission_fee: number
          amount: number
          amount_paid: number
          annual_charges: number
          arrears: number
          arrears_aging_months: number
          arrears_source_voucher_id: string | null
          books_charges: number
          created_at: string
          discount: number
          due_date: string
          fee_type: string
          id: string
          issue_date: string
          late_fee: number
          late_fee_amount: number
          month: string
          paid_date: string | null
          registration_fee: number
          remarks: string | null
          security_deposit: number
          status: string
          student_id: string
          trip_charges: number
          tuition_fee: number
          updated_at: string
          voucher_no: string
          year: number
        }
        Insert: {
          admission_fee?: number
          amount?: number
          amount_paid?: number
          annual_charges?: number
          arrears?: number
          arrears_aging_months?: number
          arrears_source_voucher_id?: string | null
          books_charges?: number
          created_at?: string
          discount?: number
          due_date?: string
          fee_type?: string
          id?: string
          issue_date?: string
          late_fee?: number
          late_fee_amount?: number
          month: string
          paid_date?: string | null
          registration_fee?: number
          remarks?: string | null
          security_deposit?: number
          status?: string
          student_id: string
          trip_charges?: number
          tuition_fee?: number
          updated_at?: string
          voucher_no: string
          year?: number
        }
        Update: {
          admission_fee?: number
          amount?: number
          amount_paid?: number
          annual_charges?: number
          arrears?: number
          arrears_aging_months?: number
          arrears_source_voucher_id?: string | null
          books_charges?: number
          created_at?: string
          discount?: number
          due_date?: string
          fee_type?: string
          id?: string
          issue_date?: string
          late_fee?: number
          late_fee_amount?: number
          month?: string
          paid_date?: string | null
          registration_fee?: number
          remarks?: string | null
          security_deposit?: number
          status?: string
          student_id?: string
          trip_charges?: number
          tuition_fee?: number
          updated_at?: string
          voucher_no?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "fee_vouchers_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      non_teaching_staff: {
        Row: {
          address: string | null
          cnic: string | null
          created_at: string
          date_of_birth: string | null
          department: string
          designation: string
          id: string
          joining_date: string | null
          name: string
          phone: string | null
          photo_url: string | null
          qualification: string | null
          salary: number | null
          staff_id: string
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          cnic?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string
          designation?: string
          id?: string
          joining_date?: string | null
          name: string
          phone?: string | null
          photo_url?: string | null
          qualification?: string | null
          salary?: number | null
          staff_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          cnic?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string
          designation?: string
          id?: string
          joining_date?: string | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          qualification?: string | null
          salary?: number | null
          staff_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_records: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string
          fee_head: string
          id: string
          parent_user_id: string | null
          payment_date: string
          payment_method: string
          receipt_no: string
          remarks: string | null
          student_id: string | null
          transaction_no: string | null
          voucher_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string
          fee_head?: string
          id?: string
          parent_user_id?: string | null
          payment_date?: string
          payment_method?: string
          receipt_no: string
          remarks?: string | null
          student_id?: string | null
          transaction_no?: string | null
          voucher_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string
          fee_head?: string
          id?: string
          parent_user_id?: string | null
          payment_date?: string
          payment_method?: string
          receipt_no?: string
          remarks?: string | null
          student_id?: string | null
          transaction_no?: string | null
          voucher_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      school_settings: {
        Row: {
          address: string
          campus: string
          city: string
          email: string
          id: string
          motto: string
          phone: string
          school_name: string
          updated_at: string
        }
        Insert: {
          address?: string
          campus?: string
          city?: string
          email?: string
          id?: string
          motto?: string
          phone?: string
          school_name?: string
          updated_at?: string
        }
        Update: {
          address?: string
          campus?: string
          city?: string
          email?: string
          id?: string
          motto?: string
          phone?: string
          school_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          class: string
          created_at: string
          date_of_birth: string | null
          father_name: string
          fee_status: string
          gender: string
          id: string
          monthly_fee: number | null
          mother_phone: string | null
          name: string
          parent_user_id: string | null
          phone: string | null
          photo_url: string | null
          section: string | null
          status: string
          student_id: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          class: string
          created_at?: string
          date_of_birth?: string | null
          father_name: string
          fee_status?: string
          gender?: string
          id?: string
          monthly_fee?: number | null
          mother_phone?: string | null
          name: string
          parent_user_id?: string | null
          phone?: string | null
          photo_url?: string | null
          section?: string | null
          status?: string
          student_id: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          class?: string
          created_at?: string
          date_of_birth?: string | null
          father_name?: string
          fee_status?: string
          gender?: string
          id?: string
          monthly_fee?: number | null
          mother_phone?: string | null
          name?: string
          parent_user_id?: string | null
          phone?: string | null
          photo_url?: string | null
          section?: string | null
          status?: string
          student_id?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      teacher_permissions: {
        Row: {
          can_enter_attendance: boolean
          can_enter_diary: boolean
          can_enter_results: boolean
          can_view_all_classes: boolean
          can_view_attendance: boolean
          can_view_diary: boolean
          can_view_fees: boolean
          can_view_results: boolean
          can_view_students: boolean
          can_view_timetable: boolean
          created_at: string
          id: string
          is_global_default: boolean
          teacher_user_id: string | null
          updated_at: string
        }
        Insert: {
          can_enter_attendance?: boolean
          can_enter_diary?: boolean
          can_enter_results?: boolean
          can_view_all_classes?: boolean
          can_view_attendance?: boolean
          can_view_diary?: boolean
          can_view_fees?: boolean
          can_view_results?: boolean
          can_view_students?: boolean
          can_view_timetable?: boolean
          created_at?: string
          id?: string
          is_global_default?: boolean
          teacher_user_id?: string | null
          updated_at?: string
        }
        Update: {
          can_enter_attendance?: boolean
          can_enter_diary?: boolean
          can_enter_results?: boolean
          can_view_all_classes?: boolean
          can_view_attendance?: boolean
          can_view_diary?: boolean
          can_view_fees?: boolean
          can_view_results?: boolean
          can_view_students?: boolean
          can_view_timetable?: boolean
          created_at?: string
          id?: string
          is_global_default?: boolean
          teacher_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          address: string | null
          classes: string
          cnic: string | null
          created_at: string
          date_of_birth: string | null
          id: string
          joining_date: string | null
          name: string
          phone: string | null
          photo_url: string | null
          qualification: string | null
          salary: number | null
          status: string
          subject: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          classes?: string
          cnic?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: string
          joining_date?: string | null
          name: string
          phone?: string | null
          photo_url?: string | null
          qualification?: string | null
          salary?: number | null
          status?: string
          subject?: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          classes?: string
          cnic?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: string
          joining_date?: string | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          qualification?: string | null
          salary?: number | null
          status?: string
          subject?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      test_results: {
        Row: {
          created_at: string
          exam_date: string | null
          exam_type: string
          grade: string | null
          id: string
          obtained_marks: number
          remarks: string | null
          student_id: string
          subject_id: string
          term: string
          total_marks: number
        }
        Insert: {
          created_at?: string
          exam_date?: string | null
          exam_type?: string
          grade?: string | null
          id?: string
          obtained_marks?: number
          remarks?: string | null
          student_id: string
          subject_id: string
          term?: string
          total_marks?: number
        }
        Update: {
          created_at?: string
          exam_date?: string | null
          exam_type?: string
          grade?: string | null
          id?: string
          obtained_marks?: number
          remarks?: string | null
          student_id?: string
          subject_id?: string
          term?: string
          total_marks?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_entries: {
        Row: {
          class_name: string
          created_at: string
          day_of_week: string
          id: string
          section: string
          subject: string
          teacher_name: string | null
          time_slot: string
        }
        Insert: {
          class_name: string
          created_at?: string
          day_of_week: string
          id?: string
          section?: string
          subject?: string
          teacher_name?: string | null
          time_slot: string
        }
        Update: {
          class_name?: string
          created_at?: string
          day_of_week?: string
          id?: string
          section?: string
          subject?: string
          teacher_name?: string | null
          time_slot?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      website_content: {
        Row: {
          content: Json
          id: string
          section_key: string
          updated_at: string
        }
        Insert: {
          content?: Json
          id?: string
          section_key: string
          updated_at?: string
        }
        Update: {
          content?: Json
          id?: string
          section_key?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "parent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "teacher", "parent"],
    },
  },
} as const
