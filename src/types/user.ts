export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  status?: string;
  lastActive?: number;
  createdAt?: number;
}
