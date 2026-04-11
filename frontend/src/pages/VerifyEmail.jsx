// import { useEffect, useState } from "react";
// import { useParams, Link } from "react-router-dom";
// import API from "../api/axios";
// import "./Auth.css";

// export default function VerifyEmail() {
//   const { token } = useParams();
//   const [status, setStatus] = useState("loading");
//   const [message, setMessage] = useState("Verifying your email...");

//   useEffect(() => {
//     const verifyEmail = async () => {
//       if (!token) {
//         setStatus("error");
//         setMessage("Invalid verification link.");
//         return;
//       }

//       try {
//         const res = await API.get(`/auth/verify/${token}`);
//         if (res.data.success) {
//           setStatus("success");
//           setMessage(res.data.message);
//         } else {
//           setStatus("error");
//           setMessage(res.data.message);
//         }
//       } catch (err) {
//         setStatus("error");
//         setMessage(
//           err.response?.data?.message ||
//             "Verification failed. The link may be invalid or expired.",
//         );
//       }
//     };

//     verifyEmail();
//   }, [token]);

//   return (
//     <div className="auth-container">
//       <div className="auth-card verification-card">
//         <div className="verification-icon">
//           {status === "loading" && <div className="spinner"></div>}
//           {status === "success" && <div className="icon-success">✓</div>}
//           {status === "error" && <div className="icon-error">✕</div>}
//         </div>

//         <h2>
//           {status === "loading" && "Verifying your email..."}
//           {status === "success" && "Email Verified!"}
//           {status === "error" && "Verification Failed"}
//         </h2>

//         <p className="verification-message">{message}</p>

//         {status === "success" && (
//           <Link to="/auth" className="btn-submit">
//             Go to Login
//           </Link>
//         )}

//         {status === "error" && (
//           <div className="verification-actions">
//             <Link to="/auth" className="btn-submit">
//               Go to Login
//             </Link>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import "./Auth.css";

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link.");
        return;
      }

      try {
        const res = await API.get(`/auth/verify/${token}`);

        if (res.data.success) {
          setStatus("success");
          setMessage(res.data.message);

          // Redirect to success page after 2 seconds
          setTimeout(() => {
            navigate("/verify-success");
          }, 2000);
        } else {
          setStatus("error");
          setMessage(res.data.message);
        }
      } catch (err) {
        setStatus("error");
        setMessage(
          err.response?.data?.message ||
            "Verification failed. The link may be invalid or expired."
        );
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="auth-container">
      <div className="auth-card verification-card">
        <div className="verification-icon">
          {status === "loading" && <div className="spinner"></div>}
          {status === "success" && (
            <div className="icon-success">✓</div>
          )}
          {status === "error" && (
            <div className="icon-error">✕</div>
          )}
        </div>

        <h2>
          {status === "loading" && "Verifying your email..."}
          {status === "success" && "Email Verified!"}
          {status === "error" && "Verification Failed"}
        </h2>

        <p className="verification-message">{message}</p>

        {status === "success" && (
          <p className="countdown-text">
            Redirecting to success page...
          </p>
        )}

        {status === "error" && (
          <div className="verification-actions">
            <button
              onClick={() => navigate("/auth")}
              className="btn-submit"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}