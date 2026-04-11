// //app.jsx

// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { useEffect } from "react";
// import Auth from "./pages/Auth";
// import Home from "./pages/Home";
// import OAuthSuccess from "./pages/OAuthSuccess";
// import Profile from "./pages/Profile";
// import Payment from "./pages/Payment";
// import PaymentSuccess from "./pages/PaymentSuccess";
// import PaymentCancel from "./pages/PaymentCancel";
// import Admin from "./pages/Admin";
// import ProtectedRoute from "./components/ProtectedRoute";
// import API from "./api/axios";
// import "./App.css";

// function App() {
//   const hasToken = !!localStorage.getItem("token");

//   // Keep-alive mechanism to prevent serverless cold starts
//   // This pings the backend periodically to keep the function warm
//   useEffect(() => {
//     if (!hasToken) return;

//     const keepAliveInterval = setInterval(() => {
//       // Ping health endpoint to keep serverless function warm
//       API.get("/health", { timeout: 5000 })
//         .then(() => {
//           console.log("Keep-alive ping successful");
//         })
//         .catch((err) => {
//           console.log("Keep-alive ping failed:", err.message);
//         });
//     }, 45000); // Ping every 45 seconds (less than typical 55s timeout)

//     return () => {
//       clearInterval(keepAliveInterval);
//     };
//   }, [hasToken]);

//   return (
//     <BrowserRouter>
//       <Routes>
//         {/* Login / Signup */}
//         <Route path="/" element={<Auth />} />

//         {/* OAuth Redirect */}
//         <Route path="/oauth-success" element={<OAuthSuccess />} />

//         {/* Protected Home */}
//         <Route
//           path="/home"
//           element={
//             <ProtectedRoute>
//               <Home />
//             </ProtectedRoute>
//           }
//         />

//         {/* Protected Profile */}
//         <Route
//           path="/profile"
//           element={
//             <ProtectedRoute>
//               <Profile />
//             </ProtectedRoute>
//           }
//         />

//         {/* Protected Payment */}
//         <Route
//           path="/payment"
//           element={
//             <ProtectedRoute>
//               <Payment />
//             </ProtectedRoute>
//           }
//         />

//         {/* Payment Success */}
//         <Route
//           path="/payment/success"
//           element={
//             <ProtectedRoute>
//               <PaymentSuccess />
//             </ProtectedRoute>
//           }
//         />

//         {/* Payment Cancel */}
//         <Route
//           path="/payment/cancel"
//           element={
//             <ProtectedRoute>
//               <PaymentCancel />
//             </ProtectedRoute>
//           }
//         />

//         {/* Protected Admin */}
//         <Route
//           path="/admin"
//           element={
//             <ProtectedRoute requiredRole="admin">
//               <Admin />
//             </ProtectedRoute>
//           }
//         />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;


//app.jsx

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import OAuthSuccess from "./pages/OAuthSuccess";
import VerifyEmail from "./pages/VerifyEmail";
import VerifySuccess from "./pages/VerifySuccess";
import Profile from "./pages/Profile";
import Payment from "./pages/Payment";
import Admin from "./pages/Admin";
import ProtectedRoute from "./components/ProtectedRoute";
import API from "./api/axios";
import "./App.css";

function App() {
  const hasToken = !!localStorage.getItem("token");

  // Keep-alive mechanism to prevent serverless cold starts
  // This pings the backend periodically to keep the function warm
  useEffect(() => {
    if (!hasToken) return;

    const keepAliveInterval = setInterval(() => {
      // Ping health endpoint to keep serverless function warm
      API.get("/health", { timeout: 5000 })
        .then(() => {
          console.log("Keep-alive ping successful");
        })
        .catch((err) => {
          console.log("Keep-alive ping failed:", err.message);
        });
    }, 45000); // Ping every 45 seconds (less than typical 55s timeout)

    return () => {
      clearInterval(keepAliveInterval);
    };
  }, [hasToken]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Login / Signup */}
        <Route path="/" element={<Auth />} />

        {/* OAuth Redirect */}
        <Route path="/oauth-success" element={<OAuthSuccess />} />

        {/* Email Verification */}
        <Route path="/verify/:token" element={<VerifyEmail />} />
        <Route path="/verify-success" element={<VerifySuccess />} />

        {/* Protected Home */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* Protected Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Protected Payment */}
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />

        {/* Protected Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;