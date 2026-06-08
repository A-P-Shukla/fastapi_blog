export interface UserPublic {
  id: number;
  username: string;
  image_file: string | null;
  image_path: string;
}

export interface UserPrivate extends UserPublic {
  email: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  user_id: number;
  date_posted: string;
  author: UserPublic;
}

export interface PaginatedPosts {
  posts: Post[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface ApiError {
  detail: string | { msg: string }[];
}
