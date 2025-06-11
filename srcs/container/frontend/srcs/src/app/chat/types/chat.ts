// src/types.ts

export type Member = {
  id: number;
  username: string;
  avatar?: string;
  lang?: string;
};

export type Group = {
  id: number;
  name: string | null;
  members: Member[];
  owners_id: number[];
  onlines_id: number[];
  private: number;
};

export type Message = {
  id: number;
  sender_id: number;
  message: string;
  sent_at: string;
};

export type Friend = {
  id: number;
  username: string;
  avatar?: string;
  lang?: string;
  relation: {
    status: "pending" | "friend";
    target: number; // user_id ciblé par la demande
    privmsg_id?: number | null; // ID du groupe privé si relation est "friend"
  };
  online: boolean;
};

export type WebSocketStatus = "Connecting..." | "Connected" | "Error" | "Closed";
