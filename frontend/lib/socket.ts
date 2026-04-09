import { io, Socket } from "socket.io-client";
import { frontendEnv } from "./env";

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  const apiUrl = frontendEnv.API_URL;
  const baseUrl = apiUrl.replace(/\/api\/?$/, "");
  console.log("Connecting to socket...", baseUrl);
  socket = io(baseUrl, {
    transports: ["polling", "websocket"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    auth: { token },
  });
  console.log("Socket state:", socket.connected);

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
