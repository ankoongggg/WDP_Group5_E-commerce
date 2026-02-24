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
      // 1. Gọi API lấy token
      const data = await api<any>("/dev/token", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      // 2. Trích xuất token an toàn (phòng trường hợp data bị bọc 2 lớp)
      const actualToken = data?.access_token || data?.data?.access_token;

      if (!actualToken) {
        setError("Lỗi: Server không trả về token. Vui lòng kiểm tra lại backend!");
        setLoading(false);
        return;
      }

      // 3. Lưu token chuẩn
      tokenStore.set(actualToken);

      // 4. Chuyển sang profile
      navigate("/account");
    } catch (e: any) {
      setError(e.message || "Login failed (Email có thể không tồn tại trong DB)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-[350px] bg-white p-6 rounded-xl shadow">
        <h1 className="text-xl font-bold mb-4">Login</h1>

        {error && <p className="text-red-500 mb-2 font-semibold text-sm">{error}</p>}

        <input
          className="w-full border px-3 py-2 rounded mb-3"
          placeholder="Nhập email của user (VD: user@example.com)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-orange-500 text-white py-2 rounded font-bold"
        >
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </button>
      </div>
    </div>
  );
};

export default Login;