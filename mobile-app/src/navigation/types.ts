export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AdminStackParamList = {
  AdminUsers: undefined;
  AdminUserDetail: { userId: number };
};

export type DrawerParamList = {
  Home: undefined;
  Settings: undefined;
  Users: undefined;
  Health: undefined;
  Metrics: undefined;
};
