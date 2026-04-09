export type RelayUser = {
  id: string;
  email: string;
  created_at: string;
};

export type Session = {
  accessToken: string;
  refreshToken: string;
  user: RelayUser;
};

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: RelayUser;
};

export type AccessTokenResponse = {
  access_token: string;
  token_type: string;
};

export type ChatMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

export type ChatSocketEvent = {
  type: "message" | "error";
  message?: ChatMessage;
  error?: string;
};
