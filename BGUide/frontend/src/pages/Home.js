import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, redirect } from "react-router-dom";

export default function Home() {
  const { id } = useSelector((state) => state.user);

  // Redirect to explorer page if user is already logged in
  useEffect(() => {
    if (id) redirect("/explorer");
  }, [id]);

  return (
    <div>
      BGUide
      <Link to="/login">Login</Link>
      <Link to="/register">Register</Link>
      <button>Continue as guest</button>
    </div>
  );
}
