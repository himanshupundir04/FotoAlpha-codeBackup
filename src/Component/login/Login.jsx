import React from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "./LoginForm";
import bgimg from "../image/login-bg.png"

function Login() {
  const navigate = useNavigate();

  return (
    <>
      <section className="login relative">
        <img src={bgimg} alt="login" className="h-screen w-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/60 backdrop-blur-sm shadow-2xl rounded lg:w-1/3 md:w-6/12 w-11/12 p-5">
            <LoginForm />
            <p
              className="text-gray-500 font-semibold text-center cursor-pointer"
              onClick={() => navigate("/register")}
            >
              Create New Account
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

export default Login;

