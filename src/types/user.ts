export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export interface UserProfile extends User {
  email?: string;
  status?: string;
  lastActive?: number;
  createdAt?: number;
}
