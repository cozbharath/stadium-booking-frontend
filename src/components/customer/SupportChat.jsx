import { useEffect, useRef, useState } from "react";
import { post } from "../../services/api";

function SupportChat({ open, onClose }) {

    const [messages, setMessages] = useState([
        {
            role: "assistant",
            text: "Hi! I'm the YourTurn support assistant. Ask me about your bookings, tickets, or how the platform works.",
        },
    ]);

    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, open]);


    // =========================================================
    // SEND MESSAGE
    // =========================================================

    const handleSend = async (e) => {
        e.preventDefault();

        const text = input.trim();

        if (!text || sending) {
            return;
        }

        setMessages((prev) => [...prev, { role: "user", text }]);
        setInput("");
        setError("");
        setSending(true);

        try {
            const data = await post("/support/chat", { message: text });

            setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);

        } catch (err) {
            console.error("Support chat error:", err);
            setError(err.message || "Something went wrong. Please try again.");

        } finally {
            setSending(false);
        }
    };

    if (!open) {
        return null;
    }

    return (
        <div className="support-chat-overlay" onClick={onClose}>

            <div
                className="support-chat-panel"
                onClick={(e) => e.stopPropagation()}
            >

                <div className="support-chat-header">
                    <div>
                        <strong>YourTurn Support</strong>
                        <span>Usually replies instantly</span>
                    </div>

                    <button
                        type="button"
                        className="support-chat-close"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <div className="support-chat-messages">

                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`support-chat-bubble ${msg.role}`}
                        >
                            {msg.text}
                        </div>
                    ))}

                    {sending && (
                        <div className="support-chat-bubble assistant typing">
                            Typing...
                        </div>
                    )}

                    {error && (
                        <div className="support-chat-error">
                            {error}
                        </div>
                    )}

                    <div ref={bottomRef} />

                </div>

                <form className="support-chat-input" onSubmit={handleSend}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about your booking or tickets..."
                        disabled={sending}
                    />

                    <button type="submit" disabled={sending || !input.trim()}>
                        Send
                    </button>
                </form>

            </div>

        </div>
    );
}

export default SupportChat;