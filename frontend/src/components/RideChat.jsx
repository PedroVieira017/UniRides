// @ts-nocheck
// frontend/src/components/RideChat.jsx
import React, { useEffect, useRef, useState } from "react";
import api from "../api/client";
import socket from "../api/socket";
import { useAuth } from "../context/AuthContext";

const RideChat = ({ rideId }) => {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!rideId || !token) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/rides/${rideId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data);
      } catch (err) {
        console.error("Erro a carregar mensagens:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    if (!socket.connected) socket.connect();
    socket.emit("join-ride", rideId);

    const handler = (message) => {
      if (message.ride === rideId || message.ride?._id === rideId) {
        setMessages((prev) => {
          if (prev.some((item) => item._id === message._id)) return prev;
          return [...prev, message];
        });
      }
    };

    socket.on("new-message", handler);

    return () => {
      socket.off("new-message", handler);
    };
  }, [rideId, token]);

  useEffect(() => {
    if (!bottomRef.current) return;
    bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const res = await api.post(
        `/rides/${rideId}/messages`,
        { text },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const created = res.data;
      setMessages((prev) => {
        if (prev.some((item) => item._id === created._id)) return prev;
        return [...prev, created];
      });
      setText("");
    } catch (err) {
      console.error("Erro a enviar mensagem:", err);
    }
  };

  return (
    <div className="card chat-card">
      <div className="chat-header">
        <div>
          <h3>Chat da boleia</h3>
          <p className="card-subtitle">
            Combina detalhes rapidos com o motorista e passageiros.
          </p>
        </div>
      </div>

      <div className="chat-box">
        {loading && <p>A carregar mensagens...</p>}
        {!loading && messages.length === 0 && (
          <p className="card-subtitle">
            Ainda nao ha mensagens. Se o primeiro a dizer ola.
          </p>
        )}
        {!loading &&
          messages.map((m) => {
            const isMine =
              m.user?._id === user?.id || m.user?._id === user?._id;
            return (
              <div
                key={m._id}
                className={`chat-message ${isMine ? "mine" : ""}`}
              >
                {!isMine && (
                  <div className="chat-author">
                    {m.user?.name || "Utilizador"}
                  </div>
                )}
                <div className="chat-text">{m.text}</div>
                <div className="chat-time">
                  {new Date(m.createdAt).toLocaleTimeString("pt-PT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            );
          })}
        <div ref={bottomRef} />
      </div>

      <form className="chat-form" onSubmit={handleSend}>
        <div className="chat-input-wrap">
          <input
            className="input"
            placeholder="Escreve uma mensagem..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="primary-button" type="submit">
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
};

export default RideChat;
