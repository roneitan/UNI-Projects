// import React, { useEffect, useRef } from "react";
// import Avatar from "@mui/material/Avatar";
// import Button from "@mui/material/Button";
// import CssBaseline from "@mui/material/CssBaseline";
// import TextField from "@mui/material/TextField";
// import Link from "@mui/material/Link";
// import Grid from "@mui/material/Grid";
// import Box from "@mui/material/Box";
// import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
// import Typography from "@mui/material/Typography";
// import { createTheme, ThemeProvider } from "@mui/material/styles";
// import { useDispatch, useSelector } from "react-redux";
// import { registerUser } from "../context/actions";
// import { useNavigate } from "react-router-dom";
// import ErrorMessage from "../components/ErrorMessage";
// import "../css/register.css";

// function Copyright(props) {
//   return (
//     <Typography
//       variant="body2"
//       align="center"
//       className="signup-copyright"
//       {...props}
//     >
//       {"Copyright © "}
//       <Link color="inherit" href="https://mui.com/">
//         BGUide
//       </Link>{" "}
//       {new Date().getFullYear()}
//       {"."}
//     </Typography>
//   );
// }

// const theme = createTheme({
//   palette: {
//     primary: {
//       main: '#FF8C00', // Dark orange
//     },
//     secondary: {
//       main: '#FFA500', // Orange
//     },
//   },
// });

// export default function SignUp() {
//   const nameRef = useRef();
//   const emailRef = useRef();
//   const passwordRef = useRef();
//   const dispatch = useDispatch();
//   const { error } = useSelector((state) => state.user);
//   const { id } = useSelector((state) => state.user);
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (id) navigate("/explorer");
//   }, [id, navigate]);

//   const handleSubmit = (event) => {
//     event.preventDefault();
//     const name = nameRef.current.value;
//     const email = emailRef.current.value;
//     const password = passwordRef.current.value;
//     const nameError = document.getElementById("name-error");
//     const emailError = document.getElementById("email-error");
//     const passwordError = document.getElementById("password-error");

//     nameError.textContent = "";
//     emailError.textContent = "";
//     passwordError.textContent = "";

//     let isValid = true;

//     if (name === "" || /\d/.test(name)) {
//       nameError.textContent = "Please enter your name properly.";
//       isValid = false;
//     }

//     if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
//       emailError.textContent = "Please enter a valid email address.";
//       isValid = false;
//     }

//     if (password === "" || password.length < 6) {
//       passwordError.textContent = "Please enter a password with at least 6 characters.";
//       isValid = false;
//     }

//     if (!isValid) return;

//     dispatch(registerUser({ name, email, password }));
//   };

//   return (
//     <ThemeProvider theme={theme}>
//       <CssBaseline />
//       <div className="signup-container">
//         <div className="signup-overlay">
//           <div className="signup-popup">
//             <Box className="signup-paper">
//               <Avatar className="signup-avatar">
//                 <LockOutlinedIcon />
//               </Avatar>
//               <Typography component="h1" variant="h5" className="signup-title">
//                 Sign Up
//               </Typography>
//               <Box
//                 component="form"
//                 noValidate
//                 onSubmit={handleSubmit}
//                 className="signup-form"
//               >
//                 <Grid container spacing={2}>
//                   <Grid item xs={12}>
//                     <TextField
//                       margin="normal"
//                       autoComplete="given-name"
//                       name="Name"
//                       required
//                       fullWidth
//                       id="Name"
//                       label="Name"
//                       inputRef={nameRef}
//                       autoFocus
//                       className="signup-input"
//                       InputProps={{
//                         style: { color: '#FF8C00' }
//                       }}
//                     />
//                     <span id="name-error" className="error-message"></span>
//                   </Grid>
//                   <Grid item xs={12}>
//                     <TextField
//                       margin="normal"
//                       required
//                       fullWidth
//                       id="email"
//                       label="Email"
//                       name="email"
//                       inputRef={emailRef}
//                       autoComplete="email"
//                       className="signup-input"
//                       InputProps={{
//                         style: { color: '#FF8C00' }
//                       }}
//                     />
//                     <span id="email-error" className="error-message"></span>
//                   </Grid>
//                   <Grid item xs={12}>
//                     <TextField
//                       margin="normal"
//                       required
//                       fullWidth
//                       name="password"
//                       label="Password"
//                       type="password"
//                       id="password"
//                       inputRef={passwordRef}
//                       autoComplete="new-password"
//                       className="signup-input"
//                       InputProps={{
//                         style: { color: '#FF8C00' }
//                       }}
//                     />
//                     <span id="password-error" className="error-message"></span>
//                   </Grid>
//                 </Grid>
//                 {error && <ErrorMessage message={error} />}
//                 <Button
//                   type="submit"
//                   fullWidth
//                   variant="contained"
//                   className="signup-button"
//                   sx={{ 
//                     backgroundColor: 'orange', 
//                     '&:hover': { backgroundColor: 'darkorange' },
//                     color: 'white'
//                   }}
//                 >
//                   Sign Up
//                 </Button>
//                 <Grid container justifyContent="center">
//                   <Grid item>
//                     <div className="signup-link">
//                       <Link href="/login" variant="body2">
//                         Already have an account? Sign In
//                       </Link>
//                     </div>
//                   </Grid>
//                 </Grid>
//               </Box>
//             </Box>
//           </div>
//         </div>
//       </div>
//       <Copyright sx={{ color: '#FFA500' }} />
//     </ThemeProvider>
//   );
// }


import React, { useEffect, useRef } from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../context/actions";
import { useNavigate } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import "../css/register.css";

function Copyright(props) {
  return (
    <Typography
      variant="body2"
      align="center"
      className="signup-copyright"
      {...props}
    >
      {"Copyright © "}
      <Link color="inherit" href="https://mui.com/">
        BGUide
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#FF8C00', // Dark orange
    },
    secondary: {
      main: '#FFA500', // Orange
    },
  },
});

export default function SignUp() {
  const nameRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const dispatch = useDispatch();
  const { error } = useSelector((state) => state.user);
  const { id } = useSelector((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) navigate("/explorer");
  }, [id, navigate]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const name = nameRef.current.value;
    const email = emailRef.current.value;
    const password = passwordRef.current.value;
    const nameError = document.getElementById("name-error");
    const emailError = document.getElementById("email-error");
    const passwordError = document.getElementById("password-error");

    nameError.textContent = "";
    emailError.textContent = "";
    passwordError.textContent = "";

    let isValid = true;

    if (name === "") {
      nameError.textContent = "Please enter your name properly.";
      isValid = false;
    }
    

    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      emailError.textContent = "Please enter a valid email address.";
      isValid = false;
    }

    if (password === "" || password.length < 6) {
      passwordError.textContent = "Please enter a password with at least 6 characters.";
      isValid = false;
    }

    if (!isValid) return;

    dispatch(registerUser({ name, email, password }));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="signup-container">
        <div className="signup-overlay">
          <div className="signup-popup">
            <Typography component="h1" variant="h3" className="signup-headline">
              BGUide
            </Typography>
            <Box className="signup-paper">
              <Avatar className="signup-avatar">
                <LockOutlinedIcon />
              </Avatar>
              <Typography component="h1" variant="h5" className="signup-title">
                Sign Up
              </Typography>
              <Box
                component="form"
                noValidate
                onSubmit={handleSubmit}
                className="signup-form"
              >
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      margin="normal"
                      autoComplete="given-name"
                      name="Name"
                      required
                      fullWidth
                      id="Name"
                      label="Name"
                      inputRef={nameRef}
                      autoFocus
                      className="signup-input"
                      InputProps={{
                        style: { color: '#FF8C00' }
                      }}
                    />
                    <span id="name-error" className="error-message"></span>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="email"
                      label="Email"
                      name="email"
                      inputRef={emailRef}
                      autoComplete="email"
                      className="signup-input"
                      InputProps={{
                        style: { color: '#FF8C00' }
                      }}
                    />
                    <span id="email-error" className="error-message"></span>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      name="password"
                      label="Password"
                      type="password"
                      id="password"
                      inputRef={passwordRef}
                      autoComplete="new-password"
                      className="signup-input"
                      InputProps={{
                        style: { color: '#FF8C00' }
                      }}
                    />
                    <span id="password-error" className="error-message"></span>
                  </Grid>
                </Grid>
                {error && <ErrorMessage message={error} />}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  className="signup-button"
                  sx={{ 
                    backgroundColor: 'orange', 
                    '&:hover': { backgroundColor: 'darkorange' },
                    color: 'white'
                  }}
                >
                  Sign Up
                </Button>
                <Grid container justifyContent="center">
                  <Grid item>
                    <div className="signup-link">
                      <Link href="/login" variant="body2">
                        Already have an account? Sign In
                      </Link>
                    </div>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </div>
        </div>
      </div>
      <Copyright sx={{ color: '#FFA500' }} />
    </ThemeProvider>
  );
}
