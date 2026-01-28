import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Determine URL based on environment or default to localhost:3000
    const URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin.replace('5173', '3000'); // Naive replacement for dev
    
    // In production/preview, you might want to proxy or set explicit URL
    const socketInstance = io('http://localhost:3000'); 

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Connected to socket');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected');
      setIsConnected(false);
    });

    socketInstance.on('timeline:data', (data) => {
      console.log('Timeline update received:', data);
      setTimeline(data.sort((a,b) => a.order_index - b.order_index));
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, timeline, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
