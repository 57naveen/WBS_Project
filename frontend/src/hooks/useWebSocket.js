import { useEffect, useState, useRef } from "react";

const useWebSocket = (url) => {
    const [data, setData] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);
    const reconnectInterval = 3000; // 3 seconds

    const connectWebSocket = () => {
        if (socketRef.current) {
            socketRef.current.close(); // Ensure the previous socket is closed before reconnecting
        }

        const ws = new WebSocket(url);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log("✅ WebSocket Connected to", url);
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            console.log("📩 WebSocket Message Received:", event.data);
            try {
                const parsedData = JSON.parse(event.data);
                console.log("✅ Updating state with:", parsedData);
                setData(parsedData); // Ensure this updates the state
            } catch (error) {
                console.error("⚠️ Error parsing WebSocket message:", error);
            }
        };

        ws.onerror = (event) => {
            console.error("⚠️ WebSocket Error:", event);
        };

        ws.onclose = (event) => {
            console.warn(`❌ WebSocket Disconnected. Code: ${event.code}, Reason: ${event.reason}`);
            setIsConnected(false);

            // Auto-reconnect if the disconnect was NOT intentional (Code 1000 means clean exit)
            if (event.code !== 1000) {
                console.log(`🔄 Attempting to reconnect in ${reconnectInterval / 1000} seconds...`);
                setTimeout(connectWebSocket, reconnectInterval);
            }
        };
    };

    useEffect(() => {
        connectWebSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.close(1000, "Component unmounting");
            }
        };
    }, [url]);

    return { data, isConnected, socket: socketRef.current };
};

export default useWebSocket;
