import { io, Socket } from "socket.io-client";
import { frontendEnv } from "./env";

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  const apiUrl = frontendEnv.API_URL;
  const baseUrl = apiUrl.replace(/\/api\/?$/, "");
  socket = io(baseUrl, {
    transports: ["websocket"],
    auth: { token },
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
