import { useEffect, useState } from "react";

const useWebSocket = (url) => {
    const [data, setData] = useState(null);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const ws = new WebSocket(url);

        ws.onopen = () => {
            console.log("✅ WebSocket Connected");
        };

        ws.onmessage = (event) => {
            console.log("📩 WebSocket Message Received:", event.data);
            setData(JSON.parse(event.data));
        };

        ws.onerror = (error) => {
            console.error("❌ WebSocket Error:", error);
        };

        ws.onclose = () => {
            console.log("⚠️ WebSocket Disconnected");
        };

        setSocket(ws);

        return () => {
            ws.close();
        };
    }, [url]);

    return { data, socket };
};

export default useWebSocket;
