import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, tokenStore } from "../../lib/api";

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      // gọi dev token (backend của m)
      const data = await api<{ access_token: string }>("/dev/token", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      // 👉 LƯU TOKEN
      tokenStore.set(data.access_token);

      // 👉 chuyển sang profile
      navigate("/account");
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-[350px] bg-white p-6 rounded-xl shadow">
        <h1 className="text-xl font-bold mb-4">Login</h1>

        {error && <p className="text-red-500 mb-2">{error}</p>}

        <input
          className="w-full border px-3 py-2 rounded mb-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-orange-500 text-white py-2 rounded"
        >
          {loading ? "Loading..." : "Login"}
        </button>
      </div>
    </div>
  );
};

export default Login;
