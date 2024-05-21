import { useState } from "react";
import "./App.css";

const RegisterLoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRegistering) {
      console.log("Registering user...");
    } else {
      console.log("Logging in user...");
    }
    setUsername("");
    setPassword("");
  };

  return (
    <div className="form-container">
      <h2>{isRegistering ? "Register" : "Login"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">{isRegistering ? "Register" : "Login"}</button>
      </form>
      <p onClick={() => setIsRegistering(!isRegistering)}>
        {isRegistering
          ? "Already have an account? Login here."
          : "Don't have an account? Register here."}
      </p>
    </div>
  );
};

export default RegisterLoginForm;
