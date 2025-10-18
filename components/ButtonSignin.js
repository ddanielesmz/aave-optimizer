/* eslint-disable @next/next/no-img-element */
"use client";

// A CTA button that always routes directly to the dashboard, no authentication
const ButtonSignin = ({ text = "Get started", extraStyle }) => {

  const handleClick = () => {
    window.open("/dashboard", "_blank");
  };

  return (
    <button
      className={`btn ${extraStyle ? extraStyle : ""}`}
      onClick={handleClick}
    >
      {text}
    </button>
  );
};

export default ButtonSignin;
