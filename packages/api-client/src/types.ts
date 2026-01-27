// Common API types

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
  status: number;
}

// Forms Block types
export interface Form {
  id: string;
  name: string;
  form_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  data: Record<string, unknown>;
  submitted_at: string;
}

// Content Block types
export interface Post {
  id: string;
  title: string;
  body: string;
  status: string;
  author_id: string;
  created_at: string;
  updated_at: string;
}

export interface Series {
  id: string;
  title: string;
  description: string;
  post_count: number;
  created_at: string;
}

// Files Block types
export interface UserFile {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  status: string;
  created_at: string;
}
