import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../services/firebase";

export default function AdminLoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/admin/panel");
    } catch (err) {
      alert("Invalid email or password");
    }
  }

  return (
    <form
      onSubmit={handleLogin}
      className="card p-4 shadow-sm"
      style={{ maxWidth: "400px", margin: "auto" }}
    >
      <h4 className="text-center mb-3">Admin Login</h4>

      <input
        type="email"
        className="form-control mb-3"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        className="form-control mb-4"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className="btn btn-primary w-100">Login</button>
    </form>
  );
}
