function AuthPage({
  username,
  setUsername,
  password,
  setPassword,
  authMode,
  setAuthMode,
  authError,
  loginUser,
  registerUser,
}) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Distributed Chat App</h1>
        <h2>{authMode === "login" ? "Login" : "Register"}</h2>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {authError && <p className="error">{authError}</p>}

        {authMode === "login" ? (
          <button onClick={loginUser}>Login</button>
        ) : (
          <button onClick={registerUser}>Register</button>
        )}

        <p>
          {authMode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}
        </p>

        <button
          className="link-button"
          onClick={() =>
            setAuthMode(authMode === "login" ? "register" : "login")
          }
        >
          {authMode === "login" ? "Register" : "Login"}
        </button>
      </div>
    </div>
  );
}

export default AuthPage;