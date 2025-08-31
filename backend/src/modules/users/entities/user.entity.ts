// Prisma handles the actual entity, but you can use this for type safety and documentation
export type UserEntity = {
  id: string;
  email: string;
  password: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
  preferences?: any;
};
