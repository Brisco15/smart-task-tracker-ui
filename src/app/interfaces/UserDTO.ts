export interface UserDTO {
  userID: number;
  userName: string;
  email: string;
  createdAt: string;
  archived: boolean;
  role: {
    roleID: number;
    roleName: string;
  };
  deletedAt?: Date;
}